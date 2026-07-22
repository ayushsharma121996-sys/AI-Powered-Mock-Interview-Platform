import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, FileText, CheckCircle, BarChart3, TrendingUp, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface HistoryItem {
  id: string;
  role: string;
  score: number;
  createdAt: string;
}

interface SummaryData {
  totalInterviews: number;
  averageScore: number;
  strongTopics: string[];
  weakTopics: string[];
  history: HistoryItem[];
}

export const Dashboard: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(false);
  const [highlightChart, setHighlightChart] = useState(false);
  const [highlightSkills, setHighlightSkills] = useState(false);

  const scrollToChart = () => {
    const el = document.getElementById('performance-chart');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setHighlightChart(true);
      setTimeout(() => setHighlightChart(false), 2000);
    }
  };

  const scrollToSkills = () => {
    const el = document.getElementById('skill-insights');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setHighlightSkills(true);
      setTimeout(() => setHighlightSkills(false), 2000);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check latest resume status
        try {
          await apiFetch('/resume/latest');
          setHasResume(true);
        } catch (err) {
          setHasResume(false);
        }

        // Fetch history summary
        const summary = await apiFetch('/interviews/history/summary');
        setData(summary);
      } catch (err: any) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-cyber-light border-t-transparent rounded-full animate-spin shadow-neon-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-light/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Hey, {user?.name}! <Sparkles className="w-6 h-6 text-cyber-light animate-pulse" />
          </h1>
          <p className="text-gray-400 max-w-xl">
            Prepare for your dream interview. Upload your resume, run automated skill extractions, and practice in real time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/upload-resume')}
            className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3.5 rounded-2xl font-bold transition-all duration-200"
          >
            <FileText className="w-5 h-5 text-cyber-purple" />
            <span>Analyze Resume</span>
          </button>
          <button
            onClick={() => navigate(hasResume ? '/role-select' : '/upload-resume')}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyber-light to-indigo-500 text-slate-900 px-6 py-3.5 rounded-2xl font-black shadow-neon-cyan hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <Play className="w-5 h-5 fill-slate-900 text-slate-900" />
            <span>Start Practice Interview</span>
          </button>
        </div>
      </div>

      {/* Warning banner if no resume uploaded */}
      {!hasResume && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-yellow-500/5 border border-yellow-500/20 text-yellow-400/90 rounded-2xl gap-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm">
              You haven't uploaded a resume yet! Uploading a resume allows the AI to tailor custom questions matching your tech stack.
            </span>
          </div>
          <button
            onClick={() => navigate('/upload-resume')}
            className="text-xs bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 px-4 py-2 rounded-xl font-bold transition-all duration-200 whitespace-nowrap"
          >
            Upload Resume Now
          </button>
        </div>
      )}

      {/* Score and Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => navigate(hasResume ? '/role-select' : '/upload-resume')}
          className="glass-panel p-6 rounded-2xl flex items-center space-x-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg transition-all duration-200 border-b-2 border-b-cyber-light/40"
        >
          <div className="p-4 bg-cyber-light/10 text-cyber-light rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Interviews Practice</p>
            <p className="text-2xl font-bold text-white mt-1">{data?.totalInterviews || 0}</p>
          </div>
        </div>

        <div 
          onClick={scrollToChart}
          className="glass-panel p-6 rounded-2xl flex items-center space-x-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg transition-all duration-200 border-b-2 border-b-cyber-purple/40"
        >
          <div className="p-4 bg-cyber-purple/10 text-cyber-purple rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Average Score</p>
            <p className="text-2xl font-bold text-white mt-1">
              {data && data.totalInterviews > 0 ? `${data.averageScore}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div 
          onClick={scrollToSkills}
          className="glass-panel p-6 rounded-2xl flex items-center space-x-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg transition-all duration-200 border-b-2 border-b-emerald-500/40"
        >
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Strong Area</p>
            <p className="text-sm font-bold text-white mt-1 truncate max-w-[140px]">
              {data?.strongTopics?.[0] || 'Java Fundamentals'}
            </p>
          </div>
        </div>

        <div 
          onClick={scrollToSkills}
          className="glass-panel p-6 rounded-2xl flex items-center space-x-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg transition-all duration-200 border-b-2 border-b-red-500/40"
        >
          <div className="p-4 bg-red-500/10 text-red-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Weak Area</p>
            <p className="text-sm font-bold text-white mt-1 truncate max-w-[140px]">
              {data?.weakTopics?.[0] || 'System Design'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SVG Performance Chart */}
        <div 
          id="performance-chart" 
          className={`glass-panel p-6 rounded-3xl lg:col-span-2 space-y-6 transition-all duration-500 ${
            highlightChart ? 'ring-2 ring-cyber-light shadow-neon-cyan scale-[1.01]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyber-light" />
              <span>Performance Trend</span>
            </h3>
            <span className="text-xs text-cyber-light font-medium bg-cyber-light/5 px-3 py-1 rounded-full">
              Latest {data?.history?.length || 0} Sessions
            </span>
          </div>

          <div className="relative h-64 w-full flex items-end justify-between px-2 pt-6 border-b border-white/5">
            {data?.history && data.history.length > 0 ? (
              data.history
                .slice()
                .reverse()
                .map((item, index) => {
                  const barHeight = item.score || 0;
                  return (
                    <div key={item.id} className="group flex flex-col items-center flex-1 mx-1.5 max-w-[50px] relative">
                      {/* Tooltip */}
                      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#141a24] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg z-20 whitespace-nowrap">
                        {item.role}: {item.score}%
                      </span>

                      {/* Bar */}
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 via-cyber-purple to-cyber-light rounded-t-lg group-hover:opacity-90 transition-all duration-300 relative"
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-t-lg transition-opacity duration-300" />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 truncate w-full text-center">
                        Session {index + 1}
                      </span>
                    </div>
                  );
                })
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                <BarChart3 className="w-8 h-8 text-gray-600" />
                <p className="text-sm text-gray-500">Practice your first interview to view analytics</p>
              </div>
            )}
          </div>
        </div>

        {/* Strong/Weak Skills */}
        <div 
          id="skill-insights" 
          className={`glass-panel p-6 rounded-3xl space-y-6 transition-all duration-500 ${
            highlightSkills ? 'ring-2 ring-cyber-purple shadow-neon-purple scale-[1.01]' : ''
          }`}
        >
          <h3 className="text-lg font-bold text-white">Skill Insights</h3>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 block mb-2">Strengths</span>
              <div className="flex flex-wrap gap-2">
                {data?.strongTopics && data.strongTopics.length > 0 ? (
                  data.strongTopics.map((topic, i) => (
                    <span key={i} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl font-medium">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Complete interviews to extract strengths</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <span className="text-xs font-semibold text-red-400 block mb-2">Needs Improvement</span>
              <div className="flex flex-wrap gap-2">
                {data?.weakTopics && data.weakTopics.length > 0 ? (
                  data.weakTopics.map((topic, i) => (
                    <span key={i} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl font-medium">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Complete interviews to extract weak topics</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h3 className="text-lg font-bold text-white">Mock Interview Practice History</h3>

        <div className="overflow-x-auto">
          {data?.history && data.history.length > 0 ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Job Role / Stream</th>
                  <th className="pb-3 font-semibold">Date Completed</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.history.map((item) => (
                  <tr key={item.id} className="text-sm text-gray-300 hover:bg-white/5 transition-colors duration-150">
                    <td className="py-4 font-semibold text-white">{item.role}</td>
                    <td className="py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.score >= 85
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.score >= 70
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {item.score}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => navigate(`/report/${item.id}`)}
                        className="text-xs text-cyber-light hover:underline font-bold"
                      >
                        View Report Card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No interview sessions found. Start a practice round to generate your history record.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
