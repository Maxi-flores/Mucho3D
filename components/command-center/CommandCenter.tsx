import React, { useState } from "react";
import styles from "./CommandCenter.module.css";

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { icon: "◆", text: "3D Viewport", id: "viewport" },
      { icon: "⬡", text: "Scene Graph", id: "scene" },
      { icon: "◈", text: "Materials", id: "materials" },
      { icon: "▤", text: "Assets", id: "assets" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { icon: "⚡", text: "Generate", id: "generate" },
      { icon: "◎", text: "Analyze", id: "analyze" },
      { icon: "⟁", text: "Optimize", id: "optimize" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: "⚙", text: "Settings", id: "settings" },
      { icon: "◧", text: "Console", id: "console" },
    ],
  },
];

interface CommandCenterProps {
  children: React.ReactNode;
  headerTitle?: string;
}

export default function CommandCenter({
  children,
  headerTitle = "3D Viewport",
}: CommandCenterProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("viewport");

  return (
    <div className={styles.layout}>
      {/* ─── Sidebar ─── */}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <div className={styles.brandIcon}>M</div>
            <span className={styles.brandText}>Mucho3D</span>
          </div>
          <button
            className={styles.toggleBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "▸" : "◂"}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <div className={styles.navLabel}>{section.label}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${
                    activeNav === item.id ? styles.active : ""
                  }`}
                  onClick={() => setActiveNav(item.id)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navItemText}>{item.text}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.statusBadge}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>Engine Ready</span>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <div className={styles.headerTitle}>
            <span className={styles.headerBreadcrumb}>mucho3d /</span>{" "}
            {headerTitle}
          </div>
          <div className={styles.headerActions}>
            <button className={styles.headerBtn}>⊞ Grid</button>
            <button className={styles.headerBtn}>↻ Reset</button>
            <button className={styles.headerBtnAccent}>▶ Render</button>
          </div>
        </div>

        <div className={styles.viewportContainer}>{children}</div>
      </main>
    </div>
  );
}
