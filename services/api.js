import axios from 'axios';

// Normaliza e limpa a URL da API do backend
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    const cleaned = envUrl.replace(/[\[\]\(\)'"`]/g, '').trim().replace(/\/+$/, '');
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }
    if (cleaned.length > 0) {
      return `https://${cleaned}`;
    }
  }

  // Fallback inteligente para ambiente web em produção (Vercel)
  if (typeof window !== 'undefined') {
    if (window.location.hostname.endsWith('vercel.app')) {
      return 'https://avaliacao-fisica-backend.onrender.com';
    }
    return `${window.location.protocol}//${window.location.hostname}:3333`;
  }

  return 'https://avaliacao-fisica-backend.onrender.com';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Interceptor de REQUISIÇÕES: adiciona o token no header Authorization
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('@TCCAuth:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPOSTAS
api.interceptors.response.use(
  (response) => {
    // Se deu tudo certo com a resposta, apenas retorna ela
    return response;
  },
  (error) => {
    // Se a requisição deu erro...
    if (error.response) {
      // Se for um erro 401 (Não autorizado / Token Expirado)
      if (error.response.status === 401) {
        console.warn("Sessão expirada ou não autorizada. Redirecionando para login...");
        
        // Verifica se não estamos já na página de login para evitar loop infinito
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          // Limpa qualquer vestígio do AuthContext no localStorage (opcional)
          localStorage.removeItem('user'); 
          
          // Redireciona o usuário "à força" para a tela de login
          window.location.href = '/login';
        }
      }
    }
    
    // Repassa o erro para o componente (ex: para mostrar um toast.error)
    return Promise.reject(error);
  }
);

export default api;