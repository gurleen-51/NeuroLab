import React from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KnowledgeBase() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const sections = [
    {
      title: "1️⃣ Introduction",
      content: "Artificial Neural Networks (ANNs) are computational models inspired by the human brain. They can learn patterns from data and make predictions."
    },
    {
      title: "2️⃣ History & Literature",
      content: "- Introduced in 1958 (Rosenblatt Perceptron)\n- MLP and Backpropagation (Rumelhart, 1986)\n- Modern deep learning: Goodfellow et al., 2016"
    },
    {
      title: "3️⃣ Types of Neural Networks",
      content: "- Perceptron (single layer)\n- Multi-Layer Perceptron (MLP)\n- Convolutional Neural Networks (CNN)\n- Recurrent Neural Networks (RNN)"
    },
    {
      title: "4️⃣ Activation Functions",
      content: "- Sigmoid: 0→1, smooth gradient\n- Tanh: -1→1, zero-centered\n- Linear: identity function\n- ReLU: max(0, x), avoids vanishing gradients"
    },
    {
      title: "5️⃣ Loss & Optimization",
      content: "- MSE, Cross-Entropy\n- Gradient Descent, SGD, Adam Optimizer"
    },
    {
      title: "6️⃣ Backpropagation",
      content: "- Compute derivative of loss w.r.t weights\n- Update weights layer by layer from output back to input."
    },
    {
      title: "7️⃣ Real-World Applications",
      content: "- Image classification, speech recognition\n- NLP, autonomous driving, finance predictions"
    },
    {
      title: "8️⃣ References",
      content: "- Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning. MIT Press\n- Rumelhart, Hinton & Williams (1986). Learning representations by backpropagation."
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">
      <div className="mb-8 border-b border-slate-700/50 pb-6">
        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center space-x-3">
          <BookOpen className="text-yellow-400" size={32} />
          <span>Knowledge Base</span>
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Everything you need to know about the fundamental theories backing the networks you're experimenting with.
        </p>
      </div>

      <motion.div 
        variants={containerVars} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {sections.map((sec, idx) => (
          <motion.div key={idx} variants={itemVars} className="glass-panel border border-slate-700/50 rounded-2xl p-6 hover:border-yellow-500/30 hover:shadow-[0_0_15px_rgba(250,204,21,0.1)] transition-all">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">{sec.title}</h3>
            <div className="text-sm font-medium text-slate-300 space-y-1">
              {sec.content.split('\n').map((line, i) => (
                 <p key={i} className={line.startsWith('-') ? 'ml-2 border-l-2 border-slate-600 pl-3 py-1' : ''}>{line}</p>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
