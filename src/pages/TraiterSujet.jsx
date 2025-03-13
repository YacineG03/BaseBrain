import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Container, TextField, Box, Paper, Typography, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function TraiterSujet() {
  const onDrop = useCallback((acceptedFiles) => {
    console.log(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h6" gutterBottom align="center">
          Traiter un sujet
        </Typography>

        

        <Box
          {...getRootProps()}
          sx={{
            border: "2px dashed #a78bfa",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            bgcolor: "#d8b4fe",
            cursor: "pointer",
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon fontSize="large" sx={{ color: "#fff" }} />
          <Typography sx={{ color: "#fff", mt: 1 }}>Drag & Drop files here</Typography>
          <Typography sx={{ color: "#fff", fontWeight: "bold", mt: 1 }}>or</Typography>
          <Button variant="contained" sx={{ mt: 1, bgcolor: "#5b21b6" }}>
            Browse file
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default TraiterSujet;
