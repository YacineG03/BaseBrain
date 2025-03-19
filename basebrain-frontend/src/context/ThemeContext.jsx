import React, { createContext, useState, useMemo } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export const ThemeContext = createContext();

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState("light");

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                primary: { main: "#7C4DFF" },
                secondary: { main: "#E6E1FF" },
                background: {
                  default: "#F5F7FA",
                  paper: "#FFFFFF",
                  sidebar: "#7C4DFF",
                  input: "#2C2F33",
                },
                text: {
                  primary: "#1C2526",
                  secondary: "#B0BEC5",
                },
              }
            : {
                primary: { main: "#7C4DFF" },
                secondary: { main: "#B0BEC5" },
                background: {
                  default: "#121212",
                  paper: "#1C2526",
                  sidebar: "#1C2526",
                  input: "#2C2F33",
                },
                text: {
                  primary: "#FFFFFF",
                  secondary: "#B0BEC5",
                },
              }),
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}