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
      img: 32,
      text: "text-lg",
      container: "h-8",
    },
    md: {
      img: 40,
      text: "text-xl",
      container: "h-10",
    },
    lg: {
      img: 48,
      text: "text-2xl",
      container: "h-12",
    },
    xl: {
      img: 64,
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
        <img
          src="/icons/golf_icon.png"
          alt="Tour Maker"
          width={config.img}
          height={config.img}
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${config.container} ${className}`}>
      <img
        src="/icons/golf_icon.png"
        alt="Tour Maker"
        width={config.img}
        height={config.img}
        className="object-contain"
      />
      <div className={`font-bold ${config.text} ${textColor} tracking-tight`}>
        <span className="font-['Poppins']">Tour</span>
        <span className={`${iconColor} font-['Poppins']`}> Maker</span>
      </div>
    </div>
  );
};
