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

    const prompt = `
      You are an elite interviewer for a ${role} position.
      Generate exactly 8 personalized interview questions for a candidate with these skills: ${skills.join(', ')}.
      
      Interview Category: ${type.toUpperCase()}

      Rules:
      1. Generate EXACTLY 8 questions in total.
      2. The first 5 questions MUST be Multiple Choice Questions (set type to "mcq").
         - For each MCQ, provide 4 options in the "sampleAnswer" field as a stringified JSON object matching this schema:
           {"options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "a" | "b" | "c" | "d"}
           Note: The "correctAnswer" property MUST be a single lowercase letter: "a", "b", "c", or "d".
      3. If category is TECHNICAL:
         - Generate 5 MCQs (type "mcq") about technical concepts.
         - Generate 2 written technical explanation questions (set type to "technical"). For these, provide a 1-2 sentence reference solution in "sampleAnswer".
         - Generate 1 coding challenge question (set type to "coding"). For this, provide a starter JavaScript coding stub in "sampleAnswer" (e.g. "// Write a function ... function solve() {}").
      4. If category is HR:
         - Generate 5 MCQs (type "mcq") about situational judgment or HR scenarios.
         - Generate 3 written behavioral questions (set type to "behavioral"). For these, provide a 1-2 sentence reference answer in "sampleAnswer".
      5. Keep all questions highly professional and relevant to the role: ${role}.

      Return the response strictly as a JSON array of objects matching this schema:
      [
        {
          "questionText": "Question text?",
          "type": "mcq" | "technical" | "coding" | "behavioral",
          "sampleAnswer": "Stringified JSON for MCQ, or reference answer/code stub for others"
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
      // 5 MCQs
      {
        questionText: 'If a project requirement is ambiguous, what is the best first step?',
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) Ask the client or product manager for immediate clarification',
            'B) Proceed with your own assumptions to save time',
            'C) Wait until the next sprint planning to address it',
            'D) Delegate the task to a teammate'
          ],
          correctAnswer: 'a'
        })
      },
      {
        questionText: 'How do you handle a situation where you cannot meet a critical deadline?',
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) Hide it and hope no one notices',
            'B) Communicate early with stakeholders, explain the bottleneck, and offer alternative plans',
            'C) Rush the work and compromise on code quality',
            'D) Blame other team members for the delay'
          ],
          correctAnswer: 'b'
        })
      },
      {
        questionText: 'Which style of communication is most effective in a cross-functional agile team?',
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) Technical jargon heavy to look expert',
            'B) Rare and minimal communication to avoid noise',
            'C) Transparent, frequent, and empathetic communication tailored to the audience',
            'D) Communication only through formal emails'
          ],
          correctAnswer: 'c'
        })
      },
      {
        questionText: 'What is the main goal of a sprint retrospective meeting?',
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) Pointing fingers at people who made mistakes',
            'B) Reflecting on the sprint to identify improvements for the next sprint',
            'C) Demoing the work done to stakeholders',
            'D) Planning tasks for the next release'
          ],
          correctAnswer: 'b'
        })
      },
      {
        questionText: 'How do you prioritize multiple tasks with high urgency?',
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) Work on the easiest tasks first',
            'B) Work on whichever task is requested by the loudest stakeholder',
            'C) Assess impact vs effort, consult the team lead, and tackle tasks sequentially',
            'D) Multitask on all of them simultaneously'
          ],
          correctAnswer: 'c'
        })
      },
      // 3 Written
      {
        questionText: 'Tell me about yourself and your journey as a professional.',
        type: 'behavioral',
        sampleAnswer: 'Strong candidates will explain their background, achievements, and fit for the role.'
      },
      {
        questionText: 'Can you describe a challenging professional situation and how you solved it?',
        type: 'behavioral',
        sampleAnswer: 'Looking for a structured STAR response: Situation, Task, Action, Result.'
      },
      {
        questionText: 'How do you handle constructive criticism from your peers or managers?',
        type: 'behavioral',
        sampleAnswer: 'Assess receptiveness, growth mindset, and constructive implementation of feedback.'
      }
    ];
  } else {
    // Technical questions customized to skills/role
    return [
      // 5 MCQs
      {
        questionText: `Which of the following is a key feature of the virtual DOM in React?`,
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) It renders the entire HTML document on every user click',
            'B) It performs in-memory updates and batches minimal reconciliations to the real DOM',
            'C) It acts as a direct interface to the browser database',
            'D) It runs backend database queries'
          ],
          correctAnswer: 'b'
        })
      },
      {
        questionText: `In CSS flexbox, which property defines the alignment along the main axis?`,
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) align-items',
            'B) align-content',
            'C) justify-content',
            'D) flex-direction'
          ],
          correctAnswer: 'c'
        })
      },
      {
        questionText: `What is the primary purpose of indexing in database management systems?`,
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) To compress the database size',
            'B) To speed up retrieval of data records at the cost of additional write overhead',
            'C) To secure the data from unauthorized access',
            'D) To ensure transactions are ACID compliant'
          ],
          correctAnswer: 'b'
        })
      },
      {
        questionText: `What does the "I" stand for in SOLID principles of software design?`,
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) Inheritance Principle',
            'B) Integration Principle',
            'C) Interface Segregation Principle',
            'D) Iteration Principle'
          ],
          correctAnswer: 'c'
        })
      },
      {
        questionText: `Which of the following describes the time complexity of searching in a balanced Binary Search Tree?`,
        type: 'mcq',
        sampleAnswer: JSON.stringify({
          options: [
            'A) O(1)',
            'B) O(N)',
            'C) O(N log N)',
            'D) O(log N)'
          ],
          correctAnswer: 'd'
        })
      },
      // 2 Written Technical
      {
        questionText: `What are the core architectural design principles you utilize when developing in ${role}?`,
        type: 'technical',
        sampleAnswer: 'Common patterns include clean architecture, separation of concerns, MVC, and microservices.'
      },
      {
        questionText: `Explain the differences between synchronous and asynchronous operations in modern software environments.`,
        type: 'technical',
        sampleAnswer: 'Synchronous blocks execution, while asynchronous processes defer execution or run in parallel using threads or event loops.'
      },
      // 1 Coding
      {
        questionText: 'Write a JavaScript function `twoSum(nums, target)` that returns indices of the two numbers such that they add up to `target`. Assume each input has exactly one solution.',
        type: 'coding',
        sampleAnswer: `// Starter Code\nfunction twoSum(nums, target) {\n  // Write your code here\n  return [];\n}\n\n// Examples:\n// twoSum([2, 7, 11, 15], 9) -> [0, 1]`
      }
    ];
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
