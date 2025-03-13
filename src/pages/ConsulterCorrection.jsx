import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const corrections = [
  { id: 1, sujet: "Sujet 1", note: 14, correction: "Contenu détaillé de la correction du Sujet 1..." },
  { id: 2, sujet: "Sujet 2", note: 16, correction: "Correction du Sujet 2 ici..." },
  { id: 3, sujet: "Sujet 3", note: 12, correction: "Correction du Sujet 3 ici..." },
  { id: 4, sujet: "Sujet 4", note: 18, correction: "Correction du Sujet 4 ici..." },
];

const ConsulterCorrection = () => {
  const [selectedSujet, setSelectedSujet] = useState(null);

  return (
    <Box sx={{ p: 3 }}>
      {selectedSujet ? (
        // Affichage des détails d'un sujet sélectionné
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedSujet(null)}
            sx={{ mb: 2 }}
          >
            Retour
          </Button>
          <Typography variant="h4" fontWeight="bold">
            Les notes et corrections
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            <strong>{selectedSujet.sujet}</strong>
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            Votre note sur 20: <strong>{selectedSujet.note}</strong>
          </Typography>
          <Paper sx={{ p: 2, mt: 2, borderRadius: "10px" }}>
            <Typography>{selectedSujet.correction}</Typography>
          </Paper>
        </Box>
      ) : (
        // Affichage de la liste des sujets
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Liste des exercices traités
          </Typography>
          <Paper sx={{ p: 2, borderRadius: "10px" }}>
            <List>
              {corrections.map((correction) => (
                <ListItem
                  key={correction.id}
                  divider
                  sx={{
                    backgroundColor: "#553883",
                    color: "white",
                    borderRadius: "5px",
                    mb: 1,
                    "&:hover": { backgroundColor: "#44276B" },
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedSujet(correction)}
                >
                  <ListItemText primary={correction.sujet} />
                  <IconButton sx={{ color: "white" }}>
                    <ArrowForwardIosIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ConsulterCorrection;
