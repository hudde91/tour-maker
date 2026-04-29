import { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTour } from "../../hooks/useTours";

/**
 * Route gate for deep-link tour pages that aren't wrapped in TourLayout
 * (e.g. RoundPage, CreateRoundPage). Funnels signed-out and non-participant
 * visitors through `/tour/:id/join` so the same flow handles them.
 */
export const TourGate = ({ children }: { children: ReactNode }) => {
  const { tourId } = useParams<{ tourId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: tour, isLoading: tourLoading } = useTour(tourId!);

  if (!authLoading && !user) {
    return <Navigate to={`/tour/${tourId}/join`} replace />;
  }
  if (
    user &&
    !tourLoading &&
    tour &&
    !tour.participantIds.includes(user.uid)
  ) {
    return <Navigate to={`/tour/${tourId}/join`} replace />;
  }

  return <>{children}</>;
};
