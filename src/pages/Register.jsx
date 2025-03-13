import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Grid,
  Paper,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { Email, Lock, Phone, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; 

const Register = () => {
  const navigate = useNavigate(); 

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <Grid container component="main" sx={{ height: "100vh" }}>
      {/* Section gauche : Formulaire */}
      <Grid
        item
        xs={12}
        sm={6}
        component={Paper}
        elevation={6}
        square
        sx={{
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: 4,
        }}
      >
        <Container maxWidth="xs">
          <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
            Inscription
          </Typography>
          <Typography variant="body2" color="gray" mb={3}>
            Entrez vos identifiants
          </Typography>

          {/* Prénom */}
          <TextField
            fullWidth
            label="Prénom"
            name="prenom"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: "#9b59b6" }} />
                </InputAdornment>
              ),
            }}
            onChange={handleChange}
          />

          {/* Nom */}
          <TextField
            fullWidth
            label="Nom"
            name="nom"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: "#9b59b6" }} />
                </InputAdornment>
              ),
            }}
            onChange={handleChange}
          />

          {/* Téléphone */}
          <TextField
            fullWidth
            label="Téléphone"
            name="telephone"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
              startAdornment: (
                <InputAdornment position="start">
                  <Phone sx={{ color: "#9b59b6" }} />
                </InputAdornment>
              ),
            }}
            onChange={handleChange}
          />

          {/* Email */}
          <TextField
            fullWidth
            label="Email"
            name="email"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: "#9b59b6" }} />
                </InputAdornment>
              ),
            }}
            onChange={handleChange}
          />

          {/* Mot de passe */}
          <TextField
            fullWidth
            label="Mot de passe"
            name="password"
            type="password"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: "#9b59b6" }} />
                </InputAdornment>
              ),
            }}
            onChange={handleChange}
          />

          {/* Confirmer mot de passe */}
          <TextField
            fullWidth
            label="Confirmer le mot de passe"
            name="confirmPassword"
            type="password"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: "#9b59b6" }} />
                </InputAdornment>
              ),
            }}
            onChange={handleChange}
          />

          {/* Sélection du rôle */}
          <Select
            fullWidth
            displayEmpty
            name="role"
            variant="outlined"
            sx={{ backgroundColor: "#222", color: "#fff", mt: 2 }}
            value={form.role}
            onChange={handleChange}
          >
            <MenuItem value="" disabled>
              Rôle
            </MenuItem>
            <MenuItem value="admin">Professeur</MenuItem>
            <MenuItem value="utilisateur">Étudiant</MenuItem>
          </Select>

          {/* Bouton Connexion */}
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#9b59b6",
              mt: 3,
              "&:hover": { backgroundColor: "#8e44ad" },
            }}
            onClick={() => navigate("/login")} // 🚀 Redirection vers login
          >
            Connexion
          </Button>

          {/* Lien Connexion */}
          <Typography variant="body2" sx={{ mt: 3, color: "gray" }}>
            Vous avez déjà un compte ?{" "}
            <Link
              component="button"
              onClick={() => navigate("/login")} // 🚀 Redirection avec le lien
              sx={{ color: "#9b59b6", cursor: "pointer" }}
            >
              Connectez-vous !
            </Link>
          </Typography>
        </Container>
      </Grid>

      {/* Section droite : Illustration & texte */}
      <Grid
        item
        xs={12}
        sm={6}
        sx={{
          backgroundColor: "#7D50FF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          color: "#fff",
          px: 4,
        }}
      >
        <Typography component="h1" variant="h4" fontWeight="bold">
          Welcome to the <span style={{ color: "#ddd" }}>BaseBrain’s</span> portal
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, maxWidth: "70%" }}>
          Inscrivez-vous pour accéder à votre espace personnel
        </Typography>

        
        <Box
          component="img"
          src="/src/assets/telechargement.jpg"
          alt="Illustration"
          sx={{ width: "60%", mt: 4 }}
        />
      </Grid>
    </Grid>
  );
};

export default Register;
