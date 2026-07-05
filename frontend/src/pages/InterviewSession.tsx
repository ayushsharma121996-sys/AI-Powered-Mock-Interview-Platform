import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VoiceRecorder } from '../components/VoiceRecorder';
import Editor from '@monaco-editor/react';
import { Sparkles, Terminal, Code, ChevronRight, AlertCircle, Play, HelpCircle, User, Volume2, VolumeX } from 'lucide-react';

interface Question {
  id: string;
  type: string; // 'technical' | 'behavioral' | 'coding'
  questionText: string;
  userAnswer: string | null;
  score: number | null;
  feedback: string | null;
}

interface Interview {
  id: string;
  role: string;
  status: string;
  questions: Question[];
}

export const InterviewSession: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input states for standard questions
  const [textAnswer, setTextAnswer] = useState('');
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  // Coding states
  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [codeRunning, setCodeRunning] = useState(false);

  // TTS Speech states
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const speakQuestion = (text: string) => {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!interview) return;
    const currentQ = interview.questions[currentIdx];
    if (currentQ) {
      if (speechEnabled) {
        speakQuestion(currentQ.questionText);
      } else {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
      }
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIdx, interview, speechEnabled]);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const data = await apiFetch(`/interviews/${interviewId}`);
        setInterview(data);
        
        // Find first unanswered question
        const unansweredIdx = data.questions.findIndex((q: Question) => q.userAnswer === null);
        if (unansweredIdx !== -1) {
          setCurrentIdx(unansweredIdx);
        } else {
          // If all answered, take to last or ready to finalize
          setCurrentIdx(data.questions.length - 1);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load interview session.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  // Set default code stub when we load a coding question
  useEffect(() => {
    if (!interview) return;
    const currentQ = interview.questions[currentIdx];
    if (currentQ && currentQ.type === 'coding') {
      setCode(currentQ.userAnswer || `// JavaScript Solution\nfunction twoSum(nums, target) {\n  // Write your code here\n  return [];\n}`);
      setConsoleOutput('');
      setTestResults([]);
    } else {
      setTextAnswer(currentQ?.userAnswer || '');
    }
  }, [currentIdx, interview]);

  const handleTranscription = (transcript: string) => {
    setTextAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  const handleRunCode = async () => {
    if (!interview) return;
    setCodeRunning(true);
    setConsoleOutput('Compiling and running code test cases...\n');
    setTestResults([]);

    const currentQ = interview.questions[currentIdx];
    let problemId = 'twoSum';
    if (currentQ.questionText.toLowerCase().includes('reverse')) problemId = 'reverseList';
    if (currentQ.questionText.toLowerCase().includes('binary')) problemId = 'binarySearch';

    try {
      const response = await apiFetch('/coding/run', {
        method: 'POST',
        body: JSON.stringify({
          code,
          language: codeLanguage,
          problemId,
        }),
      });

      setConsoleOutput(
        `Status: ${response.status}\n\nConsole Outputs:\n${response.stdout || '(No console logs)'}\n\nPassed ${response.passed}/${response.total} tests.`
      );
      if (response.results) {
        setTestResults(response.results);
      }
    } catch (err: any) {
      setConsoleOutput(`Error: ${err.message}`);
    } finally {
      setCodeRunning(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interview) return;
    setSubmitting(true);
    setError(null);

    const currentQ = interview.questions[currentIdx];
    const answer = currentQ.type === 'coding' ? code : textAnswer;

    try {
      const response = await apiFetch(`/interviews/${interviewId}/submit-answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQ.id,
          userAnswer: answer,
          codeLanguage: currentQ.type === 'coding' ? codeLanguage : null,
        }),
      });

      // Update local interview state
      const updatedQuestions = [...interview.questions];
      updatedQuestions[currentIdx] = {
        ...currentQ,
        userAnswer: answer,
        score: response.score,
        feedback: response.feedback,
      };

      setInterview({
        ...interview,
        questions: updatedQuestions,
      });

      // Advance question index
      if (currentIdx < interview.questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        // Finalize interview and generate overall scorecard
        handleFinalizeInterview();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeInterview = async () => {
    setSubmitting(true);
    try {
      const result = await apiFetch(`/interviews/${interviewId}/evaluate`, {
        method: 'POST',
      });
      navigate(`/report/${result.interviewId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to finalize evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-cyber-light border-t-transparent rounded-full animate-spin shadow-neon-cyan" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Interview Not Found</h2>
        <button onClick={() => navigate('/')} className="text-cyber-light hover:underline font-bold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = interview.questions[currentIdx];
  const isCoding = currentQ.type === 'coding';

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between py-6 px-4 max-w-7xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">{interview.role} Practice Session</h2>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Focus: {currentQ.type} Question</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center space-x-2">
          {interview.questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIdx
                  ? 'w-8 bg-cyber-light shadow-neon-cyan animate-pulse'
                  : idx < currentIdx
                  ? 'w-3 bg-emerald-500'
                  : 'w-3 bg-white/10'
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 font-bold ml-2">
            {currentIdx + 1}/{interview.questions.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[450px]">
        {isCoding ? (
          /* CODING QUESTION WORKSPACE */
          <>
            {/* Left Description Column */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-3xl flex flex-col justify-between text-left space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2 text-cyber-light">
                    <Code className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Coding Round</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSpeechEnabled(!speechEnabled)}
                      className={`p-1.5 rounded-lg border transition-all duration-200 ${
                        speechEnabled
                          ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                      title={speechEnabled ? "Mute AI Voice" : "Unmute AI Voice"}
                    >
                      {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => speakQuestion(currentQ.questionText)}
                      disabled={!speechEnabled}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] text-gray-300 hover:bg-white/10 disabled:opacity-40"
                      title="Replay Voice"
                    >
                      Replay
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white">Problem Prompt</h3>
                <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                  {currentQ.questionText}
                </p>
              </div>

              {/* Instructions Helper */}
              <div className="p-4 bg-[#141a24] rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-cyber-light flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Execution Rules</span>
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Currently running in JavaScript execution mode. Write standard solution logic matching function names.
                </p>
              </div>
            </div>

            {/* Right Editor & Console Column */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              {/* Monaco IDE Container */}
              <div className="flex-1 min-h-[350px] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative bg-[#1e1e1e]">
                <div className="bg-[#141414] px-6 py-2 flex items-center justify-between border-b border-white/5">
                  <span className="text-xs font-mono text-gray-400">workspace.js</span>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-[#1a1a1a] text-xs text-gray-300 border border-white/5 rounded px-2.5 py-1 focus:outline-none focus:border-cyber-light"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python (Simulation)</option>
                    <option value="java">Java (Simulation)</option>
                  </select>
                </div>
                <Editor
                  height="100%"
                  language={codeLanguage}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    fontSize: 13,
                    fontFamily: "'Courier New', Courier, monospace",
                    minimap: { enabled: false },
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Console & Test Case Panel */}
              <div className="glass-panel p-5 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Console text */}
                <div className="space-y-2 flex flex-col justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-cyber-light" /> Console Output
                  </span>
                  <pre className="flex-1 bg-[#141a24] p-3.5 rounded-2xl border border-white/5 font-mono text-[10px] text-gray-300 whitespace-pre-wrap min-h-[100px] max-h-[150px] overflow-y-auto">
                    {consoleOutput || 'Outputs will show up here after compiling.'}
                  </pre>
                </div>

                {/* Tests results checklist */}
                <div className="space-y-2 flex flex-col justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Test Suite Checks</span>
                  <div className="flex-1 bg-[#141a24] p-3 rounded-2xl border border-white/5 space-y-2 overflow-y-auto max-h-[150px]">
                    {testResults.length > 0 ? (
                      testResults.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1.5 border-b border-white/5">
                          <span className="text-gray-400">Case {r.testCase}: <span className="font-mono text-[10px]">{r.input}</span></span>
                          <span className={`font-semibold ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.passed ? 'Passed ✓' : 'Failed ✗'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-600">Run code to initialize tests.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* STANDARD CONCEPT QUESTION INTERFACE */
          <div className="lg:col-span-12 glass-panel p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-stretch text-left">
            {/* AI Avatar Pane */}
            <div className="md:w-1/3 bg-[#141a24]/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center space-y-6">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-cyber-purple via-indigo-600 to-cyber-light flex items-center justify-center shadow-lg relative transition-all duration-300 ${
                isRecordingActive 
                  ? 'scale-105 ring-4 ring-cyber-light/30 shadow-neon-cyan animate-none' 
                  : isAiSpeaking 
                  ? 'scale-105 ring-4 ring-cyber-purple/30 shadow-neon-purple animate-pulse' 
                  : 'scale-100 opacity-90'
              }`}>
                <User className="w-16 h-16 text-white" />
                {isRecordingActive && (
                  <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-cyber-light opacity-30"></span>
                )}
                {isAiSpeaking && (
                  <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-cyber-purple opacity-30"></span>
                )}
              </div>
              <div className="text-center flex flex-col items-center">
                <span className="text-xs font-bold text-cyber-light uppercase tracking-wider block">AI Interviewer</span>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {isAiSpeaking ? 'Speaking Question...' : isRecordingActive ? 'Listening to Response...' : 'Active Speech Assessment Engaged'}
                </span>
                <div className="flex items-center space-x-2.5 mt-4">
                  <button
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className={`p-2 rounded-xl border transition-all duration-200 ${
                      speechEnabled
                        ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                    title={speechEnabled ? "Mute AI Voice" : "Unmute AI Voice"}
                  >
                    {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => speakQuestion(currentQ.questionText)}
                    disabled={!speechEnabled}
                    className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Replay
                  </button>
                </div>
              </div>
            </div>

            {/* Content Input Pane */}
            <div className="md:w-2/3 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-cyber-light">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Active Question</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                  {currentQ.questionText}
                </h2>
              </div>

              {/* Answer Input Section */}
              <div className="space-y-4">
                <textarea
                  rows={4}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Answer by voice below or draft your response directly here..."
                  className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-purple rounded-2xl p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-colors duration-200"
                />

                {/* Voice Input component */}
                <div className="flex justify-center py-2 border-t border-white/5 pt-4">
                  <VoiceRecorder
                    onTranscription={handleTranscription}
                    onStateChange={(rec) => setIsRecordingActive(rec)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Row */}
      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-gray-400 hover:text-white font-bold border border-white/5 hover:border-white/10 px-5 py-2.5 rounded-xl transition-all duration-200"
        >
          Quit Practice
        </button>

        <div className="flex items-center space-x-4">
          {isCoding && (
            <button
              onClick={handleRunCode}
              disabled={codeRunning || submitting}
              className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 text-xs"
            >
              <Play className="w-4 h-4" />
              <span>{codeRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          )}

          <button
            onClick={handleSubmitAnswer}
            disabled={submitting || (isCoding && !code) || (!isCoding && !textAnswer.trim())}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-black px-6 py-2.5 rounded-xl shadow-neon-purple hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all duration-200 text-xs"
          >
            <span>{currentIdx < interview.questions.length - 1 ? 'Save & Next Question' : 'Submit & Analyze'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default InterviewSession;
