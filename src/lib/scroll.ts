/**
 * Utilities for smooth, framed scrolling across desktop and mobile.
 */

/**
 * Silky-smooth easing scroll using requestAnimationFrame and cubic ease-in-out.
 * Automatically respects user interaction cancellation and preferred reduced motion.
 */
export function smoothScrollTo(targetY: number, onComplete?: () => void) {
  const startY = window.pageYOffset || document.documentElement.scrollTop;
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) {
    onComplete?.();
    return;
  }

  // Dynamic duration based on distance for a natural, elegant velocity profile (450ms - 850ms)
  const duration = Math.min(850, Math.max(450, Math.sqrt(Math.abs(distance)) * 16));
  const startTime = performance.now();

  let cancelled = false;
  const cancelEvents = ["wheel", "touchstart", "touchmove", "keydown"];
  const onUserInteraction = () => {
    cancelled = true;
    cleanup();
  };

  const cleanup = () => {
    cancelEvents.forEach((evt) => window.removeEventListener(evt, onUserInteraction));
  };

  cancelEvents.forEach((evt) => window.addEventListener(evt, onUserInteraction, { passive: true }));

  // Easing: easeInOutCubic
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  function step(currentTime: number) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo({
      top: startY + distance * easedProgress,
      behavior: "instant",
    });

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      cleanup();
      onComplete?.();
    }
  }

  requestAnimationFrame(step);
}

/**
 * Smoothly scrolls to the waitlist form container or section, ensuring the form
 * is accurately positioned and fully visible in the viewport across desktop and mobile.
 */
export function scrollToWaitlist(event?: React.MouseEvent | Event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }

  const formWrap =
    document.getElementById("waitlist-form-container") ||
    document.querySelector<HTMLElement>(".waitlist-form") ||
    document.getElementById("join-waitlist");

  if (!formWrap) return;

  const isMobile = window.innerWidth < 768;
  const headerOffset = isMobile ? 70 : 88;
  const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
  const viewportHeight = window.innerHeight;
  const rect = formWrap.getBoundingClientRect();

  let targetY: number;

  if (isMobile) {
    // In mobile view, the waitlist form is stacked below the large heading/copy.
    // If the form fits in available height, center it vertically below the sticky header.
    // Otherwise, position it right below the header with comfortable padding.
    const availableHeight = viewportHeight - headerOffset;
    if (rect.height < availableHeight) {
      targetY = currentScrollY + rect.top - headerOffset - (availableHeight - rect.height) / 2;
    } else {
      targetY = currentScrollY + rect.top - headerOffset - 16;
    }
  } else {
    // Desktop view: the copy and form are side-by-side in a 2-column grid.
    // Center the whole registration block / form in the viewport.
    const section = document.getElementById("join-waitlist") || formWrap;
    const sectionRect = section.getBoundingClientRect();
    if (sectionRect.height < viewportHeight) {
      targetY = currentScrollY + sectionRect.top - (viewportHeight - sectionRect.height) / 2;
    } else {
      targetY = currentScrollY + rect.top - Math.max(headerOffset + 20, (viewportHeight - rect.height) / 2);
    }
  }

  const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
  targetY = Math.max(0, Math.min(Math.round(targetY), maxScroll));

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    window.scrollTo({ top: targetY, behavior: "instant" });
    if (window.location.hash !== "#join-waitlist") {
      window.history.pushState(null, "", "#join-waitlist");
    }
    return;
  }

  smoothScrollTo(targetY, () => {
    if (window.location.hash !== "#join-waitlist") {
      window.history.pushState(null, "", "#join-waitlist");
    }
  });
}
