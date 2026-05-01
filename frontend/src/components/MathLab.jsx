import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ChevronRight, ChevronLeft, BookOpen, Zap, Brain, RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

// ─── Core Math Engine ───────────────────────────────────────────────────────

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const sigmoidDeriv = (a) => a * (1 - a);
const tanh = (z) => Math.tanh(z);
const tanhDeriv = (a) => 1 - a * a;
const relu = (z) => Math.max(0, z);
const reluDeriv = (z) => (z > 0 ? 1 : 0);

const activateFn = (z, fn) => {
  if (fn === 'Sigmoid') return sigmoid(z);
  if (fn === 'Tanh') return tanh(z);
  if (fn === 'ReLU') return relu(z);
  return z;
};

const activateDerivFn = (a, z, fn) => {
  if (fn === 'Sigmoid') return sigmoidDeriv(a);
  if (fn === 'Tanh') return tanhDeriv(a);
  if (fn === 'ReLU') return reluDeriv(z);
  return 1;
};

const randomW = () => parseFloat((Math.random() * 2 - 1).toFixed(3));

// ─── Generate a practice quiz question ───────────────────────────────────────

const generateQuestion = (activation) => {
  const x1 = parseFloat((Math.random() * 2).toFixed(2));
  const x2 = parseFloat((Math.random() * 2).toFixed(2));
  const w1 = parseFloat((Math.random() * 2 - 1).toFixed(2));
  const w2 = parseFloat((Math.random() * 2 - 1).toFixed(2));
  const b  = parseFloat((Math.random() * 0.5).toFixed(2));
  const z  = parseFloat((x1 * w1 + x2 * w2 + b).toFixed(4));
  const a  = parseFloat(activateFn(z, activation).toFixed(4));
  return { x1, x2, w1, w2, b, z, a, activation };
};

// ─── Step Panel ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Inputs',        color: 'text-cyan-300',   border: 'border-cyan-500/50'   },
  { id: 1, label: 'Weights × X',   color: 'text-yellow-300', border: 'border-yellow-500/50' },
  { id: 2, label: 'Summation z',   color: 'text-orange-300', border: 'border-orange-500/50' },
  { id: 3, label: 'Activation a',  color: 'text-green-300',  border: 'border-green-500/50'  },
  { id: 4, label: 'Loss',          color: 'text-red-300',    border: 'border-red-500/50'    },
  { id: 5, label: 'Gradient ∂L/∂z',color: 'text-purple-300', border: 'border-purple-500/50' },
  { id: 6, label: 'Weight Update', color: 'text-pink-300',   border: 'border-pink-500/50'   },
];

// ─── Theory Data per Tab ──────────────────────────────────────────────────────

