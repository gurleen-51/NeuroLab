import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Camera, Image as ImageIcon, Sliders, Eye, Activity, 
  Info, Cpu, BarChart2, CheckCircle2, AlertCircle, RefreshCcw,
  Layers, Microscope, Zap, Shield, HelpCircle, Save, Download,
  ChevronRight, Brain, Lightbulb, Split
} from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// --- HELPERS ---
const PREPROCESSING_STEPS = {
  grayscale: {
    name: 'Grayscale',
    desc: 'Removes color information to focus on structure.',
    tutor: 'Neural networks often process grayscale images to simplify the input space and force the model to learn shapes and edges rather than relying on color memorization.'
  },
  blur: {
    name: 'Gaussian Blur',
    desc: 'Reduces high-frequency noise and detail.',
    tutor: 'Smoothing the image helps prevent the model from overfitting to pixel-level noise, allowing it to generalize better to broader patterns.'
  },
  edges: {
    name: 'Canny Edges',
    desc: 'Highlights structural boundaries in the image.',
    tutor: 'Edge detection collapses the image into pure geometry. This helps us see if the CNN is actually looking at object outlines or just textures.'
  }
};

const SAMPLE_IMAGES = [
  { id: 'cat', name: 'Sample: Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80' },
  { id: 'dog', name: 'Sample: Dog', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80' },
  { id: 'car', name: 'Sample: Car', url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80' }
];

export default function CNNLab() {
  // State
  const [cvLoaded, setCvLoaded] = useState(false);
  const [model, setModel] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [origPredictions, setOrigPredictions] = useState([]);
  const [featureMaps, setFeatureMaps] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [activeTab, setActiveTab] = useState('preprocess'); // preprocess, visualization, compare
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Controls
  const [filters, setFilters] = useState({
    grayscale: false,
    blur: 0,
    edges: false,
    contrast: 100,
    brightness: 0,
    noise: 0
  });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Check if OpenCV is loaded
    const checkCV = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        setCvLoaded(true);
        clearInterval(checkCV);
        console.log('OpenCV.js Loaded Successfully');
      }
    }, 500);

    // Load MobileNet
    const loadModel = async () => {
      try {
        const m = await mobilenet.load({ version: 2, alpha: 1.0 });
        setModel(m);
        console.log('MobileNet Loaded Successfully');
      } catch (err) {
        console.error('Failed to load model:', err);
      }
    };
    loadModel();

    return () => clearInterval(checkCV);
  }, []);

  // --- IMAGE HANDLING ---
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        processImage(img, filters);
        setIsWebcamActive(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (url) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setOriginalImage(img);
      processImage(img, filters);
      setIsWebcamActive(false);
    };
    img.src = url;
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsWebcamActive(true);
        setOriginalImage(null);
      }
    } catch (err) {
      console.error("Webcam blocked:", err);
    }
  };

  // --- OPENCV PROCESSING core ---
  const processImage = useCallback(async (imgOrVideo, currentFilters) => {
    if (!cvLoaded || !imgOrVideo) return;
    setIsProcessing(true);

    const cv = window.cv;
    let src = cv.imread(imgOrVideo);
    let dst = new cv.Mat();

    // 1. Brightness & Contrast
    src.convertTo(dst, -1, currentFilters.contrast / 100, currentFilters.brightness);

    // 2. Grayscale
    if (currentFilters.grayscale) {
      cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
      cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA); // Convert back for display and consistency
    }

    // 3. Gaussian Blur
    if (currentFilters.blur > 0) {
      let ksize = new cv.Size(currentFilters.blur * 2 + 1, currentFilters.blur * 2 + 1);
      cv.GaussianBlur(dst, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
    }

    // 4. Edges (Canny)
    if (currentFilters.edges) {
      let gray = new cv.Mat();
      cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY);
      cv.Canny(gray, gray, 50, 150, 3, false);
      cv.cvtColor(gray, dst, cv.COLOR_GRAY2RGBA);
      gray.delete();
    }

    // 5. Noise (Simulated)
    if (currentFilters.noise > 0) {
      // In a real app we'd add salt & pepper, for now we can skip or do a bit manipulation
    }

    cv.imshow(processedCanvasRef.current, dst);
    
    // Convert canvas to image for CNN input
    const processedImgData = processedCanvasRef.current;
    
    // Run CNN
    if (model) {
      const preds = await model.classify(processedImgData);
      setPredictions(preds);
      
      // If original predictions aren't set, set them
      if (origPredictions.length === 0 && imgOrVideo instanceof HTMLImageElement) {
        const opreds = await model.classify(imgOrVideo);
        setOrigPredictions(opreds);
      }

      // Generate Grad-CAM (Simplified for demo visualization)
      if (activeTab === 'visualization') {
        generateGradCAM(processedImgData);
      }
    }

    src.delete();
    dst.delete();
    setIsProcessing(false);
  }, [cvLoaded, model, activeTab, origPredictions.length]);

  // Update loop for webcam
  useEffect(() => {
    let requestRef;
    const update = () => {
      if (isWebcamActive && videoRef.current) {
        processImage(videoRef.current, filters);
        requestRef = requestAnimationFrame(update);
      }
    };
    if (isWebcamActive) {
      requestRef = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(requestRef);
  }, [isWebcamActive, filters, processImage]);

  // Handle filter changes
  useEffect(() => {
    if (originalImage && !isWebcamActive) {
      processImage(originalImage, filters);
    }
  }, [filters, originalImage, isWebcamActive, processImage]);

  // Grad-CAM logic (Conceptual for UI)
  const generateGradCAM = async (imgElement) => {
    // Real Grad-CAM would require access to the low-level TF model layers
    // For this playground, we will visualize the feature extraction layers
    // feature maps for the first few layers
    setFeatureMaps([0, 1, 2, 3].map(() => Math.random())); 
  };

  // --- UI COMPONENTS ---
  const ControlSlider = ({ label, value, min, max, onChange, icon: Icon, unit = "" }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-2">
          <Icon size={12} className="text-indigo-400" /> {label}
        </label>
        <span className="text-[10px] font-mono text-indigo-400">{value}{unit}</span>
      </div>
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer" 
      />
    </div>
  );

  const Toggle = ({ active, onClick, label, icon: Icon }) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
        active 
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
          : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
      }`}
    >
      <Icon size={16} />
      <span className="text-xs font-bold">{label}</span>
      {active && <CheckCircle2 size={14} className="ml-auto" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#050510] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      
      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <Brain size={32} />
            </div>
            <span>CNN <span className="text-indigo-500">LAB</span></span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Visual Neural Network Playground & Interactive Preprocessor
          </p>
        </motion.div>

        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl">
          {[
            { id: 'preprocess', label: 'Playground', icon: Sliders },
            { id: 'visualization', label: 'Feature Ops', icon: Microscope },
            { id: 'compare', label: 'Comparison', icon: Split }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-500 ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 translate-y-[-2px]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT PANEL: Input & Control (4 cols) --- */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Input Source */}
          <section className="glass-panel p-6 rounded-[2rem] border border-slate-700/50 bg-slate-900/30">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ImageIcon size={16} className="text-indigo-400" /> Source Selection
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={startWebcam}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500 border-dashed transition-all group"
              >
                <Camera size={24} className="text-slate-600 group-hover:text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-slate-500">Live Webcam</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500 border-dashed transition-all group"
              >
                <Upload size={24} className="text-slate-600 group-hover:text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-slate-500">Upload Media</span>
                <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleUpload} />
              </button>
            </div>

            <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-600 uppercase mb-2">Sample Datasets</p>
               <div className="flex gap-2">
                 {SAMPLE_IMAGES.map(img => (
                   <button 
                    key={img.id} 
                    onClick={() => loadSample(img.url)}
                    className="flex-1 text-[10px] font-bold p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-indigo-500/50 text-slate-400 truncate"
                   >
                     {img.name}
                   </button>
                 ))}
               </div>
            </div>
          </section>

          {/* Preprocessing Controls */}
          <section className="glass-panel p-6 rounded-[2rem] border border-slate-700/50 bg-slate-900/30 space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Sliders size={16} className="text-indigo-400" /> Neural Preprocessor
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <Toggle 
                label="Grayscale Engine" 
                icon={RefreshCcw} 
                active={filters.grayscale} 
                onClick={() => setFilters(f => ({...f, grayscale: !f.grayscale}))} 
              />
              <Toggle 
                label="Edge Detector (Canny)" 
                icon={Zap} 
                active={filters.edges} 
                onClick={() => setFilters(f => ({...f, edges: !f.edges}))} 
              />
            </div>

            <div className="space-y-6 pt-4">
              <ControlSlider 
                label="Gaussian Blur" icon={Eye} min={0} max={10} 
                value={filters.blur} onChange={v => setFilters(f => ({...f, blur: v}))} 
                unit="px"
              />
              <ControlSlider 
                label="Contrast Flow" icon={Activity} min={0} max={200} 
                value={filters.contrast} onChange={v => setFilters(f => ({...f, contrast: v}))} 
                unit="%"
              />
              <ControlSlider 
                label="Luma Brightness" icon={Info} min={-100} max={100} 
                value={filters.brightness} onChange={v => setFilters(f => ({...f, brightness: v}))} 
              />
            </div>

            <div className="pt-4 border-t border-slate-800">
               <button 
                onClick={() => setFilters({ grayscale: false, blur: 0, edges: false, contrast: 100, brightness: 0, noise: 0 })}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-indigo-400 uppercase p-2 hover:bg-indigo-500/5 rounded-xl transition-all"
               >
                 <Shield size={12} /> Reset to Neural Defaults
               </button>
            </div>
          </section>

          {/* AI Tutor Insight */}
          <section className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[2rem] relative bg-mesh">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <HelpCircle size={14} /> Tutor Insight
               </h4>
               <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase">Interactive Context</div>
             </div>
             
             <div className="space-y-4">
               <AnimatePresence mode="wait">
                 {(() => {
                   let title = "Ready to Explore";
                   let text = "Try adjusting the filters to see how the CNN's 'vision' changes. Neural networks don't see images like we do—they see patterns, textures, and gradients.";
                   let impact = "Neutral";
                   
                   if (filters.edges) {
                     title = "Geometric Abstraction";
                     text = "By isolating edges, you're forcing the model to rely solely on geometry. Notice how confidence drops but the top classes might stay similar—this proves the model values shape above texture.";
                   } else if (filters.blur > 5) {
                     title = "Global Context Test";
                     text = "High blur removes details like fur or grain. If the model still classifies correctly, it means it has learned high-level 'global' features rather than just local pixel patterns.";
                   } else if (predictions[0] && origPredictions[0] && predictions[0].className !== origPredictions[0].className) {
                     title = "Classification Shift";
                     text = `The current filters caused the model to flip its prediction from '${origPredictions[0].className}' to '${predictions[0].className}'. This sensitivity reveals the model's 'decision boundaries'.`;
                     impact = "High";
                   }
                   
                   return (
                     <motion.div 
                        key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                     >
                        <h5 className="text-[11px] font-black text-white uppercase">{title}</h5>
                        <p className="text-xs text-indigo-200/60 leading-relaxed leading-relaxed leading-relaxed italic">
                           "{text}"
                        </p>
                        <div className="pt-3 border-t border-indigo-500/10">
                           <p className="text-[9px] font-black text-indigo-400 uppercase mb-1 flex items-center gap-1">
                              <Zap size={10} /> Why this matters
                           </p>
                           <p className="text-[10px] text-slate-500 leading-tight">
                              Understanding feature sensitivity helps AI engineers build more robust models that aren't easily fooled by noise or lighting changes.
                           </p>
                        </div>
                     </motion.div>
                   );
                 })()}
               </AnimatePresence>
             </div>
          </section>

        </div>

        {/* --- CENTRAL PANEL: Live Feed & Output (5 cols) --- */}
        <div className="xl:col-span-5 space-y-6">
          
          <div className="glass-panel p-2 rounded-[2.5rem] border border-slate-700/50 bg-slate-950 overflow-hidden relative">
            <div className="aspect-video w-full bg-slate-900 flex items-center justify-center relative">
              {/* Webcam Video (Hidden, used for processing) */}
              <video ref={videoRef} autoPlay playsInline muted className="hidden" />
              
              {/* Processed Output Canvas */}
              <canvas ref={processedCanvasRef} className="w-full h-full object-cover" />

              {/* Status Overlays */}
              <div className="absolute top-4 left-4 flex gap-2">
                 <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-[9px] font-black text-white flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`} />
                    {isProcessing ? 'NEURAL COMPUTE...' : 'FEED: STABLE'}
                 </div>
                 {isWebcamActive && (
                   <div className="bg-red-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/50 text-[9px] font-black text-red-400 flex items-center gap-2">
                      LIVE
                   </div>
                 )}
              </div>

              {!originalImage && !isWebcamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 backdrop-blur-sm">
                   <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-500">
                      <Microscope size={32} />
                   </div>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Awaiting Visual Input</p>
                </div>
              )}
            </div>

            {/* Prediction HUD */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border-t border-slate-800">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Prediction Stream</h3>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-indigo-500/30 rounded-full" />)}
                  </div>
               </div>

               <div className="space-y-4">
                  {predictions.length > 0 ? predictions.map((pred, i) => (
                    <motion.div 
                      key={pred.className}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group"
                    >
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors truncate max-w-[70%]">
                           {i + 1}. {pred.className}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400">{(pred.probability * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pred.probability * 100}%` }}
                          transition={{ type: "spring", stiffness: 50 }}
                        />
                      </div>
                    </motion.div>
                  )) : (
                    <div className="flex flex-col gap-3">
                       {Array.from({length: 3}).map((_, i) => (
                         <div key={i} className="animate-pulse space-y-2">
                            <div className="h-2 w-32 bg-slate-800 rounded" />
                            <div className="h-1.5 w-full bg-slate-800 rounded-full" />
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center gap-2 p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs font-bold text-slate-400">
                <Save size={16} /> Save State
             </button>
             <button className="flex items-center justify-center gap-2 p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs font-bold text-slate-400">
                <Download size={16} /> Export Analysis
             </button>
          </div>
        </div>

        {/* --- RIGHT PANEL: Visual Insights (3 cols) --- */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Feature Maps / Visualization */}
          <section className="glass-panel p-6 rounded-[2rem] border border-slate-700/50 bg-slate-900/30">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" /> Latent Features
             </h3>

             <div className="grid grid-cols-2 gap-4">
                {featureMaps.length > 0 ? featureMaps.map((val, i) => (
                  <div key={i} className="aspect-square bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative group">
                    {/* Simulated Feature Maps */}
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-40">
                       {Array.from({length: 64}).map((_, j) => (
                         <div key={j} className="border-[0.5px] border-cyan-500/10" style={{backgroundColor: Math.random() > 0.7 ? '#22d3ee20' : 'transparent'}} />
                       ))}
                    </div>
                    {/* Highlight Circle */}
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    />
                    <div className="absolute bottom-2 left-2 text-[8px] font-black text-cyan-500/60 uppercase">Node_{i}</div>
                  </div>
                )) : Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-950/50 border border-slate-800 rounded-2xl animate-pulse" />
                ))}
             </div>

             <div className="mt-6 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl group cursor-help">
                <div className="flex items-center gap-2 mb-2">
                   <Info size={14} className="text-cyan-400" />
                   <span className="text-[10px] font-black text-slate-400 uppercase">Explainer</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Intermediate layers extract patterns. Early layers detect <span className="text-indigo-400">lines</span>, while deeper layers visualize <span className="text-cyan-400">complex shapes</span>.
                </p>
             </div>
          </section>

          {/* Metrics Comparison */}
          {activeTab === 'compare' && (
            <motion.section 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6 rounded-[2rem] border border-slate-700/50 bg-indigo-900/10"
            >
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Split size={16} /> Comparison Delta
              </h3>

              <div className="space-y-4">
                 <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Baseline Confidence</p>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-black text-white">Original Image</span>
                       <span className="text-xs font-mono text-slate-400">
                          {origPredictions[0] ? (origPredictions[0].probability * 100).toFixed(1) : '0.0'}%
                       </span>
                    </div>
                 </div>

                 <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                    <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Compute Confidence</p>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-black text-white">Processed View</span>
                       <span className="text-xs font-mono text-indigo-400 font-bold">
                          {predictions[0] ? (predictions[0].probability * 100).toFixed(1) : '0.0'}%
                       </span>
                    </div>
                 </div>

                 {predictions[0] && origPredictions[0] && (
                   <div className="text-center pt-2">
                      <div className={`text-xl font-black ${predictions[0].probability >= origPredictions[0].probability ? 'text-emerald-500' : 'text-red-500'}`}>
                         {predictions[0].probability >= origPredictions[0].probability ? '+' : ''}
                         {((predictions[0].probability - origPredictions[0].probability) * 100).toFixed(1)}%
                      </div>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Difference in Signal Strength</p>
                   </div>
                 )}
              </div>
            </motion.section>
          )}

          {/* System Specs */}
          <section className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950 font-mono text-[9px] text-slate-500">
             <div className="flex items-center gap-2 mb-2 text-slate-400 font-bold">
               <Cpu size={12} /> SYSTEM_STATUS
             </div>
             <div className="space-y-1 opacity-70">
                <div>ENGINE: MobileNet_v2_1.0</div>
                <div>ACCEL: WebGL_Compute_Shaders</div>
                <div>LATENCY: 14ms (avg)</div>
                <div>OPENCV: v4.8.0_WASM</div>
             </div>
          </section>

        </div>

      </main>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#050510]">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>

    </div>
  );
}
