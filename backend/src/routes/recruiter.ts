import { Router, Response } from 'express';
import prisma from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Middleware to block non-recruiters
const recruiterOnly = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (req.user?.role !== 'recruiter') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }
  next();
};

// Get all candidates and their performance summary
router.get('/candidates', authMiddleware, recruiterOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidates = await prisma.user.findMany({
      where: { role: 'candidate' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            filename: true,
            skills: true,
          },
        },
        interviews: {
          where: { status: 'completed' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            role: true,
            score: true,
            createdAt: true,
          },
        },
      },
    });

    const formatted = candidates.map((c) => {
      const resume = c.resumes[0] || null;
      let skills: string[] = [];
      if (resume) {
        try {
          skills = JSON.parse(resume.skills);
        } catch (e) {
          skills = [];
        }
      }

      const completedInterviews = c.interviews;
      const scores = completedInterviews.map((i) => i.score || 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        joinedAt: c.createdAt,
        resumeFilename: resume ? resume.filename : null,
        skills,
        interviewsCount: completedInterviews.length,
        averageScore: avgScore,
        latestInterview: completedInterviews[0] || null,
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Fetch Candidates Error:', error);
    return res.status(500).json({ error: 'Failed to fetch candidate dashboards.' });
  }
});

// Compare Candidates
router.get('/comparison', authMiddleware, recruiterOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const interviews = await prisma.interview.findMany({
      where: { status: 'completed' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { score: 'desc' },
    });

    return res.json(
      interviews.map((i) => ({
        interviewId: i.id,
        candidateName: i.user.name,
        candidateEmail: i.user.email,
        role: i.role,
        score: i.score,
        date: i.createdAt,
        feedbackSummary: i.feedback ? JSON.parse(i.feedback) : null,
      }))
    );
  } catch (error) {
    console.error('Fetch Comparison Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve comparison statistics.' });
  }
});

// CSV Export Candidates Summary
router.get('/candidates/export', authMiddleware, recruiterOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidates = await prisma.user.findMany({
      where: { role: 'candidate' },
      include: {
        resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
        interviews: { where: { status: 'completed' } },
      },
    });

    let csvContent = 'Candidate Name,Email,Registration Date,Interviews Count,Average Score,Latest Resume\n';

    candidates.forEach((c) => {
      const name = `"${c.name.replace(/"/g, '""')}"`;
      const email = `"${c.email.replace(/"/g, '""')}"`;
      const date = new Date(c.createdAt).toLocaleDateString();
      const count = c.interviews.length;
      
      const scores = c.interviews.map(i => i.score || 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 'N/A';
      
      const resume = c.resumes[0] ? `"${c.resumes[0].filename.replace(/"/g, '""')}"` : 'None';

      csvContent += `${name},${email},${date},${count},${avgScore},${resume}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=interviewai_candidates_report.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV Export Error:', error);
    return res.status(500).json({ error: 'Failed to generate CSV export file.' });
  }
});

// List all interview templates
router.get('/templates', authMiddleware, recruiterOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = await prisma.interviewTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(
      templates.map(t => ({
        id: t.id,
        roleName: t.roleName,
        description: t.description,
        skillsList: JSON.parse(t.skillsList),
        createdAt: t.createdAt,
      }))
    );
  } catch (error) {
    console.error('List templates error:', error);
    return res.status(500).json({ error: 'Failed to fetch interview templates.' });
  }
});

// Create custom interview template
router.post('/templates', authMiddleware, recruiterOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roleName, description, skillsList } = req.body;
    if (!roleName || !description || !skillsList || !Array.isArray(skillsList)) {
      return res.status(400).json({ error: 'Please provide roleName, description, and list of skills.' });
    }

    const existing = await prisma.interviewTemplate.findUnique({ where: { roleName } });
    if (existing) {
      return res.status(400).json({ error: 'A template for this target role already exists.' });
    }

    const template = await prisma.interviewTemplate.create({
      data: {
        roleName,
        description,
        skillsList: JSON.stringify(skillsList),
      },
    });

    return res.status(201).json({
      id: template.id,
      roleName: template.roleName,
      description: template.description,
      skillsList: JSON.parse(template.skillsList),
      createdAt: template.createdAt,
    });
  } catch (error) {
    console.error('Create template error:', error);
    return res.status(500).json({ error: 'Failed to create interview template.' });
  }
});

// Delete custom template
router.delete('/templates/:id', authMiddleware, recruiterOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.interviewTemplate.delete({ where: { id } });
    return res.json({ message: 'Interview template deleted successfully.' });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({ error: 'Failed to delete template.' });
  }
});

export default router;
