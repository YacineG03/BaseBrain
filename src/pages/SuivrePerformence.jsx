import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Divider } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Exemple de données simulées (remplacer par API backend)
const mockPerformanceData = [
  { date: "2024-12-01", note: 12, moyenne: 10 },
  { date: "2025-01-15", note: 14, moyenne: 11 },
  { date: "2025-02-10", note: 16, moyenne: 13 },
  { date: "2025-03-05", note: 15, moyenne: 14 },
];

const SuivrePerformance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Appel API pour récupérer les données réelles
  useEffect(() => {
    // Simuler chargement API
    setTimeout(() => {
      setPerformanceData(mockPerformanceData); // Remplacer par appel API réel
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Suivi de vos performances
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Évolution de vos notes
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 20]} />
              <Tooltip />
              <Line type="monotone" dataKey="note" stroke="#8e5cda" name="Votre note" />
              <Line type="monotone" dataKey="moyenne" stroke="#82ca9d" name="Moyenne classe" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Comparaison avec la moyenne de la classe
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 20]} />
              <Tooltip />
              <Bar dataKey="note" fill="#8e5cda" name="Votre note" />
              <Bar dataKey="moyenne" fill="#82ca9d" name="Moyenne classe" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card sx={{ p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Dernière note obtenue
          </Typography>
          <Typography variant="h3" color="primary" fontWeight="bold">
            {performanceData[performanceData.length - 1]?.note} / 20
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Moyenne de la classe : {performanceData[performanceData.length - 1]?.moyenne} / 20
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SuivrePerformance;
