// app/login/page.js

"use client";

import './login.css';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // 1. IMPORTAR O CONTEXTO

export default function LoginPage() {
  // 2. CRIAR ESTADOS PARA OS INPUTS
  const [email, setEmail] = useState(''); // Vamos usar email em vez de código/cpf
  const [password, setPassword] = useState('');

  // Estados que você já tinha, mantemos eles
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 3. PEGAR A FUNÇÃO DE LOGIN DO CONTEXTO
  const { signIn } = useAuth();
  
  // 4. ATUALIZAR A FUNÇÃO DE SUBMISSÃO
  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn(email, password); // Chama a função da API
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="header-curve-background">
          {/* ... seu cabeçalho continua igual ... */}
        </div>

        <div className="form-wrapper">
          <form className="form-fields" onSubmit={handleSubmit}>
            
            {/* 5. CONECTAR OS INPUTS AO ESTADO */}
            <div className="input-group">
              <input
                id="email" // Mudamos para 'email' para consistência
                name="email"
                type="email" // Usar type="email" é uma boa prática
                required
                className="text-input"
                placeholder=" "
                value={email} // Conectar o valor ao estado
                onChange={(e) => setEmail(e.target.value)} // Atualizar o estado ao digitar
              />
              <label htmlFor="email" className="input-label">Email</label>
            </div>

            <div className="input-group password-group">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="text-input"
                placeholder=" "
                value={password} // Conectar o valor ao estado
                onChange={(e) => setPassword(e.target.value)} // Atualizar o estado ao digitar
              />
              <label htmlFor="password" className="input-label">Senha</label>
              {/* ... resto do seu campo de senha ... */}
            </div>
            
            {/* ... resto do seu formulário ... */}

            <button type="submit" className="login-button">ENTRAR</button>
          </form>
          
          {/* ... resto do seu componente ... */}
        </div>
      </div>
    </div>
  );
}