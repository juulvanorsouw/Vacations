// Hand-implemented equivalent of Motion Primitives' InView
// (registry blocked automated fetches with a 429). Reveals children once when scrolled into view.
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function InView({ children, className, variants, transition, viewOptions }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px", ...viewOptions });

  const defaultVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants ?? defaultVariants}
      transition={transition ?? { duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
