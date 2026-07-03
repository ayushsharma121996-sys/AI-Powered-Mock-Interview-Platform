import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || '';
const isMockMode = !apiKey || apiKey.trim() === '' || apiKey.includes('YourActualGeminiKeyWillGoHere');

let genAI: GoogleGenerativeAI | null = null;
if (!isMockMode) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('⚠️ GEMINI_API_KEY not configured or contains placeholder. Running in Mock/Fallback Mode.');
}

/**
 * Parses resume raw text and extracts skills, education, and projects.
 */
export async function extractResumeSkills(text: string): Promise<{
  skills: string[];
  education: string;
  projects: string;
}> {
  if (isMockMode || !genAI) {
    return getMockResumeParsing(text);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      You are an expert ATS (Applicant Tracking System) parser.
      Analyze the following resume text and extract:
      1. Technical and soft skills (return as a string array).
      2. Education details (summarized into a short readable text or list).
      3. Projects details (summarized into a short readable text or list).

      Return the response strictly as a JSON object matching this schema:
      {
        "skills": ["skill1", "skill2"],
        "education": "Summary of education",
        "projects": "Summary of projects"
      }

      Resume Text:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error in extractResumeSkills via Gemini:', error);
    return getMockResumeParsing(text);
  }
}

/**
 * Generates personalized interview questions based on the candidate's skills and the target role.
 */
export async function generateQuestions(
  skills: string[],
  role: string,
  type: 'technical' | 'hr'
): Promise<Array<{
  questionText: string;
  type: string;
  sampleAnswer: string | null;
}>> {
  if (isMockMode || !genAI) {
    return getMockQuestions(skills, role, type);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const isTech = type === 'technical';
    const prompt = `
      You are an elite interviewer for a ${role} position.
      Generate 5 personalized interview questions for a candidate with these skills: ${skills.join(', ')}.
      
      Interview Category: ${type.toUpperCase()}

      Rules:
      1. If category is TECHNICAL, generate 4 technical concept questions and 1 coding challenge question (set type of the coding question to "coding").
         - For the coding question, provide a coding starter code snippet in Javascript/Typescript or Python inside the "sampleAnswer" property, along with brief instructions.
         - For other technical questions, provide a 1-2 sentence reference solution in "sampleAnswer".
      2. If category is HR, generate 5 behavioral or situational questions (set type to "behavioral").
         - "sampleAnswer" can be a short list of bullet points showing what a strong answer should cover.
      3. Keep the questions engaging, professional, and matching the role of ${role}.

      Return the response strictly as a JSON array of objects matching this schema:
      [
        {
          "questionText": "Question text here?",
          "type": "technical" | "coding" | "behavioral",
          "sampleAnswer": "Reference answer or starter code snippet or null"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error in generateQuestions via Gemini:', error);
    return getMockQuestions(skills, role, type);
  }
}

/**
 * Evaluates a single answer provided by the user.
 */
export async function evaluateAnswer(
  questionText: string,
  sampleAnswer: string | null,
  userAnswer: string
): Promise<{
  score: number;
  feedback: string;
}> {
  if (isMockMode || !genAI) {
    return getMockAnswerEvaluation(questionText, userAnswer);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      You are an AI Interviewer evaluating a candidate's answer.
      Question: "${questionText}"
      Reference Criteria/Answer: "${sampleAnswer || 'No specific reference answer provided. Evaluate on general correctness.'}"
      Candidate Answer: "${userAnswer}"

      Evaluate the candidate's answer for technical accuracy, grammar, completeness, and clarity.
      Assign a score from 0 to 100.
      Provide constructive, concise feedback (1-2 sentences) directly to the candidate.

      Return the response strictly as a JSON object matching this schema:
      {
        "score": 85,
        "feedback": "Your explanation is technical and accurate, but you could elaborate more on the specific case..."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error in evaluateAnswer via Gemini:', error);
    return getMockAnswerEvaluation(questionText, userAnswer);
  }
}

/**
 * Generates overall interview report feedback.
 */
export async function generateFeedback(
  questions: Array<{
    questionText: string;
    type: string;
    userAnswer: string | null;
    score: number | null;
    feedback: string | null;
  }>,
  role: string
): Promise<{
  score: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    categories: {
      accuracy: number;
      communication: number;
      confidence: number;
      completeness: number;
      grammar: number;
    };
  };
}> {
  if (isMockMode || !genAI) {
    return getMockOverallEvaluation(questions, role);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      You are an HR Director compiling the final feedback report for a mock interview for the role of ${role}.
      Below are the questions, the candidate's answers, scores, and specific feedbacks:
      ${JSON.stringify(questions, null, 2)}

      Analyze the candidate's overall performance.
      Calculate:
      1. Overall Score (0-100).
      2. Strengths (at least 2-3 specific points).
      3. Weaknesses/Areas of Improvement (at least 2-3 specific points).
      4. Categorical Breakdown (scores 0-100 for Accuracy, Communication, Confidence, Completeness, Grammar). Note: Confidence should be inferred from answer length, word choice, and structure.

      Return the response strictly as a JSON object matching this schema:
      {
        "score": 82,
        "feedback": {
          "strengths": ["Strong Java fundamentals", "Clear articulation of projects"],
          "weaknesses": ["Improve DBMS concepts", "Could detail testing methodologies"],
          "categories": {
            "accuracy": 85,
            "communication": 80,
            "confidence": 75,
            "completeness": 85,
            "grammar": 90
          }
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error in generateFeedback via Gemini:', error);
    return getMockOverallEvaluation(questions, role);
  }
}

// ==========================================
// MOCK FALLBACK HANDLERS
// ==========================================

function getMockResumeParsing(text: string) {
  // Look for keywords in text
  const textLower = text.toLowerCase();
  const allSkills = [
    'java', 'spring boot', 'react', 'typescript', 'javascript', 'python', 'django', 'node.js',
    'express.js', 'sql', 'postgresql', 'mysql', 'docker', 'kubernetes', 'aws', 'html', 'css',
    'tailwind', 'git', 'c++', 'c#', 'machine learning', 'data analysis', 'mongodb'
  ];

  const extractedSkills = allSkills.filter(skill => textLower.includes(skill));
  if (extractedSkills.length === 0) {
    extractedSkills.push('JavaScript', 'HTML', 'CSS', 'React');
  }

  // Capitalize properly
  const formattedSkills = extractedSkills.map(s => {
    if (s === 'sql') return 'SQL';
    if (s === 'aws') return 'AWS';
    if (s === 'html') return 'HTML';
    if (s === 'css') return 'CSS';
    return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  });

  return {
    skills: formattedSkills,
    education: 'Bachelor of Science in Computer Science (parsed from resume)',
    projects: '• Developed multiple full-stack web applications\n• Managed database integrations and APIs'
  };
}

function getMockQuestions(skills: string[], role: string, type: 'technical' | 'hr') {
  if (type === 'hr') {
    return [
      {
        questionText: 'Tell me about yourself and your journey as a developer.',
        type: 'behavioral',
        sampleAnswer: 'Strong candidates will explain their background, passions, and fit for the role.'
      },
      {
        questionText: 'Can you describe a challenging technical project you worked on and how you overcame the obstacles?',
        type: 'behavioral',
        sampleAnswer: 'Looking for a structured STAR response: Situation, Task, Action, Result.'
      },
      {
        questionText: 'How do you handle conflict or differing opinions within a software development team?',
        type: 'behavioral',
        sampleAnswer: 'Evaluate communication, empathy, and ability to find consensus.'
      },
      {
        questionText: 'Why do you want to join our company, and what do you hope to achieve here?',
        type: 'behavioral',
        sampleAnswer: 'Assess motivation, alignment with company values, and career goals.'
      },
      {
        questionText: 'What are your greatest professional strengths and weaknesses, and how are you working on your weaknesses?',
        type: 'behavioral',
        sampleAnswer: 'Check for self-awareness and active steps towards self-improvement.'
      }
    ];
  } else {
    // Technical questions customized to skills/role
    const questions = [
      {
        questionText: `What are the core design patterns you utilize when developing in ${role}?`,
        type: 'technical',
        sampleAnswer: 'Common patterns include MVC, Singleton, Factory, and Repository patterns.'
      },
      {
        questionText: `Explain the differences between synchronous and asynchronous processes in your development stack.`,
        type: 'technical',
        sampleAnswer: 'Synchronous blocks execution, while asynchronous processes run in parallel or defer execution via event loops.'
      },
      {
        questionText: `How do you optimize performance and manage database transactions in a project?`,
        type: 'technical',
        sampleAnswer: 'Using indices, query caching, connection pooling, and transactional rollbacks.'
      },
      {
        questionText: `How do you ensure secure data flow and protect against vulnerabilities like SQL injection or CSRF?`,
        type: 'technical',
        sampleAnswer: 'Input sanitization, parameterized queries, CSRF tokens, and secure JWT verification.'
      },
      {
        // 5th question is always coding
        questionText: 'Write a function `twoSum(nums, target)` that returns indices of the two numbers such that they add up to `target`. Assume each input has exactly one solution.',
        type: 'coding',
        sampleAnswer: `// Starter Code\nfunction twoSum(nums, target) {\n  // Write your code here\n  return [];\n}\n\n// Examples:\n// twoSum([2, 7, 11, 15], 9) -> [0, 1]`
      }
    ];
    return questions;
  }
}

