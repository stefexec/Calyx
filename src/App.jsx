import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import DashboardView from './views/DashboardView';
import EnvironmentsView from './views/EnvironmentsView';
import PlantsView from './views/PlantsView';
import GalleryView from './views/GalleryView';
import SettingsView from './views/SettingsView';

import useEnvironmentStore from './store/useEnvironmentStore';
import usePlantStore from './store/usePlantStore';
import useTaskStore from './store/useTaskStore';
import useGalleryStore from './store/useGalleryStore';
import useNutrientStore from './store/useNutrientStore';
import useSettingsStore from './store/useSettingsStore';

function App() {
  const fetchEnvironments = useEnvironmentStore(state => state.fetchEnvironments);
  const fetchPlants = usePlantStore(state => state.fetchPlants);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const fetchGallery = useGalleryStore(state => state.fetchGallery);
  const fetchNutrients = useNutrientStore(state => state.fetchNutrients);
  const fetchSettings = useSettingsStore(state => state.fetchSettings);

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchEnvironments(),
        fetchPlants(),
        fetchTasks(),
        fetchGallery(),
        fetchNutrients(),
        fetchSettings()
      ]);
    };

    // Initial load
    fetchAllData();

    // 1. Browser tab focus listener (for Desktop/Web)
    const onFocus = () => fetchAllData();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchAllData();
    });

    // 2. Capacitor App resume listener (for Mobile)
    let appStateListener = null;
    import('@capacitor/app').then(({ App: CapacitorApp }) => {
      appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          fetchAllData();
        }
      });
    }).catch(() => {
      // Ignore if Capacitor is not available (e.g. standard browser)
    });

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
      if (appStateListener) {
        appStateListener.then(listener => listener.remove());
      }
    };
  }, []);

  return (
    <Router>
      <div className="app-layout">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/environments" element={<EnvironmentsView />} />
          <Route path="/plants" element={<PlantsView />} />
          <Route path="/gallery" element={<GalleryView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}

export default App;
