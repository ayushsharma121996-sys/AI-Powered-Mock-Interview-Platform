import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Briefcase, FileCode, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-purple via-indigo-600 to-cyber-light flex items-center justify-center shadow-neon-purple animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-cyber-light tracking-wide hover:opacity-95 transition-opacity">
          InterviewAI
        </Link>
      </div>

      {user && (
        <nav className="flex items-center space-x-6">
          <Link
            to="/"
            className="flex items-center space-x-2 text-sm text-gray-300 hover:text-cyber-light transition-colors duration-200"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {user.role === 'recruiter' ? (
            <Link
              to="/recruiter"
              className="flex items-center space-x-2 text-sm text-gray-300 hover:text-cyber-light transition-colors duration-200"
            >
              <Briefcase className="w-4 h-4" />
              <span>Recruiter Panel</span>
            </Link>
          ) : (
            <Link
              to="/upload-resume"
              className="flex items-center space-x-2 text-sm text-gray-300 hover:text-cyber-light transition-colors duration-200"
            >
              <FileCode className="w-4 h-4" />
              <span>Resume Analysis</span>
            </Link>
          )}

          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center space-x-3">
            <Link to="/profile" className="flex flex-col items-end hover:text-cyber-light transition-colors text-right">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              <span className="text-xs text-gray-400 capitalize">{user.role}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 text-gray-400 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
export default Navbar;
