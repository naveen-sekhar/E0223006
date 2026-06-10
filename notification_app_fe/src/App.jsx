import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import AllNotificationsPage from "./pages/AllNotificationsPage.jsx";
import PriorityPage from "./pages/PriorityPage.jsx";
import { setupLogger } from "./services/logger.js";
import "./App.css";

function App() {
  useEffect(() => {
    setupLogger();
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AllNotificationsPage />} />
            <Route path="/priority" element={<PriorityPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
