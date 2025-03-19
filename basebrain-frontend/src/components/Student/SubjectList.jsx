import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getExercises } from "../../services/api";

function SubjectList() {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await getExercises();
        setSubjects(data);
        setFilteredSubjects(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des sujets :", err);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    setFilteredSubjects(
      subjects.filter((subject) =>
        subject.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, subjects]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubjectClick = (subjectId) => {
    navigate(`/subject/${subjectId}`);
  };

  return (
    <Box sx={{ p: 4, flexGrow: 1 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: (theme) => theme.palette.text.primary }}
      >
        Choisissez un sujet
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Rechercher un sujet"
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: (theme) => theme.palette.primary.main }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 4,
          backgroundColor: (theme) => theme.palette.secondary.main,
          borderRadius: 1,
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#7C4DFF" },
            "&:hover fieldset": { borderColor: "#6A40CC" },
            "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
          },
        }}
      />
      <List>
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => (
            <ListItem
              button
              key={subject.id}
              onClick={() => handleSubjectClick(subject.id)}
              sx={{
                mb: 2,
                backgroundColor: (theme) => theme.palette.primary.main,
                color: "#FFFFFF",
                borderRadius: 1,
                "&:hover": { backgroundColor: "#6A40CC" },
              }}
            >
              <ListItemText primary={subject.title} />
              <ArrowForwardIcon sx={{ color: "#FFFFFF" }} />
            </ListItem>
          ))
        ) : (
          <Typography sx={{ textAlign: "center", color: (theme) => theme.palette.text.primary }}>
            Aucun sujet trouvé.
          </Typography>
        )}
      </List>
    </Box>
  );
}

export default SubjectList;