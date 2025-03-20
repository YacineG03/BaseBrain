import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Container,
  TextField,
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Modal,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from "react-router-dom";
import { getExercises, postSubmission, getExerciseFile } from "../../services/api";

function TraiterSujet() {
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const navigate = useNavigate();

  // Récupérer la liste des exercices
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const { data } = await getExercises();
        console.log("Exercices récupérés :", data);
        if (Array.isArray(data) && data.length > 0) {
          setExercises(data);
        } else {
          setError("Aucun exercice disponible pour cet étudiant.");
        }
      } catch (err) {
        console.error("Erreur détaillée :", err);
        setError(
          err.response?.data?.error ||
          "Impossible de charger les exercices. Veuillez réessayer."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  // Gestion du dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      setError("Veuillez sélectionner un fichier.");
      setFile(null);
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile.type.includes("pdf")) {
      setError("Veuillez sélectionner un fichier PDF uniquement.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  // Filtrer les exercices par recherche
  const filteredExercises = exercises.filter((exercise) =>
    exercise.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Récupérer le fichier PDF de l'exercice
  const handleViewExerciseFile = async (fileUrl) => {
    setLoadingPdf(true);
    setError("");
    try {
      const fileName = fileUrl.split("/").pop();
      console.log("Tentative de récupération du fichier d'exercice:", fileName);
      const fileBlob = await getExerciseFile(fileName);
      const blobUrl = URL.createObjectURL(fileBlob);
      console.log("URL du blob générée:", blobUrl);
      setSelectedPdfUrl(blobUrl);
    } catch (err) {
      console.error("Erreur lors de la récupération du fichier d'exercice:", err);
      setError("Impossible de charger le fichier PDF de l'exercice : " + err.message);
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

  // Soumettre la soumission
  const handleSubmit = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier avant de soumettre.");
      return;
    }

    if (!selectedExerciseId) {
      setError("Veuillez sélectionner un exercice.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("exercise_id", selectedExerciseId);

    try {
      const response = await postSubmission(formData);
      setSuccess("Soumission envoyée avec succès ! Correction en cours...");
      setFile(null);

      // Faire disparaître le message après 3 secondes et rediriger
      setTimeout(() => {
        setSuccess("");
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      console.error("Erreur soumission :", err);
      setError(
        err.response?.data?.error || "Erreur lors de la soumission. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        component={Paper}
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          borderRadius: 2,
          bgcolor: "#fff",
          boxShadow: "10px 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h6" gutterBottom align="center">
          Choisissez un sujet
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              fullWidth
              select
              label="Sélectionner un exercice"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              sx={{
                mb: 4,
                backgroundColor: "#e9d5ff",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#a78bfa" },
                  "&:hover fieldset": { borderColor: "#7c4dff" },
                  "&.Mui-focused fieldset": { borderColor: "#a78bfa" },
                },
              }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Sélectionner un exercice</option>
              {filteredExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.title}
                </option>
              ))}
            </TextField>

            {selectedExerciseId && (
              <>
                <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
                  Uploadez votre solution
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => {
                      const selectedExercise = exercises.find(
                        (ex) => ex.id === parseInt(selectedExerciseId)
                      );
                      if (selectedExercise && selectedExercise.content) {
                        handleViewExerciseFile(selectedExercise.content);
                      } else {
                        setError("Aucun fichier PDF associé à cet exercice.");
                      }
                    }}
                    sx={{ color: "#5b21b6", borderColor: "#5b21b6" }}
                    disabled={loadingPdf}
                  >
                    Voir le sujet
                  </Button>
                </Box>
                <Box
                  {...getRootProps()}
                  sx={{
                    border: "2px dashed #d8b4fe",
                    borderRadius: 2,
                    p: 4,
                    textAlign: "center",
                    bgcolor: "#e9d5ff",
                    cursor: "pointer",
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUploadIcon fontSize="large" sx={{ color: "#fff" }} />
                  <Typography sx={{ color: "#fff", mt: 1 }}>
                    Drag & Drop un fichier PDF ici
                  </Typography>
                  <Typography sx={{ color: "#fff", fontWeight: "bold", mt: 1 }}>ou</Typography>
                  <Button variant="contained" sx={{ mt: 1, bgcolor: "#5b21b6" }}>
                    Parcourir
                  </Button>
                </Box>
                {file && (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{ mt: 2, bgcolor: "#5b21b6", "&:hover": { bgcolor: "#44276b" } }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Soumettre"}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedExerciseId("");
                    setFile(null);
                    setError("");
                  }}
                  sx={{ mt: 2, ml: 2, color: "#5b21b6", borderColor: "#5b21b6" }}
                >
                  Retour
                </Button>
              </>
            )}

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && (
              <Alert
                severity="success"
                icon={<CheckCircleOutlineIcon />}
                sx={{
                  mt: 2,
                  bgcolor: "#e6f4ea",
                  color: "#2e7d32",
                  "& .MuiAlert-icon": { color: "#2e7d32" },
                }}
              >
                {success}
              </Alert>
            )}
          </>
        )}
      </Box>

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
    </Container>
  );
}

export default TraiterSujet;