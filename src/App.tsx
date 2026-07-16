import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import PetaniList from './pages/PetaniList';
import PlotDetail from './pages/PlotDetail';
import Login from './pages/Login';
import EksportirDashboard from './pages/EksportirDashboard';
import PetaniPortal from './pages/PetaniPortal';
import RequireRole from './components/RequireRole';
import NotifBanner from './components/NotifBanner';
import OfflineIndicator from './components/OfflineIndicator';
import { AppProvider, useAppContext } from './context/AppContext';

function AppShell() {
  const { currentRole, setRole } = useAppContext();
  const navigate = useNavigate();

  const handleGantiRole = () => {
    setRole(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NotifBanner />
      <header className="no-print bg-brand-800 text-white px-6 py-4 shadow">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Paspor Petani
          </Link>
          <nav className="flex items-center gap-4 text-sm text-brand-100">
            {currentRole === 'agen' && (
              <>
                <Link to="/agen">Home</Link>
                <Link to="/agen/petani">Petani List</Link>
              </>
            )}
            {currentRole && (
              <button type="button" onClick={handleGantiRole} className="text-xs underline">
                Ganti Role
              </button>
            )}
            <OfflineIndicator />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto">
        <Routes>
          <Route path="/" element={<Login />} />
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
        </Routes>
      </main>
    </div>
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
