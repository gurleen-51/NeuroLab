import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Activity, Layers, ArrowRight, Calculator, Database, Cpu, UserPlus } from 'lucide-react';

export default function HomeView() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
  };

  const labs = [
    {
      title: "Hopfield Network Lab",
      description: "Draw patterns, inject noise, and watch energy minimization recall the stored memory step-by-step.",
      icon: <Brain size={32} className="text-cyan-400" />,
      path: "/hopfield",
      gradient: "from-cyan-500/20 to-blue-600/20",
      border: "border-cyan-500/30",
      tag: "Associative Memory"
    },
    {
      title: "RNN / LSTM Visualizer",
      description: "Sequence processing with hidden state animation, LSTM gate equations, and vanishing gradient simulation.",
      icon: <Activity size={32} className="text-purple-400" />,
      path: "/rnn",
      gradient: "from-purple-500/20 to-pink-600/20",
      border: "border-purple-500/30",
      tag: "Sequences"
    },
    {
      title: "CNN Interactive Lab",
      description: "Watch kernels slide across pixel matrices, compute feature maps, and visualize pooling operations live.",
      icon: <Layers size={32} className="text-emerald-400" />,
      path: "/cnn",
      gradient: "from-emerald-500/20 to-teal-600/20",
      border: "border-emerald-500/30",
      tag: "Computer Vision"
    },
    {
      title: "Math Intelligence Lab",
      description: "7-step solver: forward pass → backprop → weight updates, with theory panels, live computation, and quiz mode.",
      icon: <Calculator size={32} className="text-orange-400" />,
      path: "/math",
      gradient: "from-orange-500/20 to-amber-600/20",
      border: "border-orange-500/30",
      tag: "Step-by-Step"
    },
    {
      title: "AI Data Lab",
      description: "Upload CSV/JSON datasets, configure ANN/RNN/CNN architectures, and watch real-time loss curve training.",
      icon: <Database size={32} className="text-green-400" />,
      path: "/datalab",
      gradient: "from-green-500/20 to-teal-600/20",
      border: "border-green-500/30",
      tag: "Custom Datasets"
    },
    {
      title: "🏗 Model Architect",
      description: "Drag-and-drop visual network builder. Color-coded layers with flowing gradient animations. Smart preset suggestions.",
      icon: <Cpu size={32} className="text-violet-400" />,
      path: "/architect",
      gradient: "from-violet-500/20 to-purple-600/20",
      border: "border-violet-500/30",
      tag: "Visual Builder"
    },
    {
      title: "InterviewAI Pro",
      description: "Complete interview practice lab with real-time video/audio analysis and dynamic question AI.",
      icon: <UserPlus size={32} className="text-pink-400" />,
      path: "http://localhost:5174",
      gradient: "from-pink-500/20 to-rose-600/20",
      border: "border-pink-500/30",
      tag: "Mock Interview",
      external: true
    },
  ];

  return (
    <div className="min-h-full p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center relative">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl text-center mb-14 relative z-10"
      >
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-cyan-300 text-sm font-semibold tracking-wide uppercase">
          See · Understand · Calculate
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white drop-shadow-lg">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Neuro</span>Verse
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-4 max-w-2xl mx-auto font-light leading-relaxed">
          An interactive deep learning playground combining real-time visualization, step-by-step mathematics, and hands-on experimentation.
        </p>
      </motion.div>

      {/* Lab Cards */}
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-6xl z-10"
      >
        {labs.map((lab, index) => (
          <motion.div key={index} variants={itemVars}>
            {lab.external ? (
              <a
                href={lab.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col h-full glass-panel border ${lab.border} rounded-2xl p-6 bg-gradient-to-br ${lab.gradient} hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 group`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="bg-slate-800/50 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-700/50 group-hover:scale-110 transition-transform duration-300">
                    {lab.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                    {lab.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{lab.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{lab.description}</p>
                <div className="flex items-center text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  <span className="mr-2">Enter Lab</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ) : (
              <Link
                to={lab.path}
                className={`flex flex-col h-full glass-panel border ${lab.border} rounded-2xl p-6 bg-gradient-to-br ${lab.gradient} hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 group`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="bg-slate-800/50 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-700/50 group-hover:scale-110 transition-transform duration-300">
                    {lab.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                    {lab.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{lab.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{lab.description}</p>
                <div className="flex items-center text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  <span className="mr-2">Enter Lab</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
