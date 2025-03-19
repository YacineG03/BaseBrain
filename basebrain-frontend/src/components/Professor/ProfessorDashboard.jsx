import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AddBoxIcon from "@mui/icons-material/AddBox";
import EditIcon from "@mui/icons-material/Edit"; // Icône pour "Ajuster les notes"
import ProfessorCreateExercise from "./ProfessorCreateExercise";
import ProfessorCorrection from "./ProfessorCorrection";
import ProfessorStudentList from "./ProfessorStudentList";
import ProfessorPerformanceDashboard from "./ProfessorPerformanceDashboard";
import { getUserInfo } from "../../services/api";

function ProfessorDashboard() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [activeSection, setActiveSection] = useState("Dépôt d’un sujet");
  const [userName, setUserName] = useState("Professeur");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data } = await getUserInfo();
        setUserName(`${data.first_name || data.email.split("@")[0]} ${data.last_name || ""}`);
      } catch (err) {
        console.error("Erreur lors de la récupération des informations de l'utilisateur :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            backgroundColor: (theme) => theme.palette.background.sidebar,
            color: (theme) => theme.palette.text.primary,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: "left" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Base Brain
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Salut, {userName}
          </Typography>
        </Box>
        <Divider sx={{ backgroundColor: (theme) => theme.palette.text.secondary + "33", mx: 2 }} />
        <List sx={{ px: 2 }}>
          <ListItem
            onClick={() => handleNavigation("Dépôt d’un sujet")}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.secondary.main,
                "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main },
              },
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
              backgroundColor:
                activeSection === "Dépôt d’un sujet"
                  ? (theme) => theme.palette.secondary.main
                  : "transparent",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AddBoxIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Dépôt d’un sujet" />
          </ListItem>
          <ListItem
            onClick={() => handleNavigation("Proposer la correction par sujet")}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.secondary.main,
                "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main },
              },
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
              backgroundColor:
                activeSection === "Proposer la correction par sujet"
                  ? (theme) => theme.palette.secondary.main
                  : "transparent",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AssignmentIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Proposer la correction par sujet" />
          </ListItem>
          <ListItem
            onClick={() => handleNavigation("Ajuster les notes générées par IA")}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.secondary.main,
                "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main },
              },
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
              backgroundColor:
                activeSection === "Ajuster les notes générées par IA"
                  ? (theme) => theme.palette.secondary.main
                  : "transparent",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <EditIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Ajuster les notes générées par IA" />
          </ListItem>
          <ListItem
            onClick={() => handleNavigation("PERFORMANCES")}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.secondary.main,
                "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main },
              },
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
              backgroundColor:
                activeSection === "PERFORMANCES"
                  ? (theme) => theme.palette.secondary.main
                  : "transparent",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BarChartIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Performances" />
          </ListItem>
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <List sx={{ px: 2, pb: 2 }}>
          <ListItem
            onClick={toggleTheme}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {mode === "light" ? (
                <Brightness4Icon sx={{ color: (theme) => theme.palette.text.primary }} />
              ) : (
                <Brightness7Icon sx={{ color: (theme) => theme.palette.text.primary }} />
              )}
            </ListItemIcon>
            <ListItemText primary={mode === "light" ? "Mode sombre" : "Mode clair"} />
          </ListItem>
          <ListItem
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItem>
        </List>
      </Drawer>

      {/* Contenu principal */}
      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: (theme) => theme.palette.background.default,
          height: "100%",
          overflow: "auto",
        }}
      >
        {activeSection === "Dépôt d’un sujet" && <ProfessorCreateExercise />}
        {activeSection === "Proposer la correction par sujet" && <ProfessorCorrection />}
        {activeSection === "Ajuster les notes générées par IA" && <ProfessorStudentList />}
        {activeSection === "PERFORMANCES" && <ProfessorPerformanceDashboard />}
      </Box>
    </Box>
  );
}

export default ProfessorDashboard;