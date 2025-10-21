import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  maxWidth?: string;
}

export const Tooltip = ({
  content,
  children,
  position = "top",
  maxWidth = "200px",
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window);
  }, []);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
  };

  const hideTooltip = () => {
    if (isTouchDevice) {
      // On touch devices, delay hiding to allow reading
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } else {
      setIsVisible(false);
    }
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800",
    right:
      "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800",
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={!isTouchDevice ? showTooltip : undefined}
        onMouseLeave={!isTouchDevice ? hideTooltip : undefined}
        onClick={isTouchDevice ? toggleTooltip : undefined}
        className="cursor-help"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in duration-200`}
          style={{ maxWidth }}
        >
          <div className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

// Golf term tooltips helper component
interface GolfTermTooltipProps {
  term:
    | "handicap"
    | "slope-rating"
    | "course-rating"
    | "scramble"
    | "best-ball"
    | "match-play"
    | "stroke-play"
    | "stableford"
    | "skins"
    | "foursome"
    | "fourball";
  children: React.ReactNode;
}

export const GolfTermTooltip = ({ term, children }: GolfTermTooltipProps) => {
  const explanations: Record<string, string> = {
    handicap:
      "A numerical measure of a golfer's potential ability. Lower handicaps indicate better players. Used to level the playing field in competitions.",
    "slope-rating":
      "A measure of the difficulty of a course for bogey golfers (handicap ~20). Ranges from 55 (easiest) to 155 (hardest). Standard slope is 113.",
    "course-rating":
      "The expected score for a scratch golfer (0 handicap) on the course. Usually slightly above par to account for course difficulty.",
    scramble:
      "Team format where all players hit shots, then the team selects the best shot. All players then hit from that spot. Continues until holed.",
    "best-ball":
      "Team format where each player plays their own ball. The best score among team members on each hole counts as the team score.",
    "match-play":
      "Competition format where you play directly against opponent(s). Win holes individually rather than counting total strokes. Winner is determined by who wins more holes.",
    "stroke-play":
      "Traditional format where total strokes across all holes determine the winner. Lowest total score wins. Also called 'Medal Play'.",
    stableford:
      "Points-based scoring where you earn points relative to par (e.g., +2 for eagle, +1 for birdie). Higher points are better. Encourages aggressive play.",
    skins:
      "Competition format where each hole is worth a 'skin' (prize). The player with the lowest score on a hole wins that skin. Tied holes carry over.",
    foursome:
      "Team format where partners alternate hitting the same ball. One player tees off on odd holes, the other on even holes. Also called 'Alternate Shot'.",
    fourball:
      "Team format where both partners play their own ball throughout. The better score of the two partners counts on each hole.",
  };

  return (
    <Tooltip content={explanations[term]} maxWidth="280px">
      {children}
    </Tooltip>
  );
};
