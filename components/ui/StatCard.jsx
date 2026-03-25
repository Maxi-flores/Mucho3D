"use client";
import { motion } from "framer-motion";

/**
 * StatCard – a compact bento tile showing a metric with an icon.
 */
export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  delay = 0,
  className = "",
}) {
  return (
    <motion.div
      className={`glass-panel p-4 flex flex-col justify-between gap-3 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest uppercase text-slate-500">
          {label}
        </span>
        {Icon && (
          <Icon
            size={14}
            className={accent ? "text-accent" : "text-slate-600"}
          />
        )}
      </div>
      <div>
        <p
          className={`text-2xl font-semibold tracking-tight leading-none ${
            accent ? "text-accent" : "text-slate-200"
          }`}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-[10px] text-slate-600 tracking-wide">{sub}</p>
        )}
      </div>
    </motion.div>
  );
}
