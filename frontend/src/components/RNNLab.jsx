import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Play, RefreshCcw, BookOpen, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Zap, Info, ArrowRight, ArrowLeft
} from 'lucide-react';

// ─── Architecture Definitions ─────────────────────────────────────────────────
const ARCHITECTURES = {
  'Simple RNN': {
    color: '#a78bfa', desc: 'Basic recurrent unit. Prone to vanishing gradient over long sequences.',
    formula: 'hₜ = tanh(Wₕ·hₜ₋₁ + Wₓ·xₜ + b)',
    layers: 1, bidirectional: false, hasGates: false, hasCell: false,
  },
  'LSTM': {
    color: '#f472b6', desc: 'Long Short-Term Memory — uses forget, input, and output gates to control information flow, solving vanishing gradients.',
    formula: 'fₜ=σ(Wf·[h,x])  iₜ=σ(Wi·[h,x])  cₜ=fₜ⊙cₜ₋₁+iₜ⊙tanh(Wc·[h,x])  hₜ=oₜ⊙tanh(cₜ)',
    layers: 1, bidirectional: false, hasGates: true, hasCell: true,
  },
  'GRU': {
    color: '#34d399', desc: 'Gated Recurrent Unit — simplified LSTM with reset & update gates. Fewer parameters, competitive performance.',
    formula: 'zₜ=σ(Wz·[h,x])  rₜ=σ(Wr·[h,x])  h̃ₜ=tanh(W·[rₜ⊙h,x])  hₜ=(1-zₜ)⊙hₜ₋₁+zₜ⊙h̃ₜ',
    layers: 1, bidirectional: false, hasGates: true, hasCell: false,
  },
  'Bidirectional': {
    color: '#fbbf24', desc: 'Processes sequence in both forward and backward directions simultaneously. Ideal for tasks where future context matters.',
    formula: 'h→ₜ = RNN(xₜ, h→ₜ₋₁)   h←ₜ = RNN(xₜ, h←ₜ₊₁)   hₜ = [h→ₜ ; h←ₜ]',
    layers: 1, bidirectional: true, hasGates: false, hasCell: false,
  },
  'Stacked RNN': {
    color: '#38bdf8', desc: 'Multiple LSTM layers stacked — each layer learns higher-level abstractions from the sequence below it.',
    formula: 'h¹ₜ = LSTM(xₜ, h¹ₜ₋₁)   h²ₜ = LSTM(h¹ₜ, h²ₜ₋₁)   yₜ = Dense(h²ₜ)',
    layers: 3, bidirectional: false, hasGates: true, hasCell: true,
  },
  'Encoder-Decoder': {
    color: '#fb923c', desc: 'Encoder compresses sequence to a context vector. Decoder generates output from context — backbone of seq2seq (translation, summarization).',
    formula: 'Encode: cₜ = h_T  |  Decode: sₜ = LSTM(sₜ₋₁, [yₜ₋₁, cₜ])',
    layers: 2, bidirectional: false, hasGates: true, hasCell: true,
  },
};

// ─── Math: sigmoid and tanh ───────────────────────────────────────────────────
const sig = z => 1 / (1 + Math.exp(-z));
const tanh = z => Math.tanh(z);

// ─── Compute hidden states ────────────────────────────────────────────────────
function computeStates(chars, arch) {
  const Wh = 0.45, Wx = 0.7, b = 0.1;
  const states = [];
  let h = 0, c = 0;

  for (let i = 0; i < chars.length; i++) {
    const x = chars[i].charCodeAt ? ((chars[i].charCodeAt(0) - 64) / 26) : chars[i] / 10;
    let gates = null;

    if (arch.hasGates && arch.hasCell) { // LSTM / Stacked / Enc-Dec
      const f = sig(Wh * h + Wx * x + b);
      const inp = sig(Wh * h + Wx * x + b + 0.1);
      const o = sig(Wh * h + Wx * x + b - 0.1);
      const ct = tanh(Wh * h + Wx * x + b);
      c = parseFloat((f * c + inp * ct).toFixed(4));
      h = parseFloat((o * tanh(c)).toFixed(4));
      gates = { f: +f.toFixed(3), i: +inp.toFixed(3), o: +o.toFixed(3), c: +ct.toFixed(3) };
    } else if (arch.hasGates) { // GRU
      const z = sig(Wh * h + Wx * x + b);
      const r = sig(Wh * h + Wx * x + b - 0.1);
      const hTilde = tanh(Wh * (r * h) + Wx * x + b);
      h = parseFloat(((1 - z) * h + z * hTilde).toFixed(4));
      gates = { z: +z.toFixed(3), r: +r.toFixed(3), hTilde: +hTilde.toFixed(3) };
    } else { // Simple / Bidirectional
      h = parseFloat(tanh(Wh * h + Wx * x + b).toFixed(4));
    }

    const grad = parseFloat(Math.pow(0.45, chars.length - 1 - i).toFixed(4));
    states.push({ h, c: arch.hasCell ? c : null, gates, x: +x.toFixed(3), grad });
  }
  return states;
}

