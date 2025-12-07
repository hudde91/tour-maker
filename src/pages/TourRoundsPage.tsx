import { RoundCard } from "@/components/rounds/RoundCard";
import { useTour } from "@/hooks/useTours";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ClipboardList,
  XCircle,
  Home,
  Flag,
  Plus,
  Flag as GolfFlag,
} from "lucide-react";

export const TourRoundsPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ClipboardList className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading rounds...
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Tournament Not Found
            </h3>
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeRounds = tour.rounds.filter((r) => r.status === "in-progress");
  const upcomingRounds = tour.rounds.filter(
    (r) => r.status === "created" || !r.status
  );
  const completedRounds = tour.rounds.filter((r) => r.status === "completed");

  const breadcrumbs = [
    { label: "Home", path: "/", icon: <Home className="w-4 h-4" /> },
    {
      label: tour.name,
      path: `/tour/${tourId}`,
      icon: <Flag className="w-4 h-4" />,
    },
    { label: "Rounds", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  const roundCount = tour.rounds.length;
  const subtitle = `${roundCount} round${roundCount !== 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <PageHeader
        title="Rounds"
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        backPath="/"
        actions={
          <Link
            to={`/tour/${tourId}/create-round`}
            className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30 text-sm shadow-lg"
            data-testid="create-round-button"
          >
            <Plus className="w-4 h-4" />
            <span>Add Round</span>
          </Link>
        }
      />

      <div className="pt-6 pb-8 w-full max-w-6xl mx-auto">
        {tour.rounds.length === 0 ? (
          <EmptyState
            icon={<GolfFlag className="w-12 h-12 text-slate-400" />}
            title="No Rounds Yet"
            description="Create your first round to start playing golf in this tournament"
            action={{
              label: "Create First Round",
              onClick: () => navigate(`/tour/${tourId}/create-round`),
              variant: "primary",
              testId: "create-first-round-button",
            }}
            size="large"
          />
        ) : (
          <>
            {activeRounds.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3 px-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Active Rounds
                  </h2>
                  <span className="text-sm text-slate-500">
                    ({activeRounds.length})
                  </span>
                </div>
                <div className="space-y-4">
                  {activeRounds.map((round) => (
                    <RoundCard key={round.id} round={round} tour={tour} />
                  ))}
                </div>
              </div>
            )}

            {upcomingRounds.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3 px-4">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Upcoming Rounds
                  </h2>
                  <span className="text-sm text-slate-500">
                    ({upcomingRounds.length})
                  </span>
                </div>
                <div className="space-y-4">
                  {upcomingRounds.map((round) => (
                    <RoundCard key={round.id} round={round} tour={tour} />
                  ))}
                </div>
              </div>
            )}

            {completedRounds.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3 px-4">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Completed Rounds
                  </h2>
                  <span className="text-sm text-slate-500">
                    ({completedRounds.length})
                  </span>
                </div>
                <div className="space-y-4">
                  {completedRounds.map((round) => (
                    <RoundCard key={round.id} round={round} tour={tour} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
