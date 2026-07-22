import { Router, Response } from 'express';
import prisma from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { generateQuestions, evaluateAnswer, generateFeedback } from '../utils/gemini';

const router = Router();

// Start Interview Session
router.post('/start', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { role, type } = req.body; // type: 'technical' or 'hr'
    if (!role || !type) {
      return res.status(400).json({ error: 'Please provide job role and interview type.' });
    }

    // Check if there is a recruiter template for this role
    const template = await prisma.interviewTemplate.findUnique({
      where: { roleName: role },
    });

    let templateSkills: string[] = [];
    if (template) {
      try {
        templateSkills = JSON.parse(template.skillsList);
      } catch (err) {
        templateSkills = [];
      }
    }

    // Fetch user's latest resume skills (if any)
    const latestResume = await prisma.resume.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    let skills: string[] = [];
    if (latestResume) {
      try {
        skills = JSON.parse(latestResume.skills);
      } catch (err) {
        skills = [];
      }
    }

    // Merge resume skills with template skills, keeping unique values
    const mergedSkillsMap = new Set([...skills, ...templateSkills]);
    const finalSkillsList = Array.from(mergedSkillsMap);

    // If final skills list is empty, default to standard SDE skills
    if (finalSkillsList.length === 0) {
      finalSkillsList.push('Javascript', 'React', 'Data Structures');
    }

    // Generate questions matching final skills and role via Gemini
    const aiQuestions = await generateQuestions(finalSkillsList, role, type);

    // Save Interview record
    const interview = await prisma.interview.create({
      data: {
        userId: req.user.id,
        role,
        status: 'in_progress',
      },
    });

    // Save Question records
    const questionRecords = await Promise.all(
      aiQuestions.map((q) =>
        prisma.question.create({
          data: {
            interviewId: interview.id,
            type: q.type,
            questionText: q.questionText,
            sampleAnswer: q.sampleAnswer,
          },
        })
      )
    );

    return res.status(201).json({
      message: 'Interview session created successfully.',
      interviewId: interview.id,
      role: interview.role,
      status: interview.status,
      // Map questions to exclude the sampleAnswer from frontend payload for security
      questions: questionRecords.map((q) => {
        let options: string[] = [];
        if (q.type === 'mcq' && q.sampleAnswer) {
          try {
            options = JSON.parse(q.sampleAnswer).options || [];
          } catch (e) {
            options = [];
          }
        }
        return {
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          userAnswer: q.userAnswer,
          score: q.score,
          feedback: q.feedback,
          options,
        };
      }),
    });
  } catch (error) {
    console.error('Start Interview Error:', error);
    return res.status(500).json({ error: 'Failed to start interview session.' });
  }
});

// Fetch Single Interview Details
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    // Secure checking
    if (req.user?.role !== 'recruiter' && interview.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden. You do not own this interview.' });
    }

    return res.json({
      id: interview.id,
      role: interview.role,
      score: interview.score,
      status: interview.status,
      feedback: interview.feedback ? JSON.parse(interview.feedback) : null,
      createdAt: interview.createdAt,
      questions: interview.questions.map((q) => {
        let options: string[] = [];
        if (q.type === 'mcq' && q.sampleAnswer) {
          try {
            options = JSON.parse(q.sampleAnswer).options || [];
          } catch (e) {
            options = [];
          }
        }
        return {
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          userAnswer: q.userAnswer,
          score: q.score,
          feedback: q.feedback,
          options,
          // Include sampleAnswer ONLY if interview is completed, otherwise hide
          sampleAnswer: interview.status === 'completed' ? q.sampleAnswer : null,
        };
      }),
    });
  } catch (error) {
    console.error('Get Interview Error:', error);
    return res.status(500).json({ error: 'Failed to fetch interview session.' });
  }
});

