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

  //Routes de connexion et d'inscription
  export const login = (email, password) => api.post("/auth/login", { email, password });
  export const register = (data) => api.post("/auth/register", data);

  //Route du prof
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
  export const getSubmissionsForProfessor = () => api.get("/professor/submissions/exercise"); 

  export const getSubmissionFile = async (fileName) => {
    const response = await api.get(`/professor/submissions/file/${fileName}`, {
      responseType: "blob",
    });
    return response.data;
  };
    export const getSubmissionsForProfessorById = (exerciseId) =>
    api.get(`/professor/submissions/exercise/${exerciseId}`);
  export const putSubmission = (submissionId, data) =>
    api.put(`/professor/submissions/${submissionId}`, data);

  export const updateSubmission = (submissionId, data) =>
    api.put(`/submissions/${submissionId}`, data);

  export const getStudentPerformance = () => api.get("/professor/dashboard/student-performance");
  export const getDashboardStatistics = () => api.get("/professor/dashboard/statistics");
  // Récupérer un fichier de correction (non chiffré)
// export const getCorrectionFileForStudent = async (fileName) => {
//   const response = await api.get(`/professor/corrections/file/${fileName}`, {
//     responseType: "blob",
//   });
//   return response.data;
// };
  

  //Students
  export const getExercises = () => api.get("/student/exercises");
  export const getUserInfo = () => api.get("/auth/me");
  export const getSubmissions = () => api.get("/student/submissions");
  export const postSubmission = (data) =>
    api.post("/student/submissions", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  // Récupérer un fichier de soumission (déchiffré) pour l'étudiant
export const getStudentSubmissionFile = async (fileName) => {
  const response = await api.get(`/student/submissions/file/${fileName}`, {
    responseType: "blob",
  });
  return response.data;
};

// Récupérer toutes les corrections pour un exercice spécifique (étudiant)
export const getCorrectionsForExercise = async (exerciseId) => {
  return await api.get(`/student/corrections/exercise/${exerciseId}`);
};
export const getCorrectionFileForStudent = async (fileName) => {
  const response = await api.get(`/student/corrections/file/${fileName}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    responseType: 'blob',
  });
  return response.data;
};

  export const getPerformance = () => api.get("/student/performance");
  export const getSignedFileUrl = (fileName) => api.get(`/professor/corrections/file-signed/${fileName}`);
  export const getSignedExerciseFileUrlProfessor = (fileName) =>
    api.get(`/professor/exercises/file-signed/${fileName}`);

  export const getExerciseFile = async (fileName) => {
  const response = await axios.get(`/student/exercises/file/${fileName}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    responseType: 'blob',
  });
  return response.data;
};
  export default api;
