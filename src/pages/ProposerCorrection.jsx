import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Paper } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

const ProposerCorrection = () => {
  const [selectedSujet, setSelectedSujet] = useState(null);
  const [file, setFile] = useState(null);

  // Exemple de liste de sujets (peut venir d'une API)
  const sujets = [
    { id: 1, title: 'Sujet 1' },
    { id: 2, title: 'Sujet 2' },
    { id: 3, title: 'Sujet 3' },
  ];

  // Gestion du Drag and Drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    if (file && selectedSujet) {
      console.log("Sujet choisi :", selectedSujet);
      console.log("Fichier :", file);
      alert(`Correction pour "${selectedSujet.title}" bien envoyée !`);
      
    } else {
      alert("Veuillez sélectionner un sujet et ajouter un fichier de correction.");
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Proposer une correction
      </Typography>

      {/* Étape 1 : Choisir un sujet */}
      <Typography variant="h6" gutterBottom>
        Choisir un sujet :
      </Typography>
      <List>
        {sujets.map((sujet) => (
          <ListItem
            key={sujet.id}
            button
            onClick={() => setSelectedSujet(sujet)}
            sx={{
              backgroundColor: selectedSujet?.id === sujet.id ? '#8e5cda' : 'transparent',
              color: selectedSujet?.id === sujet.id ? 'white' : 'inherit',
              borderRadius: 1,
              mb: 1,
              "&:hover": { backgroundColor: '#cbb2f3' },
            }}
          >
            <ListItemText primary={sujet.title} />
          </ListItem>
        ))}
      </List>

      {/* Étape 2 : Drag & Drop */}
      {selectedSujet && (
        <>
          <Typography variant="h6" gutterBottom mt={4}>
            Déposer votre correction pour : <strong>{selectedSujet.title}</strong>
          </Typography>

          <Paper
            elevation={3}
            sx={{
              border: '2px dashed #8e5cda',
              padding: 4,
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              cursor: 'pointer',
              mb: 3,
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <CloudUpload sx={{ fontSize: 60, color: '#8e5cda' }} />
            <Typography variant="body1" mt={2}>
              Glissez & déposez le fichier ici ou cliquez pour sélectionner
            </Typography>
            {file && (
              <Typography variant="body2" mt={2} color="green">
                Fichier sélectionné : {file.name}
              </Typography>
            )}
          </Paper>

          <input
            id="fileInput"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* Bouton d'envoi */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!file}
          >
            Envoyer la correction
          </Button>
        </>
      )}
    </Box>
  );
};

export default ProposerCorrection;
