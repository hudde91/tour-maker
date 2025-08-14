interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="card text-center py-12">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-3">{title}</h3>
      <p className="text-slate-500 card-spacing max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <button onClick={action.onClick} className="btn-secondary">
          {action.label}
        </button>
      )}
    </div>
  );
};
