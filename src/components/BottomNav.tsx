import { Link, useLocation } from "react-router-dom";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
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
    <nav
      className="fixed bottom-0 left-0 right-0 safe-area-bottom z-50"
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      }}
      aria-label="Main navigation"
    >
      <div
        className="grid max-w-6xl mx-auto"
        role="tablist"
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
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center py-3 px-2 min-h-[48px] transition-all duration-200 relative outline-none ${
                isActive
                  ? "text-emerald-400"
                  : "text-white/40 hover:text-white/60 active:scale-95"
              }`}
              style={isActive ? { filter: "drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))" } : undefined}
            >
              <div
                className={`mb-1 transition-transform duration-200 ${
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
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full"
                  style={{
                    background: "linear-gradient(90deg, rgba(16, 185, 129, 0.6), rgba(52, 211, 153, 0.8), rgba(16, 185, 129, 0.6))",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)",
                  }}
                />
              )}

              {tab.badge !== undefined && tab.badge > 0 && (
                <div
                  className="absolute top-1 right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  style={{
                    background: "rgba(239, 68, 68, 0.8)",
                    boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)",
                  }}
                  aria-label={`${tab.badge} notifications`}
                >
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
