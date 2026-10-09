import { useEffect, useState } from "react";
import { useReducedMotion as useMotionPreference } from "motion/react";

// Keep prerendered content visible during hydration, then respect the visitor's preference.
export function useReducedMotion() {
  const preference = useMotionPreference();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return !mounted || preference === true;
}
