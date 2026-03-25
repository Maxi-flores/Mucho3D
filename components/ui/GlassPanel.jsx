import { motion } from "framer-motion";

/**
 * GlassPanel – frosted-glass card with optional accent border glow.
 * Accepts a `className` override and all standard div props.
 */
export default function GlassPanel({
  children,
  className = "",
  animate = true,
  ...props
}) {
  const base =
    "relative rounded-lg border border-glass-border bg-glass-bg backdrop-blur-glass shadow-glass overflow-hidden";

  if (!animate) {
    return (
      <div className={`${base} ${className}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`${base} ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{
        boxShadow: "0 4px 40px 0 rgba(0, 163, 255, 0.18)",
        borderColor: "rgba(0, 163, 255, 0.4)",
      }}
      {...props}
    >
      {/* corner accent */}
      <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-accent/5" />
      {children}
    </motion.div>
  );
}
