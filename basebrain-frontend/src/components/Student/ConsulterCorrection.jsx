import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionIcon from "@mui/icons-material/Description";
import { getSubmissions } from "../../services/api";

const ConsulterCorrection = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data } = await getSubmissions();
        setSubmissions(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des soumissions :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      {selectedSubmission ? (
        // Affichage des détails d'un sujet sélectionné
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedSubmission(null)}
            sx={{
              mb: 2,
              bgcolor: "#5b21b6",
              color: "#fff",
              "&:hover": { bgcolor: "#44276b" },
              borderRadius: "8px",
              padding: "8px 16px",
            }}
          >
            Retour
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <DescriptionIcon sx={{ fontSize: 32, color: "#5b21b6", mr: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              Les notes et corrections
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold", color: "#5b21b6" }}>
            {selectedSubmission.exercise_title || "Sujet inconnu"}
          </Typography>
          <Typography variant="h5" sx={{ mt: 1, fontWeight: "bold", color: "#333" }}>
            Votre note sur 20 :{" "}
            <span style={{ color: "#2e7d32" }}>
              {selectedSubmission.note || "Non évaluée"}
            </span>
          </Typography>
          <Paper
            sx={{
              p: 3,
              mt: 2,
              borderRadius: "10px",
              bgcolor: "#f3e8ff",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#333" }}>
              {selectedSubmission.feedback ? (
                // Structurer les questions/réponses
                selectedSubmission.feedback
                  .split(".")
                  .filter((sentence) => sentence.trim().length > 0)
                  .map((sentence, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: "bold", color: "#5b21b6" }}
                      >
                        {`Question ${index + 1}`}:
                      </Typography>{" "}
                      {sentence.trim()}.
                    </Box>
                  ))
              ) : (
                "Aucune correction disponible."
              )}
            </Typography>
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
              {submissions.length > 0 ? (
                submissions.map((submission) => (
                  <ListItem
                    key={submission.id}
                    divider
                    sx={{
                      backgroundColor: "#553883",
                      color: "white",
                      borderRadius: "5px",
                      mb: 1,
                      "&:hover": { backgroundColor: "#44276B" },
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <ListItemText
                      primary={submission.exercise_title || `Soumission #${submission.id}`}
                    />
                    <IconButton sx={{ color: "white" }}>
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </ListItem>
                ))
              ) : (
                <Typography sx={{ textAlign: "center", color: "#666" }}>
                  Aucune soumission trouvée.
                </Typography>
              )}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ConsulterCorrection;