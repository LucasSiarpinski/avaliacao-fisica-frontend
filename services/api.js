// services/api.js (frontend)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api', // Sua URL da API
  withCredentials: true, // <--- ESSA LINHA É OBRIGATÓRIA
});

export default api;