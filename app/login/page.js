// app/login/page.js
"use client";

import { useState } from 'react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Formulário de login submetido! (Funcionalidade a ser implementada!)');
  };

  return (
    // Fundo escuro e centralizado
    <div className="login-wrapper">
      
      {/* Container Principal */}
      <div className="login-container">

        {/* --- CABEÇALHO COM FORMA CURVA --- */}
        <div className="header-curve-background">
          <div className="header-content">
            {/* Logo placeholder - substitua por um SVG ou Imagem real */}
            <div className="logo-placeholder">
              <span className="logo-text">
                &times;
              </span>
            </div>
            
            <h1 className="title-text">UNOESC</h1>
            <p className="subtitle-text">Somos a melhor Universidade Comunitária de Santa Catarina.</p>
          </div>
        </div>

        {/* --- FORMULÁRIO --- */}
        <div className="form-wrapper">
          
          <form className="form-fields" onSubmit={handleSubmit}>
            {/* Campo Código ou CPF */}
            <div className="input-group">
              <input
                id="codigo"
                name="codigo"
                type="text"
                required
                className="text-input"
                placeholder=" "
                defaultValue="406047"
              />
              <label htmlFor="codigo" className="input-label">Código ou CPF</label>
            </div>

            {/* Campo de Senha */}
            <div className="input-group password-group">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="text-input"
                placeholder=" "
                defaultValue="********"
              />
              <label htmlFor="password" className="input-label">Senha</label>
              <button 
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁️
              </button>
            </div>
            
            {/* Lembre-me */}
            <div className="remember-me-group">
                <div className="checkbox-container">
                    <input 
                        id="remember-me" 
                        name="remember-me" 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="checkbox-input"
                    />
                    <label htmlFor="remember-me" className="checkbox-label">
                        Lembrar meus dados de acesso
                    </label>
                </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              className="login-button"
            >
              ENTRAR
            </button>
          </form>
          
          {/* Biometria e Esqueceu Senha */}
          <div className="footer-links">
             <div className="biometry-link">
                 <span className="biometry-text">Usar senha do celular</span>
                 {/* Toggle Switch placeholder */}
                 <span className="biometry-toggle">
                    <span className="biometry-switch-ball"></span>
                 </span>
             </div>
             
             <a href="#" className="forgot-password-link">
                Esqueci minha senha
             </a>
          </div>
        </div>
        
      </div>
    </div>
  );
}