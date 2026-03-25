import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Box,
  Cpu,
  GitBranch,
  Layers,
  Zap,
  Globe,
  Code2,
  Sparkles,
} from "lucide-react";
import GlassPanel from "../components/ui/GlassPanel";
import StatCard from "../components/ui/StatCard";
import ControlHUD from "../components/hud/ControlHUD";
import AITerminal from "../components/terminal/AITerminal";

// Dynamically load the 3D viewport to avoid SSR issues with WebGL
const Viewport3D = dynamic(
  () => import("../components/viewport/Viewport3D"),
  { ssr: false }
);

const STAGGER = 0.08;

export default function Home() {
  return (
    <div className="relative min-h-screen grid-bg overflow-hidden">
      {/* Scan-line overlay */}
      <div className="scan-overlay" aria-hidden="true" />

      {/* Radial accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 60% 30%, rgba(0,163,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-glass-border">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box size={20} className="text-accent" />
          <span className="text-sm tracking-widest uppercase font-semibold text-slate-200">
            Mucho<span className="text-accent">3D</span>
          </span>
          <span className="px-2 py-0.5 rounded border border-accent/30 text-[9px] text-accent tracking-widest">
            v2.1.0
          </span>
        </motion.div>

        <motion.nav
          className="hidden md:flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {["Viewport", "Engineer", "Assets", "Deploy"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[11px] tracking-widest uppercase text-slate-500 hover:text-accent transition-colors"
            >
              {item}
            </a>
          ))}
        </motion.nav>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-500 tracking-widest">
            ONLINE
          </span>
        </motion.div>
      </header>

      {/* ── Main layout ──────────────────────────────────────── */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_260px] gap-4 p-4 md:p-6">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Hero headline */}
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] tracking-[0.25em] uppercase text-accent/70">
              Next-Gen Engineering Interface
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 leading-tight">
              3D · AI · Real-Time{" "}
              <span className="text-accent">Command Center</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              Unified workspace for parametric 3D modelling, AI-assisted
              engineering, and live deployment pipelines.
            </p>
          </motion.div>

          {/* Bento stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Active Models"
              value="3"
              sub="2 rendering"
              icon={Box}
              accent
              delay={STAGGER * 0}
            />
            <StatCard
              label="GPU Load"
              value="34%"
              sub="RTX-Ω cluster"
              icon={Cpu}
              delay={STAGGER * 1}
            />
            <StatCard
              label="Pipelines"
              value="7"
              sub="5 passing"
              icon={GitBranch}
              delay={STAGGER * 2}
            />
            <StatCard
              label="Layers"
              value="128"
              sub="AI mesh depth"
              icon={Layers}
              accent
              delay={STAGGER * 3}
            />
          </div>

          {/* 3D Viewport */}
          <GlassPanel className="relative" style={{ height: 360 }}>
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
              <span className="text-[9px] tracking-widest uppercase text-slate-500">
                3D Viewport
              </span>
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
            </div>
            <Viewport3D className="absolute inset-0 rounded-lg" />
          </GlassPanel>

          {/* Second bento row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <GlassPanel className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-accent" />
                <span className="text-[10px] tracking-widest uppercase text-slate-500">
                  AI Assist
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Real-time mesh suggestions, constraint solving and generative
                geometry powered by on-device inference.
              </p>
            </GlassPanel>

            <GlassPanel className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-accent" />
                <span className="text-[10px] tracking-widest uppercase text-slate-500">
                  Cloud Sync
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Scenes, assets and version history are synced across GPU
                clusters with sub-100 ms latency.
              </p>
            </GlassPanel>

            <GlassPanel className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Code2 size={14} className="text-accent" />
                <span className="text-[10px] tracking-widest uppercase text-slate-500">
                  Script Engine
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Parametric scripting with TypeScript, live preview and
                integrated AI code completion in the terminal.
              </p>
            </GlassPanel>
          </div>

          {/* AI Terminal */}
          <AITerminal />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          <ControlHUD />

          {/* Quick actions */}
          <GlassPanel className="p-4 space-y-3">
            <p className="text-[9px] tracking-widest text-slate-500 uppercase">
              Quick Actions
            </p>
            {[
              { label: "New Scene", icon: Box },
              { label: "AI Generate", icon: Sparkles },
              { label: "Deploy Build", icon: Zap },
            ].map(({ label, icon: Icon }) => (
              <motion.button
                key={label}
                className="w-full flex items-center gap-2 px-3 py-2 rounded border border-glass-border text-[11px] text-slate-400 hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={12} />
                {label}
              </motion.button>
            ))}
          </GlassPanel>

          {/* Activity feed */}
          <GlassPanel className="p-4 flex-1 space-y-3">
            <p className="text-[9px] tracking-widest text-slate-500 uppercase">
              Activity
            </p>
            {[
              { msg: "Scene compiled", time: "0s", ok: true },
              { msg: "AI model updated", time: "12s", ok: true },
              { msg: "Mesh error [v12]", time: "1m", ok: false },
              { msg: "Deploy queued", time: "3m", ok: true },
              { msg: "GPU temp 74°C", time: "5m", ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 w-1 h-1 rounded-full flex-shrink-0 ${
                    item.ok ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.msg}
                  </p>
                </div>
                <span className="text-[9px] text-slate-600 flex-shrink-0">
                  {item.time}
                </span>
              </div>
            ))}
          </GlassPanel>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-glass-border px-6 py-3 flex items-center justify-between">
        <span className="text-[9px] text-slate-700 tracking-widest uppercase">
          Mucho3D © 2025
        </span>
        <span className="text-[9px] text-slate-700 tracking-widest">
          next.js · r3f · framer-motion · tailwind
        </span>
      </footer>
    </div>
  );
}
