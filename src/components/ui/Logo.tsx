import { Club, Flag } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "icon-only";
  className?: string;
}

export const Logo = ({
  size = "md",
  variant = "default",
  className = "",
}: LogoProps) => {
  const sizes = {
    sm: {
      icon: 20,
      text: "text-lg",
      container: "h-8",
    },
    md: {
      icon: 24,
      text: "text-xl",
      container: "h-10",
    },
    lg: {
      icon: 32,
      text: "text-2xl",
      container: "h-12",
    },
    xl: {
      icon: 40,
      text: "text-3xl",
      container: "h-16",
    },
  };

  const config = sizes[size];

  const textColor =
    variant === "white" ? "text-white" : "text-white dark:text-white";

  const iconColor =
    variant === "white"
      ? "text-white"
      : "text-emerald-400 dark:text-emerald-500";

  if (variant === "icon-only") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl blur-sm opacity-50" />
          <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-2 shadow-lg">
            <Flag size={config.icon} strokeWidth={2.5} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${config.container} ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-gradient-to-br from-yellow-500 to-orange-700 rounded-xl p-2 shadow-lg">
          <Club size={config.icon} strokeWidth={2.5} className="text-white" />
        </div>
      </div>
      <div className={`font-bold ${config.text} ${textColor} tracking-tight`}>
        <span className="font-['Poppins']">Tour</span>
        <span className={`${iconColor} font-['Poppins']`}> Maker</span>
      </div>
      <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-2 shadow-lg opacity-0">
        <Flag size={config.icon} strokeWidth={2.5} className="text-white" />
      </div>
    </div>
  );
};
