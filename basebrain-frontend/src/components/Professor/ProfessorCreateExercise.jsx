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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Modal,
  Backdrop,
  Fade,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { createExercise, getExercisesForProfessor, getSignedExerciseFileUrlProfessor} from "../../services/api";

function ProfessorCreateExercise() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [signedUrl, setSignedUrl] = useState("");
  const navigate = useNavigate();

  // Récupérer la liste des exercices du professeur au montage
  const fetchExercises = async () => {
    setLoading(true);
    try {
      console.log("Appel à getExercisesForProfessor pour /professor/exercises");
      const { data } = await getExercisesForProfessor();
      if (Array.isArray(data.exercises) && data.exercises.length > 0) {
        setExercises(data.exercises);
      } else {
        setError("Aucun exercice disponible.");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des exercices :", err);
      setError(
        err.response?.data?.error ||
        `Accès interdit ou erreur serveur (statut: ${err.response?.status}). Vérifiez que vous êtes connecté en tant que professeur.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // Gestion du dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 1) {
      setError("Veuillez sélectionner un seul fichier.");
      return;
    }

    const invalidFiles = acceptedFiles.filter(
      (file) => !file.type.includes("pdf") && !file.type.includes("docx")
    );
    if (invalidFiles.length > 0) {
      setError("Veuillez sélectionner uniquement des fichiers PDF ou DOCX.");
      return;
    }

    setFile(acceptedFiles[0]);
    console.log("Fichier sélectionné :", acceptedFiles[0]);
    setError("");
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  });

  // Soumettre l'exercice
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Titre et description sont requis.");
      return;
    }

    if (!file && !textContent) {
      setError("Un fichier ou un contenu texte est requis.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (file) formData.append("file", file);
    if (textContent) formData.append("textContent", textContent);

    // Log pour débogage
    for (let pair of formData.entries()) {
      console.log("FormData entry:", pair[0], pair[1]);
    }

    try {
      console.log("Appel à createExercise pour /professor/exercises");
      const response = await createExercise(formData);
      setSuccess("Exercice créé avec succès !");
      setTitle("");
      setDescription("");
      setTextContent("");
      setDeadline("");
      setFile(null);
      setTimeout(() => {
        setSuccess("");
        fetchExercises(); // Rafraîchir la liste des exercices
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la création de l'exercice :", err.response?.data || err);
      setError(
        err.response?.data?.error ||
        `Erreur lors de la création de l'exercice (statut: ${err.response?.status}). Vérifiez votre accès.`
      );
    } finally {
      setLoading(false);
    }
  };

// Gérer l'ouverture du modal et récupérer l'URL signée si un fichier est présent
const handleOpenModal = async (exercise) => {
  setSelectedExercise(exercise);
  setSignedUrl(""); // Réinitialiser l'URL signée

  // Si l'exercice a un fichier (content commence par une URL MinIO), récupérer l'URL signée
  if (exercise.content && exercise.content.includes("/exercises/")) {
    try {
      const fileName = exercise.content.split("/exercises/")[1]; // Extraire le nom du fichier
      const { data } = await getSignedExerciseFileUrlProfessor(fileName); // Appeler l'API pour obtenir l'URL signée
      setSignedUrl(data.signedUrl);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'URL signée :", err);
      setError("Impossible de charger le fichier de l'exercice.");
    }
  }

  setOpenModal(true);
};

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedExercise(null);
    setSignedUrl("");
  };

  return (
    <Container maxWidth="md">
      <Box
        component={Paper}
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          borderRadius: 2,
          bgcolor: "#fff",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h6" gutterBottom align="center">
          Dépôt d’un sujet
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  mb: 4,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "#f5f5f5",
                }}
              >
                <TextField
                  fullWidth
                  label="Nom"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ backgroundColor: "#e9d5ff" }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ backgroundColor: "#e9d5ff" }}
                />
                <TextField
                  fullWidth
                  label="Date limite"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ backgroundColor: "#e9d5ff" }}
                />
                <TextField
                  fullWidth
                  label="Contenu texte (facultatif)"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ backgroundColor: "#e9d5ff" }}
                />
              </Box>

              <Box
                {...getRootProps()}
                sx={{
                  border: "2px dashed #d8b4fe",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  bgcolor: "#c4a7e7",
                  cursor: "pointer",
                  mb: 2,
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon fontSize="large" sx={{ color: "#fff" }} />
                <Typography sx={{ color: "#fff", mt: 1 }}>
                  Drag & Drop files here
                </Typography>
                <Typography sx={{ color: "#fff", fontWeight: "bold", mt: 1 }}>or</Typography>
                <Button variant="contained" sx={{ mt: 1, bgcolor: "#5b21b6" }}>
                  Browse file
                </Button>
              </Box>
              {file && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">
                    Fichier sélectionné : {file.name}
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                sx={{ bgcolor: "#5b21b6", "&:hover": { bgcolor: "#44276b" } }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Créer le sujet"}
              </Button>
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            </form>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Liste des sujets existants
              </Typography>
              <List>
                {exercises.length > 0 ? (
                  exercises.map((exercise) => (
                    <ListItem
                      key={exercise.id}
                      onClick={() => handleOpenModal(exercise)}
                      sx={{
                        mb: 1,
                        backgroundColor: "#553883",
                        color: "#fff",
                        borderRadius: 1,
                        "&:hover": { backgroundColor: "#44276b", cursor: "pointer" },
                      }}
                    >
                      <ListItemText primary={exercise.title} />
                      <IconButton sx={{ color: "#fff" }}>
                        <ArrowForwardIosIcon />
                      </IconButton>
                    </ListItem>
                  ))
                ) : (
                  <Typography sx={{ textAlign: "center", color: "#666" }}>
                    Aucun sujet disponible.
                  </Typography>
                )}
              </List>
            </Box>
          </>
        )}
      </Box>

      {/* Modal pour afficher les détails de l'exercice */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: 800,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                Détails de l'exercice : {selectedExercise?.title}
              </Typography>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            {selectedExercise && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Description :</strong> {selectedExercise.description}
                </Typography>

                {selectedExercise.content && !selectedExercise.content.includes("/exercises/") && (
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Contenu texte :</strong> {selectedExercise.content}
                  </Typography>
                )}

                {signedUrl && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Fichier associé :</strong>
                    </Typography>
                    <iframe
                      src={signedUrl}
                      title="Exercice PDF"
                      style={{ width: "100%", height: "500px", border: "none" }}
                    />
                  </Box>
                )}

                {selectedExercise.content && selectedExercise.content.includes("/exercises/") && !signedUrl && (
                  <Typography variant="subtitle1" color="error">
                    Impossible de charger le fichier de l'exercice.
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}

export default ProfessorCreateExercise;