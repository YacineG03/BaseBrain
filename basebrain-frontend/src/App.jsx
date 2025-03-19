import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProfessorDashboard from "./components/Professor/ProfessorDashboard";
import StudentDashboard from "./components/Student/StudentDashboard";
import { ThemeContextProvider } from "./context/ThemeContext";

function App() {
  const isAuthenticated = !!localStorage.getItem("token");
  const role = localStorage.getItem("role");

  console.log("Utilisateur authentifié :", isAuthenticated);
  console.log("Rôle actuel dans localStorage :", role);

  return (
    <ThemeContextProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                role === "professor" ? (
                  <ProfessorDashboard />
                ) : role === "student" ? (
                  <StudentDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard/corrections"
            element={
              isAuthenticated ? (
                role === "professor" || role === "student" ? (
                  <div>Section Corrections (à implémenter)</div>
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard/grades"
            element={
              isAuthenticated && role === "professor" ? (
                <div>Section Ajuster les notes (à implémenter)</div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard/performance"
            element={
              isAuthenticated ? (
                role === "professor" || role === "student" ? (
                  <div>Section Performance (à implémenter)</div>
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/subject/:id" element={<div>Page de traitement du sujet (à implémenter)</div>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeContextProvider>
  );
}

export default App;