// Submit Answer for Question
router.post('/:id/submit-answer', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: interviewId } = req.params;
    const { questionId, userAnswer, codeLanguage } = req.body;

    if (!questionId || userAnswer === undefined) {
      return res.status(400).json({ error: 'Please provide questionId and userAnswer.' });
    }

    // Verify interview state and access
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found.' });
    }

    if (interview.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (interview.status !== 'in_progress') {
      return res.status(400).json({ error: 'Cannot submit answers for a completed interview.' });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question || question.interviewId !== interviewId) {
      return res.status(404).json({ error: 'Question not found in this interview session.' });
    }

    let evaluation: { score: number; feedback: string };

    if (question.type === 'mcq') {
      let isCorrect = false;
      let correctOptionLabel = '';
      if (question.sampleAnswer) {
        try {
          const parsed = JSON.parse(question.sampleAnswer);
          const correctKey = (parsed.correctAnswer || '').trim().toLowerCase();
          const userKey = (userAnswer || '').trim().toLowerCase();
          isCorrect = correctKey === userKey;

          const options = parsed.options || [];
          const matchingOption = options.find((opt: string) =>
            opt.trim().toLowerCase().startsWith(correctKey)
          );
          correctOptionLabel = matchingOption || parsed.correctAnswer.toUpperCase();
        } catch (e) {
          // fallback
        }
      }

      evaluation = {
        score: isCorrect ? 100 : 0,
        feedback: isCorrect
          ? 'Correct answer! Excellent job.'
          : `Incorrect. The correct option was ${correctOptionLabel}.`
      };
    } else {
      evaluation = await evaluateAnswer(
        question.questionText,
        question.sampleAnswer,
        userAnswer
      );
    }

    // Update Question Record
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        userAnswer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        codeLanguage: codeLanguage || null,
      },
    });

    return res.json({
      message: 'Answer submitted and evaluated.',
      questionId: updatedQuestion.id,
      score: updatedQuestion.score,
      feedback: updatedQuestion.feedback,
    });
  } catch (error) {
    console.error('Submit Answer Error:', error);
    return res.status(500).json({ error: 'Failed to evaluate and save answer.' });
  }
});

// Finalize and Evaluate Full Interview Session
router.post('/:id/evaluate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found.' });
    }

    if (interview.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    // Check if any answers have not been filled/submitted. We can default them to empty string
    const questionsWithAnswers = await Promise.all(
      interview.questions.map(async (q) => {
        if (q.userAnswer === null) {
          // evaluate empty answer
          const evaluation = await evaluateAnswer(q.questionText, q.sampleAnswer, '');
          return prisma.question.update({
            where: { id: q.id },
            data: {
              userAnswer: '',
              score: evaluation.score,
              feedback: evaluation.feedback,
            },
          });
        }
        return q;
      })
    );

    // Call Gemini utility to synthesize overall score, strengths, weaknesses, and key metrics
    const reportData = await generateFeedback(
      questionsWithAnswers.map((q) => ({
        questionText: q.questionText,
        type: q.type,
        userAnswer: q.userAnswer,
        score: q.score,
        feedback: q.feedback,
      })),
      interview.role
    );

    // Save final scorecard details back to Interview record
    const finalizedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status: 'completed',
        score: reportData.score,
        feedback: JSON.stringify(reportData.feedback),
      },
      include: { questions: true },
    });

    return res.json({
      message: 'Interview finalized successfully.',
      interviewId: finalizedInterview.id,
      role: finalizedInterview.role,
      status: finalizedInterview.status,
      score: finalizedInterview.score,
      feedback: reportData.feedback,
      questions: finalizedInterview.questions,
    });
  } catch (error) {
    console.error('Finalize Interview Error:', error);
    return res.status(500).json({ error: 'Failed to generate final report card.' });
  }
});

// Fetch Interview Analytics for Dashboard
router.get('/history/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const interviews = await prisma.interview.findMany({
      where: { userId: req.user.id, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });

    const totalInterviews = interviews.length;
    const scores = interviews.map((i) => i.score || 0);
    const averageScore = totalInterviews > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalInterviews) : 0;

    // Collect all strengths and weaknesses categories across history (simple parse extraction)
    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    interviews.forEach((i) => {
      if (i.feedback) {
        try {
          const parsed = JSON.parse(i.feedback);
          if (parsed.strengths && Array.isArray(parsed.strengths)) {
            strongTopics.push(...parsed.strengths.slice(0, 1));
          }
          if (parsed.weaknesses && Array.isArray(parsed.weaknesses)) {
            weakTopics.push(...parsed.weaknesses.slice(0, 1));
          }
        } catch (err) {
          // ignore
        }
      }
    });

    // Unique arrays capped to 4 elements
    const uniqueStrong = Array.from(new Set(strongTopics)).slice(0, 4);
    const uniqueWeak = Array.from(new Set(weakTopics)).slice(0, 4);

    return res.json({
      totalInterviews,
      averageScore,
      strongTopics: uniqueStrong.length > 0 ? uniqueStrong : ['Java Syntax', 'React Components'],
      weakTopics: uniqueWeak.length > 0 ? uniqueWeak : ['Prisma Relations', 'Algorithm Time Complexities'],
      history: interviews.map((i) => ({
        id: i.id,
        role: i.role,
        score: i.score,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch History Summary Error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

export default router;
