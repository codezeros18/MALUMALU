import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import PetaniList from './pages/PetaniList';
import PlotDetail from './pages/PlotDetail';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-800 text-white px-6 py-4 shadow">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Paspor Petani
          </Link>
          <nav className="flex gap-4 text-sm text-brand-100">
            <Link to="/">Home</Link>
            <Link to="/petani">Petani</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/petani" element={<PetaniList />} />
          <Route path="/plot/:id" element={<PlotDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
