import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

// Importation des pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import EspaceEtudiant from "./pages/EspaceEtudiant"; // Dashboard global
import TraiterSujet from "./pages/TraiterSujet";
import ConsulterCorrection from './pages/ConsulterCorrection';
import SuivrePerformence from './pages/SuivrePerformence';
import ProposerCorrection from './pages/ProposerCorrection'; // ✅ Nouvelle page ajoutée

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Thème global (dark / light mode)
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#8e5cda" }, // Violet principal
      background: {
        default: darkMode ? "#121212" : "#f4f4f4", // Fond général
        paper: darkMode ? "#1e1e1e" : "#fff", // Fond pour les papiers (cards, modales, etc.)
      },
      text: {
        primary: darkMode ? "#fff" : "#333",
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Routes publiques accessibles sans être connecté */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Redirection par défaut vers /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Routes protégées accessibles uniquement via l'espace étudiant */}
          <Route
            path="/espaceetudiant"
            element={<EspaceEtudiant darkMode={darkMode} setDarkMode={setDarkMode} />}
          >
            {/* Sous-routes affichées à l'intérieur du dashboard */}
            <Route index element={<Navigate to="traiter-sujet" replace />} /> {/* Redirection par défaut dans l'espace étudiant */}
            <Route path="traiter-sujet" element={<TraiterSujet />} />
            <Route path="consulter-correction" element={<ConsulterCorrection />} />
            <Route path="suivre-performence" element={<SuivrePerformence />} />
            <Route path="proposer-correction" element={<ProposerCorrection />} /> {/* ✅ Ajout définitif */}
          </Route>

          {/* Fallback si route non trouvée */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
