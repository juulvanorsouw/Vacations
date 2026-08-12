// Hand-implemented equivalent of Motion Primitives' AnimatedBackground
// (motion-primitives.com/c/animated-background.json blocked automated fetches with a 429).
// Same idea: a shared layoutId highlight that slides between the active child.
import { Children, cloneElement, useId, useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function AnimatedBackground({ children, defaultValue, value, onValueChange, className, transition }) {
  const uid = useId();
  const [activeId, setActiveId] = useState(value ?? defaultValue ?? null);

  useEffect(() => {
    if (value !== undefined) setActiveId(value);
  }, [value]);

  const items = Children.toArray(children);

  return items.map((child) => {
    const id = child.props["data-id"];
    const isActive = id === activeId;
    return cloneElement(child, {
      key: id,
      onClick: (e) => {
        child.props.onClick?.(e);
        setActiveId(id);
        onValueChange?.(id);
      },
      className: cn(child.props.className, "relative"),
      children: (
        <>
          {isActive && (
            <motion.div
              layoutId={`animated-background-${uid}`}
              className={cn("absolute inset-0 -z-10", className)}
              transition={transition ?? { type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          {child.props.children}
        </>
      ),
    });
  });
}
