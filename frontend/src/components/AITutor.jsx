import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, BrainCircuit, Sparkles, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const explanations = {
  '/': "Welcome to NeuroLab! I'm your AI assistant. Choose a lab to get started with interactive neural network experiments.",
  '/hopfield': "This is the Hopfield Network Lab. It acts as an associative memory. Try drawing a pattern, save it, and then add noise. The network will use its saved weights (Hebbian learning) to pull the corrupted image back to its lowest energy state—your original pattern!",
  '/rnn': "Here in the RNN Lab, you can see how sequences are processed over time. Notice how the 'Hidden State' (memory) is passed to the next step. If you toggle the Vanishing Gradient simulation, you'll see why standard RNNs struggle with long sequences (the gradient signal degrades), which is why LSTMs were invented!",
  '/cnn': "Welcome to the CNN Lab. Convolutional Neural Networks use 'Kernels' (small matrices) that slide (convolve) over an image to detect features like edges. Watch how different matrices highlight different aspects of the same input numbers."
};

export default function AITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // When route changes, add a new explanation message
    const msg = explanations[location.pathname] || "I'm here to help explain what you're seeing!";
    
    setIsTyping(true);
    setIsOpen(true);
    
    // Simulate typing delay
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, { text: msg, sender: 'ai' }]);
      setIsTyping(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4 w-80 sm:w-96 glass-panel border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 p-4 border-b border-cyan-500/30 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="text-cyan-400" size={20} />
                <span className="font-bold text-white tracking-wide">Neuro AI Tutor</span>
              </div>
              <button onClick={toggleOpen} className="text-cyan-200 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            {/* Chat Area */}
            <div className="p-4 bg-slate-900/80 max-h-80 overflow-y-auto flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx} 
                  className={`p-3 rounded-xl text-sm leading-relaxed border ${msg.sender === 'ai' ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-50 rounded-tl-none' : 'bg-slate-800 border-slate-700 text-white rounded-tr-none self-end'}`}
                >
                  {msg.sender === 'ai' && <Sparkles size={14} className="inline-block mr-2 text-cyan-400 mb-0.5" />}
                  {msg.text}
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl rounded-tl-none self-start flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
            
            {/* Input Placeholder (for aesthetics) */}
            <div className="p-3 bg-slate-900 border-t border-slate-700 flex items-center gap-2">
               <button className="flex-1 bg-slate-800 border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-white text-xs py-2 px-3 rounded-lg text-left transition-colors truncate">
                 Ask for more details...
               </button>
               <button className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors">
                 <ChevronRight size={16} />
               </button>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 z-50 ${isOpen ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse-glow'}`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
