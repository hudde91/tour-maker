import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Layout } from "./components/ui/Layout";
import { HomePage } from "./pages/HomePage";
import { CreateTourPage } from "./pages/CreateTourPage";
import { RoundPage } from "./pages/RoundPage";
import { CreateRoundPage } from "./pages/CreateRoundPage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { TourLayout } from "./components/ui/TourLayout";
import { TourLeaderboardPage } from "./pages/TourLeaderboardPage";
import { TourPlayersPage } from "./pages/TourPlayersPage";
import { TourRoundsPage } from "./pages/TourRoundsPage";
import { TourSettingsPage } from "./pages/TourSettingsPage";
import { AppSettingsPage } from "./pages/AppSettingsPage";
import { RyderCupPairingPage } from "./pages/RyderCupPairingPage";
import { TeamDashboard } from "./pages/TeamDashboard";
import { RyderCupSetupWizard } from "./components/rydercup/RyderCupSetupWizard";
import { ReloadPrompt } from "./components/pwa/ReloadPrompt";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";

function App() {
  const location = useLocation();

  return (
    <Layout>
      <OfflineIndicator />
      <ReloadPrompt />
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/create" element={<CreateTourPage />} />
          <Route path="/create/ryder-cup-wizard" element={<RyderCupSetupWizard />} />
          <Route path="/settings" element={<AppSettingsPage />} />

          <Route path="/tour/:tourId" element={<TourLayout />}>
            <Route index element={<Navigate to="players" replace />} />
            <Route path="players" element={<TourPlayersPage />} />
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
          <Route
            path="/tour/:tourId/team/:teamId"
            element={<TeamDashboard />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
