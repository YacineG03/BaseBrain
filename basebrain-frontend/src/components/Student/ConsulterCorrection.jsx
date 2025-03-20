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
  Modal,
  Alert,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  getSubmissions,
  getStudentSubmissionFile,
  getCorrectionsForExercise,
  getCorrectionFileForStudent,
} from "../../services/api";

const ConsulterCorrection = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data } = await getSubmissions();
        console.log("Soumissions reçues:", data); // Log pour débogage
        setSubmissions(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des soumissions :", err);
        setError("Erreur lors de la récupération des soumissions.");
      } finally {
        setLoadingSubmissions(false);
      }
    };
    fetchSubmissions();
  }, []);

  useEffect(() => {
    const fetchCorrections = async () => {
      if (selectedSubmission) {
        setLoadingCorrections(true);
        try {
          const response = await getCorrectionsForExercise(selectedSubmission.exercise_id);
          console.log("Corrections reçues:", response.data.corrections); // Log pour débogage
          setCorrections(response.data.corrections || []);
        } catch (err) {
          console.error("Erreur lors de la récupération des corrections :", err);
          setError("Erreur lors de la récupération des corrections : " + err.message);
        } finally {
          setLoadingCorrections(false);
        }
      }
    };
    fetchCorrections();
  }, [selectedSubmission]);

  const handleViewSubmissionFile = async (fileUrl) => {
    setLoadingPdf(true);
    setError("");
    try {
      const fileName = fileUrl.split("/").pop();
      console.log("Tentative de récupération du fichier de soumission:", fileName);
      const fileBlob = await getStudentSubmissionFile(fileName);
      const blobUrl = URL.createObjectURL(fileBlob);
      console.log("URL du blob générée:", blobUrl);
      setSelectedPdfUrl(blobUrl);
    } catch (err) {
      console.error("Erreur lors de la récupération du fichier soumis:", err);
      setError("Impossible de charger le fichier PDF soumis : " + err.message);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleViewCorrectionFile = async (fileUrl) => {
    setLoadingPdf(true);
    setError("");
    try {
      const fileName = fileUrl.split("/").pop();
      console.log("Tentative de récupération du fichier de correction:", fileName);
      const fileBlob = await getCorrectionFileForStudent(fileName);
      const blobUrl = URL.createObjectURL(fileBlob);
      console.log("URL du blob générée:", blobUrl);
      setSelectedPdfUrl(blobUrl);
    } catch (err) {
      console.error("Erreur lors de la récupération du fichier de correction:", err);
      setError("Impossible de charger le fichier PDF de correction : " + err.message);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleCloseModal = () => {
    if (selectedPdfUrl) {
      URL.revokeObjectURL(selectedPdfUrl);
    }
    setSelectedPdfUrl(null);
    setLoadingPdf(false);
    setError("");
  };

  if (loadingSubmissions) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {selectedSubmission ? (
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
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => handleViewSubmissionFile(selectedSubmission.file_path)}
            sx={{ mt: 2, mb: 2, color: "#5b21b6", borderColor: "#5b21b6" }}
            disabled={loadingPdf}
          >
            Voir votre soumission
          </Button>
          <Paper
            sx={{
              p: 3,
              mt: 2,
              borderRadius: "10px",
              bgcolor: "#f3e8ff",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#5b21b6" }}>
              Feedback
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "#333" }}>
              {selectedSubmission.feedback ? (
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

          <Paper
            sx={{
              p: 3,
              mt: 3,
              borderRadius: "10px",
              bgcolor: "#f3e8ff",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#5b21b6" }}>
              Corrections de l'exercice
            </Typography>
            {loadingCorrections ? (
              <CircularProgress />
            ) : corrections.length > 0 ? (
              <List>
                {corrections.map((correction) => (
                  <ListItem
                    key={correction.id}
                    divider
                    sx={{
                      backgroundColor: "#e0d4f7",
                      borderRadius: "5px",
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={correction.title}
                      secondary={correction.description}
                    />
                    {correction.models && correction.models.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {correction.models.map((model, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewCorrectionFile(model.file_url)}
                            sx={{ color: "#5b21b6", borderColor: "#5b21b6" }}
                            disabled={loadingPdf}
                          >
                            Fichier {index + 1}
                          </Button>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: "#666" }}>
                        Aucun fichier de correction associé.
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: "#666" }}>
                Aucune correction disponible pour cet exercice.
              </Typography>
            )}
          </Paper>
        </Box>
      ) : (
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

      <Modal
        open={!!selectedPdfUrl || loadingPdf}
        onClose={handleCloseModal}
        disableEnforceFocus
        aria-labelledby="modal-pdf-title"
        aria-describedby="modal-pdf-description"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            position: "relative",
            width: "80%",
            height: "80%",
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
            overflow: "auto",
          }}
        >
          <Button onClick={handleCloseModal} sx={{ mb: 2, color: "#5b21b6" }}>
            Fermer
          </Button>
          {loadingPdf ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <CircularProgress />
            </Box>
          ) : selectedPdfUrl ? (
            <iframe
              src={selectedPdfUrl}
              title="PDF Viewer"
              style={{ width: "100%", height: "100%", border: "none" }}
              onError={(e) => {
                console.error("Erreur iframe:", e);
                setError("Erreur lors du chargement du PDF.");
                handleCloseModal();
              }}
            />
          ) : (
            <Typography>Erreur lors du chargement du PDF.</Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default ConsulterCorrection;