import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import DashboardView from './views/DashboardView';
import EnvironmentsView from './views/EnvironmentsView';
import PlantsView from './views/PlantsView';
import SettingsView from './views/SettingsView';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/environments" element={<EnvironmentsView />} />
          <Route path="/plants" element={<PlantsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}

export default App;
