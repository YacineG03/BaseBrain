import React from "react";
import {
  Box,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  IconButton,
  Divider,
} from "@mui/material";
import { useNavigate, Outlet } from "react-router-dom";
import {
  CloudDownload,
  Chat,
  Tune,
  BarChart,
  PowerSettingsNew,
  Psychology,
  Brightness4,
  Brightness7,
  EditNote,
} from "@mui/icons-material";

const drawerWidth = 250;

const EspaceEtudiant = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      <CssBaseline />

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#553883",
            color: "white",
            borderRadius: "0px 10px 10px 0px",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
      
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center">
            Base Brain <Psychology sx={{ ml: 1 }} />
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Salut, (Nom étudiant)
          </Typography>
        </Box>

        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }} />

       
        <List>
          <ListItem
            button
            onClick={() => navigate("/espaceetudiant/traiter-sujet")}
            sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <CloudDownload />
            </ListItemIcon>
            <ListItemText primary="Traiter un sujet" />
          </ListItem>

          <ListItem
            button
            onClick={() => navigate("/espaceetudiant/consulter-correction")}
            sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <Chat />
            </ListItemIcon>
            <ListItemText primary="Consulter la correction" />
          </ListItem>

          <ListItem
            button
            onClick={() => navigate("/espaceetudiant/proposer-correction")}
            sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <EditNote />
            </ListItemIcon>
            <ListItemText primary="Proposer une correction" />
          </ListItem>

          

          <ListItem
            button
            onClick={() => navigate("/espaceetudiant/suivre-performence")}
            sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <BarChart />
            </ListItemIcon>
            <ListItemText primary="Suivre Performance" />
          </ListItem>
        </List>

       
        <Box sx={{ mt: "auto", p: 2 }}>
          <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.3)", mb: 1 }} />
          <ListItem
            button
            onClick={handleLogout}
            sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <PowerSettingsNew />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItem>
        </Box>
      </Drawer>

   
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: darkMode ? "#1e1e1e" : "#f4f4f4",
          color: darkMode ? "white" : "black",
          position: "relative",
          borderRadius: "0 10px 10px 0",
          overflow: "hidden",
        }}
      >
      
        <IconButton
          onClick={() => setDarkMode(!darkMode)}
          color="inherit"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1000,
            border: "2px solid white",
            borderRadius: "50%",
            backgroundColor: darkMode ? "#333" : "#f0f0f0",
          }}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        
        <Box
          sx={{
            p: 3,
            height: "100%",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default EspaceEtudiant;
