'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Verifique esta linha
import styles from './registro.module.css'; 

export default function RegistroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.message || 'Ocorreu um erro no registro.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
      console.error(err);
    }
  };

  return (
    // Verifique o uso de "styles."
    <div className={styles.authWrapper}>
      <div className={styles.authContainer}>
        
        <header className={styles.headerCurveBackground}>
          <div className={styles.logoPlaceholder}>A</div>
          <h1 className={styles.titleText}>Criar Conta</h1>
          <p className={styles.subtitleText}>Preencha seus dados para começar</p>
        </header>

        <main className={styles.formWrapper}>
          <form onSubmit={handleSubmit} className={styles.formFields}>
            
            {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}

            <div className={styles.inputGroup}>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.textInput}
                placeholder=" " 
                required
              />
              <label htmlFor="name" className={styles.inputLabel}>Nome Completo</label>
            </div>

            <div className={styles.inputGroup}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.textInput}
                placeholder=" "
                required
              />
              <label htmlFor="email" className={styles.inputLabel}>Email</label>
            </div>

            <div className={styles.passwordGroup}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.textInput}
                placeholder=" "
                required
              />
              <label htmlFor="password" className={styles.inputLabel}>Senha</label>
              <button 
                type="button" 
                className={styles.passwordToggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'} 
              </button>
            </div>

            <button type="submit" className={styles.registerButton}>Registrar</button>
          </form>

          <div className={styles.footerLinkContainer}>
            <Link href="/login" className={styles.loginLink}>
              Já tem uma conta? Faça login
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

