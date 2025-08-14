import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AffectationForm from './components/AffectationForm';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import './App.css'; // pour wrapper général

function App() {
  return (
    <Router>
      <Topbar />
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/affectation" element={<AffectationForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
