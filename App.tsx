
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calculator as CalcIcon, 
  History as HistoryIcon, 
  LineChart, 
  Cpu, 
  Settings, 
  Delete,
  ChevronRight,
  Send,
  Sparkles,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculation, TabType, GraphPoint } from './types';
import { getMathExplanation, solveComplexQuery } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<Calculation[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [graphData, setGraphData] = useState<GraphPoint[]>([]);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll AI response
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiResponse, isAiLoading]);

  // Safe Math Calculation
  const calculate = useCallback(() => {
    try {
      if (display === 'Error' || !display) return;
      
      // Pre-processing the string for eval
      let sanitized = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/\^/g, '**');

      // Handle percentages: replace "number%" with "(number/100)"
      sanitized = sanitized.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

      // Evaluate
      const resultValue = eval(sanitized);
      
      if (isNaN(resultValue) || !isFinite(resultValue)) {
        throw new Error("Invalid Output");
      }

      const resultStr = Number(resultValue.toFixed(8)).toString();
      
      const newCalc: Calculation = {
        id: Date.now().toString(),
        expression: display,
        result: resultStr,
        timestamp: Date.now()
      };

      setHistory(prev => [newCalc, ...prev].slice(0, 20));
      setEquation(display + ' =');
      setDisplay(resultStr);

      const x = Date.now();
      if (!isNaN(resultValue)) {
        setGraphData(prev => [...prev, { x, y: resultValue }].slice(-20));
      }
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  }, [display]);

  const handleInput = (val: string) => {
    setDisplay(prev => {
      if (prev === 'Error' || (prev === '0' && !['.', '+', '-', '×', '÷', '^', '%'].includes(val))) {
        if (['sin(', 'cos(', 'sqrt(', 'log('].includes(val)) return val;
        return val;
      }
      
      // Prevent double operators
      const lastChar = prev.slice(-1);
      const operators = ['+', '-', '×', '÷', '^', '.', '%'];
      if (operators.includes(lastChar) && operators.includes(val)) {
        return prev.slice(0, -1) + val;
      }

      if (prev.length > 25) return prev;
      return prev + val;
    });
    setEquation('');
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };
  
  const backspace = () => {
    setDisplay(prev => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      // Handle multi-char functions like sin(
      if (prev.endsWith('sin(') || prev.endsWith('cos(') || prev.endsWith('tan(') || prev.endsWith('log(')) {
        return prev.slice(0, -4) || '0';
      }
      if (prev.endsWith('sqrt(')) {
        return prev.slice(0, -5) || '0';
      }
      return prev.slice(0, -1);
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    setActiveTab('ai');
    const res = await solveComplexQuery(aiInput);
    setAiResponse(res || "The AI could not process this request.");
    setIsAiLoading(false);
    setAiInput('');
  };

  const explainCurrent = async () => {
    if (display === '0' || display === 'Error') return;
    setIsAiLoading(true);
    setActiveTab('ai');
    const res = await getMathExplanation(display, "Current Output");
    setAiResponse(res || "Explanation failed.");
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-[100dvh] grid-bg relative overflow-hidden flex flex-col items-center justify-center p-0 sm:p-4 transition-all duration-500">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <main className="w-full max-w-4xl h-[100dvh] sm:h-[90vh] sm:max-h-[850px] glass rounded-none sm:rounded-3xl overflow-hidden flex flex-col border-0 sm:border border-cyan-500/30 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Header */}
        <header className="h-12 sm:h-14 border-b border-cyan-500/20 flex items-center justify-between px-4 sm:px-6 bg-slate-900/80 backdrop-blur-xl z-10 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            </div>
            <span className="ml-2 sm:ml-4 font-orbitron text-[10px] sm:text-xs tracking-[0.2em] text-cyan-400 neon-text-cyan flex items-center gap-2">
              <Cpu size={12} className="animate-spin-slow" />
              NOVA_CORE_v2.5
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={copyToClipboard}
              className={`p-2 rounded-lg transition-all ${copied ? 'text-green-400 bg-green-500/10' : 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
              title="Copy result"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button className="text-cyan-400/60 hover:text-cyan-400 transition-colors p-2">
              <Settings size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
          {/* Sidebar / Bottom Nav */}
          <nav className="order-last md:order-first w-full md:w-20 lg:w-24 border-t md:border-t-0 md:border-r border-cyan-500/20 flex flex-row md:flex-col items-center justify-around md:justify-center py-3 md:py-8 gap-2 md:gap-10 bg-slate-950/40 backdrop-blur-md z-10">
            <NavIcon active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} icon={<CalcIcon size={22} />} label="Calc" />
            <NavIcon active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} icon={<LineChart size={22} />} label="Graph" />
            <NavIcon active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Sparkles size={22} />} label="A.I." />
            <NavIcon active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<HistoryIcon size={22} />} label="History" />
          </nav>

          {/* Main Content View */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-6 relative bg-gradient-to-br from-transparent to-slate-900/20">
            
            {activeTab === 'calculator' && (
              <div className="flex-1 flex flex-col gap-4 sm:gap-6 animate-in fade-in zoom-in-95 duration-500">
                {/* Visual Feedback Display */}
                <div className="h-32 sm:h-44 glass rounded-2xl flex flex-col justify-end items-end px-5 sm:px-8 py-4 sm:py-6 border border-cyan-500/30 relative group overflow-hidden transition-all duration-300 hover:border-cyan-400/50 shadow-inner">
                  <div className="absolute top-3 left-6 text-[8px] sm:text-[10px] text-cyan-400/40 font-orbitron tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                    Processor_Load: 4.2%
                  </div>
                  
                  <div className="text-cyan-500/40 text-sm sm:text-base font-medium h-6 mb-1 overflow-hidden font-orbitron text-right w-full tracking-wider opacity-60">
                    {equation || (history[0] ? `${history[0].expression}` : 'Ready for input_')}
                  </div>
                  
                  <div className="text-4xl sm:text-6xl font-orbitron text-white neon-text-cyan truncate max-w-full leading-none tracking-tight">
                    {display}
                    <span className="w-1 h-8 sm:h-12 bg-cyan-400/50 inline-block animate-pulse ml-1 align-middle"></span>
                  </div>

                  <button 
                    onClick={explainCurrent}
                    className="absolute top-4 right-4 text-cyan-500/30 hover:text-cyan-400 transition-all flex items-center gap-2 text-[9px] font-orbitron group/btn"
                  >
                    <Info size={14} className="group-hover/btn:rotate-12 transition-transform" /> 
                    <span className="hidden xs:inline tracking-widest bg-cyan-500/5 px-2 py-1 rounded border border-cyan-500/10 group-hover/btn:border-cyan-400/40">AI_ANALYZE</span>
                  </button>
                  
                  {/* Decorative Scanline */}
                  <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,128,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                </div>

                {/* Enhanced Button Grid */}
                <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 pb-2 select-none overflow-y-auto pr-1">
                  {/* Row 1: Scientific Functions (Visible on Desktop/Large mobile) */}
                  <div className="col-span-4 sm:col-span-5 grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                    <CalcButton label="sin" onClick={() => handleInput('sin(')} color="cyan-ghost" small />
                    <CalcButton label="cos" onClick={() => handleInput('cos(')} color="cyan-ghost" small />
                    <CalcButton label="sqrt" onClick={() => handleInput('sqrt(')} color="cyan-ghost" small />
                    <CalcButton label="log" onClick={() => handleInput('log(')} color="cyan-ghost" small />
                    <CalcButton label="^" onClick={() => handleInput('^')} color="cyan-ghost" small className="hidden sm:flex" />
                  </div>

                  {/* Main Grid Body */}
                  <CalcButton label="AC" color="pink" onClick={clear} />
                  <CalcButton label={<Delete size={20} />} color="pink" onClick={backspace} />
                  <CalcButton label="%" onClick={() => handleInput('%')} color="cyan-ghost" />
                  <CalcButton label="÷" color="cyan" onClick={() => handleInput('÷')} />
                  <CalcButton label="π" onClick={() => handleInput('π')} color="cyan-ghost" className="hidden sm:flex" />

                  <CalcButton label="7" onClick={() => handleInput('7')} />
                  <CalcButton label="8" onClick={() => handleInput('8')} />
                  <CalcButton label="9" onClick={() => handleInput('9')} />
                  <CalcButton label="×" color="cyan" onClick={() => handleInput('×')} />
                  <CalcButton label="(" onClick={() => handleInput('(')} color="cyan-ghost" className="hidden sm:flex" />

                  <CalcButton label="4" onClick={() => handleInput('4')} />
                  <CalcButton label="5" onClick={() => handleInput('5')} />
                  <CalcButton label="6" onClick={() => handleInput('6')} />
                  <CalcButton label="-" color="cyan" onClick={() => handleInput('-')} />
                  <CalcButton label=")" onClick={() => handleInput(')')} color="cyan-ghost" className="hidden sm:flex" />

                  <CalcButton label="1" onClick={() => handleInput('1')} />
                  <CalcButton label="2" onClick={() => handleInput('2')} />
                  <CalcButton label="3" onClick={() => handleInput('3')} />
                  <CalcButton label="+" color="cyan" onClick={() => handleInput('+')} />
                  <CalcButton label="e" onClick={() => handleInput('e')} color="cyan-ghost" className="hidden sm:flex" />

                  <CalcButton label="0" span={2} onClick={() => handleInput('0')} />
                  <CalcButton label="." onClick={() => handleInput('.')} />
                  <CalcButton label="=" color="cyan-filled" onClick={calculate} />
                  <CalcButton label="ANS" onClick={() => handleInput(history[0]?.result || '0')} color="cyan-ghost" className="hidden sm:flex" />
                </div>
              </div>
            )}

            {activeTab === 'graph' && (
              <div className="flex-1 flex flex-col gap-4 sm:gap-6 animate-in fade-in slide-in-from-left-6 duration-500 overflow-hidden">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-orbitron text-cyan-400 neon-text-cyan tracking-widest">DATA_VISUALIZER</h2>
                  <div className="flex items-center gap-2 text-[10px] text-cyan-500/60 uppercase tracking-widest bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> SYSTEM_LIVE
                  </div>
                </div>
                <div className="flex-1 glass rounded-3xl border border-cyan-500/20 p-4 sm:p-6 shadow-2xl overflow-hidden min-h-0 relative">
                  {graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={graphData}>
                        <defs>
                          <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.05)" vertical={false} />
                        <XAxis dataKey="x" hide />
                        <YAxis stroke="rgba(34, 211, 238, 0.2)" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(34, 211, 238, 0.4)', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: 'Orbitron' }}
                          itemStyle={{ color: '#22d3ee', fontSize: '12px' }}
                          labelStyle={{ display: 'none' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="y" 
                          stroke="#22d3ee" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }} 
                          activeDot={{ r: 8, fill: '#fff', stroke: '#22d3ee', strokeWidth: 2 }}
                          animationDuration={1000}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-cyan-500/20 gap-4 text-center p-8">
                      <div className="relative">
                        <LineChart size={64} className="opacity-40 animate-pulse" />
                        <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-10"></div>
                      </div>
                      <p className="font-orbitron text-xs tracking-[0.3em] uppercase opacity-60">Initializing Neural Mapping System...</p>
                      <p className="text-[10px] max-w-xs text-slate-500">Perform calculations in the main matrix to generate data points for visualization.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-6 duration-500 h-full overflow-hidden">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-pink-400 animate-pulse" />
                    <h2 className="text-xl font-orbitron text-pink-400 neon-text-pink tracking-widest uppercase">Nova AI Core</h2>
                  </div>
                  <div className="text-[8px] font-orbitron text-pink-500/50 tracking-[0.2em] bg-pink-500/5 px-2 py-1 rounded border border-pink-500/10">MOD_GEMINI_3_PRO</div>
                </div>
                
                <div 
                  ref={scrollRef}
                  className="flex-1 glass rounded-3xl border border-pink-500/20 p-5 sm:p-8 overflow-y-auto space-y-5 scroll-smooth custom-scrollbar bg-slate-950/20"
                >
                  {aiResponse ? (
                    <div className="text-slate-300 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2 duration-700">
                      {aiResponse.split('\n').map((line, i) => {
                        if (!line.trim()) return <div key={i} className="h-4" />;
                        
                        const isHeader = line.startsWith('#') || (line.includes(':') && line.length < 50);
                        return (
                          <p key={i} className={`${isHeader ? 'text-pink-400 font-orbitron mb-2 mt-4 first:mt-0 text-sm tracking-widest border-l-2 border-pink-500/30 pl-3' : 'mb-3 text-sm sm:text-base opacity-90'}`}>
                            {line.replace(/^#+\s*/, '')}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-pink-500/20 gap-6 text-center">
                      <div className="relative">
                        <Cpu size={72} className="opacity-20 animate-spin-slow" />
                        <div className="absolute inset-0 bg-pink-400 blur-3xl opacity-10"></div>
                      </div>
                      <div>
                        <p className="font-orbitron text-xs mb-2 uppercase tracking-[0.4em] text-pink-400/60">Neural Network Standby</p>
                        <p className="text-[10px] sm:text-xs max-w-[280px] opacity-40 mx-auto font-medium">Query the quantum core for theoretical explanations, formula derivation, or complex problem-solving strategies.</p>
                      </div>
                    </div>
                  )}
                  
                  {isAiLoading && (
                    <div className="flex flex-col gap-3 py-6 items-center sm:items-start">
                      <div className="flex items-center gap-4 text-pink-400 animate-pulse">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        <span className="text-[10px] uppercase font-orbitron tracking-[0.3em]">Synapse_Processing...</span>
                      </div>
                      <div className="h-1.5 w-full max-w-[200px] bg-pink-500/10 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-400/50 w-full animate-shimmer"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-16 flex gap-3 flex-shrink-0 group">
                  <input 
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiAsk()}
                    placeholder="Enter query into neural interface..."
                    className="flex-1 glass rounded-2xl px-6 border border-pink-500/30 text-white text-sm sm:text-base placeholder-pink-500/20 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-500/50 transition-all duration-300 shadow-inner"
                  />
                  <button 
                    onClick={handleAiAsk}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="w-16 glass border border-pink-500/30 rounded-2xl flex items-center justify-center text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 transition-all duration-300 disabled:opacity-20 disabled:pointer-events-none group-hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/5"
                  >
                    <Send size={20} className={isAiLoading ? 'animate-ping' : ''} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="flex-1 flex flex-col gap-4 sm:gap-6 animate-in fade-in slide-in-from-top-6 duration-500 overflow-hidden">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-orbitron text-cyan-400 neon-text-cyan tracking-widest">MEMORY_ARCHIVE</h2>
                  <button 
                    onClick={() => setHistory([])}
                    className="text-[9px] font-orbitron text-red-400/40 hover:text-red-400 transition-colors uppercase tracking-widest border border-red-500/10 px-2 py-1 rounded"
                  >
                    Purge_All
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar min-h-0">
                  {history.length > 0 ? history.map((calc) => (
                    <div 
                      key={calc.id} 
                      onClick={() => { setDisplay(calc.result); setActiveTab('calculator'); setEquation(calc.expression + ' ='); }} 
                      className="glass p-4 rounded-2xl border border-cyan-500/10 group hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all cursor-pointer flex justify-between items-center active:scale-[0.98] shadow-md"
                    >
                      <div className="flex-1">
                        <div className="text-[9px] text-cyan-400/40 font-orbitron mb-1 tracking-widest flex items-center gap-2">
                          <HistoryIcon size={10} />
                          {new Date(calc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-slate-400 text-sm sm:text-base font-medium opacity-80 mb-1">{calc.expression}</div>
                        <div className="text-cyan-400 font-orbitron text-lg sm:text-2xl font-bold tracking-tight">
                          <span className="opacity-50 text-base mr-2">=</span>{calc.result}
                        </div>
                      </div>
                      <div className="bg-cyan-500/10 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                        <ChevronRight size={20} className="text-cyan-400" />
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-cyan-500/10 gap-6 py-20">
                      <div className="relative">
                        <HistoryIcon size={64} className="opacity-40 animate-pulse" />
                        <div className="absolute inset-0 bg-cyan-400 blur-3xl opacity-5"></div>
                      </div>
                      <p className="font-orbitron text-xs tracking-[0.5em] uppercase opacity-40">Zero Logs Retained</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <footer className="h-8 border-t border-cyan-500/10 flex items-center justify-between px-6 bg-slate-950/90 text-[8px] sm:text-[9px] font-orbitron tracking-[0.3em] text-cyan-500/40 flex-shrink-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-glow shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span> NODE_ACTIVE</span>
            <span className="hidden sm:inline opacity-60">LINK: QUANTUM_SECURE</span>
            <span className="hidden sm:inline opacity-60">REGION: NORTH_CORE</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <span className="flex items-center gap-1.5">CPU_TEMP: <span className="text-cyan-400">32.4°C</span></span>
            <span className="flex items-center gap-1.5 hidden xs:flex">THROUGHPUT: <span className="text-cyan-400">1.2 TB/S</span></span>
            <span className="text-cyan-400/60 uppercase">E_VERSION: 2.5.0_ALPHA</span>
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.3);
        }
      `}</style>
    </div>
  );
};

