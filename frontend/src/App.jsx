import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Brain, Activity, Layers, Menu, X, Terminal, Cpu } from 'lucide-react';

// Components
import HomeView from './components/HomeView';
import HopfieldLab from './components/HopfieldLab';
import RNNLab from './components/RNNLab';
import CNNLab from './components/CNNLab';
import AITutor from './components/AITutor';
import KnowledgeBase from './components/KnowledgeBase';
import MathLab from './components/MathLab';
import Playground from './components/Playground';
import VisualLearning from './components/VisualLearning';
import CustomDataLab from './components/CustomDataLab';
import ModelArchitect from './components/ModelArchitect';
import { BookOpen, Calculator, Target, BarChart2, Database, Layers as LayersIcon, Cpu as CpuIcon, UserPlus } from 'lucide-react';

function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Hopfield Lab', path: '/hopfield', icon: <Brain size={20} /> },
    { name: 'RNN / LSTM Lab', path: '/rnn', icon: <Activity size={20} /> },
    { name: 'CNN Lab', path: '/cnn', icon: <Layers size={20} /> },
    { name: 'Knowledge Base', path: '/knowledge', icon: <BookOpen size={20} /> },
    { name: 'Learn the Math', path: '/math', icon: <Calculator size={20} /> },
    { name: 'Playground', path: '/playground', icon: <Target size={20} /> },
    { name: 'Visual Learning', path: '/visual', icon: <BarChart2 size={20} /> },
    { name: 'AI Data Lab', path: '/datalab', icon: <Database size={20} className="text-emerald-400" /> },
    { name: '🏗 Model Architect', path: '/architect', icon: <CpuIcon size={20} className="text-violet-400" /> },
    { name: 'InterviewAI Pro', path: 'http://localhost:5174', icon: <UserPlus size={20} className="text-pink-400" />, external: true },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Cpu size={28} />
            <span className="text-xl font-bold font-mono tracking-wider">NEUROLAB</span>
          </div>
          <button className="md:hidden text-slate-300 hover:text-white" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Labs & Playgrounds</div>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                {item.external ? (
                  <a 
                    href={item.path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-slate-300 hover:bg-slate-800/50 hover:text-white`}
                    onClick={() => window.innerWidth < 768 && toggleSidebar()}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </a>
                ) : (
                  <Link 
                    to={item.path} 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${location.pathname === item.path ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
                    onClick={() => window.innerWidth < 768 && toggleSidebar()}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Terminal size={16} />
            <span>v2.0.0-beta</span>
          </div>
        </div>
      </div>
    </>
  );
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sharedDataset, setSharedDataset] = useState([]);

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {/* 3D Background Placeholder (would be added via CSS/Canvas) */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #0ea5e9 0%, transparent 50%)', filter: 'blur(100px)' }}></div>
      <div className="fixed top-0 right-0 w-full h-full z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, #8b5cf6 0%, transparent 40%)', filter: 'blur(80px)' }}></div>
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col md:ml-64 w-full relative z-10 min-h-screen">
        <header className="h-16 flex items-center px-4 glass-panel border-b border-slate-700/50 md:hidden sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
            <Menu size={24} />
          </button>
          <div className="ml-4 flex items-center space-x-2 text-cyan-400 font-mono font-bold tracking-wider">
            <Cpu size={20} />
            <span>NEUROLAB</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/hopfield" element={<HopfieldLab />} />
            <Route path="/rnn" element={<RNNLab />} />
            <Route path="/cnn" element={<CNNLab />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/math" element={<MathLab />} />
            <Route path="/playground" element={<Playground sharedDataset={sharedDataset} setSharedDataset={setSharedDataset} />} />
            <Route path="/visual" element={<VisualLearning sharedDataset={sharedDataset} setSharedDataset={setSharedDataset} />} />
            <Route path="/datalab" element={<CustomDataLab />} />
            <Route path="/architect" element={<ModelArchitect />} />
          </Routes>
        </main>
      </div>
      <AITutor />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
