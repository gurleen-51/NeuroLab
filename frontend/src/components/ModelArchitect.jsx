import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Cpu, Zap, Play, Lightbulb, ArrowDown, BarChart2, Info } from 'lucide-react';

// ─── Layer Type Definitions ───────────────────────────────────────────────────
const LAYER_TYPES = {
  INPUT:   { label: 'Input Layer',    color: '#38bdf8', glow: 'rgba(56,189,248,0.5)',  tag: 'DATA',   icon: '📥' },
  DENSE:   { label: 'Dense Layer',    color: '#a78bfa', glow: 'rgba(167,139,250,0.5)', tag: 'HIDDEN', icon: '🔷' },
  LSTM:    { label: 'LSTM Block',     color: '#f472b6', glow: 'rgba(244,114,182,0.5)', tag: 'MEMORY', icon: '🔁' },
  GRU:     { label: 'GRU Block',      color: '#fb923c', glow: 'rgba(251,146,60,0.5)',  tag: 'MEMORY', icon: '🔂' },
  CONV:    { label: 'Conv2D Layer',   color: '#34d399', glow: 'rgba(52,211,153,0.5)',  tag: 'CONV',   icon: '🖼️' },
  POOL:    { label: 'Pooling Layer',  color: '#fbbf24', glow: 'rgba(251,191,36,0.5)',  tag: 'POOL',   icon: '⬇️' },
  DROPOUT: { label: 'Dropout',        color: '#94a3b8', glow: 'rgba(148,163,184,0.3)', tag: 'REG',    icon: '🎲' },
  OUTPUT:  { label: 'Output Layer',   color: '#f43f5e', glow: 'rgba(244,63,94,0.5)',   tag: 'OUT',    icon: '📤' },
};

// ─── Architecture Presets ─────────────────────────────────────────────────────
const PRESETS = {
  'Image Classifier': {
    reason: 'CNNs extract spatial features via convolution — ideal for structured image data. Pooling reduces dimensions while preserving dominant features.',
    layers: [
      { type: 'INPUT',  units: 784, label: 'Input (28×28 image)',  activation: '' },
      { type: 'CONV',   units: 32,  label: 'Conv2D (32 filters)',   activation: 'ReLU' },
      { type: 'POOL',   units: 0,   label: 'MaxPooling (2×2)',       activation: '' },
      { type: 'CONV',   units: 64,  label: 'Conv2D (64 filters)',   activation: 'ReLU' },
      { type: 'DENSE',  units: 128, label: 'Dense (128)',            activation: 'ReLU' },
      { type: 'DROPOUT',units: 0,   label: 'Dropout (0.5)',          activation: '' },
      { type: 'OUTPUT', units: 10,  label: 'Output (10 classes)',    activation: 'Softmax' },
    ]
  },
  'Text Sequence': {
    reason: 'LSTM networks handle long-range dependencies in sequences via forget/input/output gates — preventing vanishing gradients common in vanilla RNNs.',
    layers: [
      { type: 'INPUT',  units: 50,  label: 'Input (seq len=50)',     activation: '' },
      { type: 'LSTM',   units: 64,  label: 'LSTM (64 units)',         activation: 'Tanh' },
      { type: 'LSTM',   units: 32,  label: 'LSTM (32 units)',         activation: 'Tanh' },
      { type: 'DENSE',  units: 64,  label: 'Dense (64)',              activation: 'ReLU' },
      { type: 'OUTPUT', units: 1,   label: 'Output (regression)',     activation: 'Linear' },
    ]
  },
  'Tabular Data': {
    reason: 'Multi-layer Perceptrons (dense layers) are the go-to for structured/tabular data — flexible enough to learn non-linear decision boundaries.',
    layers: [
      { type: 'INPUT',  units: 8,   label: 'Input (8 features)',     activation: '' },
      { type: 'DENSE',  units: 64,  label: 'Dense (64)',              activation: 'ReLU' },
      { type: 'DENSE',  units: 32,  label: 'Dense (32)',              activation: 'ReLU' },
      { type: 'DROPOUT',units: 0,   label: 'Dropout (0.3)',           activation: '' },
      { type: 'OUTPUT', units: 1,   label: 'Output (binary)',         activation: 'Sigmoid' },
    ]
  },
};

