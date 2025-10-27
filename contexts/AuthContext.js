"use client"; // <--- PASSO MAIS IMPORTANTE!

import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Efeito que roda quando o app carrega
  useEffect(() => {
    async function loadUserFromStorage() {
      const token = localStorage.getItem('@TCCAuth:token');
      if (token) {
        try {
          // Diz ao axios para usar este token em todas as requisições futuras
          api.defaults.headers.Authorization = `Bearer ${token}`;
          // Aqui poderíamos buscar os dados do usuário com o token, mas por enquanto vamos guardar o que temos
          const userData = JSON.parse(localStorage.getItem('@TCCAuth:user'));
          setUser(userData);
        } catch (e) {
          localStorage.clear();
        }
      }
      setLoading(false);
    }
    loadUserFromStorage();
  }, []);

  async function signIn(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;

      // 1. Salvar os dados no localStorage para persistir a sessão
      localStorage.setItem('@TCCAuth:user', JSON.stringify(userData));
      localStorage.setItem('@TCCAuth:token', token);

      // 2. Atualizar o header do axios com o novo token
      api.defaults.headers.Authorization = `Bearer ${token}`;

      // 3. Atualizar o estado
      setUser(userData);

      // 4. Redirecionar para a página principal
      router.push('/home'); // Vamos criar essa página em breve
    } catch (error) {
      console.error('Falha no login:', error.response?.data?.error);
      // Aqui você pode/deve mostrar um alerta de erro para o usuário
      alert(error.response?.data?.error || 'Não foi possível fazer login.');
    }
  }

  function signOut() {
    localStorage.clear();
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso
export const useAuth = () => useContext(AuthContext);