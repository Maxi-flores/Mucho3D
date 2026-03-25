import React, { useState } from "react";
import styles from "./ControlHUD.module.css";

interface ControlHUDProps {
  fps?: number;
  triangles?: string;
  drawCalls?: number;
  cameraPosition?: { x: number; y: number; z: number };
}

const TOOLS = [
  { icon: "⊹", label: "Select", id: "select" },
  { icon: "↔", label: "Move", id: "move" },
  { icon: "⟳", label: "Rotate", id: "rotate" },
  { icon: "⤢", label: "Scale", id: "scale" },
  { icon: "◻", label: "Box", id: "box" },
];

export default function ControlHUD({
  fps = 60,
  triangles = "24.5K",
  drawCalls = 128,
  cameraPosition = { x: 5.0, y: 3.2, z: 8.0 },
}: ControlHUDProps) {
  const [activeTool, setActiveTool] = useState("select");

  return (
    <div className={styles.hudOverlay}>
      {/* ─── Stats Panel (Top-Left) ─── */}
      <div className={styles.statsPanel}>
        <div className={styles.statsPanelTitle}>Performance</div>
        <div className={styles.statsGrid}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>FPS</span>
            <span className={styles.statValueAccent}>{fps}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Triangles</span>
            <span className={styles.statValue}>{triangles}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Draw Calls</span>
            <span className={styles.statValue}>{drawCalls}</span>
          </div>
        </div>
      </div>

      {/* ─── Camera Panel (Top-Right) ─── */}
      <div className={styles.cameraPanel}>
        <div className={styles.cameraPanelTitle}>Camera</div>
        <div className={styles.cameraCoords}>
          <div className={styles.coordItem}>
            <span className={styles.coordLabel}>X</span>
            <span className={styles.coordValue}>
              {cameraPosition.x.toFixed(1)}
            </span>
          </div>
          <div className={styles.coordItem}>
            <span className={styles.coordLabel}>Y</span>
            <span className={styles.coordValue}>
              {cameraPosition.y.toFixed(1)}
            </span>
          </div>
          <div className={styles.coordItem}>
            <span className={styles.coordLabel}>Z</span>
            <span className={styles.coordValue}>
              {cameraPosition.z.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Tools Panel (Bottom-Left) ─── */}
      <div className={styles.toolsPanel}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={
              activeTool === tool.id ? styles.toolBtnActive : styles.toolBtn
            }
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* ─── Info Badge (Bottom-Right) ─── */}
      <div className={styles.infoBadge}>
        <span className={styles.infoDot} />
        Mucho3D Engine v1.0 • WebGL 2.0
      </div>
    </div>
  );
}
