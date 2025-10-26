import { Link, useLocation } from "react-router-dom";

interface Tab {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

interface BottomNavProps {
  tabs: Tab[];
}

export const BottomNav = ({ tabs }: BottomNavProps) => {
  const location = useLocation();

  const handleTabClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50 shadow-lg">
      <div
        className="grid max-w-6xl mx-auto"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.id}
              to={tab.path}
              onClick={handleTabClick}
              data-testid={`tab-${tab.id}`}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 relative ${
                isActive
                  ? "text-emerald-600"
                  : "text-slate-400 hover:text-slate-600 active:scale-95"
              }`}
            >
              <div
                className={`text-2xl mb-1 transition-transform duration-200 ${
                  isActive ? "scale-110" : ""
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-xs font-medium transition-all duration-200 ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-600 rounded-b-full" />
              )}

              {tab.badge !== undefined && tab.badge > 0 && (
                <div className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
