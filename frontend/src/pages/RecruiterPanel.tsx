import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { Users, ChevronRight, AlertCircle, Mail, CheckCircle, Download, Plus, Trash2, FileSignature, Sparkles } from 'lucide-react';

interface CandidateSummary {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  resumeFilename: string | null;
  skills: string[];
  interviewsCount: number;
  averageScore: number | null;
  latestInterview: {
    id: string;
    role: string;
    score: number;
    createdAt: string;
  } | null;
}

interface InterviewTemplate {
  id: string;
  roleName: string;
  description: string;
  skillsList: string[];
  createdAt: string;
}

export const RecruiterPanel: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSummary | null>(null);

  // Dashboard Tabs: 'pipeline' or 'templates'
  const [activeTab, setActiveTab] = useState<'pipeline' | 'templates'>('pipeline');

  // Form states for creating templates
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  useEffect(() => {
    if (user?.role !== 'recruiter') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch candidates
        const candidatesData = await apiFetch('/recruiter/candidates');
        setCandidates(candidatesData);
        if (candidatesData.length > 0) {
          setSelectedCandidate(candidatesData[0]);
        }

        // Fetch templates
        const templatesData = await apiFetch('/recruiter/templates');
        setTemplates(templatesData);
      } catch (err: any) {
        setError(err.message || 'Failed to load recruiter insights.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_URL}/recruiter/candidates/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('interviewai_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to generate export file.');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interviewai_candidates_report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV report.');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || !description.trim() || !skillsInput.trim()) {
      setError('Please fill in all the template fields.');
      return;
    }

    setCreatingTemplate(true);
    setError(null);

    const skillsList = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      const response = await apiFetch('/recruiter/templates', {
        method: 'POST',
        body: JSON.stringify({
          roleName: roleName.trim(),
          description: description.trim(),
          skillsList,
        }),
      });

      setTemplates((prev) => [response, ...prev]);
      setShowCreateModal(false);
      setRoleName('');
      setDescription('');
      setSkillsInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to register new template.');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom template?')) return;
    try {
      await apiFetch(`/recruiter/templates/${templateId}`, {
        method: 'DELETE',
      });
      setTemplates((prev) => prev.filter(t => t.id !== templateId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete custom template.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-cyber-purple border-t-transparent rounded-full animate-spin shadow-neon-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-cyber-purple animate-pulse" />
            <span>Recruiter Analytics Portal</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Review candidates, track templates, and export analytics.</p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex bg-[#141a24] p-1.5 rounded-2xl border border-white/5 self-start">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'pipeline'
                ? 'bg-cyber-purple text-white shadow-neon-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Candidate Pipeline
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'templates'
                ? 'bg-cyber-purple text-white shadow-neon-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Custom Role Templates
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'pipeline' ? (
        /* CANDIDATE PIPELINE TAB */
        candidates.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
            <Users className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Candidates Found</h3>
            <p className="text-xs text-gray-500">Practice runs by candidates will display logs here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-200"
              >
                <Download className="w-4 h-4 text-cyber-light" />
                <span>Export Candidate CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Pipeline Table */}
              <div className="lg:col-span-7 glass-panel p-6 rounded-3xl flex flex-col space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-cyber-light" />
                  <span>Registered Candidate Pipeline</span>
                </h3>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-gray-400 uppercase font-semibold">
                        <th className="pb-3 text-left">Candidate Name</th>
                        <th className="pb-3 text-center">Interviews</th>
                        <th className="pb-3 text-center">Avg Score</th>
                        <th className="pb-3 text-right">Resume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {candidates.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCandidate(c)}
                          className={`text-xs cursor-pointer transition-colors duration-150 ${
                            selectedCandidate?.id === c.id ? 'bg-cyber-light/5 text-cyber-light font-semibold' : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          <td className="py-4 text-left">
                            <span className="font-bold text-white block">{c.name}</span>
                            <span className="text-[10px] text-gray-500">{c.email}</span>
                          </td>
                          <td className="py-4 text-center">{c.interviewsCount}</td>
                          <td className="py-4 text-center">
                            {c.averageScore !== null ? (
                              <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                                c.averageScore >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                              }`}>
                                {c.averageScore}%
                              </span>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            {c.resumeFilename ? (
                              <span className="text-[10px] text-gray-400 bg-white/5 border border-white/5 px-2 py-1 rounded truncate max-w-[120px] inline-block">
                                {c.resumeFilename}
                              </span>
                            ) : (
                              <span className="text-gray-600">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selection Details Panel */}
              <div className="lg:col-span-5 glass-panel p-6 rounded-3xl space-y-6 flex flex-col justify-between">
                {selectedCandidate ? (
                  <div className="space-y-6 flex-1 text-left">
                    <div className="border-b border-white/5 pb-4 space-y-2">
                      <h3 className="text-xl font-bold text-white">{selectedCandidate.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="w-3.5 h-3.5 text-cyber-light" />
                        <span>{selectedCandidate.email}</span>
                      </div>
                      <span className="inline-block text-[10px] text-gray-500">
                        Registered: {new Date(selectedCandidate.joinedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Resume section */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Skills Profile</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCandidate.skills.length > 0 ? (
                          selectedCandidate.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] bg-cyber-light/10 border border-cyber-light/20 text-cyber-light px-2 py-0.5 rounded font-medium">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No skills parsed from resume.</span>
                        )}
                      </div>
                    </div>

                    {/* Performance overview */}
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Performance Metrics</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-500 block uppercase">Completed Rounds</span>
                          <span className="text-xl font-bold text-white mt-1 block">{selectedCandidate.interviewsCount}</span>
                        </div>
                        <div className="bg-[#141a24] p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-500 block uppercase">Average Score</span>
                          <span className="text-xl font-bold text-white mt-1 block">
                            {selectedCandidate.averageScore !== null ? `${selectedCandidate.averageScore}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Latest Interview detail */}
                    {selectedCandidate.latestInterview && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Latest Evaluation</span>
                        <div className="flex items-center justify-between p-3.5 bg-cyber-purple/5 border border-cyber-purple/15 rounded-xl">
                          <div>
                            <span className="font-bold text-white text-xs block">{selectedCandidate.latestInterview.role}</span>
                            <span className="text-[9px] text-gray-500">
                              {new Date(selectedCandidate.latestInterview.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/report/${selectedCandidate.latestInterview?.id}`)}
                            className="flex items-center space-x-1 text-[11px] text-cyber-purple hover:underline font-bold"
                          >
                            <span>Inspect Report</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-1 py-12 text-gray-500 text-sm">
                    Select a candidate on the left to inspect performance reports.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        /* CUSTOM INTERVIEW TEMPLATES TAB */
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 text-xs bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-neon-purple hover:scale-102 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Template</span>
            </button>
          </div>

          {/* Templates Grid */}
          {templates.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
              <FileSignature className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Templates Registered</h3>
              <p className="text-xs text-gray-500">Create custom role templates to set customized prompt guidelines.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tpl) => (
                <div key={tpl.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 relative border-white/5 hover:border-cyber-purple/20 transition-all duration-300 group">
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-2 text-left">
                    <span className="text-[10px] text-cyber-light font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Target Role Template
                    </span>
                    <h4 className="text-base font-bold text-white pr-6 truncate">{tpl.roleName}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{tpl.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide block">Skills List</span>
                    <div className="flex flex-wrap gap-1">
                      {tpl.skillsList.map((skill, index) => (
                        <span key={index} className="text-[9px] bg-white/5 border border-white/5 text-gray-300 px-2 py-0.5 rounded font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-neon-purple p-6 rounded-3xl w-full max-w-md space-y-6 text-left relative">
            <div>
              <h3 className="text-lg font-bold text-white">Create Custom Template</h3>
              <p className="text-xs text-gray-400 mt-1">Configure preset custom skills for targeted interview streams.</p>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Target Role Name</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-purple rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-500 focus:outline-none"
                  placeholder="e.g. Senior DevOps Specialist"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-purple rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-500 focus:outline-none resize-none"
                  placeholder="Describe the candidate expectations, duties, and target focus..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Skills List (Comma-separated)</label>
                <input
                  type="text"
                  required
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-purple rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-500 focus:outline-none"
                  placeholder="e.g. AWS, Kubernetes, Terraform, CI/CD"
                />
                <span className="text-[9px] text-gray-500 block">Separate skills with commas. The AI will evaluate candidates against these tags.</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-gray-400 hover:text-white font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTemplate}
                  className="text-xs bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-neon-purple hover:opacity-95"
                >
                  {creatingTemplate ? 'Saving...' : 'Register Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default RecruiterPanel;
