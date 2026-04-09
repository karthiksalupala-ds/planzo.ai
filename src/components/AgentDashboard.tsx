import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle, AlertTriangle, Play, Pause, ChevronDown, ListChecks, Activity, Brain } from "lucide-react";

interface AgentDashboardProps {
  tripId: string;
}

export const AgentDashboard = ({ tripId }: AgentDashboardProps) => {
  const [isActive, setIsActive] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warning' }>>([
    { timestamp: new Date().toISOString(), message: "Autonomous Agent Initialized for Trip: " + tripId, type: 'info' },
    { timestamp: new Date().toISOString(), message: "Analyzing historical visitor density for optimal routing...", type: 'info' }
  ]);

  // Simulate Agent Activity
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const messages = [
        "Scanning weather patterns for trip dates...",
        "Evaluating restaurant availability and closures...",
        "Identifying vibe-matched hidden gems nearby...",
        "Healed itinerary: Moved Beach walk from 2PM to 10AM (Weather Delay).",
        "Autonomous Check: Local festival verified as 'Active'.",
        "Optimizing transport nodes for minimal transition times.",
        "Cross-referencing budget caps with live pricing data.",
        "Agent Note: Found skip-the-line option for afternoon landmark."
      ];
      
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setLogs(prev => {
        const type: 'info' | 'success' | 'warning' = randomMsg.includes('Healed') ? 'warning' : 'success';
        const newLogs = [...prev, { 
          timestamp: new Date().toISOString(), 
          message: randomMsg, 
          type 
        }];
        return newLogs.slice(-10); // Keep last 10
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isActive, tripId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="relative mb-12">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-accent/10 blur-[100px] pointer-events-none rounded-full" />

      <motion.div 
        layout
        className="relative z-10 glass-premium rounded-[40px] shadow-premium border-white/40 overflow-hidden"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-8 gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md animate-pulse" />
              <div className="h-14 w-14 rounded-2xl bg-premium-gradient flex items-center justify-center relative shadow-xl">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                 <Activity className="h-3 w-3 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-black text-xl tracking-tight text-foreground">
                  Agent Intelligence
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
                  Live Engine
                </span>
              </div>
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em]">
                Autonomous Optimization System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3.5 rounded-2xl glass-premium hover:text-primary transition-all active:scale-95 border-white/50"
            >
              <ChevronDown className={`h-5 w-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg active:scale-95 ${
                isActive 
                ? 'bg-primary text-white shadow-primary/30' 
                : 'bg-muted text-foreground/40 shadow-inner'
              }`}
            >
              {isActive ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              {isActive ? "Engine Active" : "Paused"}
            </button>
          </div>
        </div>

        {/* Reasoning Logs Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="overflow-hidden"
            >
              <div className="px-8 pb-8">
                <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent mb-8" />
                
                <div 
                  ref={scrollRef}
                  className="space-y-4 max-h-[320px] overflow-y-auto pr-4 scroll-smooth scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent"
                >
                  {logs.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                       <Sparkles className="h-12 w-12 mb-4" />
                       <p className="text-sm font-bold uppercase tracking-widest">Initializing reasoning cores...</p>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <motion.div 
                        key={log.timestamp + index}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex items-start gap-4 p-5 rounded-[24px] transition-all duration-300 border ${
                          log.type === 'warning' 
                          ? 'bg-amber-500/5 border-amber-500/20 shadow-[0_4px_20px_-10px_rgba(245,158,11,0.2)]' 
                          : 'bg-white/40 dark:bg-black/20 border-white/40 shadow-sm'
                        }`}
                      >
                        <div className={`mt-1 h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                          log.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                          log.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-primary/10 text-primary'
                        }`}>
                          {log.type === 'success' ? <CheckCircle className="h-5 w-5" /> : 
                           log.type === 'warning' ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : 
                           <Loader2 className="h-5 w-5 animate-spin" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-[15px] font-bold leading-relaxed tracking-tight ${log.type === 'warning' ? 'text-amber-900 dark:text-amber-400' : 'text-foreground'}`}>
                            {log.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                             <span className="text-[10px] text-foreground/30 font-black uppercase tracking-tighter">
                               {new Date(log.timestamp).toLocaleTimeString()}
                             </span>
                             <div className="h-1 w-1 rounded-full bg-foreground/20" />
                             <span className="text-[10px] text-foreground/30 font-black uppercase tracking-tighter">
                               Processor Node 0{index + 1}
                             </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="mt-8 p-6 rounded-[28px] bg-muted/30 border border-white/50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => (
                           <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-premium-gradient flex items-center justify-center text-[8px] font-bold text-white">
                              {i}
                           </div>
                         ))}
                      </div>
                      <p className="text-xs font-bold text-foreground/60 leading-tight">
                         Collaborating with <span className="text-primary">Planzo Core</span> <br/>
                         and 8 other API clusters
                      </p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Health Status</p>
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                         <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Nominal</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