const THEORY = {
  ANN: {
    beginner: "An Artificial Neural Network (ANN) is like a team of tiny calculators, each called a Neuron. You feed it numbers, it multiplies by weights (importance scores), adds them all up, and passes through an activation function — just like how you decide to act based on how strongly you feel about something.",
    math: [
      "Forward: z = W·X + b",
      "Activation: a = σ(z)",
      "Loss (MSE): L = ½(y - a)²",
      "Backprop: ∂L/∂z = (a - y) · σ'(z)",
      "Update: W ← W - α · ∂L/∂W",
    ],
    intuition: "Weights act as the importance of each input. Training adjusts those weights using the chain rule so that the output gradually matches the expected answer. The learning rate α controls the size of each step downhill on the loss landscape."
  },
  CNN: {
    beginner: "A Convolutional Neural Network scans an image using a small filter (like a flashlight) and computes how much each region matches the feature it learned — e.g., edges, shapes, corners.",
    math: [
      "Convolution: (I ★ K)[i,j] = Σₘ Σₙ I[i+m, j+n]·K[m,n]",
      "Max Pooling: out = max(region)",
      "Activation applied after each conv: a = ReLU(z)",
    ],
    intuition: "By sliding a learned kernel (K) across the image we produce a 'feature map' — a new representation highlighting specific patterns. Deeper layers stack these to detect complex shapes."
  },
  RNN: {
    beginner: "A Recurrent Neural Network has a hidden 'memory' state that it carries forward from one time step to the next — like remembering the context of a sentence while you read it.",
    math: [
      "Hidden state: hₜ = tanh(Wₕ·hₜ₋₁ + Wₓ·xₜ + b)",
      "Output: yₜ = Wᵧ·hₜ",
      "LSTM Cell: cₜ = fₜ⊙cₜ₋₁ + iₜ⊙g̃ₜ",
      "LSTM Hidden: hₜ = oₜ⊙tanh(cₜ)",
      "Forget gate: fₜ = σ(Wf·[hₜ₋₁, xₜ] + bf)",
    ],
    intuition: "The vanishing gradient problem occurs when gradients shrink exponentially as they pass back through time steps during BPTT. LSTM solves this using gating mechanisms (forget, input, output gates) that learn what to remember."
  },
  Hopfield: {
    beginner: "A Hopfield Network works like a magnet: patterns are stored in its weights, and when you give it a noisy version, it rolls downhill to the nearest stored pattern.",
    math: [
      "Hebbian weights: W = (1/N) · Σ xᵘ(xᵘ)ᵀ  (diag = 0)",
      "Energy: E = -½ · sᵀWs",
      "Update rule: sᵢ = sign(Σⱼ Wᵢⱼ · sⱼ)",
    ],
    intuition: "Training the weight matrix is a one-shot process (no gradient needed). During recall, neurons are updated asynchronously until the energy E can no longer decrease — the network has found an attractor (stored memory)."
  }
};

