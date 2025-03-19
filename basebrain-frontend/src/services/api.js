  import axios from "axios";

  const api = axios.create({
    baseURL: "http://localhost:3001/api",
    withCredentials: true,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  export const login = (email, password) => api.post("/auth/login", { email, password });
  export const register = (data) => api.post("/auth/register", data);
  export const createExercise = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("deadline", data.deadline);
    formData.append("file", data.file);
    return api.post("/professor/exercises", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  export const postCorrection = (data) =>
    api.post("/professor/corrections", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  export const getCorrectionsByExercise = (exerciseId) =>
    api.get(`/professor/corrections/exercise/${exerciseId}`);
  export const getExercisesForProfessor = () => api.get("/professor/exercises");
  export const getSubmissionsForProfessor = () => api.get("/professor/submissions/exercise"); // Ajuste selon ton endpoint
  export const getSubmissionsForProfessorById = (exerciseId) =>
    api.get(`/professor/submissions/exercise/${exerciseId}`);
  export const putSubmission = (submissionId, data) =>
    api.put(`/professor/submissions/${submissionId}`, data);
  export const updateSubmission = (submissionId, data) =>
    api.put(`/submissions/${submissionId}`, data);

  export const getStudentPerformance = () => api.get("/professor/dashboard/student-performance");
  export const getDashboardStatistics = () => api.get("/professor/dashboard/statistics");
  
  //Students
  export const getExercises = () => api.get("/student/exercises");
  export const getUserInfo = () => api.get("/auth/me");
  export const getSubmissions = () => api.get("/student/submissions");
  export const postSubmission = (data) =>
    api.post("/student/submissions", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  export const getPerformance = () => api.get("/student/performance");
  export const getSignedFileUrl = (fileName) => api.get(`/professor/corrections/file-signed/${fileName}`);
  export default api;