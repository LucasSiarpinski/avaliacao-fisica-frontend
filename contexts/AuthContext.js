"use client";

import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // O useEffect agora serve para carregar os dados do usuário que salvamos
  // no localStorage. Isso evita que a UI "pisque" (mostrando "Olá, !" 
  // antes de mostrar "Olá, Lucas!").
  useEffect(() => {
    function loadUserFromStorage() {
      const storedUser = localStorage.getItem('@TCCAuth:user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
    loadUserFromStorage();
  }, []);

async function signIn(email, password) {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    const { user: userData, token } = response.data;
    localStorage.setItem('@TCCAuth:user', JSON.stringify(userData));
    localStorage.setItem('@TCCAuth:token', token);
    setUser(userData);

    // Redirecionar para a página home
    window.location.href = '/home';
    
  } catch (error) {
    console.error('Falha no login:', error.response?.data?.error);
    alert(error.response?.data?.error || 'Não foi possível fazer login.');
  }
}

  async function signOut() {
    // 1. Limpamos o usuário e o token do localStorage.
    localStorage.removeItem('@TCCAuth:user');
    localStorage.removeItem('@TCCAuth:token');
    setUser(null);

    try {
      // 2. Chamamos a rota de logout no backend (opcional).
      await api.post('/api/auth/logout');
    } catch (error) {
      // Mesmo que a chamada falhe, continuamos o processo de logout.
      console.error("Erro ao fazer logout no backend:", error);
    }
    
    // 3. Redirecionamos o usuário para a página de login.
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
