# AI-Powered Mock Interview Platform

An advanced, full-stack application designed to simulate technical interviews, assess coding challenges in real-time, and analyze candidate resumes using generative AI. The platform features an AI voice-enabled interviewer, a coding sandbox with automated test case runs, and a recruiter dashboard for assessment reviews.

---

## 🚀 Key Features

* **🎙️ AI Voice Interviewer**: Utilizes built-in Text-to-Speech (TTS) to read interview questions aloud. Includes responsive controls (Mute/Unmute, Replay) and dynamic visual cues (glowing avatar animations syncing with listening/speaking states).
* **💻 Coding Sandbox**: Integrates the Monaco Editor with support for multiple programming languages, providing a complete test-case validation suite and runtime error parsing.
* **📄 Resume Analyzer**: Allows candidates to upload PDF resumes, which are parsed and analyzed to tailor mock interview questions specifically to their skillset and experience.
* **🔑 Secure Authentication**: Full sign-up, sign-in, and password recovery system using JWT. Implements a robust password reset flow powered by Nodemailer (supporting custom SMTP and Ethereal test mail fallbacks).
* **📊 Recruiter Control Panel**: A dashboard for recruiters to view candidates, check detailed performance reports, view scores, and read specific feedback on interview transcripts.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React, Vite, TypeScript
* **Styling**: Tailwind CSS
* **Code Editor**: Monaco Editor (`@monaco-editor/react`)
* **Icons**: Lucide React
* **Speech/Audio**: Web Speech API (SpeechSynthesis), Web Audio API

### Backend
* **Runtime & Framework**: Node.js, Express, TypeScript
* **Database & ORM**: Prisma ORM, SQLite
* **AI Engine**: Gemini API (Google Generative AI)
* **Email System**: Nodemailer
* **Parsing**: PDF Parsing library

---

## 📁 Project Structure

```text
summerpep-project/
├── backend/                  # Express & TypeScript API server
│   ├── prisma/               # Database schemas & migrations
│   ├── src/
│   │   ├── middleware/       # JWT & route guards
│   │   ├── routes/           # Auth, Coding, Interview, Recruiter, Resume routes
│   │   ├── utils/            # Gemini client, Nodemailer mailer, PDF parser
│   │   └── index.ts          # Server entrypoint
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Vite & React SPA client
│   ├── src/
│   │   ├── components/       # Navigation, Voice Recorder
│   │   ├── context/          # Authentication state context
│   │   ├── pages/            # Dashboard, Interview, Recruiter, Resume Upload pages
│   │   └── main.tsx          # Application entrypoint
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## ⚙️ Setup and Installation

Follow these steps to set up the project locally on your machine.

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (v9 or higher)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/ayushsharma121996-sys/AI-Powered-Mock-Interview-Platform.git
cd AI-Powered-Mock-Interview-Platform
```

---

### Step 2: Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend` directory (a template is provided in the folder) and supply the necessary environment variables:
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_jwt_secret"
   GEMINI_API_KEY="your_gemini_api_key"

   # SMTP Configuration (Optional - Fallback will use Ethereal console link)
   SMTP_HOST="smtp.mailtrap.io"
   SMTP_PORT=2525
   SMTP_USER="your_smtp_username"
   SMTP_PASS="your_smtp_password"
   SMTP_FROM='"InterviewAI Support" <support@interviewai.local>'
   ```
4. Set up the SQLite database and run the migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the backend developer server:
   ```bash
   npm run dev
   ```

---

### Step 3: Configure the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 🔒 License

This project is licensed under the MIT License - see the LICENSE file for details.
