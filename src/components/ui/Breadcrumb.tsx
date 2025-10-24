import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className = "" }: BreadcrumbProps) => {
  return (
    <nav
      className={`overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent ${className}`}
      aria-label="Breadcrumb"
    >
      <div className="flex items-center space-x-2 text-sm min-w-max">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={index} className="flex items-center flex-shrink-0">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-slate-400 mx-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}

              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 transition-colors font-medium whitespace-nowrap"
                >
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-900 font-semibold whitespace-nowrap">
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                    {item.label}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};