function getMockAnswerEvaluation(questionText: string, userAnswer: string) {
  const wordCount = userAnswer ? userAnswer.trim().split(/\s+/).length : 0;
  let score = 50;
  let feedback = 'Your response is too brief. Please provide a more detailed explanation of the concepts.';

  if (wordCount > 30) {
    score = 85;
    feedback = 'Excellent response! You touched on the core technical details and gave a structured explanation.';
  } else if (wordCount > 10) {
    score = 70;
    feedback = 'Good start, but you should elaborate on how this works in a production environment.';
  }

  return { score, feedback };
}

function getMockOverallEvaluation(questions: any[], role: string) {
  const scores = questions.map(q => q.score || 70);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    score: avgScore,
    feedback: {
      strengths: [
        'Good fundamental knowledge of software principles',
        'Structured responses with appropriate examples',
        'Demonstrates solid programming practices'
      ],
      weaknesses: [
        'Could elaborate further on complex architectural styles',
        'Requires more detailed explanations for database indexing',
        'Could improve explanation of REST API design patterns'
      ],
      categories: {
        accuracy: Math.min(avgScore + 5, 100),
        communication: Math.min(avgScore - 2, 100),
        confidence: Math.min(avgScore, 100),
        completeness: Math.min(avgScore - 5, 100),
        grammar: Math.min(avgScore + 3, 100)
      }
    }
  };
}