export default function MathLab() {
  // ── Configuration ──────────────────────────────────────────────────────────
  const [x1, setX1] = useState(0.5);
  const [x2, setX2] = useState(1.0);
  const [w1, setW1] = useState(0.4);
  const [w2, setW2] = useState(0.6);
  const [bias, setBias] = useState(0.1);
  const [lr, setLr] = useState(0.1);
  const [target, setTarget] = useState(0.8);
  const [activation, setActivation] = useState('Sigmoid');
  const [weightMode, setWeightMode] = useState('Random'); // 'Random' | 'Custom'

  // ── Stepper ────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Theory panel ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('ANN');
  const [theoryMode, setTheoryMode] = useState('beginner');

  // ── Practice quiz ──────────────────────────────────────────────────────────
  const [quiz, setQuiz] = useState(() => generateQuestion('Sigmoid'));
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizResult, setQuizResult] = useState(null); // null | 'correct' | 'wrong'

  // ── Derived math ───────────────────────────────────────────────────────────
  const z = parseFloat((x1 * w1 + x2 * w2 + bias).toFixed(4));
  const a = parseFloat(activateFn(z, activation).toFixed(4));
  const loss = parseFloat((0.5 * Math.pow(target - a, 2)).toFixed(4));
  const dLda = parseFloat((a - target).toFixed(4));
  const dadz = parseFloat(activateDerivFn(a, z, activation).toFixed(4));
  const dLdz = parseFloat((dLda * dadz).toFixed(4));
  const dLdw1 = parseFloat((dLdz * x1).toFixed(4));
  const dLdw2 = parseFloat((dLdz * x2).toFixed(4));
  const w1_new = parseFloat((w1 - lr * dLdw1).toFixed(4));
  const w2_new = parseFloat((w2 - lr * dLdw2).toFixed(4));
  const b_new  = parseFloat((bias - lr * dLdz).toFixed(4));

  const stepContent = [
    {
      title: 'Step 1 — Inputs',
      formula: `X = [${x1}, ${x2}]   W = [${w1}, ${w2}]   b = ${bias}`,
      explanation: 'These are the raw input features and the current weights & bias. Weights determine how much each input contributes to the output.'
    },
    {
      title: 'Step 2 — Weighted Products',
      formula: `w₁·x₁ = ${w1} × ${x1} = ${(w1*x1).toFixed(4)}\nw₂·x₂ = ${w2} × ${x2} = ${(w2*x2).toFixed(4)}`,
      explanation: 'Each input is scaled by its weight. A large positive weight amplifies the input; negative weights invert its effect.'
    },
    {
      title: 'Step 3 — Summation z',
      formula: `z = ${(w1*x1).toFixed(4)} + ${(w2*x2).toFixed(4)} + ${bias} = ${z}`,
      explanation: 'The weighted sum z is called the "pre-activation" or "net input". It is a linear combination of inputs before the non-linearity is applied.'
    },
    {
      title: 'Step 4 — Activation a',
      formula: activation === 'Sigmoid' ? `a = σ(${z}) = 1 / (1 + e^-${z}) = ${a}` :
               activation === 'Tanh'    ? `a = tanh(${z}) = ${a}` :
                                          `a = ReLU(${z}) = max(0, ${z}) = ${a}`,
      explanation: `The ${activation} function squashes z into a useful range. Sigmoid → (0,1), Tanh → (-1,1), ReLU → (0,∞). This non-linearity is what makes neural networks powerful.`
    },
    {
      title: 'Step 5 — Loss L',
      formula: `Target y = ${target}\nL = ½(y - a)² = ½(${target} - ${a})² = ${loss}`,
      explanation: 'Mean-Squared Error loss measures how far off our prediction is. We want to minimize L — that drives learning.'
    },
    {
      title: 'Step 6 — Gradients (Chain Rule)',
      formula: `∂L/∂a = (a - y) = ${dLda}\n${activation}'(z) = ${dadz}\n∂L/∂z = ${dLda} × ${dadz} = ${dLdz}\n∂L/∂w₁= ${dLdz}×${x1} = ${dLdw1}\n∂L/∂w₂= ${dLdz}×${x2} = ${dLdw2}`,
      explanation: 'Via chain rule, we propagate error backwards. The gradient tells each weight which direction to move to reduce loss.'
    },
    {
      title: 'Step 7 — Weight Update (α=' + lr + ')',
      formula: `w₁: ${w1} − ${lr}×${dLdw1} = ${w1_new}\nw₂: ${w2} − ${lr}×${dLdw2} = ${w2_new}\nb:  ${bias} − ${lr}×${dLdz}  = ${b_new}`,
      explanation: `Gradient Descent nudges each weight slightly downhill on the loss surface. After applying these updates, run a new forward pass — the loss should be lower!`
    }
  ];

  // Autoplay stepper
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= STEPS.length - 1) { setIsPlaying(false); return; }
    const timer = setTimeout(() => setCurrentStep(s => s + 1), 1800);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const randomizeWeights = () => {
    setW1(randomW()); setW2(randomW()); setBias(parseFloat((Math.random() * 0.4).toFixed(3)));
  };

  const applyUpdatedWeights = () => {
    setW1(w1_new); setW2(w2_new); setBias(b_new);
  };

  const checkQuizAnswer = () => {
    const userAns = parseFloat(parseFloat(quizAnswer).toFixed(4));
    const correct = parseFloat(quiz.a.toFixed(4));
    setQuizResult(Math.abs(userAns - correct) < 0.01 ? 'correct' : 'wrong');
  };

  const refreshQuiz = () => {
    setQuiz(generateQuestion(activation));
    setQuizAnswer('');
    setQuizResult(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="mb-6 border-b border-slate-700/50 pb-4">
        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center space-x-3">
          <Calculator className="text-orange-400" size={32} />
          <span>Mathematical Intelligence Lab</span>
        </h1>
        <p className="text-slate-400 max-w-4xl text-sm leading-relaxed">
          The complete numeric workbench: step-by-step forward &amp; backward pass, live weight customization, theory panels, and a practice quiz system across ANN, CNN, RNN, and Hopfield networks.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT: Step-by-Step Solver ───────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* Config Row */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5">
            <div className="flex flex-wrap gap-4 items-end justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="text-orange-400" size={20}/> Numerical Solver — ANN Forward + Backprop
              </h3>

              {/* Mode Toggle */}
              <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden text-sm">
                {['Random', 'Custom'].map(m => (
                  <button key={m}
                    onClick={() => { setWeightMode(m); if (m === 'Random') randomizeWeights(); }}
                    className={`px-4 py-2 font-semibold transition-colors ${weightMode === m ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >{m} Weights</button>
                ))}
              </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              {[
                { label: 'x₁', val: x1, set: setX1, color: 'border-cyan-500' },
                { label: 'x₂', val: x2, set: setX2, color: 'border-cyan-500' },
                { label: 'w₁', val: w1, set: setW1, color: 'border-yellow-500', disabled: weightMode === 'Random' },
                { label: 'w₂', val: w2, set: setW2, color: 'border-yellow-500', disabled: weightMode === 'Random' },
                { label: 'b',  val: bias, set: setBias, color: 'border-orange-500', disabled: weightMode === 'Random' },
                { label: 'Target y', val: target, set: setTarget, color: 'border-green-500' },
              ].map(({ label, val, set, color, disabled }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">{label}</label>
                  <input type="number" step="0.01"
                    value={val}
                    onChange={e => !disabled && set(parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className={`w-full bg-slate-900 border ${color} text-white text-center py-2 rounded-lg font-mono text-sm focus:outline-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'focus:ring-1 focus:ring-orange-500'}`}
                  />
                </div>
              ))}
            </div>

            {/* Activation + LR */}
            <div className="flex flex-wrap gap-4 mt-4 items-end">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Activation</label>
                <select value={activation} onChange={e => setActivation(e.target.value)}
                  className="bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500">
                  <option>Sigmoid</option><option>Tanh</option><option>ReLU</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Learning Rate α = {lr}</label>
                <input type="range" min="0.01" max="0.5" step="0.01" value={lr} onChange={e => setLr(parseFloat(e.target.value))}
                  className="w-40 accent-orange-500" />
              </div>
              <button onClick={randomizeWeights}
                className="ml-auto flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
                <RefreshCcw size={14}/> Randomize W
              </button>
            </div>
          </div>

          {/* Step Navigator */}
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4">
            {/* Step Pills */}
            <div className="flex flex-wrap gap-2">
              {STEPS.map(s => (
                <button key={s.id}
                  onClick={() => { setCurrentStep(s.id); setIsPlaying(false); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${currentStep === s.id ? `${s.color} ${s.border} bg-slate-800 shadow-lg` : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
                >
                  {s.id + 1}. {s.label}
                </button>
              ))}
            </div>

            {/* Active Step Card */}
            <AnimatePresence mode="wait">
              <motion.div key={currentStep}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className={`bg-slate-900 border ${STEPS[currentStep].border} rounded-xl p-5`}
              >
                <h4 className={`text-base font-bold ${STEPS[currentStep].color} mb-3`}>
                  {stepContent[currentStep].title}
                </h4>
                <pre className="font-mono text-sm text-white bg-black/30 rounded-lg p-4 mb-4 whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {stepContent[currentStep].formula}
                </pre>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {stepContent[currentStep].explanation}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors text-sm">Reset</button>
              <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft size={18}/>
              </button>
              <button onClick={() => setIsPlaying(p => !p)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${isPlaying ? 'bg-orange-700 text-white' : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500'}`}>
                {isPlaying ? '⏸ Pause' : '▶ Auto-Play'}
              </button>
              <button onClick={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={currentStep === STEPS.length - 1}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight size={18}/>
              </button>
              {currentStep === STEPS.length - 1 && (
                <button onClick={applyUpdatedWeights}
                  className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Apply Updates →
                </button>
              )}
            </div>
          </div>

          {/* ── Practice Quiz ─────────────────────────────────────────────── */}
          <div className="glass-panel border border-purple-500/30 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
              ✍️ Practice — Numerical Quiz
            </h3>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-sm text-white mb-4">
              Given: x₁={quiz.x1}, x₂={quiz.x2}, w₁={quiz.w1}, w₂={quiz.w2}, b={quiz.b}, Activation: {quiz.activation}<br/>
              <br/>
              <span className="text-yellow-300">
                z = {quiz.x1}×{quiz.w1} + {quiz.x2}×{quiz.w2} + {quiz.b} = {quiz.z}
              </span><br/>
              <span className="text-purple-300 font-bold">Q: What is the activation output a = {quiz.activation.toLowerCase()}(z)?</span>
            </div>

            <div className="flex gap-3">
              <input type="number" step="0.0001" value={quizAnswer}
                onChange={e => setQuizAnswer(e.target.value)}
                placeholder="Your answer..."
                className="flex-1 bg-slate-900 border border-slate-600 text-white px-4 py-2 rounded-lg font-mono text-sm focus:outline-none focus:border-purple-500"
              />
              <button onClick={checkQuizAnswer}
                className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors">
                Check
              </button>
              <button onClick={refreshQuiz}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
                <RefreshCcw size={16}/>
              </button>
            </div>

            <AnimatePresence>
              {quizResult && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl border text-sm font-semibold flex items-center gap-3 ${quizResult === 'correct' ? 'border-green-500/50 bg-green-900/20 text-green-300' : 'border-red-500/50 bg-red-900/20 text-red-300'}`}>
                  {quizResult === 'correct' ? <><CheckCircle size={18}/> Correct! a = {quiz.a}</> : <><XCircle size={18}/> Not quite. Correct answer: a = {quiz.a}. Step through the solver above to see why!</>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: Theory Panel ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4 flex-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="text-blue-400" size={20}/> Concept Library
            </h3>

            {/* Network Tabs */}
            <div className="grid grid-cols-2 gap-2">
              {['ANN', 'CNN', 'RNN', 'Hopfield'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${activeTab === tab ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Mode Buttons */}
            <div className="flex gap-2">
              {[['beginner','🧒 Beginner'], ['math','📐 Math'], ['intuition','💡 Intuition']].map(([mode, label]) => (
                <button key={mode} onClick={() => setTheoryMode(mode)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${theoryMode === mode ? 'bg-slate-700 border-slate-500 text-white' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`${activeTab}-${theoryMode}`}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="flex-1"
              >
                {theoryMode === 'math' ? (
                  <div className="space-y-2">
                    {THEORY[activeTab].math.map((formula, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-xs text-yellow-300">
                        {formula}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                    {theoryMode === 'beginner' ? THEORY[activeTab].beginner : THEORY[activeTab].intuition}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Live Output Summary ─────────────────────────────────────────── */}
          <div className="glass-panel border border-orange-500/20 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-orange-300 mb-3">📊 Live Computation Summary</h3>
            <div className="space-y-2 font-mono text-xs">
              {[
                ['z (pre-activation)', z, 'text-orange-300'],
                ['a (output)', a, 'text-green-300'],
                ['L (loss)', loss, 'text-red-300'],
                ['∂L/∂z', dLdz, 'text-purple-300'],
                ['∂L/∂w₁', dLdw1, 'text-yellow-300'],
                ['∂L/∂w₂', dLdw2, 'text-yellow-300'],
                ['w₁ → updated', w1_new, 'text-pink-300'],
                ['w₂ → updated', w2_new, 'text-pink-300'],
                ['b  → updated', b_new, 'text-pink-300'],
              ].map(([label, val, col]) => (
                <div key={label} className="flex justify-between items-center border-b border-slate-800 pb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-bold ${col}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
