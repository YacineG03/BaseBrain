import React, { useContext, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ThemeContext } from "../../context/ThemeContext";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { createExercise } from "../../services/api";

function SubjectForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    file: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { mode } = useContext(ThemeContext);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData({ ...formData, file: acceptedFiles[0] });
      }
    },
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }
    try {
      await createExercise({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        file: formData.file,
      });
      setSuccess("Sujet déposé avec succès !");
      setError("");
      setFormData({ title: "", description: "", deadline: "", file: null });
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du dépôt du sujet");
      setSuccess("");
    }
  };

  return (
    <Box sx={{ p: 4, flexGrow: 1 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: (theme) => theme.palette.text.primary }}
      >
        Dépôt d’un sujet
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          backgroundColor: (theme) => theme.palette.background.input,
          border: "none",
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Nom *"
            variant="outlined"
            name="title"
            value={formData.title}
            onChange={handleChange}
            InputLabelProps={{ style: { color: (theme) => theme.palette.text.secondary } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#4A4A4A" },
                "&:hover fieldset": { borderColor: (theme) => theme.palette.primary.main },
                "&.Mui-focused fieldset": { borderColor: (theme) => theme.palette.primary.main },
                backgroundColor: (theme) => theme.palette.background.input,
              },
              "& .MuiInputBase-input": { color: (theme) => theme.palette.text.primary },
            }}
            required
          />
          <TextField
            fullWidth
            label="Description *"
            variant="outlined"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            InputLabelProps={{ style: { color: (theme) => theme.palette.text.secondary } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#4A4A4A" },
                "&:hover fieldset": { borderColor: (theme) => theme.palette.primary.main },
                "&.Mui-focused fieldset": { borderColor: (theme) => theme.palette.primary.main },
                backgroundColor: (theme) => theme.palette.background.input,
              },
              "& .MuiInputBase-input": { color: (theme) => theme.palette.text.primary },
            }}
            required
          />
          <TextField
            fullWidth
            label="Date limite *"
            variant="outlined"
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            InputLabelProps={{ shrink: true, style: { color: (theme) => theme.palette.text.secondary } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#4A4A4A" },
                "&:hover fieldset": { borderColor: (theme) => theme.palette.primary.main },
                "&.Mui-focused fieldset": { borderColor: (theme) => theme.palette.primary.main },
                backgroundColor: (theme) => theme.palette.background.input,
              },
              "& .MuiInputBase-input": { color: (theme) => theme.palette.text.primary },
            }}
            required
          />
        </Box>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundColor: (theme) => theme.palette.secondary.main,
          textAlign: "center",
          border: "1px dashed #7C4DFF",
        }}
      >
        <Box {...getRootProps()}>
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: (theme) => theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ mt: 2, color: (theme) => theme.palette.text.primary }}>
            Drag & Drop files here
          </Typography>
          <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }}>
            or
          </Typography>
          <Button
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: (theme) => theme.palette.primary.main,
              "&:hover": { backgroundColor: "#6A40CC" },
            }}
          >
            Browse file
          </Button>
        </Box>
        {formData.file && (
          <Typography variant="body2" sx={{ mt: 2, color: (theme) => theme.palette.text.primary }}>
            Fichier sélectionné : {formData.file.name}
          </Typography>
        )}
      </Paper>

      {error && (
        <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
          {error}
        </Typography>
      )}
      {success && (
        <Typography color="success.main" sx={{ mt: 2, textAlign: "center" }}>
          {success}
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 3, py: 1.5, backgroundColor: (theme) => theme.palette.primary.main }}
        onClick={handleSubmit}
      >
        Déposer le sujet
      </Button>
    </Box>
  );
}

export default SubjectForm;