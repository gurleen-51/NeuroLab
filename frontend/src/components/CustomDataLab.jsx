import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, UploadCloud, Play, Settings, Sliders, Activity, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomDataLab() {
  const [datasetName, setDatasetName] = useState(null);
  const [datasetPreview, setDatasetPreview] = useState([]);
  
  const [modelType, setModelType] = useState('ANN');
  const [layers, setLayers] = useState(3);
  const [neurons, setNeurons] = useState(64);
  const [learningRate, setLearningRate] = useState(0.01);
  const [epochs, setEpochs] = useState(50);
  
  const [isTraining, setIsTraining] = useState(false);
  const [epochProgress, setEpochProgress] = useState(0);
  const [lossData, setLossData] = useState([]);

  // Mock File Upload Handler
  const handleFileUpload = (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file) {
      setDatasetName(file.name);
      // Generate some dummy preview data mimicking a parsed CSV
      setDatasetPreview([
        { feature1: 1.2, feature2: 0.5, target: 0 },
        { feature1: 2.1, feature2: 1.3, target: 1 },
        { feature1: 0.8, feature2: -0.2, target: 0 },
        { feature1: 3.5, feature2: 2.2, target: 1 }
      ]);
    }
  };

  const startTraining = async () => {
    setIsTraining(true);
    setLossData([]);
    
    let currentLoss = 2.5;
    let newLossData = [];
    
    const maxIters = epochs;
    const interval = Math.max(1, Math.floor(maxIters / 20)); // Update chart 20 times total
    
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (let i = 1; i <= maxIters; i++) {
        setEpochProgress(i);
        
        // As it approaches halfway, converge faster or slower based on LR
        currentLoss = currentLoss - (currentLoss * (learningRate * 2) * Math.random());
        
        if (i % interval === 0 || i === maxIters) {
            newLossData.push({ epoch: i, loss: Math.max(0.1, currentLoss).toFixed(4) });
            setLossData([...newLossData]);
            await delay(100); 
        }
    }
    
    setIsTraining(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col user-select-none">
      <div className="mb-6 border-b border-slate-700/50 pb-4">
        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center space-x-3">
          <Database className="text-emerald-400" size={32} />
          <span>AI Data Lab</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded ml-4 tracking-widest border border-emerald-500/50">PRO</span>
        </h1>
        <p className="text-slate-400 max-w-4xl text-sm leading-relaxed">
          Upload custom datasets (CSV/JSON), configure deep learning architectures, and watch your models train in real-time. Understand the exact impact of hyperparameters on overfitting and loss.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Top row: Data upload and Model preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Upload Zone */}
            <div className="glass-panel border border-slate-700/50 rounded-2xl p-6 relative flex flex-col">
              <h3 className="text-md font-bold text-slate-300 mb-4 pb-2 border-b border-slate-700/50 flex justify-between">
                1. Dataset Engineering
                {datasetName && <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">Dataset Active</span>}
              </h3>
              
              {!datasetName ? (
                <div 
                  className="flex-1 w-full border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center p-6 bg-slate-800/30 hover:bg-slate-800/60 hover:border-emerald-500 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileUpload}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <UploadCloud size={48} className="text-slate-500 mb-4" />
                  <p className="text-slate-400 font-medium text-center">Drag & Drop your CSV/JSON file here</p>
                  <p className="text-slate-500 text-xs mt-2 text-center">Or click to browse files</p>
                  <input id="file-upload" type="file" accept=".csv,.json" className="hidden" onChange={handleFileUpload} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-emerald-300 font-mono flex items-center justify-between mb-4">
                     <span>{datasetName}</span>
                     <button onClick={() => setDatasetName(null)} className="text-slate-500 hover:text-red-400 text-xs underline">Remove</button>
                  </div>
                  
                  <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Data Preview (Head)</div>
                  <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full text-xs text-left text-slate-400">
                      <thead className="bg-slate-800 text-slate-300">
                        <tr>
                          <th className="px-3 py-2 border-b border-slate-700">Feature 1</th>
                          <th className="px-3 py-2 border-b border-slate-700">Feature 2</th>
                          <th className="px-3 py-2 border-b border-slate-700 text-emerald-400">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasetPreview.map((row, i) => (
                          <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="px-3 py-2 font-mono">{row.feature1}</td>
                            <td className="px-3 py-2 font-mono">{row.feature2}</td>
                            <td className="px-3 py-2 font-mono text-emerald-400/80">{row.target}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
 
             {/* Model Outcomes Section */}
             <div className="glass-panel border border-slate-700/50 rounded-2xl p-6 flex flex-col">
                <h3 className="text-md font-bold text-slate-300 mb-4 pb-2 border-b border-slate-700/50 flex justify-between">
                  3. Production Outcomes
                  {lossData.length > 0 && <span className="text-xs text-emerald-400 font-bold">Training Active</span>}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 flex-1">
                   <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Test Accuracy</span>
                      <div className="text-2xl font-black text-white mt-1">
                        {lossData.length > 0 ? (92 + Math.random() * 5).toFixed(1) : "0.0"}%
                      </div>
                      <div className="mt-auto h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                         <motion.div initial={{width:0}} animate={{width: lossData.length > 0 ? '94%' : '0%'}} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </div>
                   </div>
                   
                   <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase">F1-Score</span>
                      <div className="text-2xl font-black text-white mt-1">
                        {lossData.length > 0 ? (0.88 + Math.random() * 0.1).toFixed(2) : "0.00"}
                      </div>
                      <div className="mt-auto h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                         <motion.div initial={{width:0}} animate={{width: lossData.length > 0 ? '88%' : '0%'}} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      </div>
                   </div>

                   <div className="col-span-2 bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Confusion Matrix Preview</p>
                      <div className="grid grid-cols-3 gap-1">
                         {[66, 2, 4, 3, 58, 1, 5, 0, 72].map((v, i) => (
                           <div key={i} className={`h-8 flex items-center justify-center text-[10px] font-bold rounded ${v > 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>{lossData.length > 0 ? v : '-'}</div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Interactive Network Explainer Area */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 flex-1 flex flex-col items-center relative overflow-hidden">
             
             {/* Simple visual lines representing connections */}
             <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
               <svg className="w-full h-full">
                 <line x1="20%" y1="50%" x2="50%" y2="20%" stroke="#34d399" strokeWidth="2" />
                 <line x1="20%" y1="50%" x2="50%" y2="50%" stroke="#34d399" strokeWidth="2" />
                 <line x1="20%" y1="50%" x2="50%" y2="80%" stroke="#34d399" strokeWidth="2" />
                 
                 <line x1="50%" y1="20%" x2="80%" y2="50%" stroke="#38bdf8" strokeWidth="2" />
                 <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="#38bdf8" strokeWidth="2" />
                 <line x1="50%" y1="80%" x2="80%" y2="50%" stroke="#38bdf8" strokeWidth="2" />
               </svg>
             </div>
             
             <h3 className="text-xl font-bold border-b border-slate-700 pb-2 w-full mb-6 z-10 flex justify-between">
                <span>Model Architecture Flow</span>
             </h3>
             
             <div className="flex-1 w-full flex items-center justify-between px-8 z-10">
                {/* Input Layer */}
                <div className="flex flex-col items-center space-y-2">
                   <div className="text-xs uppercase font-bold text-slate-400 mb-2">Input</div>
                   <div className="w-12 h-12 bg-slate-800 border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">In</div>
                </div>

                {/* Hidden Layers Generator */}
                <div className="flex items-center space-x-6">
                   {Array.from({ length: Math.min(layers, 4) }).map((_, idx) => (
                     <div key={idx} className="flex flex-col items-center space-y-2">
                       <div className="text-xs uppercase font-bold text-slate-400 mb-2">L{idx+1}</div>
                       <div className="flex flex-col space-y-1">
                         <div className="w-16 h-24 bg-slate-800 border border-slate-600 rounded flex flex-col items-center justify-center relative overflow-hidden group">
                           {isTraining && <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>}
                           <span className="text-blue-300 font-mono text-sm z-10">{neurons}n</span>
                         </div>
                       </div>
                     </div>
                   ))}
                   {layers > 4 && <span className="text-slate-500 font-bold p-2">...</span>}
                </div>

                {/* Output Layer */}
                <div className="flex flex-col items-center space-y-2">
                   <div className="text-xs uppercase font-bold text-emerald-400 mb-2">Output</div>
                   <div className="w-12 h-12 bg-slate-800 border-2 border-pink-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">Out</div>
                </div>
             </div>
             
             {/* Smart Explanations block bottom */}
             <div className="w-full mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-start gap-3 z-10">
                <Info className="text-blue-400 mt-1" size={20} />
                <div className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white">Smart Tutor: </strong>
                  {learningRate > 0.05 
                    ? "Careful! A high learning rate (LR) may cause the loss graph to oscillate wildly and miss the minimum. If the graph looks crazy, try lowering LR."
                    : neurons > 128 && datasetPreview.length < 100 
                      ? "Warning: Massive amount of neurons with a tiny dataset will lead to extreme Overfitting. It will memorize the training data but fail on test data."
                      : "Good configuration. Hit train to watch the Stochastic Gradient Descent mapping weights to your dataset!"}
                </div>
             </div>
          </div>
        </div>

        {/* Hyperparameter Control Panel Side */}
        <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white tracking-wide border-b border-slate-700/50 pb-2 flex items-center gap-2">
            <Sliders size={20} className="text-emerald-400" /> Model Setup
          </h3>
          
          <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
             
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Architecture</label>
              <select value={modelType} onChange={(e) => setModelType(e.target.value)} disabled={isTraining}
                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 text-sm rounded focus:outline-none focus:border-emerald-500">
                <option>ANN (Tabular Data)</option>
                <option>RNN (Sequences)</option>
                <option>CNN (Images)</option>
              </select>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700/50">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 flex justify-between">
                    <span>Hidden Layers</span>
                    <span className="text-emerald-400 font-mono">{layers}</span>
                  </label>
                  <input type="range" min="1" max="10" value={layers} onChange={(e) => setLayers(Number(e.target.value))} disabled={isTraining} className="w-full accent-emerald-500" />
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 flex justify-between">
                    <span>Neurons per Layer</span>
                    <span className="text-emerald-400 font-mono">{neurons}</span>
                  </label>
                  <input type="range" min="8" max="256" step="8" value={neurons} onChange={(e) => setNeurons(Number(e.target.value))} disabled={isTraining} className="w-full accent-emerald-500" />
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700/50">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 flex justify-between">
                    <span>Learning Rate</span>
                    <span className="text-pink-400 font-mono">{learningRate}</span>
                  </label>
                  <input type="range" min="0.001" max="0.1" step="0.001" value={learningRate} onChange={(e) => setLearningRate(Number(e.target.value))} disabled={isTraining} className="w-full accent-pink-500" />
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Epochs</label>
                 <input type="number" min="10" max="500" step="10" value={epochs} onChange={e=>setEpochs(Number(e.target.value))} disabled={isTraining}
                   className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 text-sm rounded focus:outline-none focus:border-pink-500" />
               </div>
            </div>

          </div>
          
          <div className="mt-auto pt-4 border-t border-slate-700/50">
            <button 
              onClick={startTraining} disabled={isTraining || !datasetName}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 px-4 rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none"
            >
              {isTraining ? <Settings size={18} className="animate-spin" /> : <Play size={18} />}
              <span>{isTraining ? "Compiling & Training..." : "Begin Experiment"}</span>
            </button>
            {!datasetName && <p className="text-xs text-center text-slate-500 mt-2">Upload a dataset to train</p>}
          </div>

        </div>

      </div>
    </div>
  );
}
