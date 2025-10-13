import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Layout } from "./components/ui/Layout";
import { HomePage } from "./pages/HomePage";
import { CreateTourPage } from "./pages/CreateTourPage";
import { RoundPage } from "./pages/RoundPage";
import { CreateRoundPage } from "./pages/CreateRoundPage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { TourLayout } from "./components/ui/TourLayout";
import { TourLeaderboardPage } from "./pages/TourLeaderboardPage";
import { TourPlayersPage } from "./pages/TourPlagerPage";
import { TourRoundsPage } from "./pages/TourRoundPage";
import { TourSettingsPage } from "./pages/TourSettingsPage";
import { RyderCupPairingPage } from "./pages/RyderCupPairingPage";
function App() {
  const location = useLocation();

  return (
    <Layout>
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/create" element={<CreateTourPage />} />

          <Route path="/tour/:tourId" element={<TourLayout />}>
            <Route index element={<TourPlayersPage />} />
            <Route path="rounds" element={<TourRoundsPage />} />
            <Route path="leaderboard" element={<TourLeaderboardPage />} />
            <Route path="settings" element={<TourSettingsPage />} />
          </Route>

          <Route
            path="/tour/:tourId/create-round"
            element={<CreateRoundPage />}
          />
          <Route path="/tour/:tourId/round/:roundId" element={<RoundPage />} />
          <Route
            path="/tour/:tourId/round/:roundId/pairing"
            element={<RyderCupPairingPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
