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
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // 🚀 Import de useNavigate

const Login = () => {
  const navigate = useNavigate(); // Hook pour la navigation 🚀

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            Connexion
          </Typography>
          <Typography variant="body2" color="gray" mb={3}>
            Entrez vos identifiants
          </Typography>

          {/* Champ Email */}
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
            }}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Champ Mot de passe */}
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            variant="outlined"
            margin="normal"
            InputProps={{
              style: { backgroundColor: "#222", color: "#fff" },
            }}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Link href="#" variant="body2" sx={{ color: "#9b59b6", display: "block", mt: 1 }}>
            Mot de passe oublié ?
          </Link>

          {/* Bouton Connexion */}
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#9b59b6",
              mt: 3,
              "&:hover": { backgroundColor: "#8e44ad" },
            }}
          >
            Connexion
          </Button>

          {/* Lien Inscription */}
          <Typography variant="body2" sx={{ mt: 3, color: "gray" }}>
            Vous n'avez pas de compte ?{" "}
            <Link
              component="button"
              onClick={() => navigate("/register")} // 🚀 Redirection vers l'inscription
              sx={{ color: "#9b59b6", cursor: "pointer" }}
            >
              Inscrivez-vous !
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
          Connectez-vous pour accéder à votre espace personnel
        </Typography>

        {/* Image Illustration */}
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

export default Login;  