// Nav Link Component
const NavIcon: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all group relative ${active ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-400/60'}`}
  >
    {active && (
      <div className="absolute -left-1 md:left-auto md:-top-1 w-full h-0.5 md:h-full md:w-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] rounded-full hidden sm:block"></div>
    )}
    <div className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-500 ${active ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-110' : 'border-transparent group-hover:bg-slate-800/50'}`}>
      {icon}
    </div>
    <span className={`text-[8px] sm:text-[9px] font-orbitron font-bold uppercase tracking-[0.2em] transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1 md:opacity-0 group-hover:opacity-100 group-hover:translate-y-0'}`}>
      {label}
    </span>
  </button>
);

// Calculation Button Component
const CalcButton: React.FC<{ label: React.ReactNode, onClick: () => void, color?: 'cyan' | 'pink' | 'cyan-filled' | 'cyan-ghost', span?: number, small?: boolean, className?: string }> = ({ label, onClick, color, span = 1, small = false, className = '' }) => {
  const baseClasses = `
    flex items-center justify-center rounded-2xl font-orbitron transition-all duration-300 
    border select-none relative overflow-hidden group/btn shadow-lg
    ${small ? 'text-xs sm:text-sm min-h-[40px] py-2' : 'text-xl min-h-[60px]'}
  `;
  
  const getColors = () => {
    switch(color) {
      case 'cyan': return 'bg-cyan-500/5 text-cyan-400 border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-500/20 active:bg-cyan-500/30';
      case 'pink': return 'bg-pink-500/5 text-pink-400 border-pink-500/20 hover:border-pink-400/60 hover:bg-pink-500/20 active:bg-pink-500/30 shadow-pink-500/5';
      case 'cyan-filled': return 'bg-cyan-500 text-slate-950 font-black border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95';
      case 'cyan-ghost': return 'bg-slate-900/40 text-cyan-500/60 border-cyan-500/10 hover:text-cyan-400 hover:border-cyan-400/40 active:bg-cyan-500/10 text-sm';
      default: return 'bg-white/5 text-slate-300 border-white/5 hover:border-white/30 hover:bg-white/10 active:bg-white/20';
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${getColors()} ${span > 1 ? `col-span-${span}` : ''} ${className}`}
    >
      <span className="relative z-10">{label}</span>
      <div className="absolute inset-0 bg-white/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
    </button>
  );
};

export default App;
