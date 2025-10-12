import { useEffect, useRef } from "react";

/**
 * Custom hook that automatically scrolls focused inputs into view
 * when the virtual keyboard appears on mobile devices.
 *
 * @param isOpen - Whether the modal/sheet is currently open
 * @param scrollDelay - Delay in ms to wait for keyboard animation (default: 300)
 * @returns Ref to attach to the scrollable container
 *
 * @example
 * ```tsx
 * const MyModal = ({ isOpen, onClose }) => {
 *   const formContainerRef = useKeyboardAwareScroll(isOpen);
 *
 *   return (
 *     <div className="modal">
 *       <div ref={formContainerRef} className="scrollable-content">
 *         <input type="text" />
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 */
export const useKeyboardAwareScroll = <T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  scrollDelay: number = 300
) => {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;

      // Check if the focused element is an input field
      if (
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA"
      ) {
        // Wait for keyboard animation to start
        setTimeout(() => {
          const container = containerRef.current;
          if (!container) return;

          const targetRect = target.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          // Calculate scroll offset with padding (20px above the input)
          const scrollOffset = targetRect.top - containerRect.top - 20;

          // Smoothly scroll the input into view
          container.scrollBy({
            top: scrollOffset,
            behavior: "smooth",
          });
        }, scrollDelay);
      }
    };

    // Use capture phase to catch focus events before they bubble
    document.addEventListener("focus", handleFocus, true);

    return () => {
      document.removeEventListener("focus", handleFocus, true);
    };
  }, [isOpen, scrollDelay]);

  return containerRef;
};
