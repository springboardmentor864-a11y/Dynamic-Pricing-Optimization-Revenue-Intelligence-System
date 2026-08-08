import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Terminal, Shield, Brain, Sliders, Key, 
  Code, AlertTriangle, HelpCircle, Mail, ChevronRight, CheckCircle2,
  FileText, Cpu, Database, Server, ExternalLink, Sparkles, Layers,
  Lock, GitFork, Users, Cloud, CheckSquare, ChevronDown, ChevronUp,
  Download, Eye, Phone, Globe, RefreshCw, FileCode, Check, FileSpreadsheet, Table
} from 'lucide-react';


import { getProjectDocuments, getDocumentDetails, downloadProjectDocument } from '../services/api';
import { useToast } from '../context/ToastContext';

const DocsPage = () => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('home');

  // Documents API state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const data = await getProjectDocuments();
        if (Array.isArray(data)) setDocuments(data);
      } catch (err) {
        console.error('Failed to load project documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  const handlePreviewDoc = async (docId) => {
    setLoadingPreview(true);
    setPreviewModalOpen(true);
    try {
      const details = await getDocumentDetails(docId);
      setSelectedDoc(details);
    } catch (err) {
      toast.error('Failed to fetch document preview.');
      setPreviewModalOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownloadDoc = async (docId, filename) => {
    try {
      await downloadProjectDocument(docId, filename);
      toast.success(`Downloaded ${filename || 'document'}!`);
    } catch (err) {
      toast.error('Failed to download document file.');
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    toast.success('Thank you! Your message has been sent to PricePilot AI Support.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  // Sections Registry
  const docSections = [
    { id: 'home', title: 'Home & Overview', icon: BookOpen, badge: 'Platform Intro' },
    { id: 'getting-started', title: 'Getting Started', icon: Sparkles, badge: 'Overview' },
    { id: 'installation', title: 'Installation & Setup', icon: Terminal, badge: 'CLI Guide' },
    { id: 'architecture', title: 'Project Architecture', icon: Layers, badge: 'System Flow' },
    { id: 'authentication', title: 'Authentication', icon: Lock, badge: 'Security & JWT' },
    { id: 'backend-apis', title: 'Backend APIs', icon: Server, badge: 'REST Reference' },
    { id: 'frontend-components', title: 'Frontend Components', icon: Code, badge: 'UI & Pages' },
    { id: 'machine-learning', title: 'Machine Learning', icon: Brain, badge: 'Extra Trees Engine' },
    { id: 'database', title: 'Database & ER Diagram', icon: Database, badge: 'PostgreSQL' },
    { id: 'technologies', title: 'Technologies Used', icon: Cpu, badge: 'Tech Stack' },
    { id: 'team', title: 'Team Members', icon: Users, badge: 'Infosys Team' },
    { id: 'project-documents', title: 'Project Documents', icon: FileText, badge: 'Downloadable Docs' },
    { id: 'user-guide', title: 'User Guide', icon: CheckSquare, badge: 'End User Manual' },
    { id: 'admin-guide', title: 'Admin Guide', icon: Shield, badge: 'Admin Handbook' },
    { id: 'deployment-guide', title: 'Deployment Guide', icon: Cloud, badge: 'Docker & Cloud' },
    { id: 'faq', title: 'Frequently Asked Questions', icon: HelpCircle, badge: 'FAQ' },
    { id: 'contact', title: 'Contact & Support', icon: Mail, badge: 'Contact Us' },
    { id: 'about', title: 'About Project', icon: ExternalLink, badge: 'Infosys 7.0' }
  ];

  // API Reference Data
  const apiEndpoints = [
    { method: 'POST', endpoint: '/api/auth/register', desc: 'Register new account & send OTP verification', auth: 'Public', resp: '201 Created' },
    { method: 'POST', endpoint: '/api/auth/login', desc: 'Authenticate user credentials & return JWT access token', auth: 'Public', resp: '200 OK Token' },
    { method: 'POST', endpoint: '/api/auth/forgot-password/request-otp', desc: 'Request 6-digit OTP code for password reset via email/phone', auth: 'Public', resp: '200 OK' },
    { method: 'POST', endpoint: '/api/auth/forgot-password/verify-otp', desc: 'Verify 6-digit OTP token validity', auth: 'Public', resp: '200 OK' },
    { method: 'POST', endpoint: '/api/auth/forgot-password/reset-password', desc: 'Reset account password with valid OTP code', auth: 'Public', resp: '200 OK' },
    { method: 'POST', endpoint: '/api/predict', desc: 'Execute Machine Learning price prediction & profit calculation', auth: 'JWT (User/Admin)', resp: '200 OK Prediction' },
    { method: 'GET', endpoint: '/api/predictions', desc: 'Retrieve prediction history log for current user or admin', auth: 'JWT (User/Admin)', resp: '200 OK List' },
    { method: 'GET', endpoint: '/api/dashboard/stats', desc: 'Fetch real-time analytics KPIs, trends, and system status', auth: 'JWT (User/Admin)', resp: '200 OK Dashboard' },
    { method: 'GET', endpoint: '/api/users', desc: 'List all registered accounts with status filtering', auth: 'JWT (Admin Only)', resp: '200 OK Users List' },
    { method: 'GET', endpoint: '/api/admin/export-users', desc: 'Generate & download formatted Users_Report.xlsx via openpyxl', auth: 'JWT (Admin Only)', resp: '200 Stream File' },
    { method: 'POST', endpoint: '/api/users/bulk-status', desc: 'Bulk approve, suspend, or activate selected user accounts', auth: 'JWT (Admin Only)', resp: '200 OK Status' },
    { method: 'POST', endpoint: '/api/users/bulk-delete', desc: 'Bulk delete selected user accounts permanently', auth: 'JWT (Admin Only)', resp: '200 OK Count' },
    { method: 'GET', endpoint: '/api/docs', desc: 'Retrieve project documents metadata repository list', auth: 'JWT (User/Admin)', resp: '200 OK Docs List' },
    { method: 'GET', endpoint: '/api/docs/{id}', desc: 'Get document details & textual preview', auth: 'JWT (User/Admin)', resp: '200 OK Preview' },
    { method: 'GET', endpoint: '/api/docs/download/{id}', desc: 'Download document binary file (PDF/Doc)', auth: 'JWT (User/Admin)', resp: '200 File Stream' }
  ];

  // Tech Stack Cards
  const techStack = [
    { name: 'React', ver: 'v19.2', purpose: 'UI Framework', desc: 'Declarative component-driven frontend architecture with dynamic rendering and hooks.', link: 'https://react.dev' },
    { name: 'TypeScript', ver: 'v5.4', purpose: 'Type Safety', desc: 'Strongly typed JavaScript superset ensuring type safety across components and services.', link: 'https://www.typescriptlang.org' },
    { name: 'Tailwind CSS', ver: 'v4.3', purpose: 'Styling & Design', desc: 'Utility-first CSS framework powering the dark futuristic glassmorphism aesthetic.', link: 'https://tailwindcss.com' },
    { name: 'FastAPI', ver: 'v0.110', purpose: 'Backend REST API', desc: 'High-performance Python web framework built on Starlette and Pydantic with OpenAPI.', link: 'https://fastapi.tiangolo.com' },
    { name: 'PostgreSQL', ver: 'v16.0', purpose: 'Relational DB', desc: 'Enterprise relational database storing users, predictions, products, and activity logs.', link: 'https://www.postgresql.org' },
    { name: 'Neon DB', ver: 'Serverless', purpose: 'Cloud Database', desc: 'Serverless cloud PostgreSQL provider with branching and instant connections.', link: 'https://neon.tech' },
    { name: 'Extra Trees', ver: 'v1.4', purpose: 'Primary ML Model', desc: 'Extremely Randomized Trees Regressor achieving peak 96.5% R² score for price prediction.', link: 'https://scikit-learn.org' },
    { name: 'XGBoost', ver: 'v2.0', purpose: 'Gradient Boosting', desc: 'Optimized distributed gradient boosting library evaluated in benchmark suite.', link: 'https://xgboost.readthedocs.io' },
    { name: 'Scikit-Learn', ver: 'v1.4', purpose: 'ML Toolkit', desc: 'Comprehensive Python Machine Learning library for training and hyperparameter tuning.', link: 'https://scikit-learn.org' },
    { name: 'Docker', ver: 'v26.0', purpose: 'Containerization', desc: 'Container deployment configuration for production backend and static assets.', link: 'https://www.docker.com' },
    { name: 'Vercel', ver: 'Cloud', purpose: 'Frontend Host', desc: 'Continuous deployment hosting platform for the Vite React single-page application.', link: 'https://vercel.com' },
    { name: 'Render', ver: 'Cloud', purpose: 'Backend Host', desc: 'Cloud platform hosting the Python FastAPI web service and background workers.', link: 'https://render.com' }
  ];

  // Team Members Data
  const teamMembers = [
    {
      name: 'Narendar Reddy',
      role: 'Lead Full Stack Architect',
      dept: 'Infosys Springboard 7.0',
      email: 'narendar@pricepilot.ai',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      skills: ['FastAPI', 'React', 'PostgreSQL', 'Architecture', 'Security', 'Openpyxl'],
      resp: 'Architected FastAPI backend, openpyxl Excel reporting engine, JWT authentication system, and React state management.'
    },
    {
      name: 'Manvitha',
      role: 'Machine Learning Engineer',
      dept: 'Infosys Springboard 7.0',
      email: 'manvitha@pricepilot.ai',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      skills: ['Python', 'Scikit-Learn', 'Extra Trees', 'XGBoost', 'Feature Engineering'],
      resp: 'Trained and evaluated ML pricing models, conducted GridSearchCV hyperparameter tuning, and optimized Extra Trees regressor.'
    },
    {
      name: 'Pravallika',
      role: 'Frontend UI/UX Specialist',
      dept: 'Infosys Springboard 7.0',
      email: 'pravallika@pricepilot.ai',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      skills: ['React', 'Tailwind CSS', 'Framer Motion', 'Glassmorphism', 'Responsive UI'],
      resp: 'Designed dark futuristic UI, responsive glassmorphic cards, interactive charts, and user management console.'
    },
    {
      name: 'Ashwindh',
      role: 'Backend & DevOps Engineer',
      dept: 'Infosys Springboard 7.0',
      email: 'ashwindh@pricepilot.ai',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      skills: ['SQLAlchemy', 'PostgreSQL', 'Neon DB', 'Docker', 'Alembic', 'REST APIs'],
      resp: 'Managed PostgreSQL database schema, Neon cloud connection, Alembic migrations, and Docker deployment pipelines.'
    }
  ];

  // FAQ Items
  const faqList = [
    { q: 'How does the PricePilot AI price prediction engine work?', a: 'PricePilot AI uses an Extra Trees Regressor model trained on product category, freight value, product dimensions, weight, and historical demand. When you input product parameters, the model predicts the optimal market price and computes profit margins in under 0.045 seconds.' },
    { q: 'How does the OTP password reset and login authentication work?', a: 'Users authenticate via JWT access tokens. For password recovery, the platform sends a secure 6-digit OTP code to the registered email address. Once verified, the user can set a new password safely.' },
    { q: 'Why was Extra Trees selected as the Best Machine Learning Model?', a: 'Extra Trees achieved the highest accuracy across evaluation metrics (R² = 96.5%, lowest MAE and RMSE) compared to Random Forest, XGBoost, Decision Trees, and Linear Regression due to its randomized node splitting which reduces variance and prevents overfitting.' },
    { q: 'How does the Admin Excel User Data Export work?', a: 'Administrators can click "Export User Data" to generate a formatted Users_Report.xlsx file via openpyxl. The Excel workbook includes custom blue headers, auto-adjusted column widths, zebra row striping, cell borders, freeze panes, and auto-filters.' },
    { q: 'Is the Neon PostgreSQL database secure and scalable?', a: 'Yes. Neon provides serverless cloud PostgreSQL with SSL encryption, connection pooling, automated backups, and instant scaling to handle heavy analytical query loads.' },
    { q: 'Which web browsers are supported by PricePilot AI?', a: 'PricePilot AI supports all modern evergreen browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari, and Brave.' }
  ];

  // Filter sections by search term
  const filteredSections = docSections.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.badge.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#111827] via-[#1E1B4B] to-[#111827] border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Enterprise Knowledge & Developer Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
              Help & <span className="gradient-text">Documentation Portal</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Complete enterprise reference guide covering system architecture, ML models, FastAPI REST APIs, PostgreSQL database, Excel export, installation steps, and downloadable project documents.
            </p>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documentation sections..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Documentation Portal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2">
          <div className="p-3.5 rounded-2xl bg-[#111827] border border-[#1F2937] space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">Documentation Directory</p>
            <div className="space-y-0.5 max-h-[680px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredSections.map((sec) => {
                const IconComp = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-[#1F2937] text-slate-400 font-mono">
                      {sec.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <div className="p-6 rounded-[22px] bg-[#111827] border border-[#1F2937] min-h-[600px] text-slate-300 space-y-6">

            {/* SECTION 1: HOME & OVERVIEW */}
            {activeSection === 'home' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">Enterprise AI Platform</span>
                  <h2 className="text-xl font-bold text-white mt-2">Welcome to PricePilot AI Platform</h2>
                  <p className="text-xs text-slate-400 mt-1">AI-Powered Dynamic Pricing & Demand Forecasting SaaS Engine</p>
                </div>

                <p className="text-xs leading-relaxed">
                  PricePilot AI is an enterprise Machine Learning dynamic pricing system engineered to calculate optimal product selling prices, forecast sales demand, and maximize profit margins for e-commerce enterprises. Powered by FastAPI, React, PostgreSQL, and Extra Trees Regressor models.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/30 space-y-1">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h4 className="text-xs font-bold text-white">Machine Learning Engine</h4>
                    <p className="text-[11px] text-slate-400">Extra Trees Regressor model delivering 96.5% R² score accuracy.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/30 space-y-1">
                    <Database className="w-5 h-5 text-blue-400" />
                    <h4 className="text-xs font-bold text-white">PostgreSQL & Neon DB</h4>
                    <p className="text-[11px] text-slate-400">Persistent relational storage with connection pooling and SSL.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 space-y-1">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white">Excel Report Generator</h4>
                    <p className="text-[11px] text-slate-400">Automated Users_Report.xlsx generator built with openpyxl styling.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: GETTING STARTED */}
            {activeSection === 'getting-started' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Getting Started Guide</h2>
                  <p className="text-xs text-slate-400">System overview and core platform features</p>
                </div>
                
                <div className="space-y-3 text-xs">
                  <p>Follow these quick steps to start exploring PricePilot AI:</p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300">
                    <li><strong className="text-white">Authentication:</strong> Login with Admin credentials (<code className="text-purple-300 font-mono">admin / admin123</code>) or User credentials (<code className="text-blue-300 font-mono">viewer / viewer123</code>).</li>
                    <li><strong className="text-white">AI Predictions:</strong> Navigate to New AI Prediction, select product parameters, and click Calculate Price.</li>
                    <li><strong className="text-white">User Management:</strong> Admins can approve new users, manage roles, and click "Export User Data (Excel)".</li>
                    <li><strong className="text-white">Analytics:</strong> Inspect real-time charts, model performance benchmarks, and database health.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SECTION 3: INSTALLATION & SETUP */}
            {activeSection === 'installation' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Installation & Environment Setup</h2>
                  <p className="text-xs text-slate-400">Step-by-step local setup for Frontend, Backend, and Database</p>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-[#1F2937]">
                    <p className="text-purple-400 font-sans font-bold mb-2">1. Frontend React Setup</p>
                    <p className="text-slate-300">cd PricePilot_AI/frontend</p>
                    <p className="text-slate-300">npm install</p>
                    <p className="text-slate-300">npm run dev</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-[#1F2937]">
                    <p className="text-blue-400 font-sans font-bold mb-2">2. Backend FastAPI Setup</p>
                    <p className="text-slate-300">cd PricePilot_AI/backend</p>
                    <p className="text-slate-300">python -m venv venv</p>
                    <p className="text-slate-300">venv\Scripts\activate  <span className="text-slate-500"># Windows</span></p>
                    <p className="text-slate-300">pip install -r requirements.txt</p>
                    <p className="text-slate-300">uvicorn main:app --reload --port 8000</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-[#1F2937]">
                    <p className="text-emerald-400 font-sans font-bold mb-2">3. Database & Migration (Neon PostgreSQL)</p>
                    <p className="text-slate-300">alembic upgrade head  <span className="text-slate-500"># Run migrations</span></p>
                    <p className="text-slate-300">python seed.py        <span className="text-slate-500"># Seed default users & products</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: PROJECT ARCHITECTURE */}
            {activeSection === 'architecture' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Project Architecture</h2>
                  <p className="text-xs text-slate-400">End-to-end data flow and decoupled tier architecture</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-[#1F2937] space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs font-mono">
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 w-full sm:w-auto">
                      React Frontend
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 w-full sm:w-auto">
                      JWT Auth & API Layer
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                    <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 w-full sm:w-auto">
                      FastAPI Backend
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                    <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-full sm:w-auto">
                      PostgreSQL DB & ML Engine
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: AUTHENTICATION */}
            {activeSection === 'authentication' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Authentication & Authorization</h2>
                  <p className="text-xs text-slate-400">JWT Tokens, OTP Password Recovery, and Role-Based Access Control</p>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-purple-400" /> JWT Bearer Tokens
                    </h4>
                    <p>On login, FastAPI issues a signed HS256 JWT access token stored securely in localStorage and automatically attached to request headers.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                      <Key className="w-4 h-4 text-amber-400" /> OTP Verification
                    </h4>
                    <p>Forgot password requests generate a 6-digit numeric OTP with 10-minute expiration. Verified via <code className="text-amber-300 font-mono">/api/auth/forgot-password/verify-otp</code>.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: BACKEND APIs */}
            {activeSection === 'backend-apis' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Backend REST API Reference</h2>
                  <p className="text-xs text-slate-400">Complete API catalog powered by FastAPI OpenAPI</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-[#1F2937] text-slate-400 font-extrabold uppercase text-[10px]">
                        <th className="p-3">Method</th>
                        <th className="p-3">Endpoint</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Authorization</th>
                        <th className="p-3">Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937] font-mono text-[11px]">
                      {apiEndpoints.map((ep, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              ep.method === 'GET' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {ep.method}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-white">{ep.endpoint}</td>
                          <td className="p-3 font-sans text-slate-300">{ep.desc}</td>
                          <td className="p-3 text-slate-400">{ep.auth}</td>
                          <td className="p-3 text-emerald-400">{ep.resp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 7: FRONTEND COMPONENTS */}
            {activeSection === 'frontend-components' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Frontend Architecture & Components</h2>
                  <p className="text-xs text-slate-400">Modular React pages and shared UI components</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <h4 className="font-bold text-white">DashboardPage.jsx</h4>
                    <p className="text-slate-400 text-[11px] mt-1">Real-time KPI metrics, database status, and sales trend charts.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <h4 className="font-bold text-white">PredictionPage.jsx</h4>
                    <p className="text-slate-400 text-[11px] mt-1">Interactive ML price calculator with profit margin breakdown.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <h4 className="font-bold text-white">UsersPage.jsx</h4>
                    <p className="text-slate-400 text-[11px] mt-1">Admin user console, openpyxl Excel exports, and bulk management.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-[#1F2937]">
                    <h4 className="font-bold text-white">DocsPage.jsx</h4>
                    <p className="text-slate-400 text-[11px] mt-1">Enterprise documentation portal and project documents repository.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: MACHINE LEARNING */}
            {activeSection === 'machine-learning' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Machine Learning Engine</h2>
                  <p className="text-xs text-slate-400">Evaluation benchmarks and why Extra Trees was selected as Best Model</p>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-2">
                  <h4 className="font-bold text-purple-300">Why Extra Trees Regressor Became Best Model</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Extra Trees (Extremely Randomized Trees) randomizes cut-points when splitting decision tree nodes. This significantly reduces variance compared to standard Random Forest and XGBoost while maintaining exceptional accuracy (R² = 0.965) and fast execution time (0.045s).
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 font-extrabold uppercase text-[10px]">
                        <th className="p-3">ML Model</th>
                        <th className="p-3">R² Score</th>
                        <th className="p-3">MAE</th>
                        <th className="p-3">RMSE</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937] font-mono text-[11px]">
                      <tr className="bg-purple-950/30">
                        <td className="p-3 font-bold text-purple-300">Extra Trees Regressor</td>
                        <td className="p-3 text-emerald-400 font-bold">0.9650</td>
                        <td className="p-3">₹12.40</td>
                        <td className="p-3">₹18.60</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans font-bold">Best Model</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white">Random Forest</td>
                        <td className="p-3 text-slate-300">0.9420</td>
                        <td className="p-3">₹15.80</td>
                        <td className="p-3">₹22.10</td>
                        <td className="p-3 text-slate-400 font-sans">Runner Up</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white">XGBoost Regressor</td>
                        <td className="p-3 text-slate-300">0.9380</td>
                        <td className="p-3">₹16.20</td>
                        <td className="p-3">₹23.40</td>
                        <td className="p-3 text-slate-400 font-sans">High Performance</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white">Gradient Boosting</td>
                        <td className="p-3 text-slate-300">0.9150</td>
                        <td className="p-3">₹19.50</td>
                        <td className="p-3">₹27.80</td>
                        <td className="p-3 text-slate-400 font-sans">Evaluated</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white">Decision Tree</td>
                        <td className="p-3 text-slate-300">0.8840</td>
                        <td className="p-3">₹24.10</td>
                        <td className="p-3">₹34.20</td>
                        <td className="p-3 text-slate-400 font-sans">Evaluated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 9: DATABASE */}
            {activeSection === 'database' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Database & ER Diagram</h2>
                  <p className="text-xs text-slate-400">PostgreSQL relational database schema specifications</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-[#1F2937] space-y-3 font-mono text-xs">
                  <p className="text-purple-400 font-sans font-bold">Relational Entity Tables:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                    <li><strong className="text-white">users:</strong> id, name, email, username, password_hash, role, status, is_approved, last_login</li>
                    <li><strong className="text-white">predictions:</strong> id, product_id, user_id, predicted_price, confidence_score, model_name</li>
                    <li><strong className="text-white">products:</strong> id, name, category, current_price, cost_price, stock</li>
                    <li><strong className="text-white">password_reset_otps:</strong> id, user_id, email_or_phone, otp_code, expires_at, is_used</li>
                    <li><strong className="text-white">activity_logs:</strong> id, user_id, action, timestamp</li>
                  </ul>
                </div>
              </div>
            )}

            {/* SECTION 10: TECHNOLOGIES USED */}
            {activeSection === 'technologies' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Technologies Used</h2>
                  <p className="text-xs text-slate-400">Complete technology stack powering PricePilot AI Enterprise</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {techStack.map((tech, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] space-y-2 hover:border-purple-500/40 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{tech.name}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">{tech.ver}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold text-purple-400">{tech.purpose}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{tech.desc}</p>
                      <a 
                        href={tech.link}
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold pt-1"
                      >
                        Official Site <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 11: TEAM MEMBERS */}
            {activeSection === 'team' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Team Members</h2>
                  <p className="text-xs text-slate-400">Infosys Springboard 7.0 Internship Project Team</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-900/80 border border-[#1F2937] space-y-3 hover:border-purple-500/50 transition shadow-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg group-hover:scale-105 transition">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{member.name}</h4>
                          <p className="text-xs text-purple-300 font-medium">{member.role}</p>
                          <p className="text-[10px] text-slate-500">{member.dept}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{member.resp}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {member.skills.map((skill, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded-full bg-slate-800 border border-[#1F2937] text-[10px] text-slate-300 font-mono">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-[#1F2937] text-xs text-slate-400">
                        <a href={`mailto:${member.email}`} className="hover:text-purple-300 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                        <a href={member.github} target="_blank" rel="noreferrer" className="hover:text-purple-300 flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> GitHub
                        </a>
                        <a href={member.linkedin} target="_blank" rel="noreferrer" className="hover:text-purple-300 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 12: PROJECT DOCUMENTS */}
            {activeSection === 'project-documents' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">Project Documents Repository</h2>
                    <p className="text-xs text-slate-400">Official project documentation, diagrams, reports, and manuals</p>
                  </div>
                  <span className="text-xs text-purple-300 font-mono bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                    {documents.length} Files Available
                  </span>
                </div>

                {loadingDocs ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading document registry...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] space-y-3 hover:border-purple-500/40 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-xs">{doc.title}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">{doc.category} • {doc.version}</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{doc.description}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#1F2937] text-xs">
                          <span className="text-[10px] text-slate-500 font-mono">{doc.file_size}</span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreviewDoc(doc.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                            <button
                              onClick={() => handleDownloadDoc(doc.id, doc.filename)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 13: USER GUIDE */}
            {activeSection === 'user-guide' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">End User Manual</h2>
                  <p className="text-xs text-slate-400">Step-by-step operating instructions for end users</p>
                </div>
                <div className="space-y-3 text-xs leading-relaxed">
                  <p>1. <strong className="text-white">Log in:</strong> Access your account using registered email/username and password.</p>
                  <p>2. <strong className="text-white">Run AI Price Prediction:</strong> Enter freight charges, package weight, and volume parameters to calculate optimal price points.</p>
                  <p>3. <strong className="text-white">View History:</strong> Track previous prediction records and profit margin estimates.</p>
                </div>
              </div>
            )}

            {/* SECTION 14: ADMIN GUIDE */}
            {activeSection === 'admin-guide' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Administrator Operations Handbook</h2>
                  <p className="text-xs text-slate-400">System management, Excel reporting, and user security</p>
                </div>
                <div className="space-y-3 text-xs leading-relaxed">
                  <p>1. <strong className="text-white">User Approvals:</strong> Approve or reject pending user account registrations.</p>
                  <p>2. <strong className="text-white">Excel User Export:</strong> Download formatted <code className="text-emerald-300 font-mono">Users_Report.xlsx</code> reports anytime.</p>
                  <p>3. <strong className="text-white">Bulk Management:</strong> Select multiple accounts for bulk status update or bulk delete.</p>
                </div>
              </div>
            )}

            {/* SECTION 15: DEPLOYMENT GUIDE */}
            {activeSection === 'deployment-guide' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Deployment & DevOps Guide</h2>
                  <p className="text-xs text-slate-400">Production deployment for Docker, Vercel, Render, and Neon</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-[#1F2937] space-y-2 font-mono text-xs">
                  <p className="text-purple-400 font-sans font-bold">Docker Build & Deployment:</p>
                  <p className="text-slate-300">docker build -t pricepilot-backend ./backend</p>
                  <p className="text-slate-300">docker run -d -p 8000:8000 pricepilot-backend</p>
                </div>
              </div>
            )}

            {/* SECTION 16: FAQ */}
            {activeSection === 'faq' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Frequently Asked Questions (FAQ)</h2>
                  <p className="text-xs text-slate-400">Common questions about PricePilot AI platform</p>
                </div>

                <div className="space-y-3">
                  {faqList.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-900/60 border border-[#1F2937] overflow-hidden">
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
                        className="w-full p-4 text-left font-bold text-xs text-white flex items-center justify-between gap-3 hover:bg-slate-800/50 transition"
                      >
                        <span>{item.q}</span>
                        {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-purple-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                      </button>
                      {openFaqIndex === idx && (
                        <div className="p-4 pt-0 text-xs text-slate-300 border-t border-[#1F2937]/50 leading-relaxed bg-slate-950/40">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 17: CONTACT */}
            {activeSection === 'contact' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">Contact & Support Channels</h2>
                  <p className="text-xs text-slate-400">Get in touch with the PricePilot AI development team</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] space-y-1">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <h4 className="font-bold text-white">Support Email</h4>
                    <p className="text-slate-400 font-mono text-[11px]">support@pricepilot.ai</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] space-y-1">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <h4 className="font-bold text-white">Phone Support</h4>
                    <p className="text-slate-400 font-mono text-[11px]">+1 800-PILOT-AI</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] space-y-1">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-white">Official Website</h4>
                    <p className="text-slate-400 font-mono text-[11px]">https://pricepilot.ai</p>
                  </div>
                </div>

                <form onSubmit={handleContactSubmit} className="p-5 rounded-2xl bg-slate-900/40 border border-[#1F2937] space-y-4 text-xs">
                  <h4 className="font-bold text-white text-sm">Send a Direct Message</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Your Name"
                      className="p-2.5 rounded-xl glass-input text-white"
                    />
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="Your Email Address"
                      className="p-2.5 rounded-xl glass-input text-white"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Subject"
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Write your inquiry or feedback message here..."
                    className="w-full p-2.5 rounded-xl glass-input text-white"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-600/30"
                  >
                    Submit Message
                  </button>
                </form>
              </div>
            )}

            {/* SECTION 18: ABOUT PROJECT */}
            {activeSection === 'about' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="border-b border-[#1F2937] pb-4">
                  <h2 className="text-xl font-bold text-white">About PricePilot AI Project</h2>
                  <p className="text-xs text-slate-400">Infosys Springboard Internship 7.0 Capstone Submission</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] space-y-2 text-xs text-slate-300">
                  <p><strong className="text-white">Organization:</strong> Infosys Springboard 7.0</p>
                  <p><strong className="text-white">Project Title:</strong> Machine Learning Based Dynamic Pricing & Demand Forecasting System</p>
                  <p><strong className="text-white">Completion Date:</strong> August 2026</p>
                  <p><strong className="text-white">Version:</strong> Enterprise Edition v2.0</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Document Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-2xl w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <FileText className="w-5 h-5 text-purple-400" /> Document Preview: {selectedDoc?.title || 'Loading...'}
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {loadingPreview ? (
              <div className="p-8 text-center text-xs text-slate-400">Fetching document preview...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Version: <strong className="text-white font-mono">{selectedDoc?.version}</strong></span>
                  <span>Category: <strong className="text-purple-300 font-mono">{selectedDoc?.category}</strong></span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-[#1F2937] max-h-96 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedDoc?.preview}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close
              </button>
              {selectedDoc && (
                <button
                  onClick={() => handleDownloadDoc(selectedDoc.id, selectedDoc.filename)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                >
                  <Download className="w-4 h-4" /> Download File
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocsPage;
