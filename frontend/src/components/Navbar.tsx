import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, LayoutDashboard, Briefcase, FileCode, Sparkles, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50 dark:border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-purple via-indigo-600 to-cyber-light flex items-center justify-center shadow-neon-purple animate-pulse">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-gray-200 dark:to-cyber-light tracking-wide hover:opacity-95 transition-opacity">
          InterviewAI
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-2 text-sm text-slate-600 dark:text-gray-300 hover:text-cyber-light transition-colors duration-200"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {user.role === 'recruiter' ? (
               <Link
                 to="/recruiter"
                 className="flex items-center space-x-2 text-sm text-slate-600 dark:text-gray-300 hover:text-cyber-light transition-colors duration-200"
               >
                 <Briefcase className="w-4 h-4" />
                 <span className="hidden sm:inline">Recruiter Panel</span>
               </Link>
            ) : (
               <Link
                 to="/upload-resume"
                 className="flex items-center space-x-2 text-sm text-slate-600 dark:text-gray-300 hover:text-cyber-light transition-colors duration-200"
               >
                 <FileCode className="w-4 h-4" />
                 <span className="hidden sm:inline">Resume Analysis</span>
               </Link>
            )}

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />

            <Link to="/profile" className="flex flex-col items-end hover:text-cyber-light transition-colors text-right">
              <span className="text-sm font-semibold text-slate-800 dark:text-white leading-none">{user.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 capitalize mt-0.5">{user.role}</span>
            </Link>
          </nav>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400 hover:text-cyber-light dark:hover:text-cyber-light transition-all duration-200"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-100 hover:bg-red-500/10 hover:text-red-600 dark:bg-white/5 dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-slate-200 dark:border-white/5 hover:border-red-200 dark:hover:border-red-500/20 text-slate-500 dark:text-gray-400 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;

