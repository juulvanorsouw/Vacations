// Hand-implemented equivalent of Motion Primitives' TextEffect
// (registry blocked automated fetches with a 429). Per-word/char stagger reveal.
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function TextEffect({ children, per = "word", className, delay = 0, as: Tag = "span" }) {
  const text = String(children);
  const units = per === "char" ? Array.from(text) : text.split(/(\s+)/);

  return (
    <Tag className={cn("inline-block", className)}>
      {units.map((unit, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, delay: delay + i * 0.03, ease: "easeOut" }}
        >
          {unit === " " ? " " : unit}
        </motion.span>
      ))}
    </Tag>
  );
}
