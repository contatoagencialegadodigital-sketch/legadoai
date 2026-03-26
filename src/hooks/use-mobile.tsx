// Lightweight, dependency-free mobile detector without React hooks to avoid invalid hook call issues
export function useIsMobile() {
  const MOBILE_BREAKPOINT = 768;
  if (typeof window === "undefined") return false;
  try {
    return window.innerWidth < MOBILE_BREAKPOINT;
  } catch {
    return false;
  }
}

