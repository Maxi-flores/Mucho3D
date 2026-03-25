"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X, Minimize2, Maximize2 } from "lucide-react";

const BOOT_SEQUENCE = [
  "$ mucho3d --init",
  "> loading neural substrate... ████████░░ 80%",
  "> loading neural substrate... ██████████ 100% ✓",
  "> connecting to 3D render cluster...",
  "> cluster [gpu-nx-01] online ✓",
  "> initializing AI inference engine...",
  "> model: next-gen-3d-assist v2.1.0 ✓",
  "> websocket secure channel established ✓",
  "> all systems nominal.",
  "",
  "mucho3d@engine:~$ _",
];

export default function AITerminal({ className = "" }) {
  const [lines, setLines] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  // Boot sequence animation
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < BOOT_SEQUENCE.length) {
        setLines((prev) => [...prev, BOOT_SEQUENCE[i]]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 220);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = (e) => {
    if (e.key !== "Enter" || !input.trim()) return;
    const cmd = input.trim();
    const responses = {
      help: [
        "Available commands:",
        "  status   – system status",
        "  render   – trigger 3D re-render",
        "  ai       – query AI assistant",
        "  clear    – clear terminal",
        "  version  – show version info",
      ],
      status: [
        "GPU: RTX-Ω cluster | utilization 34%",
        "RAM: 128 GB / 512 GB",
        "3D engine: active [60fps]",
        "AI model: online",
      ],
      render: ["> re-rendering scene...", "> frame buffer flushed ✓"],
      version: ["mucho3d v2.1.0", "next 16.x | react 19 | r3f 9.x"],
      clear: null,
      ai: ["> AI assistant initializing...", "> ready. ask me anything."],
    };

    const resp = responses[cmd.toLowerCase()];
    if (cmd.toLowerCase() === "clear") {
      setLines([]);
    } else if (resp) {
      setLines((prev) => [
        ...prev,
        `mucho3d@engine:~$ ${cmd}`,
        ...resp,
        "mucho3d@engine:~$ _",
      ]);
    } else {
      setLines((prev) => [
        ...prev,
        `mucho3d@engine:~$ ${cmd}`,
        `command not found: ${cmd}. Type 'help' for commands.`,
        "mucho3d@engine:~$ _",
      ]);
    }
    setHistory((prev) => [...prev, cmd]);
    setInput("");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`flex flex-col rounded-lg border border-accent/30 bg-[#020d1a]/90 backdrop-blur-xl overflow-hidden shadow-accent-glow font-mono text-xs ${className}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3 }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-accent/20 bg-[#030f1f]/80">
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-accent" />
            <span className="text-accent/80 tracking-widest text-[10px] uppercase">
              AI Terminal
            </span>
            <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent text-[9px]">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized((v) => !v)}
              className="text-slate-500 hover:text-accent transition-colors"
            >
              {isMinimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Body */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Output */}
              <div className="h-48 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      line.startsWith(">")
                        ? "text-accent/70"
                        : line.startsWith("$") || line.startsWith("mucho3d")
                        ? "text-accent"
                        : line.includes("✓")
                        ? "text-emerald-400/80"
                        : "text-slate-400"
                    }`}
                  >
                    {line || "\u00A0"}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-accent/10">
                <span className="text-accent text-[10px]">$</span>
                <input
                  className="flex-1 bg-transparent outline-none text-slate-300 text-xs placeholder-slate-600 caret-accent"
                  placeholder="type a command..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleCommand}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
