interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
    testId?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: "small" | "medium" | "large";
  illustration?: React.ReactNode;
  showCard?: boolean;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "medium",
  illustration,
  showCard = true,
}: EmptyStateProps) => {
  const sizeClasses = {
    small: {
      container: "py-8",
      icon: "w-16 h-16",
      iconText: "text-3xl",
      title: "text-lg",
      description: "text-sm",
    },
    medium: {
      container: "py-12",
      icon: "w-20 h-20",
      iconText: "text-4xl",
      title: "text-xl",
      description: "text-base",
    },
    large: {
      container: "py-16",
      icon: "w-24 h-24",
      iconText: "text-5xl",
      title: "text-2xl",
      description: "text-lg",
    },
  };

  const classes = sizeClasses[size];
  const containerClass = showCard ? "card" : "";

  return (
    <div className={`${containerClass} text-center ${classes.container}`}>
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <div
          className={`${classes.icon} bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4`}
        >
          <span className={classes.iconText}>{icon}</span>
        </div>
      )}
      <h3 className={`${classes.title} font-bold text-slate-700 mb-3`}>
        {title}
      </h3>
      <p
        className={`${classes.description} text-slate-500 mb-6 max-w-md mx-auto leading-relaxed`}
      >
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={
                action.variant === "secondary" ? "btn-secondary" : "btn-primary"
              }
              data-testid={action.testId}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button onClick={secondaryAction.onClick} className="btn-secondary">
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
