import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../services/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Link,
  MenuItem,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
    nom: "",
    prenom: "",
    telephone: "",
    sexe: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await register(formData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d’inscription");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      <Grid
        container
        sx={{
          height: "100%",
          width: "100%",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Section gauche : Formulaire d'inscription */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            backgroundColor: "#1C2526",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: { xs: 2, md: 4 },
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <Typography
            variant="h2"
            color="#FFFFFF"
            gutterBottom
            sx={{ textAlign: "center", fontSize: { xs: "1.5rem", md: "2rem" } }}
          >
            Inscription
          </Typography>
          <Typography
            variant="body1"
            color="#B0BEC5"
            gutterBottom
            sx={{ textAlign: "center", fontSize: { xs: "0.875rem", md: "1rem" } }}
          >
            Entrez vos identifiants
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
              {error}
            </Typography>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Prénom *"
              variant="outlined"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "#B0BEC5", mr: 1 }} />,
              }}
              InputLabelProps={{ style: { color: "#B0BEC5" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#4A4A4A" },
                  "&:hover fieldset": { borderColor: "#7C4DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
                  backgroundColor: "#2C2F33",
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
              required
            />
            <TextField
              fullWidth
              label="Nom *"
              variant="outlined"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "#B0BEC5", mr: 1 }} />,
              }}
              InputLabelProps={{ style: { color: "#B0BEC5" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#4A4A4A" },
                  "&:hover fieldset": { borderColor: "#7C4DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
                  backgroundColor: "#2C2F33",
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
              required
            />
            <TextField
              fullWidth
              label="Téléphone"
              variant="outlined"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              InputProps={{
                startAdornment: <PhoneIcon sx={{ color: "#B0BEC5", mr: 1 }} />,
              }}
              InputLabelProps={{ style: { color: "#B0BEC5" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#4A4A4A" },
                  "&:hover fieldset": { borderColor: "#7C4DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
                  backgroundColor: "#2C2F33",
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
            />
            <TextField
              fullWidth
              label="Email *"
              variant="outlined"
              name="email"
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: <EmailIcon sx={{ color: "#B0BEC5", mr: 1 }} />,
              }}
              InputLabelProps={{ style: { color: "#B0BEC5" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#4A4A4A" },
                  "&:hover fieldset": { borderColor: "#7C4DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
                  backgroundColor: "#2C2F33",
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
              required
            />
            <TextField
              fullWidth
              label="Mot de passe *"
              variant="outlined"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: "#B0BEC5", mr: 1 }} />,
              }}
              InputLabelProps={{ style: { color: "#B0BEC5" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#4A4A4A" },
                  "&:hover fieldset": { borderColor: "#7C4DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
                  backgroundColor: "#2C2F33",
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
              required
            />
            <TextField
              fullWidth
              label="Confirmer le mot de passe *"
              variant="outlined"
              type="password"
              InputProps={{
                startAdornment: <LockIcon sx={{ color: "#B0BEC5", mr: 1 }} />,
              }}
              InputLabelProps={{ style: { color: "#B0BEC5" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#4A4A4A" },
                  "&:hover fieldset": { borderColor: "#7C4DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
                  backgroundColor: "#2C2F33",
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
              required
            />
            <TextField
              fullWidth
              select
              label="Sexe *"
              name="sexe"
              value={formData.sexe}
              onChange={handleChange}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "#B0BEC5", mr: 1 }} />,
              }}
              InputLabelProps={{ style: { color: "#B0BEC5" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#4A4A4A" },
                  "&:hover fieldset": { borderColor: "#7C4DFF" },
                  "&.Mui-focused fieldset": { borderColor: "#7C4DFF" },
                  backgroundColor: "#2C2F33",
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
              required
            >
              <MenuItem value="">Sélectionner</MenuItem>
              <MenuItem value="M">Masculin</MenuItem>
              <MenuItem value="F">Féminin</MenuItem>
            </TextField>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, py: 1.5, backgroundColor: "#7C4DFF" }}
            >
              Connexion
            </Button>
            <Typography
              variant="body2"
              color="#B0BEC5"
              sx={{ mt: 2, textAlign: "center" }}
            >
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                underline="hover"
                color="#7C4DFF"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Connectez-vous !
              </Link>
            </Typography>
          </Box>
        </Grid>

        {/* Section droite : Illustration et slogan */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            backgroundColor: "#7C4DFF",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: { xs: 2, md: 4 },
            height: "100%",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <Typography
            variant="h1"
            color="#FFFFFF"
            gutterBottom
            sx={{ fontSize: { xs: "1.5rem", md: "2.5rem" } }}
          >
            Welcome to the BaseBrain's Portal
          </Typography>
          <Typography
            variant="body1"
            color="#E0E0E0"
            gutterBottom
            sx={{ fontSize: { xs: "0.75rem", md: "1rem" } }}
          >
            Inscrivez-vous pour accéder à votre espace personnel
          </Typography>
          <Box
            component="img"
            src="https://via.placeholder.com/400x300" // Remplace par ton illustration
            alt="Illustration BaseBrain"
            sx={{ maxWidth: "100%", mt: 2 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Register;