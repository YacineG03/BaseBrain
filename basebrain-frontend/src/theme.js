import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#7C4DFF", // Violet utilisé pour le bouton et les accents
    },
    background: {
      default: "#1C2526", // Fond sombre pour la section gauche
      paper: "#2C2F33", // Fond des champs et formulaires
    },
    text: {
      primary: "#FFFFFF", // Texte blanc pour contraste
      secondary: "#B0BEC5", // Texte gris clair pour les sous-titres
    },
  },
  typography: {
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    body1: {
      color: "#B0BEC5",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#2C2F33",
          borderRadius: "4px",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#4A4A4A",
            },
            "&:hover fieldset": {
              borderColor: "#7C4DFF",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#7C4DFF",
            },
          },
          "& .MuiInputBase-input": {
            color: "#FFFFFF",
          },
          "& .MuiInputLabel-root": {
            color: "#B0BEC5",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#7C4DFF",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;