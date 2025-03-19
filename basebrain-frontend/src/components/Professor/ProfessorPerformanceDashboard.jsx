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
import { getStudentPerformance, getDashboardStatistics } from "../../services/api";

const ProfessorPerformanceDashboard = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les performances des étudiants
        const performanceResponse = await getStudentPerformance();
        console.log("Données de performance des étudiants :", performanceResponse.data);

        // Récupérer les statistiques globales
        const statisticsResponse = await getDashboardStatistics();
        console.log("Données statistiques :", statisticsResponse.data);

        // Formatter les données pour les graphiques
        const formattedPerformance = performanceResponse.data.data.studentStats.map((student) => {
          const submissions = student.submissions.map((sub) => ({
            date: sub.submitted_at.substring(0, 10), // Format YY-MM-DD
            note: student.averageNote || 0,
            exercise: sub.exercise_title,
          }));
          return { ...student, submissions };
        });

        setPerformanceData(formattedPerformance);
        setStatisticsData(statisticsResponse.data.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <CircularProgress />;

  // Calculer la tendance globale (simplifié)
  const calculateTrend = (stats) => {
    if (!stats || !stats.learningTrends || stats.learningTrends.length < 2) return "stable";
    const diffs = stats.learningTrends
      .slice(1)
      .map((trend, i) => trend.averageNote - stats.learningTrends[i].averageNote);
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return avgDiff > 0 ? "up" : avgDiff < 0 ? "down" : "stable";
  };

  const trend = calculateTrend(statisticsData);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <BarChartIcon sx={{ fontSize: 32, color: "#5b21b6", mr: 1 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Suivi des performances des étudiants
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Graphique d'évolution des notes moyennes des étudiants */}
      <Card sx={{ mb: 4, p: 2, borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5b21b6", fontWeight: "bold" }}>
            Évolution des notes moyennes des étudiants
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statisticsData?.learningTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 20]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="averageNote"
                stroke="#8e5cda"
                name="Note moyenne"
              />
            </LineChart>
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
                {statisticsData?.totalSubmissions || 0}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body1" color="text.secondary">
                Taux de réussite :
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#2e7d32">
                {statisticsData?.successRate || "0"}%
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body1" color="text.secondary">
                Note moyenne :
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#333">
                {statisticsData?.averageNote || "N/A"} / 20
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Tendance globale :
            </Typography>
            <Chip
              icon={
                trend === "up" ? (
                  <TrendingUpIcon />
                ) : trend === "down" ? (
                  <TrendingDownIcon />
                ) : (
                  <TrendingFlatIcon />
                )
              }
              label={
                trend === "up"
                  ? "Amélioration"
                  : trend === "down"
                  ? "Baisse"
                  : "Stable"
              }
              color={
                trend === "up" ? "success" : trend === "down" ? "error" : "default"
              }
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Questions mal comprises */}
      <Card sx={{ mb: 4, p: 2, borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5b21b6", fontWeight: "bold" }}>
            Questions mal comprises
          </Typography>
          {statisticsData?.poorlyUnderstoodQuestions.length > 0 ? (
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Question</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Occurrences</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Note moyenne</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Exemples de feedback</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statisticsData.poorlyUnderstoodQuestions.map((question, index) => (
                  <TableRow key={index}>
                    <TableCell>{question.question}</TableCell>
                    <TableCell>{question.count}</TableCell>
                    <TableCell>{question.averageGrade} / 20</TableCell>
                    <TableCell>
                      {question.feedbackExamples
                        .slice(0, 2)
                        .map((feedback, i) => (
                          <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                            {feedback}
                          </Typography>
                        ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography sx={{ color: "#666", textAlign: "center" }}>
              Aucune question mal comprise détectée.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Comparaison des performances par étudiant */}
      <Card sx={{ p: 2, borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#5b21b6", fontWeight: "bold" }}>
            Comparaison des performances par étudiant
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="student_name" />
              <YAxis domain={[0, 20]} />
              <Tooltip />
              <Bar dataKey="averageNote" fill="#8e5cda" name="Note moyenne" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfessorPerformanceDashboard;