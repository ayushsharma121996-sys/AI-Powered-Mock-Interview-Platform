import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, CheckCircle, FileText, ChevronRight, AlertCircle, Cpu } from 'lucide-react';

export const ResumeUpload: React.FC = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<{
    filename: string;
    skills: string[];
    education: string;
    projects: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest parsed resume on mount (if user wants to see what's already uploaded)
  useEffect(() => {
    const fetchLatestResume = async () => {
      try {
        const resume = await apiFetch('/resume/latest');
        if (resume) {
          setParsedData(resume);
        }
      } catch (err) {
        // Safe to ignore if they don't have one
      }
    };
    fetchLatestResume();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Invalid file format. Please upload only PDF or DOCX documents.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await apiFetch('/resume/upload', {
        method: 'POST',
        body: formData,
      });
      setParsedData(response.resume);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process resume parsing.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Resume Parser</h1>
        <p className="text-gray-400 max-w-lg mx-auto text-sm">
          Upload your resume. Our AI model will extract your tech stack, education milestones, and key projects to customize your questions.
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Column */}
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center space-y-4 ${
              isDragOver
                ? 'border-cyber-purple bg-cyber-purple/5 scale-[1.01]'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="p-4 bg-cyber-light/10 text-cyber-light rounded-full">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-bold">Drag and drop your file here</p>
              <p className="text-xs text-gray-500 mt-1">Accepts PDF or DOCX formats (Max 10MB)</p>
            </div>

            <div className="relative">
              <input
                type="file"
                id="file-select"
                onChange={handleFileChange}
                accept=".pdf,.docx"
                className="hidden"
              />
              <label
                htmlFor="file-select"
                className="cursor-pointer inline-block text-xs bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 px-5 py-2.5 rounded-xl transition-all duration-200"
              >
                Or Browse Files
              </label>
            </div>
          </div>

          {file && (
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-cyber-purple" />
                <div className="text-left">
                  <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-cyber-light text-slate-900 text-xs font-black px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all duration-200"
              >
                {uploading ? 'Parsing...' : 'Analyze Now'}
              </button>
            </div>
          )}
        </div>

        {/* AI Results Column */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 relative min-h-[300px] flex flex-col justify-between">
          {uploading ? (
            <div className="flex flex-col items-center justify-center flex-1 space-y-4">
              <div className="w-12 h-12 border-4 border-cyber-purple border-t-transparent rounded-full animate-spin shadow-neon-purple" />
              <div className="text-center">
                <p className="text-white font-bold flex items-center justify-center gap-1.5">
                  AI Analyzing Resume <Cpu className="w-4 h-4 text-cyber-light animate-pulse" />
                </p>
                <p className="text-xs text-gray-500 mt-1">Extracting skills, projects & educational history...</p>
              </div>
            </div>
          ) : parsedData ? (
            <div className="space-y-6 flex-1 text-left">
              <div className="flex items-center space-x-2.5 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Analysis Complete</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Filename</h3>
                <p className="text-sm font-semibold text-white">{parsedData.filename}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Extracted Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs bg-cyber-light/10 border border-cyber-light/20 text-cyber-light px-2.5 py-1 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Education Summary</h3>
                <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                  {parsedData.education}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Projects Detected</h3>
                <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                  {parsedData.projects}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => navigate('/role-select')}
                  className="flex items-center space-x-2 text-xs bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-neon-purple hover:scale-[1.02] active:scale-95 transition-all duration-200"
                >
                  <span>Select Role & Practice</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 space-y-2 text-center">
              <FileText className="w-12 h-12 text-gray-600" />
              <p className="text-sm text-gray-500 font-medium">No resume parsed yet.</p>
              <p className="text-xs text-gray-600 max-w-[200px]">Upload your PDF or DOCX file to run automated parsing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ResumeUpload;
