import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Play, Sparkles, RefreshCcw, Save, Trash2, Info, 
  ChevronRight, Activity, Camera, MousePointer2, Zap, 
  Target, BarChart2, Lightbulb, Hand, Layers, ShieldCheck,
  Download, Image as ImageIcon, Box
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// --- CONSTANTS ---
const GRID_SIZE = 20; // Upgraded for gesture accuracy
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const LEARNING_SPEED = 0.5;

// --- UTILS ---
const createEmptyGrid = () => Array(TOTAL_CELLS).fill(-1);

const calculateEnergy = (grid, weights) => {
  let e = 0;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    let sum = 0;
    for (let j = 0; j < TOTAL_CELLS; j++) {
      sum += weights[i][j] * grid[j];
    }
    e += -0.5 * sum * grid[i];
  }
  return e;
};

export default function HopfieldLab() {
  // --- STATE ---
  const [cvLoaded, setCvLoaded] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [handLandmarks, setHandLandmarks] = useState(null);
  
  const [originalGrid, setOriginalGrid] = useState(createEmptyGrid());
  const [noisyGrid, setNoisyGrid] = useState(createEmptyGrid());
  const [recallGrid, setRecallGrid] = useState(createEmptyGrid());
  
  const [weights, setWeights] = useState(Array(TOTAL_CELLS).fill(0).map(() => new Float32Array(TOTAL_CELLS)));
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [isRecalling, setIsRecalling] = useState(false);
  const [converged, setConverged] = useState(false);
  const [energyHistory, setEnergyHistory] = useState([]);
  const [currentEnergy, setCurrentEnergy] = useState(0);
  const [iterations, setIterations] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(15);
  const [activeCell, setActiveCell] = useState(null);

  // Drawing State
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [lastGesture, setLastGesture] = useState('none'); // none, draw, pause, clear, submit

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // For air drawing
  const overlayCanvasRef = useRef(null); // For mediapipe landmarks
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const gestureHistoryRef = useRef({ type: 'none', count: 0, lastX: 0, movement: 0 });

  // --- HAND TRACKING SETUP ---
  useEffect(() => {
    let attempts = 0;
    const checkMediaPipe = setInterval(() => {
      attempts++;
      if (window.Hands) {
        clearInterval(checkMediaPipe);
        try {
          const hands = new window.Hands({
            locateFile: (file) => `https://unpkg.com/@mediapipe/hands/${file}`
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          hands.onResults((results) => {
            if (results.multiHandLandmarks) {
              setHandLandmarks(results.multiHandLandmarks[0]);
              drawHandOverlay(results);
              processGestures(results.multiHandLandmarks[0]);
            }
          });

          handsRef.current = hands;
          setCvLoaded(true);
          console.log("MediaPipe Hands Ready via unpkg");
        } catch (err) {
          console.error("Critical Hands Init Failure:", err);
          alert("Neural Vision Engine failed to initialize correctly. Please check if your firewall blocks unpkg.com.");
        }
      }
      
      if (attempts > 15) { // ~7.5 seconds
        console.warn("MediaPipe takes too long to load. Enabling mouse fallback.");
        setCvLoaded(true); // Unlock UI anyway to allow mouse use
        clearInterval(checkMediaPipe);
      }
    }, 500);

    return () => clearInterval(checkMediaPipe);
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    
    // Check if we have global modules
    if (!window.Camera || !window.Hands) {
       console.error("MediaPipe modules missing", { Camera: !!window.Camera, Hands: !!window.Hands });
       alert("AI Modules (MediaPipe) not detected. Please verify your internet connection or check the browser console.");
       return;
    }
    
    try {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current) {
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch(e) { /* ignore frame drop */ }
          }
        },
        width: 640,
        height: 480
      });
      
      cameraRef.current = camera;
      await camera.start();
      setIsWebcamActive(true);
    } catch (err) {
      console.error("Camera Hardware Error:", err);
      alert("Hardware Error: Could not start camera. Ensure your webcam is connected and not used by another program (like Teams or Zoom).");
      setIsWebcamActive(false);
    }
  };

  const drawHandOverlay = (results) => {
    if (!overlayCanvasRef.current) return;
    const ctx = overlayCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    
    if (results.multiHandLandmarks) {
      // Draw minimal futuristic dots for landmarks
      results.multiHandLandmarks.forEach(landmarks => {
        landmarks.forEach(lm => {
            const x = lm.x * overlayCanvasRef.current.width;
            const y = lm.y * overlayCanvasRef.current.height;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#22d3ee';
            ctx.fill();
        });
      });
    }
  };

  // --- GESTURE PROCESSING ---
  const processGestures = (landmarks) => {
    if (!landmarks) {
      setLastGesture('none');
      return;
    }

    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const thumbTip = landmarks[4];
    
    // Helper to check if a finger is extended (tip above pip/mcp)
    const isExtended = (tip, pip) => tip.y < pip.y - 0.05; // Added epsilon for stability
    
    const indexUp = isExtended(indexTip, landmarks[6]);
    const middleUp = isExtended(middleTip, landmarks[10]);
    const ringUp = isExtended(ringTip, landmarks[14]);
    const pinkyUp = isExtended(pinkyTip, landmarks[18]);
    const thumbUp = isExtended(thumbTip, landmarks[2]);

    let detectedGesture = 'none';

    // 1. Drawing: Index extended, but others curled
    if (indexUp && !middleUp && !ringUp && !pinkyUp) {
        detectedGesture = 'draw';
    } 
    // 2. Commit: Thumbs Up ONLY
    else if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
        detectedGesture = 'submit';
    }
    // 3. Wipe: Open Palm + Horizontal Movement
    else if (indexUp && middleUp && ringUp && pinkyUp) {
        const currentX = landmarks[0].x; // Use wrist X for stable tracking
        const deltaX = Math.abs(currentX - gestureHistoryRef.current.lastX);
        
        // Accumulate movement if palm is open
        if (deltaX > 0.02) {
            gestureHistoryRef.current.movement += deltaX;
        }
        
        if (gestureHistoryRef.current.movement > 0.5) { // Significant swipe detected
            detectedGesture = 'clear';
        } else {
            detectedGesture = 'palm_steady';
        }
        gestureHistoryRef.current.lastX = currentX;
    } else {
        gestureHistoryRef.current.movement = 0; // Reset movement if not in palm state
    }

    // Stability Engine (Debounce)
    if (detectedGesture === gestureHistoryRef.current.type) {
        gestureHistoryRef.current.count++;
    } else {
        gestureHistoryRef.current.type = detectedGesture;
        gestureHistoryRef.current.count = 1;
        if (detectedGesture !== 'palm_steady') gestureHistoryRef.current.movement = 0;
    }

    // Apply Gesture
    const threshold = 12; // Frames
    
    if (detectedGesture === 'draw') {
        setLastGesture('draw');
        addDrawingPoint(indexTip.x, indexTip.y);
    } else if (detectedGesture === 'clear') {
        setLastGesture('clear');
        setDrawingPoints([]);
        gestureHistoryRef.current.movement = 0;
        gestureHistoryRef.current.count = 0;
    } else if (detectedGesture === 'submit' && gestureHistoryRef.current.count > threshold) {
        setLastGesture('submit');
        submitDrawingToGrid();
        gestureHistoryRef.current.count = 0;
    } else if (detectedGesture === 'none' || detectedGesture === 'palm_steady') {
        setLastGesture('none');
    }
  };

  const addDrawingPoint = (x, y) => {
    setDrawingPoints(prev => [...prev.slice(-100), { x, y, timestamp: Date.now() }]);
  };

  // --- AIR CANVAS RENDERING ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    if (drawingPoints.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(drawingPoints[0].x * canvasRef.current.width, drawingPoints[0].y * canvasRef.current.height);
    
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#22d3ee';
    ctx.strokeStyle = '#22d3ee';

    for (let i = 1; i < drawingPoints.length; i++) {
        const x = drawingPoints[i].x * canvasRef.current.width;
        const y = drawingPoints[i].y * canvasRef.current.height;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [drawingPoints]);

  const submitDrawingToGrid = async () => {
    if (!canvasRef.current || drawingPoints.length < 2) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = GRID_SIZE;
    tempCanvas.height = GRID_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw points directly onto 20x20 grid to maintain perfect hit-boxes
    tempCtx.beginPath();
    tempCtx.moveTo(drawingPoints[0].x * GRID_SIZE, drawingPoints[0].y * GRID_SIZE);
    tempCtx.lineWidth = 2.5; 
    tempCtx.lineCap = 'round';
    tempCtx.lineJoin = 'round';
    tempCtx.strokeStyle = 'white';
    
    for (let i = 1; i < drawingPoints.length; i++) {
        tempCtx.lineTo(drawingPoints[i].x * GRID_SIZE, drawingPoints[i].y * GRID_SIZE);
    }
    tempCtx.stroke();
    
    const imgData = tempCtx.getImageData(0,0,GRID_SIZE,GRID_SIZE).data;
    const newGrid = createEmptyGrid();
    let hasSignal = false;
    for(let i=0; i<TOTAL_CELLS; i++) {
        if (imgData[i * 4 + 3] > 10) {
            newGrid[i] = 1;
            hasSignal = true;
        } else {
            newGrid[i] = -1;
        }
    }
    
    if (!hasSignal) return; // Prevent submitting empty grid
    
    setOriginalGrid(newGrid);
    setRecallGrid([...newGrid]);
    setNoisyGrid([...newGrid]);
    
    if (!isRecalling) {
        recallAction(newGrid);
    }
  };

  // --- HOPFIELD LOGIC ---
  const savePattern = useCallback(() => {
    const newWeights = weights.map(row => new Float32Array(row));
    for (let i = 0; i < TOTAL_CELLS; i++) {
      for (let j = 0; j < TOTAL_CELLS; j++) {
        if (i === j) newWeights[i][j] = 0;
        else newWeights[i][j] += (originalGrid[i] * originalGrid[j]) / TOTAL_CELLS;
      }
    }
    setWeights(newWeights);
    setSavedPatterns(prev => [...prev, [...originalGrid]]);
    setCurrentEnergy(calculateEnergy(originalGrid, newWeights));
  }, [originalGrid, weights]);

  const applyNoise = () => {
    const newGrid = [...originalGrid];
    for (let i = 0; i < TOTAL_CELLS; i++) {
        if (Math.random() * 100 < noiseLevel) newGrid[i] *= -1;
    }
    setNoisyGrid(newGrid);
    setRecallGrid([...newGrid]);
    setConverged(false);
    setEnergyHistory([]);
    setIterations(0);
  };

  const recallAction = async (forcedGrid = null) => {
    setIsRecalling(true);
    setConverged(false);
    let currentGrid = forcedGrid ? [...forcedGrid] : [...noisyGrid];
    let hasChanged = true;
    let iter = 0;
    const eHistory = [calculateEnergy(currentGrid, weights)];
    
    while (hasChanged && iter < 100) {
      hasChanged = false;
      const indices = Array.from({length: TOTAL_CELLS}, (_, i) => i).sort(() => Math.random() - 0.5);
      
      for (let i of indices) {
        let sum = 0;
        for (let j = 0; j < TOTAL_CELLS; j++) sum += weights[i][j] * currentGrid[j];
        const newState = sum > 0 ? 1 : (sum < 0 ? -1 : currentGrid[i]);
        if (newState !== currentGrid[i]) {
            currentGrid[i] = newState;
            hasChanged = true;
            setActiveCell(i);
            const newE = calculateEnergy(currentGrid, weights);
            eHistory.push({ e: newE, i: eHistory.length });
            setCurrentEnergy(newE);
            setRecallGrid([...currentGrid]);
            await new Promise(res => setTimeout(res, 5));
        }
      }
      iter++;
      setIterations(iter);
      setEnergyHistory([...eHistory]);
    }
    setActiveCell(null);
    setConverged(true);
    setIsRecalling(false);
  };

  // --- UI COMPONENTS ---
  const GridView = ({ grid, title, interactive = false, highlight = false }) => (
    <div className="flex flex-col items-center gap-3">
       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
         {highlight ? <Zap size={12} className="text-yellow-400" /> : <Layers size={12} className="text-indigo-400" />}
         {title}
       </h4>
       <div 
        className={`grid bg-slate-950 p-1.5 border rounded-2xl transition-all duration-500 ${
          converged && highlight ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-slate-800'
        }`}
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: '220px', height: '220px' }}
       >
         {grid.map((c, i) => (
           <div 
            key={i} 
            className={`w-full h-full rounded-[1px] transition-colors duration-200 ${
              c === 1 ? (highlight && converged ? 'bg-emerald-400' : 'bg-cyan-400') : 'bg-slate-900/50'
            } ${activeCell === i ? 'bg-pink-500 scale-150 z-10' : ''}`}
            onClick={() => {
              if (interactive) {
                const ng = [...grid];
                ng[i] *= -1;
                setOriginalGrid(ng);
                setRecallGrid(ng);
                setNoisyGrid(ng);
              }
            }}
           />
         ))}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030308] text-slate-200 p-4 md:p-8 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl shadow-xl shadow-cyan-500/20">
              <Brain size={32} />
            </div>
            <span>HOPIFIELD <span className="text-cyan-500">MIND ENGINE</span></span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            Gestural Pattern Association & Associative Memory Lab
          </p>
        </motion.div>

        <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-3xl">
           <div className="flex items-center gap-6 px-6 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase">Memory Capacity</span>
                <span className="text-sm font-bold text-white">{Math.floor(TOTAL_CELLS * 0.14)} Attractors</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase">Stored Items</span>
                <span className="text-sm font-bold text-cyan-400">{savedPatterns.length} Nodes</span>
              </div>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT: GESTURE CONSOLE ─────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-6">
           <section className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-900/20 space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Hand size={16} className="text-cyan-400" /> Interaction HUD
              </h3>

              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                 {/* Persistent Video/Canvas for Ref Stability */}
                 <video 
                    ref={videoRef} 
                    className={`absolute inset-0 w-full h-full object-cover mirror transition-opacity duration-500 ${isWebcamActive ? 'opacity-30' : 'opacity-0 pointer-events-none'}`} 
                    autoPlay playsInline muted 
                 />
                 <canvas 
                    ref={overlayCanvasRef} 
                    className={`absolute inset-0 w-full h-full mirror transition-opacity duration-500 ${isWebcamActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                    width={640} height={480} 
                 />

                 {!isWebcamActive && (
                   <button 
                    onClick={startCamera}
                    disabled={!cvLoaded}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950/40 backdrop-blur-sm hover:bg-slate-900/60 transition-all group disabled:opacity-50 disabled:cursor-wait"
                   >
                     <div className={`p-5 rounded-full bg-cyan-500/10 border-2 border-cyan-500/20 text-cyan-500 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300 ${!cvLoaded ? 'animate-pulse' : ''} shadow-[0_0_20px_rgba(34,211,238,0.1)]`}>
                        {cvLoaded ? <Camera size={38} /> : <RefreshCcw size={38} className="animate-spin" />}
                     </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                          {cvLoaded ? 'Initialize Neural Vision' : 'Syncing Engine...'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-60">Gesture-Based Interaction Engine</span>
                     </div>
                   </button>
                 )}

                 <AnimatePresence>
                   {isWebcamActive && (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 left-4 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-2xl z-20"
                     >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Vision System Active</span>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Gesture Map</p>
                  <div className="space-y-2">
                     {[
                       { icon: MousePointer2, label: 'Index Finger', action: 'Draw Neural Signal', active: lastGesture === 'draw' },
                       { icon: ShieldCheck, label: 'Thumbs Up', action: 'Commit & Recall Pattern', active: lastGesture === 'submit' },
                       { icon: RefreshCcw, label: 'Moving Palm', action: 'Swipe to Wipe Memory', active: lastGesture === 'clear' },
                     ].map(g => (
                       <div key={g.label} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${g.active ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                          <g.icon size={16} className={g.label === 'Moving Palm' && g.active ? 'animate-spin-slow' : ''} />
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{g.label}</span>
                             <span className="text-[9px] font-medium opacity-60 leading-none mt-1">{g.action}</span>
                          </div>
                       </div>
                     ))}
                  </div>
              </div>
           </section>

           <section className="bg-gradient-to-br from-indigo-900/10 to-cyan-900/10 border border-cyan-500/20 p-6 rounded-[2rem] relative overflow-hidden">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Lightbulb size={14} /> Cognitive Tip
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                "The Hopfield Network uses Hebbian learning: 'Neurons that fire together, wire together.' By air-drawing, you are physically creating these synaptic connections in real-time."
              </p>
           </section>
        </div>

        {/* ── CENTER: LIVE ENGINE ─────────────────────────────────────────── */}
        <div className="xl:col-span-6 space-y-8">
           <div className="glass-panel p-2 rounded-[3rem] border border-white/5 bg-slate-950/40 relative min-h-[500px] flex flex-col">
              
              <div className="flex items-center justify-between px-8 py-6">
                 <div>
                    <h2 className="text-2xl font-black text-white">Mind Canvas</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Air-Drawing Reconstruction Interface</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setDrawingPoints([])} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                    <button onClick={submitDrawingToGrid} className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-black shadow-lg shadow-cyan-600/20 hover:scale-105 transition-all">SUBMIT BRAINWAVE</button>
                 </div>
              </div>

              {/* Main Interaction Area */}
              <div className="flex-1 px-8 pb-8 flex flex-col gap-8">
                 <div className="relative aspect-video bg-slate-950 rounded-[2rem] border-2 border-slate-800/50 overflow-hidden group">
                    <div className="absolute inset-0 grid-mesh opacity-20 pointer-events-none" />
                    <canvas 
                      ref={canvasRef} 
                      className="absolute inset-0 w-full h-full z-10 cursor-crosshair" 
                      width={1280} height={720} 
                      onMouseMove={(e) => {
                        // Mouse Fallback Drawing
                        if (e.buttons === 1) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          addDrawingPoint((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
                        }
                      }}
                    />
                    
                    {!isWebcamActive && (
                      <div className="absolute top-4 right-4 z-20">
                         <div className="bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700 text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">
                           <MousePointer2 size={12} /> Mouse-Draw Active
                         </div>
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-slate-900/30 p-8 rounded-[2rem] border border-white/5">
                    <GridView grid={originalGrid} title="1. Encoded Pattern" interactive />
                    <div className="flex flex-col items-center gap-2">
                       <ChevronRight className="text-slate-800" size={32} />
                       <div className="text-[9px] font-black text-slate-600 uppercase">Weight Association</div>
                    </div>
                    <GridView grid={recallGrid} title="2. Recalled Signal" highlight />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={savePattern}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 group hover:scale-105 transition-all"
              >
                <Save size={20} />
                <span className="text-[10px] font-black uppercase">Store Pattern</span>
              </button>
              <button 
                onClick={applyNoise}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all group"
              >
                <Zap size={20} className="group-hover:text-yellow-400" />
                <span className="text-[10px] font-black uppercase">Inject Noise</span>
              </button>
              <button 
                onClick={() => recallAction()}
                disabled={isRecalling}
                className="lg:col-span-2 flex items-center justify-center gap-4 p-4 rounded-3xl bg-cyan-600 text-white shadow-xl shadow-cyan-600/20 font-black text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isRecalling ? <RefreshCcw className="animate-spin" /> : <Play />}
                RECALL FROM ATTRACTOR
              </button>
           </div>
        </div>

        {/* ── RIGHT: ANALYTICS ────────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-6">
           <section className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-900/20">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                <BarChart2 size={16} className="text-pink-400" /> Energy Metrics
              </h3>

              <div className="h-48 w-full bg-slate-950/50 rounded-2xl border border-slate-800 p-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={energyHistory}>
                       <defs>
                          <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                       <XAxis dataKey="i" hide />
                       <Area type="monotone" dataKey="e" stroke="#ec4899" fillOpacity={1} fill="url(#colorE)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-4">
                 <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Network Energy</span>
                    <span className="text-sm font-mono font-bold text-pink-400">{currentEnergy.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Updates</span>
                    <span className="text-sm font-mono font-bold text-cyan-400">{iterations} Iters</span>
                 </div>
              </div>
           </section>

           <section className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-900/20">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Target size={16} className="text-indigo-400" /> Experimenter
              </h3>

              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-500">
                       <span className="uppercase">Distortion Level</span>
                       <span className="text-white">{noiseLevel}%</span>
                    </div>
                    <input type="range" min="0" max="60" value={noiseLevel} onChange={e => setNoiseLevel(e.target.value)} className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all flex flex-col items-center gap-2">
                       <Download size={14} /> Export Graph
                    </button>
                    <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all flex flex-col items-center gap-2">
                       <ImageIcon size={14} /> Save Pattern
                    </button>
                 </div>
              </div>
           </section>

           <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-3 text-slate-400 font-black text-[10px] uppercase">
                <Zap size={14} /> System Latency
              </div>
              <div className="flex items-end gap-1 h-8">
                 {[40, 60, 30, 80, 50, 40, 70, 40, 60, 90, 40].map((h, i) => (
                   <motion.div key={i} animate={{ height: h + '%' }} className="w-full bg-cyan-500/20 rounded-t-[1px]" />
                 ))}
              </div>
           </div>
        </div>

      </main>

      {/* Decorative BG */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#030308]">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full" />
         <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[150px] rounded-full" />
      </div>

    </div>
  );
}
