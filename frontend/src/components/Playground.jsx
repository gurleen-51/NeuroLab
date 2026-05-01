import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Play, RefreshCcw, Settings, Layers, Zap, 
  Cpu, Activity, TrendingUp, Info, ChevronRight, BarChart2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, Cell 
} from 'recharts';

export default function Playground({ sharedDataset, setSharedDataset }) {
  // 1. Hyperparameters
  const [config, setConfig] = useState({
    lr: 0.01,
    epochs: 100,
    optimizer: 'Adam',
    activation: 'Sigmoid'
  });

  // 2. Architecture (Hidden Layers)
  const [layers, setLayers] = useState([8, 4]); // Units per hidden layer

  // 3. Training State
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [history, setHistory] = useState([]);
  const [gradients, setGradients] = useState([0.8, 0.4, 0.1]); // Mock gradient magnitudes

  const trainingRef = useRef(null);

  const startTraining = () => {
    if (isTraining || sharedDataset.length === 0) return;
    setIsTraining(true);
    setHistory([]);
    setEpoch(0);
    
    let currentLoss = 1.0;
    let currentAcc = 0.1;
    
    trainingRef.current = setInterval(() => {
      setEpoch(prev => {
        const next = prev + 1;
        
        // Simulation based on architecture size
        const complexityFactor = layers.reduce((a, b) => a + b, 0) / 20;
        const lrEffect = config.lr * 10;
        
        currentLoss = Math.max(0.05, currentLoss - (lrEffect * 0.05 * complexityFactor) + (Math.random() * 0.02));
        currentAcc = Math.min(0.99, currentAcc + (lrEffect * 0.03) + (Math.random() * 0.01));
        
        setHistory(h => [...h, { epoch: next, loss: +currentLoss.toFixed(4), accuracy: +currentAcc.toFixed(4) }]);
        setGradients(layers.map(() => Math.random() * Math.exp(-next/20)));

        if (next >= config.epochs) {
          clearInterval(trainingRef.current);
          setIsTraining(false);
        }
        return next;
      });
    }, 50);
  };

  const stopTraining = () => {
    clearInterval(trainingRef.current);
    setIsTraining(false);
  };

  const addLayer = () => { if (layers.length < 5) setLayers([...layers, 4]); };
  const removeLayer = (i) => setLayers(layers.filter((_, idx) => idx !== i));
  const updateUnits = (i, val) => {
    const nextArr = [...layers];
    nextArr[i] = Math.max(1, Math.min(32, val));
    setLayers(nextArr);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col gap-6 text-slate-200 font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Target className="text-rose-500" size={32} />
            <span className="bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent uppercase tracking-tight font-black">Neural Playground</span>
          </h1>
          <p className="text-slate-500 text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-bold">Standard Perceptron & MLP Training Simulation</p>
        </div>
        
        {sharedDataset.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Dataset Sync Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Architecture & Config (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
           
           {/* Architecture Builder */}
           <div className="glass-panel border border-slate-800 rounded-3xl p-5 bg-slate-900/40">
             <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-rose-400" /> Architecture
                </h3>
                <button onClick={addLayer} className="text-rose-500 hover:text-rose-400 transition-colors"><Zap size={14}/></button>
             </div>
             
             <div className="space-y-3">
               <div className="flex items-center justify-between group">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">I</div>
                  <div className="h-0.5 flex-1 bg-slate-800 mx-2" />
                  <span className="text-[10px] font-mono text-slate-500">
                    Auto-Scaled Input: {sharedDataset.length > 0 ? Object.keys(sharedDataset[0]).filter(k => k !== 'id' && k !== 'label').length : 0} Nodes
                  </span>
               </div>
               
               {layers.map((units, i) => (
                  <motion.div key={i} layout initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-[10px] font-bold text-rose-400">{units}</div>
                    <div className="h-0.5 flex-1 bg-rose-500/20 mx-2" />
                    <div className="flex gap-1">
                       <button onClick={() => updateUnits(i, units - 1)} className="w-5 h-5 rounded border border-slate-800 hover:bg-slate-800 text-[10px]">-</button>
                       <button onClick={() => updateUnits(i, units + 1)} className="w-5 h-5 rounded border border-slate-800 hover:bg-slate-800 text-[10px]">+</button>
                       <button onClick={() => removeLayer(i)} className="w-5 h-5 rounded border border-red-900/40 text-red-500 hover:bg-red-500/10 text-[10px]">×</button>
                    </div>
                  </motion.div>
               ))}
               
               <div className="flex items-center justify-between pt-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-400">O</div>
                  <div className="h-0.5 flex-1 bg-emerald-500/20 mx-2" />
                  <span className="text-[10px] font-mono text-slate-500 italic">Classification Layer</span>
               </div>
             </div>
           </div>

           {/* Configuration */}
           <div className="glass-panel border border-slate-800 rounded-3xl p-5 bg-slate-900/40 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Settings size={14} className="text-orange-400" /> Hyperparameters
              </h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between"><span>Learning Rate</span><span className="text-orange-400">{config.lr}</span></label>
                <input type="range" min="0.001" max="0.1" step="0.001" value={config.lr} onChange={e => setConfig({...config, lr: parseFloat(e.target.value)})} className="w-full accent-orange-500 h-1" />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Optimizer</label>
                <select value={config.optimizer} onChange={e => setConfig({...config, optimizer: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[11px] font-bold focus:outline-none focus:ring-1 ring-orange-500/50">
                   <option>Adam</option>
                   <option>SGD</option>
                   <option>RMSProp</option>
                </select>
              </div>

              <button 
                onClick={isTraining ? stopTraining : startTraining}
                disabled={sharedDataset.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 transition-all ${
                  isTraining ? 'bg-red-500/20 border border-red-500/50 text-red-500' : 'bg-rose-600 text-white shadow-xl shadow-rose-500/20 hover:scale-[1.02]'
                } disabled:opacity-30`}
              >
                {isTraining ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
                {isTraining ? 'HALT ENGINE' : 'COMMENCE TRAINING'}
              </button>
           </div>
        </div>

        {/* Main Training Visuals (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-6">
           
           {sharedDataset.length === 0 ? (
             <div className="flex-1 glass-panel border border-slate-800 rounded-[2.5rem] bg-slate-950/40 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 animate-pulse">
                   <BarChart2 size={40} className="text-rose-500" />
                </div>
                <div className="max-w-md">
                   <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">No Active Dataset</h3>
                   <p className="text-sm text-slate-500 leading-relaxed font-medium">
                     Neural Playground requires a source signal to begin backpropagation. Please visit the <span className="text-blue-400 italic">Visual Learning</span> tab to upload or generate a CSV dataset.
                   </p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all">
                  LEARN DATA PRE-PROCESSING <Info size={14}/>
                </button>
             </div>
           ) : (
             <div className="flex-1 grid grid-rows-2 gap-6">
                
                {/* Metrics Curve */}
                <div className="glass-panel border border-slate-800 rounded-[2.5rem] bg-slate-950/40 p-8 flex flex-col">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-white flex items-center gap-3">
                         <Activity className="text-orange-500" size={24} /> Training Dynamics
                      </h3>
                      <div className="flex gap-4">
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase">Live Loss</span>
                            <span className="text-rose-400 font-mono font-bold leading-none">{history.length > 0 ? history[history.length-1].loss : '0.000'}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase">Live Accuracy</span>
                            <span className="text-emerald-400 font-mono font-bold leading-none">{history.length > 0 ? history[history.length-1].accuracy : '0.000'}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex-1 min-h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={history}>
                            <defs>
                               <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                               <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="loss" stroke="#f43f5e" strokeWidth={3} fill="url(#lossGrad)" />
                            <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} fill="url(#accGrad)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                   
                   <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-rose-500 uppercase mb-1">Loss Interpretation</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Measures the discrepancy between model predictions and ground truth. Ideally, this should descend smoothly as Backpropagation updates the weights.</p>
                      </div>
                      <div className="w-[1px] bg-slate-800" />
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Accuracy Insight</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Tracks the percentage of correct classifications. A plateauing accuracy with high loss suggests a learning rate that is too low or an architecture that's too simple.</p>
                      </div>
                   </div>
                </div>

                {/* Weights & Decision Space Simulation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Gradient Flow */}
                   <div className="glass-panel border border-slate-800 rounded-3xl bg-slate-900/40 p-6 flex flex-col">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <TrendingUp size={14}/> Backprop Gradient Flow
                      </h4>
                      <div className="flex-1 flex flex-col justify-around">
                         {layers.map((_, i) => (
                           <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono font-bold">
                                 <span className="text-slate-500 uppercase">Layer {i+1} δ</span>
                                 <span className="text-rose-400">{(gradients[i] || 0).toFixed(4)}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                 <motion.div animate={{ width: `${(gradients[i] || 0) * 100}%` }} className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Insight Panel */}
                   <div className="glass-panel border border-slate-800 rounded-3xl bg-slate-950/60 p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 text-rose-500/20"><Cpu size={40}/></div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Output Panel</h4>
                      <div className="space-y-4">
                         <div>
                            <p className="text-xs font-bold text-white mb-1 tracking-tight">Current Optimization Strategy</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                               Performing {config.optimizer} updates with {config.activation} non-linearity. The network is adjusting its internal {layers.reduce((a,b)=>a+b,0) * 10} weights to minimize the cross-entropy surface.
                            </p>
                         </div>
                         <div className="pt-2 border-t border-slate-800 space-y-2">
                           <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400">EPOCH COMPETION</span>
                              <span className="text-orange-400">{epoch}/{config.epochs}</span>
                           </div>
                           <div className="h-1 bg-slate-800 rounded-full">
                              <motion.div initial={{width:0}} animate={{width: `${(epoch/config.epochs)*100}%`}} className="h-full bg-orange-500" />
                           </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

        </div>
      </div>

      <style>{`
        .glass-panel { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      `}</style>
    </div>
  );
}
