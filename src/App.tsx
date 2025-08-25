import { Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "./components/ui/Layout";
import { HomePage } from "./pages/HomePage";
import { CreateTourPage } from "./pages/CreateTourPage";
import { TourPage } from "./pages/TourPage";
import { RoundPage } from "./pages/RoundPage";
import { CreateRoundPage } from "./pages/CreateRoundPage";
import ErrorBoundary from "./components/common/ErrorBoundary";

function App() {
  const location = useLocation();
  return (
    <Layout>
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateTourPage />} />
          <Route path="/tour/:tourId" element={<TourPage />} />
          <Route path="/tour/:tourId/round/:roundId" element={<RoundPage />} />
          <Route
            path="/tour/:tourId/create-round"
            element={<CreateRoundPage />}
          />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
