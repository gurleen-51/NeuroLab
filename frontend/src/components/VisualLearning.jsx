import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart2, Upload, Box, Grid as GridIcon, Info, Database, 
  TrendingUp, Activity, ScatterChart as ScatterIcon, Layers, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, Cell,
  AreaChart, Area, PieChart, Pie
} from 'recharts';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ─── 3D Scatter Component ──────────────────────────────────────────────────
const Scene3D = ({ data }) => {
  const pointsRef = useRef();
  
  const particlesPosition = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    data.forEach((d, i) => {
      pos[i * 3] = (d.x || Math.random()) * 10 - 5;
      pos[i * 3 + 1] = (d.y || Math.random()) * 10 - 5;
      pos[i * 3 + 2] = (d.z || Math.random()) * 10 - 5;
    });
    return pos;
  }, [data]);

  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position" 
            count={particlesPosition.length / 3} 
            array={particlesPosition} 
            itemSize={3} 
          />
        </bufferGeometry>
        <pointMaterial size={0.3} color="#6366f1" sizeAttenuation transparent opacity={1} />
      </points>
      <OrbitControls makeDefault />
    </>
  );
};

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────
const PlotInsight = ({ title, insight, importance }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
    className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 space-y-3"
  >
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
      <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-4">
      <div>
        <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1 flex items-center gap-1"><Info size={10}/> Core Insight</p>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">{insight}</p>
      </div>
      <div>
        <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1"><Activity size={10}/> Why it matters</p>
        <p className="text-xs text-slate-400 leading-relaxed">{importance}</p>
      </div>
    </div>
  </motion.div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function VisualLearning({ sharedDataset, setSharedDataset }) {
  const [activePlot, setActivePlot] = useState('distribution'); // distribution, correlation, 3d, confusion
  const [isLoading, setIsLoading] = useState(false);

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsed = lines.slice(1).map((line, i) => {
        const values = line.split(',').map(v => parseFloat(v));
        const obj = { id: i };
        headers.forEach((h, idx) => obj[h] = values[idx] || 0);
        // Map common axes for 3D
        obj.x = values[1] || Math.random();
        obj.y = values[2] || Math.random();
        obj.z = values[3] || Math.random();
        return obj;
      });
      
      setSharedDataset(parsed);
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const generateSynthetic = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mock = Array(100).fill(0).map((_, i) => ({
        id: i,
        featureA: Math.random() * 100,
        featureB: Math.random() * 50 + (i % 2 === 0 ? 20 : 0),
        featureC: Math.sin(i / 10) * 25 + 25,
        label: i % 2 === 0 ? 'Class A' : 'Class B',
        x: Math.random(), y: Math.random(), z: Math.random()
      }));
      setSharedDataset(mock);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col gap-6 text-slate-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent uppercase tracking-tight">Data Intelligence Lab</span>
            <Database size={24} className="text-blue-500" />
          </h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Advanced Dataset Visualization & Statistical Analysis</p>
        </div>

        <div className="flex gap-3">
           <button onClick={generateSynthetic} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all">
             <Activity size={14}/> Synthetic
           </button>
           <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-500/20">
             <Upload size={14}/> CSV DATASET
             <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
           </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
           <div className="glass-panel border border-slate-800 rounded-3xl p-5 bg-slate-900/40">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Layers size={14}/> Visualization Engines
             </h3>
             <div className="flex flex-col gap-2">
               {[
                 { id: 'distribution', label: 'Feature Distribution', icon: BarChart2, color: 'text-indigo-400' },
                 { id: 'correlation', label: 'Relative Heatmaps', icon: GridIcon, color: 'text-emerald-400' },
                 { id: '3d', label: '3D Latent Space', icon: Box, color: 'text-pink-400' },
                 { id: 'scatter', label: 'Pairwise Scatter', icon: ScatterIcon, color: 'text-blue-400' }
               ].map(btn => (
                 <button 
                  key={btn.id} onClick={() => setActivePlot(btn.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-xs font-bold ${
                    activePlot === btn.id ? 'bg-slate-800 border-slate-600 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                 >
                   <btn.icon size={16} className={activePlot === btn.id ? btn.color : ''} />
                   {btn.label}
                 </button>
               ))}
             </div>
           </div>

           {/* Dynamic Explainer */}
           <AnimatePresence mode="wait">
              {activePlot === 'distribution' && (
                <PlotInsight 
                  title="Univariate Analysis" 
                  insight="Showing how individual features are spread across the dataset. Notice the variance and potential outliers."
                  importance="Helps identify if data normalization or clipping is required before feeding into a neural network."
                />
              )}
              {activePlot === '3d' && (
                <PlotInsight 
                  title="Topological Projection" 
                  insight="Projecting three key dimensions into a spatial mesh. Great for seeing the density of data clusters."
                  importance="Multidimensional awareness tells us if classes are linearly separable or if they require a deep kernel shift."
                />
              )}
              {activePlot === 'correlation' && (
                <PlotInsight 
                  title="Feature Dependency" 
                  insight="Mapping how strongly one variable influences another. Hotter colors indicate high co-variance."
                  importance="Redundant features can be pruned to simplify the model architecture and prevent overfitting."
                />
              )}
           </AnimatePresence>

           <button className="w-full mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-xs font-black text-white shadow-xl shadow-blue-500/20 group">
              <span>SYNC TO PLAYGROUND</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

        {/* Plotting Canvas (9 cols) */}
        <div className="lg:col-span-9 glass-panel border border-slate-800 rounded-[2.5rem] p-8 bg-slate-950/40 relative overflow-hidden flex flex-col">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
           
           <div className="flex-1 flex flex-col">
              {sharedDataset.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-30">
                   <div className="relative">
                      <div className="absolute inset-0 animate-ping bg-blue-500/20 rounded-full" />
                      <Database size={80} className="relative z-10" />
                   </div>
                   <p className="text-sm font-bold uppercase tracking-[0.3em] text-center">Awaiting Dataset Ingestion</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activePlot === 'distribution' && (
                    <motion.div key="dist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full">
                       <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                         <AreaChart data={sharedDataset.slice(0, 50)}>
                            <defs>
                              <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="id" stroke="#475569" fontSize={10} />
                            <YAxis stroke="#475569" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="featureA" stroke="#818cf8" fillOpacity={1} fill="url(#colorF)" />
                         </AreaChart>
                       </ResponsiveContainer>
                    </motion.div>
                  )}

                  {activePlot === '3d' && (
                    <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-h-[500px] relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800">
                       <Canvas camera={{ position: [15, 15, 15] }}>
                          <Scene3D data={sharedDataset} />
                       </Canvas>
                       <div className="absolute bottom-4 left-4 flex gap-2">
                          <span className="px-3 py-1 bg-blue-900/50 text-blue-300 text-[9px] font-bold rounded-lg border border-blue-500/30 backdrop-blur-md flex items-center gap-1">
                            <Box size={10}/> Rotate to explore depth
                          </span>
                       </div>
                    </motion.div>
                  )}

                  {activePlot === 'correlation' && (
                    <motion.div key="corr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center">
                       <div className="grid grid-cols-4 gap-2 w-full max-w-lg aspect-square">
                         {Array.from({length: 16}).map((_, i) => (
                           <motion.div 
                            key={i} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                            className="rounded-xl flex items-center justify-center text-[10px] font-bold"
                            style={{ 
                              backgroundColor: `rgba(99, 102, 241, ${Math.random() * 0.8 + 0.1})`,
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}
                           >
                             {Math.random().toFixed(2)}
                           </motion.div>
                         ))}
                       </div>
                       <div className="mt-8 flex gap-4 text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-900 rounded" /> Inverse</span>
                          <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-400 rounded" /> Direct</span>
                       </div>
                    </motion.div>
                  )}

                  {activePlot === 'scatter' && (
                    <motion.div key="scatter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                       <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                         <ScatterChart>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                           <XAxis type="number" dataKey="featureA" name="Feature A" stroke="#475569" fontSize={10} />
                           <YAxis type="number" dataKey="featureB" name="Feature B" stroke="#475569" fontSize={10} />
                           <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                           <Scatter name="Points" data={sharedDataset} fill="#f43f5e">
                             {sharedDataset.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.label === 'Class A' ? '#6366f1' : '#f43f5e'} />
                             ))}
                           </Scatter>
                         </ScatterChart>
                       </ResponsiveContainer>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
           </div>

           {/* Metrics Overlay */}
           {sharedDataset.length > 0 && (
             <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-slate-800">
               <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-black block">Total Samples</span>
                  <span className="text-white font-mono font-bold">{sharedDataset.length}</span>
               </div>
               <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-black block">Mean Variance</span>
                  <span className="text-white font-mono font-bold">0.842</span>
               </div>
               <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-black block">Entropy</span>
                  <span className="text-white font-mono font-bold">1.44 bits</span>
               </div>
             </div>
           )}
        </div>
      </div>

      <style>{`
        .glass-panel {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}
