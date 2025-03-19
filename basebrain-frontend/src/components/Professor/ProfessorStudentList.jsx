import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  getSubmissionsForProfessorById,
  getExercisesForProfessor,
  putSubmission,
} from "../../services/api";

function ProfessorStudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les exercices
        const exercisesResponse = await getExercisesForProfessor();
        const exercisesData = exercisesResponse.data.exercises || [];
        setExercises(exercisesData);

        // Sélectionner le premier exercice par défaut si disponible
        if (exercisesData.length > 0 && !selectedExerciseId) {
          setSelectedExerciseId(exercisesData[0].id);
        }

        // Récupérer les soumissions uniquement si un exercice est sélectionné
        if (selectedExerciseId) {
          const submissionsResponse = await getSubmissionsForProfessorById(selectedExerciseId);
          const submissions = submissionsResponse.data.submissions || [];

          // Agréger les données par étudiant
          const studentData = submissions.reduce((acc, submission) => {
            const exercise = exercisesData.find((e) => e.id === submission.exercise_id);
            const studentName = submission.student_name || `Étudiant ${submission.student_id}`;
            if (!acc[submission.student_id]) {
              acc[submission.student_id] = {
                id: submission.student_id,
                name: studentName,
                note: submission.note || null,
                submissionId: submission.id,
                exerciseTitle: exercise ? exercise.title : "Inconnu",
              };
            }
            return acc;
          }, {});

          setStudents(Object.values(studentData));
          console.log("Exercices:", exercisesResponse.data);
          console.log("Soumissions:", submissionsResponse.data);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Impossible de charger la liste des étudiants. Vérifiez votre connexion ou contactez un administrateur.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedExerciseId]); // Recharger quand l'exercice change

  const handleOpenDialog = (student) => {
    setSelectedStudent(student);
    setNote(student.note?.toString() || "");
    setFeedback("");
  };

  const handleCloseDialog = () => {
    setSelectedStudent(null);
    setNote("");
    setFeedback("");
  };

  const handleSaveCorrection = async () => {
    if (!selectedStudent || !selectedStudent.submissionId) return;

    setLoading(true);
    try {
      const updatedData = {
        note: note ? parseFloat(note) : null,
        feedback: feedback || null,
      };
      await putSubmission(selectedStudent.submissionId, updatedData);
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === selectedStudent.id
            ? { ...student, note: updatedData.note }
            : student
        )
      );
      setError("");
      handleCloseDialog();
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la soumission :", err);
      setError("Échec de la mise à jour de la note.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Liste des étudiants
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Sélection de l'exercice */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Choisir un exercice</InputLabel>
        <Select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          label="Choisir un exercice"
        >
          {exercises.map((exercise) => (
            <MenuItem key={exercise.id} value={exercise.id}>
              {exercise.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {students.map((student) => (
        <Box
          key={student.id}
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "#5b21b6",
            color: "white",
            borderRadius: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography>{`Étudiant: ${student.name}`}</Typography>
          <Box>
            <Typography>{`Note: ${student.note !== null ? student.note : "Non évalué"}`}</Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenDialog(student)}
              sx={{ ml: 2, bgcolor: "#d8b4fe", "&:hover": { bgcolor: "#c084fc" } }}
            >
              Corriger
            </Button>
          </Box>
        </Box>
      ))}

      <Dialog open={!!selectedStudent} onClose={handleCloseDialog}>
        <DialogTitle>{`Corriger: ${selectedStudent?.name}`}</DialogTitle>
        <DialogContent>
          <TextField
            label="Note (0-20)"
            type="number"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ min: 0, max: 20 }}
          />
          <TextField
            label="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleSaveCorrection}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Valider"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProfessorStudentList;