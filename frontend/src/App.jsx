import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import DestinationsPage from './pages/DestinationsPage.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/destinations" element={<DestinationsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
