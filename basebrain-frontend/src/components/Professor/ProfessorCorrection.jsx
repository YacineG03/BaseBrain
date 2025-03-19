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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Modal,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
import { getExercisesForProfessor, postCorrection, getCorrectionsByExercise, getSignedFileUrl } from "../../services/api";

function ProfessorCorrection() {
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [corrections, setCorrections] = useState([]);
  const [showCorrections, setShowCorrections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null); // Changé de blob à URL directe
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const { data } = await getExercisesForProfessor();
        if (Array.isArray(data.exercises) && data.exercises.length > 0) {
          setExercises(data.exercises);
        } else {
          setError("Aucun exercice disponible.");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des exercices :", err);
        setError(`Impossible de charger les exercices (statut: ${err.response?.status}).`);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const fetchCorrections = async (exerciseId) => {
    setLoading(true);
    try {
      const { data } = await getCorrectionsByExercise(exerciseId);
      console.log("Réponse API corrections:", data);
      setCorrections(Array.isArray(data.corrections) ? data.corrections : data);
    } catch (err) {
      console.error("Erreur lors de la récupération des corrections :", err);
      setError(`Erreur lors de la récupération des corrections (statut: ${err.response?.status}).`);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const invalidFiles = acceptedFiles.filter((file) => !file.type.includes("pdf"));
    if (invalidFiles.length > 0) {
      setError("Veuillez sélectionner uniquement des fichiers PDF.");
      return;
    }

    if (acceptedFiles.length + files.length > 5) {
      setError("Vous ne pouvez uploader que 5 fichiers maximum au total.");
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    setError("");
  }, [files]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 5,
  });

  const removeFile = (fileToRemove) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  const handleSubmit = async () => {
    if (!selectedExerciseId) {
      setError("Veuillez sélectionner un exercice.");
      return;
    }

    if (!title || !description) {
      setError("Le titre et la description sont requis.");
      return;
    }

    if (files.length === 0) {
      setError("Veuillez uploader au moins un fichier de correction.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("exercise_id", selectedExerciseId);
    formData.append("title", title);
    formData.append("description", description);
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await postCorrection(formData);
      setSuccess("Correction ajoutée avec succès !");
      setFiles([]);
      setTitle("");
      setDescription("");
      setTimeout(() => {
        setSuccess("");
        fetchCorrections(selectedExerciseId);
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la soumission :", err);
      setError(`Erreur lors de l'ajout de la correction (statut: ${err.response?.status}).`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (fileUrl) => {
    try {
      const fileName = fileUrl.split("/").pop();
      const { data } = await getSignedFileUrl(fileName);
      setSelectedPdfUrl(data.signedUrl);
    } catch (err) {
      console.error("Erreur lors de la récupération de l’URL signée:", err);
      setError("Impossible de charger le fichier PDF.");
    }
  };

  const handleDownload = async (fileUrl) => {
    try {
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileUrl.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      setError("Impossible de télécharger le fichier.");
    }
  };

  const handleCloseModal = () => {
    setSelectedPdfUrl(null);
  };

  return (
    <Container maxWidth="md">
      <Box
        component={Paper}
        elevation={3}
        sx={{ p: 4, mt: 8, borderRadius: 2, bgcolor: "#fff", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}
      >
        <Typography variant="h6" gutterBottom align="center">
          {showCorrections
            ? "Liste des corrections proposées"
            : selectedExerciseId
            ? "Proposer la correction par sujet"
            : "Liste des sujets"}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : showCorrections ? (
          <Box>
            <Button
              variant="outlined"
              onClick={() => setShowCorrections(false)}
              sx={{ mb: 2, color: "#5b21b6", borderColor: "#5b21b6" }}
            >
              Retour
            </Button>
            {corrections.length > 0 ? (
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Titre</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Fichiers</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {corrections.map((correction) => (
                    <TableRow key={correction.id}>
                      <TableCell>{correction.title || "Non défini"}</TableCell>
                      <TableCell>{correction.description || "Non défini"}</TableCell>
                      <TableCell>
                        {correction.models && correction.models.length > 0 ? (
                          correction.models.map((model, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Button
                                variant="outlined"
                                onClick={() => handleViewFile(model.file_url)}
                                sx={{ mr: 1, color: "#5b21b6", borderColor: "#5b21b6" }}
                              >
                                Voir Fichier {index + 1}
                              </Button>
                            </Box>
                          ))
                        ) : (
                          <Typography>Aucun fichier disponible</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {correction.models && correction.models.length > 0 && (
                          <IconButton
                            onClick={() => handleDownload(correction.models[0].file_url)}
                            sx={{ color: "#5b21b6" }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography sx={{ textAlign: "center", color: "#666" }}>
                Aucune correction proposée pour cet exercice.
              </Typography>
            )}
          </Box>
        ) : selectedExerciseId ? (
          <Box>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedExerciseId("");
                setFiles([]);
                setTitle("");
                setDescription("");
                setError("");
                setSuccess("");
              }}
              sx={{ mb: 2, color: "#5b21b6", borderColor: "#5b21b6" }}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                fetchCorrections(selectedExerciseId);
                setShowCorrections(true);
              }}
              sx={{ mb: 2, ml: 2, bgcolor: "#5b21b6", "&:hover": { bgcolor: "#44276b" } }}
            >
              Voir les corrections proposées
            </Button>
            <TextField
              fullWidth
              label="Titre de la correction"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <Box
              {...getRootProps()}
              sx={{
                border: "2px dashed #d8b4fe",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                bgcolor: "#e9d5ff",
                cursor: "pointer",
                mb: 2,
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
            {files.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Fichiers uploadés :</Typography>
                <List>
                  {files.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={file.name} />
                      <IconButton
                        onClick={() => removeFile(file)}
                        sx={{ color: "#d32f2f" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ bgcolor: "#5b21b6", "&:hover": { bgcolor: "#44276b" } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Ajouter la correction"}
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          </Box>
        ) : (
          <Box>
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
              SelectProps={{ native: true }}
            >
              <option value="">Sélectionner un exercice</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.title}
                </option>
              ))}
            </TextField>
          </Box>
        )}

        <Modal
          open={!!selectedPdfUrl}
          onClose={handleCloseModal}
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
            {selectedPdfUrl ? (
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
              <Typography>Chargement du PDF...</Typography>
            )}
          </Box>
        </Modal>
      </Box>
    </Container>
  );
}

export default ProfessorCorrection;