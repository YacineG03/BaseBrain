import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import BarChartIcon from "@mui/icons-material/BarChart";
import { getPerformance } from "../../services/api";

const SuivrePerformance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [pastPerformance, setPastPerformance] = useState(null);
  const [progression, setProgression] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const { data } = await getPerformance();
        console.log("Données de performance :", data);

        // Formatter les données pour les graphiques
        const formattedData = data.data.performance.labels.map((label, index) => ({
          date: label,
          note: parseFloat(data.data.performance.notes[index]) || 0,
          moyenne: parseFloat(data.data.performance.classAverages[index]) || 0,
          exercise: data.data.performance.exercises[index],
        }));

        setPerformanceData(formattedData);
        setPastPerformance(data.data.pastPerformance);
        setProgression(data.data.progression);
      } catch (err) {
        console.error("Erreur lors de la récupération des performances :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <BarChartIcon sx={{ fontSize: 32, color: "#5b21b6", mr: 1 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Suivi de vos performances
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Graphique d'évolution des notes */}
      <Card sx={{ mb: 4, p: 2, borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5b21b6", fontWeight: "bold" }}>
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

      {/* Graphique de comparaison avec la moyenne de la classe */}
      <Card sx={{ mb: 4, p: 2, borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5b21b6", fontWeight: "bold" }}>
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

      {/* Statistiques globales */}
      <Card sx={{ mb: 4, p: 2, borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5b21b6", fontWeight: "bold" }}>
            Statistiques globales
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body1" color="text.secondary">
                Total des soumissions :
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#333">
                {pastPerformance?.totalSubmissions || 0}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body1" color="text.secondary">
                Note la plus haute :
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#2e7d32">
                {pastPerformance?.highestNote || "N/A"} / 20
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body1" color="text.secondary">
                Note la plus basse :
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#d32f2f">
                {pastPerformance?.lowestNote || "N/A"} / 20
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body1" color="text.secondary">
                Note moyenne :
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#333">
                {pastPerformance?.averageNote || "N/A"} / 20
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Progression dans le temps */}
      <Card sx={{ p: 2, borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5b21b6", fontWeight: "bold" }}>
            Progression dans le temps
          </Typography>
          {progression.length > 0 ? (
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>De</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>À</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Exercice De</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Exercice À</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Différence</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Tendance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progression.map((prog, index) => (
                  <TableRow key={index}>
                    <TableCell>{prog.from}</TableCell>
                    <TableCell>{prog.to}</TableCell>
                    <TableCell>{prog.fromExercise}</TableCell>
                    <TableCell>{prog.toExercise}</TableCell>
                    <TableCell
                      sx={{
                        color: prog.difference > 0 ? "#2e7d32" : prog.difference < 0 ? "#d32f2f" : "#666",
                      }}
                    >
                      {prog.difference > 0 ? "+" : ""}
                      {prog.difference}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          prog.trend === "up" ? (
                            <TrendingUpIcon />
                          ) : prog.trend === "down" ? (
                            <TrendingDownIcon />
                          ) : (
                            <TrendingFlatIcon />
                          )
                        }
                        label={prog.trend === "up" ? "Amélioration" : prog.trend === "down" ? "Baisse" : "Stable"}
                        color={
                          prog.trend === "up" ? "success" : prog.trend === "down" ? "error" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography sx={{ color: "#666", textAlign: "center" }}>
              Aucune donnée de progression disponible.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SuivrePerformance;