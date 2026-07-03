import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, Lock, Shield, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResumeDetails {
  id: string;
  filename: string;
  skills: string[];
  education: string;
  projects: string;
  createdAt: string;
}

export const Profile: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [resume, setResume] = useState<ResumeDetails | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPassChange, setLoadingPassChange] = useState(false);

  useEffect(() => {
    const fetchProfileResume = async () => {
      try {
        const resumeData = await apiFetch('/resume/latest');
        setResume(resumeData);
      } catch (err) {
        // user hasn't uploaded a resume yet, which is fine
      } finally {
        setLoadingResume(false);
      }
    };
    fetchProfileResume();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoadingPassChange(true);
    try {
      const response = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(response.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoadingPassChange(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-left">
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <UserIcon className="w-8 h-8 text-cyber-light" />
          <span>My Profile Settings</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage passwords, check parsed resumes, and review metadata.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: General Profile Card & Password Update Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Meta Card */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-light/5 rounded-full blur-2xl" />
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyber-purple to-indigo-600 flex items-center justify-center shadow-lg text-white font-bold text-xl uppercase">
                {user?.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                <span className="text-[10px] bg-cyber-light/15 border border-cyber-light/35 text-cyber-light font-bold px-2 py-0.5 rounded capitalize">
                  {user?.role} Profile
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-3 text-xs text-gray-300">
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="capitalize">{user?.role} Permissions Granted</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyber-purple" /> Change Password
            </h3>

            {error && (
              <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-purple rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-purple rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#141a24] border border-white/5 focus:border-cyber-purple rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPassChange}
                className="w-full py-2.5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-neon-purple"
              >
                {loadingPassChange ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Resume History & AI Skill Profiles */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 rounded-3xl space-y-6 h-full flex flex-col justify-between">
            {loadingResume ? (
              <div className="flex items-center justify-center flex-1 py-12">
                <div className="w-8 h-8 border-4 border-cyber-light border-t-transparent rounded-full animate-spin shadow-neon-cyan" />
              </div>
            ) : resume ? (
              <div className="space-y-6 flex-1">
                <div className="flex items-start justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-5 h-5 text-cyber-light" />
                      <span>Active Resume Profile</span>
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Parsed: {new Date(resume.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-1 rounded text-gray-400 font-mono">
                    {resume.filename}
                  </span>
                </div>

                {/* Skills chips */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Extracted Skill Chips</span>
                  <div className="flex flex-wrap gap-1">
                    {resume.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="text-[10px] bg-cyber-light/10 border border-cyber-light/20 text-cyber-light px-2.5 py-1 rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Projects Summary</span>
                  <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-[#141a24] p-3 rounded-xl border border-white/5">
                    {resume.projects}
                  </p>
                </div>

                {/* Education */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Education Milestones</span>
                  <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-[#141a24] p-3 rounded-xl border border-white/5">
                    {resume.education}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center space-y-3">
                <FileText className="w-12 h-12 text-gray-600" />
                <p className="text-sm text-gray-400 font-bold">No Resume Found</p>
                <p className="text-xs text-gray-600 max-w-[240px]">
                  You haven't uploaded a resume yet. Go to Resume Analysis tab to upload PDF/DOCX resumes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
