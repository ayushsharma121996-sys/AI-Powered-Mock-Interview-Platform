import { Router, Response } from 'express';
import multer from 'multer';
import prisma from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { parseResume } from '../utils/pdfParser';
import { extractResumeSkills } from '../utils/gemini';

const router = Router();

// Configure multer storage in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname.endsWith('.pdf') ||
      file.originalname.endsWith('.docx')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed.'));
    }
  },
});

// Upload and Parse Resume
router.post(
  '/upload',
  authMiddleware,
  upload.single('resume'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a PDF or DOCX resume file.' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const { buffer, mimetype, originalname } = req.file;

      // Extract raw text from document buffer
      const rawText = await parseResume(buffer, mimetype, originalname);

      if (!rawText || rawText.trim() === '') {
        return res.status(400).json({ error: 'Could not extract text from the resume file. Please ensure it is not scanned or empty.' });
      }

      // Call Gemini helper to analyze skills, education, and projects
      const analysis = await extractResumeSkills(rawText);

      // Save resume in database
      const resume = await prisma.resume.create({
        data: {
          userId: req.user.id,
          filename: originalname,
          skills: JSON.stringify(analysis.skills),
          education: analysis.education,
          projects: analysis.projects,
        },
      });

      return res.status(200).json({
        message: 'Resume parsed successfully',
        resume: {
          id: resume.id,
          filename: resume.filename,
          skills: analysis.skills,
          education: resume.education,
          projects: resume.projects,
        },
      });
    } catch (error: any) {
      console.error('Resume Upload & Extraction Error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error during resume parsing.' });
    }
  }
);

// Get user's latest resume
router.get('/latest', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const resume = await prisma.resume.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!resume) {
      return res.status(404).json({ error: 'No resumes found.' });
    }

    return res.json({
      id: resume.id,
      filename: resume.filename,
      skills: JSON.parse(resume.skills),
      education: resume.education,
      projects: resume.projects,
      createdAt: resume.createdAt,
    });
  } catch (error) {
    console.error('Fetch resume error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
