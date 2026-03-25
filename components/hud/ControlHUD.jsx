"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  Activity,
  Layers,
  Wifi,
  Battery,
  Settings,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
} from "lucide-react";

const metrics = [
  { label: "GPU", value: "34%", icon: Cpu, color: "text-emerald-400" },
  { label: "FPS", value: "60", icon: Activity, color: "text-accent" },
  { label: "LAYERS", value: "12", icon: Layers, color: "text-violet-400" },
  { label: "PING", value: "4ms", icon: Wifi, color: "text-accent" },
];

export default function ControlHUD({ className = "" }) {
  const [activeMode, setActiveMode] = useState("orbit");

  const modes = [
    { id: "orbit", icon: RotateCcw, label: "Orbit" },
    { id: "pan", icon: Move3D, label: "Pan" },
    { id: "zoom-in", icon: ZoomIn, label: "Zoom In" },
    { id: "zoom-out", icon: ZoomOut, label: "Zoom Out" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <motion.div
      className={`flex flex-col gap-3 ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Metrics */}
      <div className="glass-panel p-3 space-y-2">
        <p className="text-[9px] tracking-widest text-slate-500 uppercase mb-2">
          System
        </p>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon size={10} className={m.color} />
                <span className="text-[10px] text-slate-500">{m.label}</span>
              </div>
              <span className={`text-[10px] font-semibold ${m.color}`}>
                {m.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Viewport controls */}
      <div className="glass-panel p-3">
        <p className="text-[9px] tracking-widest text-slate-500 uppercase mb-2">
          Viewport
        </p>
        <div className="flex flex-col gap-1">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-all ${
                  activeMode === mode.id
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon size={10} />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status indicator */}
      <div className="glass-panel px-3 py-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-slate-500 tracking-widest uppercase">
          Engine Online
        </span>
      </div>
    </motion.div>
  );
}
