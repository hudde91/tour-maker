import { Link } from "react-router-dom";
import { useTours } from "../hooks/useTours";

export const HomePage = () => {
  const { data: tours = [], isLoading } = useTours();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-medium">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen golf-bg-pattern">
      {/* Hero Section */}
      <div className="golf-hero-bg safe-area-top">
        <div className="p-6 pb-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              Tour Maker
            </h1>
            <p className="text-emerald-100 text-lg font-medium">
              Professional Golf Tournament Management
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-8">
        {/* Create Tournament Card */}
        <div className="card-elevated mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Create New Tournament
            </h2>
            <p className="text-slate-600 mb-6">
              Set up a professional golf tournament with players, teams, and
              multiple rounds
            </p>
            <Link to="/create" className="btn-primary w-full">
              Create Tournament
            </Link>
          </div>
        </div>

        {/* Tournaments Section */}
        <div className="section-spacing">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-header">Your Tournaments</h2>
            <span className="text-caption bg-slate-100 px-3 py-1 rounded-full">
              {tours.length} Total
            </span>
          </div>

          {tours.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No Tournaments Yet
              </h3>
              <p className="text-slate-500 mb-6">
                Create your first tournament to get started with professional
                golf management
              </p>
              <Link to="/create" className="btn-secondary">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tours.map((tour) => (
                <Link
                  key={tour.id}
                  to={`/tour/${tour.id}`}
                  className="leaderboard-row hover:shadow-lg transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {tour.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tour.isActive ? "status-active" : "status-completed"
                        }`}
                      >
                        {tour.isActive ? "Active" : "Completed"}
                      </span>
                    </div>

                    {tour.description && (
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {tour.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-caption">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 414 0zM7 10a2 2 0 11-4 0 2 2 0 414 0z"
                          />
                        </svg>
                        <span>{tour.players.length} Players</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span>{tour.rounds.length} Rounds</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        <span className="capitalize">
                          {tour.format.replace("-", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <svg
                      className="w-5 h-5 text-slate-400"
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
