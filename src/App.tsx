import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import Landing from "./Pages/Landing";
import BackupLanding from "./Pages/BackupLanding";
import Login from "./Pages/Login";
import SearchATM from "./Pages/SearchATM";
import Results from "./Pages/Results";
import MapView from "./Pages/MapView";
import BankerDashboard from "./Pages/BankerDashboard";
import Contact from "./Pages/Contact";
import SiteHeader from "./Components/SiteHeader";
import UnderDevelopment from "./Pages/UnderDevelopment";

function ProtectedMap() {
  const isLoggedIn = Boolean(
    localStorage.getItem("cashready_token") || sessionStorage.getItem("cashready_token"),
  );

  return isLoggedIn ? <MapView /> : <Navigate to="/login/customer" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <div className="app-content">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/backup" element={<BackupLanding />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/home" element={<Landing />} />

        <Route
          path="/login/customer"
          element={<Login role="customer" />}
        />

        <Route
          path="/login/banker"
          element={<Login role="banker" />}
        />

        <Route
          path="/customer-dashboard"
          element={<SearchATM />}
        />

        <Route path="/search" element={<SearchATM />} />

        <Route path="/results" element={<Results />} />

        <Route path="/forecasting" element={<UnderDevelopment title="Cash Forecasting" pageKey="forecasting" />} />
        <Route path="/operations" element={<UnderDevelopment title="Operations Center & Reports" />} />
        <Route path="/reports" element={<UnderDevelopment title="Reports" />} />
        <Route path="/operations-reports" element={<UnderDevelopment title="Operations Center & Reports" />} />
        <Route path="/priority-queue" element={<UnderDevelopment title="Priority queue" pageKey="priority-queue" />} />
        <Route path="/field-activity" element={<UnderDevelopment title="Field activity" pageKey="field-activity" />} />
        <Route path="/network-alerts" element={<UnderDevelopment title="Network alerts" pageKey="network-alerts" />} />
        <Route path="/daily-network-summary" element={<UnderDevelopment title="Daily network summary" pageKey="daily-network-summary" />} />
        <Route path="/cash-movement-report" element={<UnderDevelopment title="Cash movement report" pageKey="cash-movement-report" />} />
        <Route path="/export-center" element={<UnderDevelopment title="Export center" pageKey="export-center" />} />

        <Route path="/map" element={<ProtectedMap />} />

        <Route
          path="/banker-dashboard"
          element={<BankerDashboard />}
        />
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;