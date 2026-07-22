import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const RoleSelect: React.FC = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [type, setType] = useState<'technical' | 'hr'>('technical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const POPULAR_ROLES = [
    'General HR & Leadership',
    'Project Manager',
    'Customer Success',
    'HR Specialist',
    'Sales Executive'
  ];

  const TECH_STACKS = [
    { name: 'Frontend', role: 'Frontend Developer', desc: 'React, TypeScript, TailwindCSS' },
    { name: 'Backend', role: 'Backend Developer', desc: 'NodeJS, ExpressJS, SQL, Prisma' },
    { name: 'DSA', role: 'Software Engineer (DSA)', desc: 'Data Structures and Algorithms' },
    { name: 'Data Science', role: 'Data Scientist', desc: 'Python, Machine Learning, Data Analytics' },
  ];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      setError('Please select or write a target job role.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/interviews/start', {
        method: 'POST',
        body: JSON.stringify({ role: role.trim(), type }),
      });
      
      // Redirect to the interview session
      navigate(`/interview/${response.interviewId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start the interview session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-12 px-4">
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden text-left space-y-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-light/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-extrabold text-white tracking-wide">Configure Your Interview</h2>
          <p className="text-xs text-gray-400">Choose your targeted professional stream and AI context.</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-6">
          {/* Interview Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Interview Focus</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setType('technical');
                  setRole('');
                }}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 ${
                  type === 'technical'
                    ? 'bg-cyber-light/10 border-cyber-light text-cyber-light shadow-neon-cyan'
                    : 'bg-[#141a24] border-white/5 text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-sm font-bold">Technical Interview</span>
                <span className="text-[10px] text-gray-500 mt-1">Core Tech, Architectures & Coding Round</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('hr');
                  setRole('');
                }}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 ${
                  type === 'hr'
                    ? 'bg-cyber-purple/10 border-cyber-purple text-cyber-purple shadow-neon-purple'
                    : 'bg-[#141a24] border-white/5 text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-sm font-bold">HR/Behavioral</span>
                <span className="text-[10px] text-gray-500 mt-1">STAR methodology, leadership, weaknesses</span>
              </button>
            </div>
          </div>

          {/* Target Role Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Target Job Role</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Java Developer, Data Analyst"
                className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-light rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Quick selectors */}
            <div className="pt-2">
              <span className="text-[10px] text-gray-500 font-semibold block mb-2 uppercase">
                {type === 'technical' ? 'Select Tech Stack' : 'Popular Focus Areas'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {type === 'technical' ? (
                  TECH_STACKS.map((t, idx) => {
                    const isSelected = role === t.role;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRole(t.role)}
                        className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-150 ${
                          isSelected
                            ? 'bg-cyber-light/10 border-cyber-light text-cyber-light shadow-neon-cyan'
                            : 'bg-[#141a24] border-white/5 text-gray-400 hover:bg-[#1f2833]/50'
                        }`}
                      >
                        <span className="text-xs font-bold text-white">{t.name}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{t.desc}</span>
                      </button>
                    );
                  })
                ) : (
                  POPULAR_ROLES.map((r, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-[11px] text-left p-3.5 rounded-xl border font-medium transition-all duration-150 ${
                        role === r
                          ? 'bg-cyber-purple/10 border-cyber-purple text-cyber-purple shadow-neon-purple'
                          : 'bg-[#141a24] border-white/5 text-gray-400 hover:bg-[#1f2833]/50'
                      }`}
                    >
                      {r}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-cyber-light via-indigo-600 to-cyber-purple text-white rounded-2xl font-black flex items-center justify-center space-x-2 hover:opacity-95 disabled:opacity-50 transition-all duration-200 shadow-neon-cyan"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                <span>Initialize AI Interview</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default RoleSelect;