// ─── Gate Bar ────────────────────────────────────────────────────────────────
function GateBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-6 font-mono text-slate-400">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full"
          animate={{ width: `${value * 100}%` }}
          style={{ background: color }} />
      </div>
      <span className="w-10 font-mono text-right" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Timestep Cell Component ──────────────────────────────────────────────────
function TimestepCell({ char, index, step, state, arch, totalLen, isReversed, taskMode, predChar }) {
  const isActive  = step === index + 1;
  const isPast    = step > index;
  const archDef   = ARCHITECTURES[arch];
  const color     = archDef.color;
  const memoryPct = state ? Math.abs(state.h) * 100 : 0;

  return (
    <div className="flex flex-col items-center" style={{ minWidth: 64 }}>
      {/* Input label */}
      <div className="text-[10px] text-slate-500 mb-1 font-mono">{isReversed ? '←' : ''}x{index}</div>

      {/* Input Node */}
      <motion.div
        animate={{ opacity: isPast ? 1 : 0.25, scale: isActive ? 1.15 : 1 }}
        className="h-10 px-2 min-w-[40px] rounded-lg flex items-center justify-center text-xs font-bold border transition-all truncate max-w-[80px]"
        style={isPast ? { borderColor: color, color, background: color + '20', boxShadow: `0 0 12px ${color}60` } : { borderColor: '#334155', color: '#64748b', background: '#1e293b' }}
      >{char}</motion.div>

      {/* Arrow down */}
      <div className="w-0.5 h-4 my-0.5" style={{ background: isPast ? color + '80' : '#334155' }} />

      {/* Hidden state node */}
      <motion.div
        animate={{ scale: isActive ? 1.25 : 1, opacity: isPast ? 1 : 0.3 }}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold border-2 relative"
        style={isPast ? { borderColor: color, background: `hsl(259, 80%, ${15 + memoryPct * 0.3}%)`, boxShadow: `0 0 20px ${color}80`, color: '#fff' } : { borderColor: '#334155', background: '#1e293b', color: '#64748b' }}
      >
        h{index}
        {isActive && state && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: -28 }}
            className="absolute text-[9px] font-mono bg-slate-900 border border-slate-600 px-2 py-0.5 rounded whitespace-nowrap z-10"
            style={{ color }}>
            {state.h}
          </motion.div>
        )}
        {/* Memory strength ring */}
        {isPast && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke={color} strokeWidth="2"
              strokeDasharray={`${memoryPct * 1.38} 138`} strokeLinecap="round"
              style={{ opacity: 0.6, transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
          </svg>
        )}
      </motion.div>

      {/* Arrow down */}
      {taskMode !== 'sentiment' && (
        <div className="w-0.5 h-4 my-0.5" style={{ background: isPast ? color + '80' : '#334155' }} />
      )}

      {/* Output node */}
      {taskMode !== 'sentiment' && (
        <motion.div
          animate={{ opacity: isPast ? 1 : 0.2 }}
          className="h-8 px-2 min-w-[32px] rounded-full flex items-center justify-center text-[10px] font-bold border truncate max-w-[80px]"
          style={isPast ? { borderColor: '#f43f5e', background: '#f43f5e20', color: '#f43f5e' } : { borderColor: '#334155', background: '#1e293b', color: '#64748b' }}
        >
          {taskMode === 'prediction' && isPast ? (predChar || `y${index}`) : `y${index}`}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RNNLab() {
  const [arch, setArch]           = useState('LSTM');
  const [sequence, setSequence]   = useState('HELLO');
  const [step, setStep]           = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [vanishing, setVanishing] = useState(false);
  const [showMath, setShowMath]   = useState(false);
  const [theoryTab, setTheoryTab] = useState('concept');
  const [taskMode, setTaskMode]   = useState('raw'); // 'raw', 'sentiment', 'prediction'
  const [speed, setSpeed]         = useState(700);

  const archDef  = ARCHITECTURES[arch];
  
  // Dynamic parsing based on task
  const charArr  = taskMode === 'raw' 
      ? sequence.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10).split('')
      : sequence.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().split(/\s+/).slice(0, 8).filter(Boolean);
      
  const states   = computeStates(charArr, archDef);

  // Gradients (BPTT simulation)
  const gradients = charArr.map((_, i) =>
    parseFloat(Math.pow(vanishing ? 0.35 : 0.85, charArr.length - 1 - i).toFixed(3))
  );

  // Task simulation logic
  let score = 0.5;
  const posWords = ['GOOD', 'LOVE', 'GREAT', 'HAPPY', 'NICE', 'JOY', 'SMILE', 'WOW', 'BEST', 'EXCELLENT', 'AMAZING', 'BEAUTIFUL'];
  const negWords = ['BAD', 'SAD', 'HATE', 'POOR', 'EVIL', 'CRY', 'MAD', 'NO', 'TERRIBLE', 'WORST', 'HORRIBLE'];
  posWords.forEach(w => { if (sequence.includes(w)) score += 0.40; });
  negWords.forEach(w => { if (sequence.includes(w)) score -= 0.45; });
  const sentimentScore = Math.max(0.05, Math.min(0.95, score));
  const isPositive = sentimentScore > 0.6;
  const isNegative = sentimentScore < 0.4;
  const sentimentLabel = isPositive ? 'Positive' : isNegative ? 'Negative' : 'Neutral';
  
  const nextWordMap = {
    'HELLO': 'WORLD', 'THE': 'QUICK', 'QUICK': 'BROWN', 'BROWN': 'FOX',
    'FOX': 'JUMPS', 'JUMPS': 'OVER', 'OVER': 'THE', 'I': 'LOVE', 'WE': 'LOVE',
    'LOVE': 'THIS', 'THIS': 'APP', 'APP': 'IS', 'IS': 'GREAT', 'GREAT': '!',
    'HI': 'HOW', 'HOW': 'ARE', 'ARE': 'YOU', 'YOU': 'DOING', 'DOING': '?'
  };

  // Next word/char prediction shifted target
  const predictedSequence = taskMode === 'raw'
     ? (sequence.length > 1 ? (sequence.slice(1) + (isPositive ? '!' : isNegative ? '.' : '?')).split('') : ['?'])
     : charArr.map((word, i) => charArr[i+1] || nextWordMap[word] || (isPositive ? 'AWESOME' : isNegative ? 'TERRIBLE' : '...'));

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setStep(0);
    const delay = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i <= charArr.length; i++) {
      setStep(i);
      await delay(speed);
    }
    setIsRunning(false);
  }, [charArr.length, speed]);

  const handlePredictAppend = () => {
    const lastWord = charArr[charArr.length - 1];
    const prediction = nextWordMap[lastWord] || (isPositive ? 'AWESOME' : isNegative ? 'TERRIBLE' : '...');
    if (prediction && prediction !== '...') {
      setSequence(prev => (prev + ' ' + prediction).trim().slice(0, 40));
      setStep(0);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col gap-5">
      {/* Header */}
      <div className="border-b border-slate-700/50 pb-4">
        <h1 className="text-3xl font-extrabold text-white mb-1 flex items-center gap-3">
          <Activity style={{ color: archDef.color }} size={30} />
          <span>RNN Sequence Lab</span>
          <span className="text-sm font-semibold px-3 py-1 rounded-full border"
            style={{ color: archDef.color, borderColor: archDef.color + '50', background: archDef.color + '15' }}>
            {arch}
          </span>
        </h1>
        <p className="text-slate-400 text-sm max-w-4xl">{archDef.desc}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 flex-1">

        {/* ── Architecture Selection ──────────────────────────────────────── */}
        <div className="glass-panel border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="font-bold text-white text-sm border-b border-slate-700/50 pb-2">Architecture</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(ARCHITECTURES).map(([name, def]) => (
              <button key={name} onClick={() => { setArch(name); setStep(0); }}
                className="flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all"
                style={arch === name
                  ? { borderColor: def.color, background: def.color + '15', color: def.color }
                  : { borderColor: '#334155', background: 'transparent', color: '#94a3b8' }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: def.color, boxShadow: arch === name ? `0 0 8px ${def.color}` : 'none' }} />
                <span className="font-semibold">{name}</span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="space-y-3 pt-3 border-t border-slate-700/50">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Task Mode</label>
              <select value={taskMode} onChange={e => setTaskMode(e.target.value)} disabled={isRunning}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-500">
                <option value="raw">Raw Character Sequences</option>
                <option value="sentiment">Sentiment Analysis (Word-based)</option>
                <option value="prediction">Next Word Prediction (Word-based)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {taskMode === 'raw' ? 'Input Sequence (Characters, max 10)' : 'Input Text (Words, max 8)'}
              </label>
              <input value={sequence} maxLength={taskMode === 'raw' ? 10 : 40}
                placeholder={taskMode === 'raw' ? 'HELLO' : 'THE APP IS GREAT'}
                onChange={e => { setSequence(e.target.value.toUpperCase()); setStep(0); }}
                disabled={isRunning}
                className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg font-mono text-center uppercase tracking-widest text-sm focus:outline-none focus:border-purple-500" />
            </div>

            <div>
              <label className="text-xs text-slate-400 flex justify-between mb-1">
                <span>Animation Speed</span><span className="text-purple-300">{speed}ms/step</span>
              </label>
              <input type="range" min={200} max={1500} step={100} value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full accent-purple-500" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg border border-slate-700 bg-slate-800/40">
              <span className="text-xs text-slate-300">Vanishing Gradient</span>
              <button onClick={() => setVanishing(v => !v)} disabled={isRunning}>
                {vanishing ? <ToggleRight size={24} className="text-red-400" /> : <ToggleLeft size={24} className="text-slate-500" />}
              </button>
            </div>

            <button onClick={handleRun} disabled={isRunning || !charArr.length}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${archDef.color}, ${archDef.color}bb)`, boxShadow: `0 0 16px ${archDef.color}40` }}>
              {isRunning ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
              {isRunning ? 'Processing...' : 'Run Forward Pass'}
            </button>

            {taskMode === 'prediction' && !isRunning && charArr.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                onClick={handlePredictAppend}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs text-purple-200 border border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 transition-all">
                <Zap size={14} className="text-purple-400" />
                <span>Predict & Append Next Word</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* ── Main Visualization Canvas ───────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Sequence Flow */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 flex-1 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `radial-gradient(ellipse at 50% 50%, ${archDef.color}08 0%, transparent 70%)`
            }} />

            {/* Architecture label */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Zap size={16} style={{ color: archDef.color }} /> Forward Pass
              </h3>
              <div className="text-xs font-mono px-2 py-1 rounded border"
                style={{ color: archDef.color, borderColor: archDef.color + '40', background: archDef.color + '10' }}>
                {step === 0 ? 'Ready' : step >= charArr.length ? '✓ Complete' : `t=${step-1}: computing h${step-1}`}
              </div>
            </div>

            {/* Forward pass nodes */}
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start gap-3 min-w-max mx-auto justify-center">
                {charArr.map((ch, i) => (
                  <React.Fragment key={i}>
                    <TimestepCell char={ch} index={i} step={step} state={states[i]}
                      arch={arch} totalLen={charArr.length} taskMode={taskMode} predChar={predictedSequence[i]} />
                    {i < charArr.length - 1 && (
                      <div className="flex flex-col items-center justify-center mt-16">
                        <motion.div className="h-0.5 w-8 relative"
                          animate={{ opacity: step > i ? 1 : 0.15 }}
                          style={{ background: `linear-gradient(90deg, ${archDef.color}, ${archDef.color}80)` }}>
                          {isRunning && step === i + 1 && (
                            <motion.div className="absolute w-2 h-2 rounded-full -top-0.5"
                              style={{ background: archDef.color, boxShadow: `0 0 8px ${archDef.color}` }}
                              animate={{ left: ['0%', '100%'] }}
                              transition={{ duration: 0.5, repeat: Infinity }} />
                          )}
                        </motion.div>
                        <ArrowRight size={10} style={{ color: archDef.color, opacity: step > i ? 0.8 : 0.2 }} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Bidirectional reverse pass */}
            {archDef.bidirectional && (
              <div className="mt-2 overflow-x-auto pb-2 border-t border-slate-700/50 pt-3">
                <div className="text-xs text-yellow-400 font-semibold mb-2 flex items-center gap-1">
                  <ArrowLeft size={12}/> Backward Pass (Bidirectional)
                </div>
                <div className="flex items-start gap-3 min-w-max mx-auto justify-center">
                  {[...charArr].reverse().map((ch, i) => (
                    <React.Fragment key={i}>
                      <TimestepCell char={ch} index={i} step={step} state={states[charArr.length - 1 - i]}
                        arch="Simple RNN" totalLen={charArr.length} isReversed />
                      {i < charArr.length - 1 && (
                        <div className="flex flex-col items-center justify-center mt-16">
                          <motion.div className="h-0.5 w-8"
                            animate={{ opacity: step > i ? 1 : 0.15 }}
                            style={{ background: 'linear-gradient(270deg, #fbbf24, #fbbf2480)' }} />
                          <ArrowLeft size={10} style={{ color: '#fbbf24', opacity: step > i ? 0.8 : 0.2 }} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Encoder / Decoder split */}
            {arch === 'Encoder-Decoder' && step >= charArr.length && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 border-t border-slate-700/50 pt-3">
                <div className="text-xs font-semibold text-orange-300 mb-2">Context Vector → Decoder</div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 rounded-lg border text-xs font-mono font-bold text-orange-300"
                    style={{ borderColor: '#fb923c60', background: '#fb923c15' }}>
                    c = h{charArr.length - 1} = {states[charArr.length - 1]?.h}
                  </div>
                  <ArrowRight size={16} className="text-slate-500" />
                  <div className="flex gap-2">
                    {['s₀','s₁','s₂'].map((s, i) => (
                      <motion.div key={s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}
                        className="w-10 h-10 rounded-lg border flex items-center justify-center text-xs font-bold"
                        style={{ borderColor: '#fb923c', background: '#fb923c20', color: '#fb923c' }}>
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sentiment Classifier */}
            {taskMode === 'sentiment' && step >= charArr.length && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="mt-6 border-t border-slate-700/50 pt-5 flex flex-col items-center">
                <div className="w-0.5 h-6 bg-slate-500 absolute -mt-5" />
                <div className="bg-slate-800 border border-slate-600 rounded-xl px-5 py-3 shadow-lg flex flex-col items-center">
                   <div className="text-[10px] text-slate-400 font-mono mb-1">Final Hidden State h{charArr.length - 1}</div>
                   <div className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Zap size={14} className="text-yellow-400"/> Dense Classifier
                   </div>
                   <div className="flex w-full h-2 rounded-full overflow-hidden bg-slate-900 mb-1">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${sentimentScore * 100}%` }}
                        className={`h-full ${isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-slate-400'}`} />
                   </div>
                   <div className={`text-sm font-extrabold ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-300'}`}>
                      {sentimentLabel} ({sentimentScore.toFixed(2)})
                   </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Gradient + Sequence Importance */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Info size={14} className="text-red-400" />
              {vanishing ? '⚠️ Vanishing Gradient Simulation' : 'Sequence Importance (Gradient Magnitude)'}
            </h3>
            <div className="flex items-end gap-2 h-20">
              {gradients.map((g, i) => (
                <div key={i} className="flex flex-col items-center flex-1 justify-end gap-1">
                  <motion.div className="w-full rounded-t min-h-[4px] transition-all"
                    animate={{ height: `${Math.max(4, g * 76)}px` }}
                    style={{ background: vanishing && i < charArr.length - 3
                      ? `linear-gradient(to top, #ef4444, #7f1d1d)`
                      : `linear-gradient(to top, ${archDef.color}, ${archDef.color}80)` }} />
                  <span className="text-[9px] text-slate-500 font-mono">t{i}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {vanishing
                ? `With small Wₕ, gradients decay as Wₕᵗ. Early timesteps receive negligible updates — the problem LSTM/GRU solve.`
                : `Higher bars = timestep contributed more to learning. ${arch} maintains gradient flow better over long sequences.`}
            </p>
          </div>
        </div>

        {/* ── Math / Theory Panel ─────────────────────────────────────────── */}
        <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <BookOpen size={14} className="text-blue-400" /> Theory & Math
            </h3>
            <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
              {['concept','math','numeric', 'tasks'].map(t => (
                <button key={t} onClick={() => setTheoryTab(t)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all capitalize ${theoryTab === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`${arch}-${theoryTab}`}
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-3 flex-1">

              {theoryTab === 'concept' && (
                <>
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                    <strong style={{ color: archDef.color }}>{arch}: </strong>{archDef.desc}
                  </div>
                  <div className="bg-slate-900 border border-blue-500/20 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
                    <strong className="text-blue-300">Real-world analogy: </strong>
                    {arch === 'Simple RNN' && 'Like a person reading but forgetting the beginning of a long book by the end.'}
                    {arch === 'LSTM' && 'Like a person with a notepad — they can decide what to write down, erase, or keep based on relevance.'}
                    {arch === 'GRU' && 'Like a simplified notepad — fewer controls, but nearly as effective at remembering context.'}
                    {arch === 'Bidirectional' && 'Like proofreading — you read forward and backward to catch errors by understanding full context.'}
                    {arch === 'Stacked RNN' && 'Like a team of analysts — each level summarizes patterns for the next, creating hierarchical understanding.'}
                    {arch === 'Encoder-Decoder' && 'Like a translator — first listen to the entire sentence (encode), then generate the translation (decode).'}
                  </div>
                </>
              )}

              {theoryTab === 'math' && (
                <div className="space-y-2">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: archDef.color }}>
                    {archDef.formula}
                  </div>
                  {archDef.hasGates && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                      <div className="text-yellow-300 font-bold mb-2">Gate Meanings:</div>
                      {arch === 'GRU' ? <>
                        <div><span className="text-green-300">zₜ (Update):</span> How much of old memory to keep</div>
                        <div><span className="text-pink-300">rₜ (Reset):</span> How much of old state to forget</div>
                        <div><span className="text-cyan-300">h̃ₜ (Candidate):</span> New memory proposal</div>
                      </> : <>
                        <div><span className="text-red-300">fₜ (Forget):</span> Erase irrelevant memory</div>
                        <div><span className="text-green-300">iₜ (Input):</span> Write new information</div>
                        <div><span className="text-blue-300">oₜ (Output):</span> Expose relevant memory</div>
                      </>}
                    </div>
                  )}
                </div>
              )}

              {theoryTab === 'numeric' && states.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Step-by-step hidden states for sequence "{sequence.slice(0,charArr.length)}"</p>
                  {states.map((s, i) => (
                    <div key={i}
                      className={`rounded-xl border p-3 space-y-1.5 text-xs font-mono transition-all ${step > i ? 'border-opacity-100' : 'opacity-40'}`}
                      style={{ borderColor: archDef.color + '50', background: step > i ? archDef.color + '08' : undefined }}>
                      <div className="flex justify-between">
                        <span className="text-slate-400">t={i} (x={s.x})</span>
                        <span style={{ color: archDef.color }}>h={s.h}</span>
                      </div>
                      {s.gates && archDef.hasGates && (
                        <div className="space-y-1 pt-1 border-t border-slate-800">
                          {arch === 'GRU' ? <>
                            <GateBar label="z" value={s.gates.z}  color="#34d399" />
                            <GateBar label="r" value={s.gates.r}  color="#f472b6" />
                          </> : <>
                            <GateBar label="f" value={s.gates.f}  color="#ef4444" />
                            <GateBar label="i" value={s.gates.i}  color="#22c55e" />
                            <GateBar label="o" value={s.gates.o}  color="#3b82f6" />
                            {s.c !== null && <div className="text-slate-500 pt-0.5">c = {s.c}</div>}
                          </>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {theoryTab === 'tasks' && (
                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                  <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4">
                    <h4 className="text-purple-300 font-bold mb-2 flex items-center gap-2">Many-to-Many: Next Char Prediction</h4>
                    <p className="mb-2"><strong>Goal:</strong> Given a sequence of characters, predict the immediate next character in the string.</p>
                    <p className="mb-2"><strong>How it works:</strong> The network produces an output <span className="font-mono text-purple-400">yₜ</span> at <em>every single timestep</em>. The output is shifted by one (e.g., if input is "H", target is "E").</p>
                    <p className="text-slate-400">This is the exact fundamental mechanism behind Large Language Models (like GPT). They continuously predict the next token based on all previous context.</p>
                  </div>
                  <div className="bg-slate-900 border border-green-500/30 rounded-xl p-4">
                    <h4 className="text-green-300 font-bold mb-2 flex items-center gap-2">Many-to-One: Sentiment Analysis</h4>
                    <p className="mb-2"><strong>Goal:</strong> Read an entire sequence, understand its context, and produce a single classification at the end.</p>
                    <p className="mb-2"><strong>How it works:</strong> The outputs of all early timesteps are <em>ignored</em>. Only the final hidden state <span className="font-mono text-green-400">h_T</span> (which acts as a compressed summary of the entire word) is passed to a Dense layer to classify positive or negative.</p>
                    <p className="text-slate-400">Used for classifying movie reviews, spam detection, or organizing user feedback.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