// ─── Animated Connection Line ─────────────────────────────────────────────────
function FlowLine({ fromColor, toColor, isTraining }) {
  return (
    <div className="flex justify-center items-center h-10 relative w-full overflow-hidden">
      <div className="w-0.5 h-full relative" style={{ background: `linear-gradient(to bottom, ${fromColor}, ${toColor})` }}>
        {isTraining && (
          <motion.div
            className="absolute w-2 h-2 rounded-full left-1/2 -translate-x-1/2"
            style={{ background: toColor, boxShadow: `0 0 8px ${toColor}` }}
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      <ArrowDown size={12} className="absolute bottom-0 text-slate-500" />
    </div>
  );
}

// ─── Single Layer Card ────────────────────────────────────────────────────────
function LayerCard({ layer, index, isTraining, activationStrength, onRemove, onUpdate, total }) {
  const def = LAYER_TYPES[layer.type];
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const glow = isTraining && activationStrength > 0.5
    ? `0 0 28px ${def.glow}, 0 0 8px ${def.glow}`
    : `0 0 12px ${def.glow}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative rounded-2xl border p-4 flex items-center gap-4"
      style={{
        borderColor: def.color + '60',
        background: `linear-gradient(135deg, ${def.color}10, ${def.color}05)`,
        boxShadow: glow,
      }}
    >
      {/* Layer Icon + type badge */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: def.color + '20', border: `1.5px solid ${def.color}60` }}>
        {def.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-white text-sm">{layer.label || def.label}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: def.color + '30', color: def.color }}>
            {def.tag}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {layer.units > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Units:</span>
              <input type="number" value={layer.units} min={1} max={1024}
                onChange={e => onUpdate(index, { units: parseInt(e.target.value) || 1 })}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500" />
            </div>
          )}
          {layer.activation && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Act:</span>
              <select value={layer.activation}
                onChange={e => onUpdate(index, { activation: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-cyan-500">
                {['ReLU','Sigmoid','Tanh','Softmax','Linear'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Activation bar (training visualization) */}
      {isTraining && (
        <div className="flex flex-col items-center gap-1 w-8">
          <div className="w-2 rounded-full" style={{
            height: `${Math.max(8, activationStrength * 48)}px`,
            background: `linear-gradient(to top, ${def.color}, ${def.color}80)`,
            boxShadow: `0 0 8px ${def.color}`,
            transition: 'height 0.4s ease'
          }} />
          <span className="text-[8px] font-mono" style={{ color: def.color }}>{(activationStrength * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* Remove button */}
      {!isFirst && !isLast && (
        <button onClick={() => onRemove(index)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-900/70 border border-red-700 rounded-full flex items-center justify-center text-red-300 hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={10} />
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ModelArchitect() {
  const [layers, setLayers] = useState([
    { type: 'INPUT',  units: 4,  label: 'Input Layer',      activation: '' },
    { type: 'DENSE',  units: 16, label: 'Dense (16)',         activation: 'ReLU' },
    { type: 'OUTPUT', units: 1,  label: 'Output Layer',       activation: 'Sigmoid' },
  ]);

  const [isTraining, setIsTraining]     = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [lossHistory, setLossHistory]   = useState([]);
  const [activations, setActivations]   = useState([]);
  const [preset, setPreset]             = useState(null);
  const [suggestion, setSuggestion]     = useState(null);
  const [addType, setAddType]           = useState('DENSE');
  const [showAddPanel, setShowAddPanel] = useState(false);

  // ── Layer management ────────────────────────────────────────────────────────
  const addLayer = useCallback((type) => {
    const def = LAYER_TYPES[type];
    const newLayer = {
      type,
      units: type === 'POOL' || type === 'DROPOUT' ? 0 : 32,
      label: def.label,
      activation: type === 'DENSE' ? 'ReLU' : type === 'LSTM' || type === 'GRU' ? 'Tanh' : type === 'CONV' ? 'ReLU' : '',
    };
    setLayers(prev => {
      const arr = [...prev];
      arr.splice(arr.length - 1, 0, newLayer); // insert before output
      return arr;
    });
    setShowAddPanel(false);
  }, []);

  const removeLayer = useCallback((index) => {
    setLayers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateLayer = useCallback((index, updates) => {
    setLayers(prev => prev.map((l, i) => i === index ? { ...l, ...updates } : l));
  }, []);

  const applyPreset = useCallback((name) => {
    setPreset(name);
    setSuggestion(PRESETS[name].reason);
    setLayers(PRESETS[name].layers.map(l => ({ ...l })));
    setLossHistory([]);
    setTrainProgress(0);
  }, []);

  // ── Mock training simulation ────────────────────────────────────────────────
  const startTraining = useCallback(async () => {
    setIsTraining(true);
    setLossHistory([]);
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const steps = 40;

    for (let i = 0; i <= steps; i++) {
      setTrainProgress((i / steps) * 100);

      // Simulate activation strengths per layer (decreasing noise over time)
      const noise = 1 - i / steps;
      const acts = layers.map(() => Math.max(0.1, Math.min(1, 0.4 + Math.random() * 0.6 - noise * 0.3)));
      setActivations(acts);

      // Fake loss curve: starts high, decays
      const loss = parseFloat((2.5 * Math.exp(-i / 12) + 0.1 + (Math.random() - 0.5) * 0.2 * noise).toFixed(3));
      setLossHistory(h => [...h, loss]);

      await delay(120);
    }
    setIsTraining(false);
  }, [layers]);

  const totalParams = layers.reduce((acc, l, i) => {
    if (i === 0 || !l.units) return acc;
    const prevUnits = layers[i - 1]?.units || 0;
    if (l.type === 'LSTM') return acc + 4 * (prevUnits + l.units + 1) * l.units;
    if (l.type === 'GRU')  return acc + 3 * (prevUnits + l.units + 1) * l.units;
    if (l.type === 'CONV') return acc + (3 * 3 * prevUnits + 1) * l.units;
    if (l.type === 'DENSE' || l.type === 'OUTPUT') return acc + (prevUnits + 1) * l.units;
    return acc;
  }, 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-6 border-b border-slate-700/50 pb-4">
        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
          <Cpu className="text-violet-400" size={32} />
          <span>Creative Model Architect</span>
          <span className="text-sm font-semibold bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/40">Visual Builder</span>
        </h1>
        <p className="text-slate-400 max-w-4xl text-sm leading-relaxed">
          Design neural networks visually. Every layer glows with its own color identity. Flowing gradient lines show data moving through the network. Click Train to see activations light up in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── CENTER: Visual Architecture Canvas ─────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Preset Selector */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="flex items-center gap-2 text-sm font-bold text-violet-300">
                <Lightbulb size={16}/> Smart Presets:
              </span>
              {Object.keys(PRESETS).map(name => (
                <button key={name} onClick={() => applyPreset(name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${preset === name ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white hover:border-violet-500'}`}>
                  {name}
                </button>
              ))}
              <button onClick={() => setLayers([
                { type: 'INPUT', units: 4, label: 'Input Layer', activation: '' },
                { type: 'DENSE', units: 16, label: 'Dense (16)', activation: 'ReLU' },
                { type: 'OUTPUT', units: 1, label: 'Output Layer', activation: 'Sigmoid' },
              ])} className="ml-auto text-xs text-slate-500 hover:text-red-400 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                Reset
              </button>
            </div>

            {/* Why this architecture */}
            <AnimatePresence>
              {suggestion && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-3 bg-violet-900/20 border border-violet-500/30 rounded-xl p-3 flex gap-2">
                  <Info size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-violet-200 leading-relaxed">{suggestion}</p>
                  <button onClick={() => setSuggestion(null)} className="ml-auto text-slate-500 hover:text-white">✕</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Architecture Canvas */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-6 flex-1 relative group">
            <div className="flex flex-col items-center mx-auto" style={{ maxWidth: '480px' }}>
              <AnimatePresence>
                {layers.map((layer, i) => (
                  <React.Fragment key={i}>
                    <div className="w-full relative group">
                      <LayerCard
                        layer={layer}
                        index={i}
                        isTraining={isTraining}
                        activationStrength={activations[i] || 0}
                        onRemove={removeLayer}
                        onUpdate={updateLayer}
                        total={layers.length}
                      />
                    </div>

                    {i < layers.length - 1 && (
                      <FlowLine
                        fromColor={LAYER_TYPES[layer.type].color}
                        toColor={LAYER_TYPES[layers[i + 1].type].color}
                        isTraining={isTraining}
                      />
                    )}
                  </React.Fragment>
                ))}
              </AnimatePresence>

              {/* Add Layer button */}
              <div className="mt-4 w-full">
                {!showAddPanel ? (
                  <button onClick={() => setShowAddPanel(true)}
                    className="w-full border-2 border-dashed border-slate-600 hover:border-violet-500 text-slate-500 hover:text-violet-300 rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                    <Plus size={18}/> Add Layer (insert before output)
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(LAYER_TYPES).filter(([k]) => k !== 'INPUT' && k !== 'OUTPUT').map(([key, def]) => (
                      <button key={key} onClick={() => addLayer(key)}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-bold transition-all hover:-translate-y-1"
                        style={{ borderColor: def.color + '60', background: def.color + '10', color: def.color }}>
                        <span className="text-lg">{def.icon}</span>
                        <span>{def.label.replace(' Layer','').replace(' Block','')}</span>
                      </button>
                    ))}
                    <button onClick={() => setShowAddPanel(false)} className="col-span-2 sm:col-span-4 text-xs text-slate-500 hover:text-white border border-slate-700 rounded-xl py-2 transition-colors">Cancel</button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Control + Stats Panel ───────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Network Summary */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-violet-400"/> Network Summary
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Total Layers</span>
                <span className="text-violet-300 font-bold">{layers.length}</span>
              </div>
              {layers.map((l, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5" style={{ color: LAYER_TYPES[l.type].color }}>
                    <span>{LAYER_TYPES[l.type].icon}</span>
                    <span>{l.label?.slice(0, 18)}</span>
                  </span>
                  <span className="text-slate-500">{l.units > 0 ? `${l.units}u` : '–'}</span>
                </div>
              ))}
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2 mt-2">
                <span>Est. Parameters</span>
                <span className="text-cyan-300 font-bold">{totalParams.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">🎨 Color Intelligence</h3>
            <div className="space-y-2">
              {[
                ['#38bdf8', 'Input data flowing in'],
                ['#a78bfa', 'Hidden layer processing'],
                ['#f472b6', 'LSTM memory state'],
                ['#34d399', 'Active convolution'],
                ['#fbbf24', 'Pooling / compression'],
                ['#f43f5e', 'Output prediction'],
                ['#94a3b8', 'Dropout regularization'],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Training Control */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-yellow-400"/> Train & Visualize
            </h3>

            <button onClick={startTraining} disabled={isTraining}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50">
              {isTraining ? <><Cpu size={16} className="animate-spin"/> Training...</> : <><Play size={16}/> Start Training</>}
            </button>

            {/* Progress */}
            {(isTraining || lossHistory.length > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress</span>
                  <span className="text-violet-300">{trainProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                    animate={{ width: `${trainProgress}%` }} />
                </div>
              </div>
            )}

            {/* Mini Loss Chart */}
            {lossHistory.length > 1 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Loss Curve</div>
                <div className="h-20 flex items-end gap-0.5 bg-slate-900 border border-slate-700 rounded-lg p-2">
                  {lossHistory.map((loss, i) => {
                    const maxL = Math.max(...lossHistory);
                    const minL = Math.min(...lossHistory);
                    const h = Math.max(4, ((loss - minL) / (maxL - minL || 1)) * 60);
                    // Color: red → yellow → green as loss falls
                    const progress = 1 - (loss - minL) / (maxL - minL || 1);
                    const r = Math.round(244 * (1 - progress));
                    const g = Math.round(63 + (211 - 63) * progress);
                    return (
                      <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}px` }}
                        className="flex-1 rounded-sm min-w-[2px]"
                        style={{ background: `rgb(${r},${g},94)` }} />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>Loss: {lossHistory[lossHistory.length-1]?.toFixed(3)}</span>
                  <span className="text-green-400">↓ {(((lossHistory[0] - lossHistory[lossHistory.length-1]) / lossHistory[0]) * 100).toFixed(1)}% drop</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
