import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import PetaniList from './pages/PetaniList';
import PlotDetail from './pages/PlotDetail';
import Login from './pages/Login';
import TentangKami from './pages/TentangKami';
import RequireRole from './components/RequireRole';
import NotifBanner from './components/NotifBanner';
import DashboardShell from './components/DashboardShell';
import PageLoader from './components/ui/PageLoader';
import { AppProvider, useAppContext } from './context/AppContext';

// Lazy-loaded: hanya inti halaman dashboard (Agen/Petani/Eksportir) yang ditunda
// muat & dibungkus Suspense di bawah — navbar/sidebar DashboardShell TIDAK ikut
// re-render/reload saat berpindah halaman karena berada di luar boundary Suspense ini.
const Home = lazy(() => import('./pages/Home'));
const TambahPlot = lazy(() => import('./pages/TambahPlot'));
const PetaniList = lazy(() => import('./pages/PetaniList'));
const PlotDetail = lazy(() => import('./pages/PlotDetail'));
const EksportirDashboard = lazy(() => import('./pages/EksportirDashboard'));
const PetaniTerdekat = lazy(() => import('./pages/PetaniTerdekat'));
const PetaniPortal = lazy(() => import('./pages/PetaniPortal'));
const HargaReferensi = lazy(() => import('./pages/HargaReferensi'));
const PaketBuktiEudr = lazy(() => import('./pages/PaketBuktiEudr'));

function AppShell() {
  const { currentRole, setRole } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGantiRole = () => {
    setRole(null);
    navigate('/masuk');
  };

  if (location.pathname === '/masuk') {
    return <Login />;
  }

  if (location.pathname === '/' || location.pathname === '/tentang') {
    return <TentangKami />;
  }

  const routes = (
    <Routes>
      <Route
        path="/agen"
        element={
          <RequireRole role="agen">
            <Home />
          </RequireRole>
        }
      />
      <Route
        path="/agen/plot/:id"
        element={
          <RequireRole role="agen">
            <PlotDetail />
          </RequireRole>
        }
      />
      <Route
        path="/agen/petani"
        element={
          <RequireRole role="agen">
            <PetaniList />
          </RequireRole>
        }
      />
      <Route
        path="/petani"
        element={
          <RequireRole role="petani">
            <PetaniPortal />
          </RequireRole>
        }
      />
      <Route
        path="/eksportir"
        element={
          <RequireRole role="eksportir">
            <EksportirDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/eksportir/terdekat"
        element={
          <RequireRole role="eksportir">
            <PetaniTerdekat />
          </RequireRole>
        }
      />
    </Routes>
  );

  return (
    <>
      <NotifBanner />
      {currentRole ? (
        <DashboardShell currentRole={currentRole} onGantiRole={handleGantiRole}>
          {routes}
        </DashboardShell>
      ) : (
        routes
      )}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
