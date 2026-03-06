import { useEffect, useState } from "react";

export type CelebrationType = "birdie" | "eagle" | "ace" | null;

interface ScoreCelebrationProps {
  type: CelebrationType;
  onComplete?: () => void;
}

const celebrationConfig = {
  birdie: {
    label: "BIRDIE!",
    color: "text-emerald-400",
    bgGlow: "from-emerald-500/20 to-transparent",
    duration: 1800,
  },
  eagle: {
    label: "EAGLE!",
    color: "text-amber-400",
    bgGlow: "from-amber-500/20 to-transparent",
    duration: 2200,
  },
  ace: {
    label: "ACE!",
    color: "text-red-400",
    bgGlow: "from-red-500/20 via-amber-500/10 to-transparent",
    duration: 3000,
  },
};

/** Determines celebration type based on score vs par */
export const getCelebrationType = (
  score: number,
  par: number
): CelebrationType => {
  if (score === 1) return "ace";
  if (score <= par - 2) return "eagle";
  if (score === par - 1) return "birdie";
  return null;
};

export const ScoreCelebration = ({
  type,
  onComplete,
}: ScoreCelebrationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!type) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const config = celebrationConfig[type];
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, config.duration);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  if (!type || !visible) return null;

  const config = celebrationConfig[type];

  return (
    <div className="celebration-overlay">
      {/* Radial glow background */}
      <div
        className={`absolute inset-0 bg-radial-gradient ${config.bgGlow} opacity-60`}
        style={{
          background: `radial-gradient(circle at 50% 40%, ${
            type === "ace"
              ? "rgba(239, 68, 68, 0.15)"
              : type === "eagle"
                ? "rgba(251, 191, 36, 0.12)"
                : "rgba(16, 185, 129, 0.1)"
          } 0%, transparent 60%)`,
        }}
      />

      {/* Floating score label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="score-name-float text-center">
          <div
            className={`text-4xl sm:text-5xl font-extrabold ${config.color} tracking-tight`}
            style={{
              fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
              textShadow:
                type === "ace"
                  ? "0 0 40px rgba(239, 68, 68, 0.5), 0 0 80px rgba(251, 191, 36, 0.3)"
                  : type === "eagle"
                    ? "0 0 30px rgba(251, 191, 36, 0.4)"
                    : "0 0 20px rgba(16, 185, 129, 0.3)",
            }}
          >
            {config.label}
          </div>
        </div>
      </div>

      {/* Sparkle particles for eagle/ace */}
      {(type === "eagle" || type === "ace") && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: type === "ace" ? 12 : 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 30}%`,
                background:
                  type === "ace"
                    ? `hsl(${Math.random() * 60 + 10}, 90%, 60%)`
                    : "#fbbf24",
                animation: `particleFloat ${1 + Math.random() * 1.5}s ease-out ${Math.random() * 0.3}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
