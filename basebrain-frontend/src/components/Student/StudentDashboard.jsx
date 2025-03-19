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
import { getUserInfo, getExercises, getSubmissions } from "../../services/api";
import TraiterSujet from "./TraiterSujet";
import ConsulterCorrection from "./ConsulterCorrection";
import SuivrePerformance from "./SuivrePerformance";

function StudentDashboard() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [activeSection, setActiveSection] = useState("Traiter un sujet");
  const [userName, setUserName] = useState("Étudiant");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data } = await getUserInfo();
        setUserName(`${data.first_name || data.email.split('@')[0]} ${data.last_name || ''}`);
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
            button
            selected={activeSection === "Traiter un sujet"}
            onClick={() => handleNavigation("Traiter un sujet")}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.secondary.main,
                "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main },
              },
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AssignmentIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Traiter un sujet" />
          </ListItem>
          <ListItem
            button
            selected={activeSection === "Consulter la correction"}
            onClick={() => handleNavigation("Consulter la correction")}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.secondary.main,
                "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main },
              },
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DescriptionIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Consulter la correction" />
          </ListItem>
          <ListItem
            button
            selected={activeSection === "Suivre sa performance"}
            onClick={() => handleNavigation("Suivre sa performance")}
            sx={{
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: (theme) => theme.palette.secondary.main,
                "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main },
              },
              "&:hover": { backgroundColor: (theme) => theme.palette.secondary.main + "80" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BarChartIcon sx={{ color: (theme) => theme.palette.text.primary }} />
            </ListItemIcon>
            <ListItemText primary="Suivre sa performance" />
          </ListItem>
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <List sx={{ px: 2, pb: 2 }}>
          <ListItem
            button
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
            button
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
        {activeSection === "Traiter un sujet" && <TraiterSujet />}
        {activeSection === "Consulter la correction" && <ConsulterCorrection />}
        {activeSection === "Suivre sa performance" && <SuivrePerformance />}
      </Box>
    </Box>
  );
}

export default StudentDashboard;