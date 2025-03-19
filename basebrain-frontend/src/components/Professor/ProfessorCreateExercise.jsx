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
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useNavigate } from "react-router-dom";
import { createExercise, getExercisesForProfessor } from "../../services/api";

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
  const navigate = useNavigate();

  // Définir fetchExercises dans la portée du composant
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

  // Récupérer la liste des exercices du professeur au montage
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
    </Container>
  );
}

export default ProfessorCreateExercise;