import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import ListView from './pages/ListView';
import GalleryView from './pages/GalleryView';
import DetailView from './pages/DetailView';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Marvel Character Explorer</h1>
        <nav className="app-nav">
          <NavLink to="/list" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            List
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Gallery
          </NavLink>
        </nav>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/list" replace />} />
          <Route path="/list" element={<ListView />} />
          <Route path="/gallery" element={<GalleryView />} />
          <Route path="/detail/:characterId" element={<DetailView />} />
          <Route path="*" element={<Navigate to="/list" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
