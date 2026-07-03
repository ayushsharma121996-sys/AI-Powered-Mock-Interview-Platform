import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, Check, X, ArrowLeft, BarChart3, HelpCircle, MessageSquare } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  questionText: string;
  userAnswer: string | null;
  sampleAnswer: string | null;
  score: number | null;
  feedback: string | null;
}

interface InterviewReport {
  id: string;
  role: string;
  score: number;
  status: string;
  createdAt: string;
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
  questions: Question[];
}

export const FeedbackReport: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQId, setActiveQId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await apiFetch(`/interviews/${interviewId}`);
        setReport(data);
        if (data.questions && data.questions.length > 0) {
          setActiveQId(data.questions[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve evaluation report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-cyber-purple border-t-transparent rounded-full animate-spin shadow-neon-purple" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <p className="text-sm text-gray-500">{error || 'This report is unavailable.'}</p>
        <button onClick={() => navigate('/')} className="text-cyber-light hover:underline font-bold flex items-center justify-center mx-auto gap-1">
          <ArrowLeft className="w-4 h-4" /> Return Dashboard
        </button>
      </div>
    );
  }

  const { role, score, feedback, questions } = report;
  const scoreColor = score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-indigo-400' : 'text-yellow-400';

  // SVG parameters for circular score ring
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Back to Dashboard */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Hero Header Report Card */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center md:justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-purple/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 flex-1">
          <div className="flex items-center space-x-2 text-cyber-light">
            <Award className="w-6 h-6 animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider">AI Evaluation Scorecard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{role}</h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Interview analysis compiled. Find details below about technical accuracies, soft skill communication vectors, and category ratings.
          </p>
        </div>

        {/* Circular SVG Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-white/5 fill-transparent"
              strokeWidth={strokeWidth}
            />
            {/* Accent circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-cyber-light fill-transparent transition-all duration-1000 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${scoreColor}`}>{score}%</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Overall</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Strengths/Weaknesses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Categories Score bar sliders */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyber-light" />
            <span>Category Performance Breakdown</span>
          </h3>

          <div className="space-y-5">
            {feedback?.categories &&
              Object.entries(feedback.categories).map(([category, rating]) => {
                const percentage = rating as number;
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="capitalize text-gray-300 tracking-wide">{category}</span>
                      <span className="text-cyber-light">{percentage}%</span>
                    </div>
                    {/* Progress Track */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-gradient-to-r from-cyber-purple to-cyber-light rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Strengths & Weaknesses checklists */}
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold text-white">Observations</h3>

          <div className="space-y-6">
            {/* Strengths */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Strengths</span>
              <ul className="space-y-2.5">
                {feedback?.strengths.map((str, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Weaknesses</span>
              <ul className="space-y-2.5">
                {feedback?.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-gray-300">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Question by Question Review Accordion */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyber-light" />
          <span>Interactive Question Review</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Question List Left column */}
          <div className="md:col-span-4 flex flex-col space-y-2 overflow-y-auto max-h-[400px]">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQId(q.id)}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 ${
                  activeQId === q.id
                    ? 'bg-cyber-light/10 border-cyber-light text-cyber-light shadow-neon-cyan'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span>Question {idx + 1}</span>
                  <span className={`px-2 py-0.5 rounded ${
                    (q.score || 0) >= 85
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : (q.score || 0) >= 70
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {q.score}%
                  </span>
                </div>
                <p className="text-xs truncate font-medium">{q.questionText}</p>
              </button>
            ))}
          </div>

          {/* Answer Analysis Display Panel Right column */}
          <div className="md:col-span-8 bg-[#141a24] border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-5 text-sm text-gray-300">
            {activeQId ? (
              (() => {
                const activeQ = questions.find((q) => q.id === activeQId);
                if (!activeQ) return null;
                return (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    {/* Prompt */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Question Prompt</h4>
                      <p className="text-sm font-semibold text-white">{activeQ.questionText}</p>
                    </div>

                    {/* User response */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-cyber-purple uppercase tracking-wide">Your Submitted Answer</h4>
                      <p className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed">
                        {activeQ.userAnswer || '(Answer empty or omitted)'}
                      </p>
                    </div>

                    {/* AI Feedback evaluation */}
                    <div className="space-y-1.5 p-4 bg-cyber-light/5 border border-cyber-light/15 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-cyber-light uppercase tracking-wide flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>AI Analysis & Constructive Review</span>
                      </h4>
                      <p className="text-xs leading-relaxed text-gray-200">
                        {activeQ.feedback || 'Evaluating text logs...'}
                      </p>
                    </div>

                    {/* Reference sample Answer */}
                    {activeQ.sampleAnswer && (
                      <div className="space-y-1.5 pt-3 border-t border-white/5">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reference Answer Guideline</h4>
                        <pre className="p-3 bg-white/5 rounded-xl text-[10px] font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap">
                          {activeQ.sampleAnswer}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center flex-1 py-12 text-gray-500">
                Select a question on the left to review metrics details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default FeedbackReport;
