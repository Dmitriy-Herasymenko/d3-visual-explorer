import InteractiveMap from "./components/Map/InteractiveMap";
import RealTimeDashboard from "./components/DashBoard/RealTimeDashboard";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from "./components/Header/Header";

import './App.css';

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div className={`app ${theme}`}>

      <Router>
       <Header />

        <Routes>
          <Route path="/map" element={<InteractiveMap />} />
          <Route path="/dashboard" element={<RealTimeDashboard />} />
          <Route path="/" element={<h2>Welcome to the App!</h2>} />
        </Routes>
      </Router>
    </div>
  );
}

export default () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
