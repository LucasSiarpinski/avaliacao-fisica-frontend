// app/(MAIN)/home/page.js
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import styles from './home.module.css';

export default function HomePage() {
  const router = useRouter();
  const [kpis, setKpis] = useState({
    ativos: 0,
    novosMes: 0,
    avaliacoesMes: 0,
    riscoMedico: 0,
    anamnesesPendentes: 0,
    avaliacoesHoje: 0
  });
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca nome do usuário no local storage
    const userStr = localStorage.getItem('@App:user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUserName(userObj.name?.split(' ')[0] || 'Usuário');
      } catch (e) {}
    }

    // Busca KPIs do backend
    const fetchKPIs = async () => {
      try {
        const response = await api.get('/dashboard/kpis');
        setKpis(response.data);
      } catch (error) {
        console.error('Erro ao carregar KPIs da dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  // Icon Helpers
  const IconUsers = () => (
    <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  );
  
  const IconCalendar = () => (
    <svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
  );

  const IconActivity = () => (
    <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
  );

  const IconAlert = () => (
    <svg viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
  );

  const IconClipboard = () => (
    <svg viewBox="0 0 24 24"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
  );

  const IconClock = () => (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  );

  const IconPlus = () => (
    <svg viewBox="0 0 24 24"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
  );

  if (loading) {
    return <div style={{ color: '#fff', padding: '2rem' }}>Carregando painel...</div>;
  }

  return (
    <div className={styles.container}>
      
      {/* HEADER */}
      <header className={styles.header}>
        <h1 className={styles.title}>Olá, {userName} 👋</h1>
        <p className={styles.subtitle}>
          Você possui <span className={styles.highlight}>{kpis.ativos} alunos ativos</span> e <span className={styles.highlight}>{kpis.avaliacoesHoje} avaliações</span> agendadas para hoje.
        </p>
      </header>

      {/* STATS GRID */}
      <section className={styles.statsGrid}>
        
        {/* 1. Alunos Ativos */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Alunos Ativos</p>
            <div className={`${styles.statIconWrapper} ${styles.iconBlue}`}>
              <IconUsers />
            </div>
          </div>
          <div>
            <p className={styles.statValue}>{kpis.ativos}</p>
            <p className={styles.statTrend}>Métricas da sua base atual</p>
          </div>
        </div>

        {/* 2. Novos no Mês */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Novos no Mês</p>
            <div className={`${styles.statIconWrapper} ${styles.iconGreen}`}>
              <IconCalendar />
            </div>
          </div>
          <div>
            <p className={styles.statValue}>+{kpis.novosMes}</p>
            <p className={styles.statTrend}>Cadastros neste mês</p>
          </div>
        </div>

        {/* 3. Avaliações no Mês */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Avaliações Realizadas</p>
            <div className={`${styles.statIconWrapper} ${styles.iconPurple}`}>
              <IconActivity />
            </div>
          </div>
          <div>
            <p className={styles.statValue}>{kpis.avaliacoesMes}</p>
            <p className={styles.statTrend}>Total no mês atual</p>
          </div>
        </div>

        {/* 4. Risco Médico */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Risco Médico (Atenção)</p>
            <div className={`${styles.statIconWrapper} ${styles.iconRed}`}>
              <IconAlert />
            </div>
          </div>
          <div>
            <p className={styles.statValue}>{kpis.riscoMedico}</p>
            <p className={styles.statTrend}>Alunos com PAR-Q positivo</p>
          </div>
        </div>

        {/* 5. Anamneses Pendentes */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Anamneses Pendentes</p>
            <div className={`${styles.statIconWrapper} ${styles.iconOrange}`}>
              <IconClipboard />
            </div>
          </div>
          <div>
            <p className={styles.statValue}>{kpis.anamnesesPendentes}</p>
            <p className={styles.statTrend}>Requer preenchimento</p>
          </div>
        </div>

        {/* 6. Avaliações Hoje */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statLabel}>Avaliações Hoje</p>
            <div className={`${styles.statIconWrapper} ${styles.iconTeal}`}>
              <IconClock />
            </div>
          </div>
          <div>
            <p className={styles.statValue}>{kpis.avaliacoesHoje}</p>
            <p className={styles.statTrend}>Criadas ou agendadas hoje</p>
          </div>
        </div>

      </section>
      
      {/* AÇÕES RÁPIDAS */}
      <section className={styles.actionsSection}>
        <h2 className={styles.actionsHeader}>Ações Rápidas</h2>
        <div className={styles.actionsContainer}>
          <button 
            className={`${styles.actionButton} ${styles.btnPrimary}`}
            onClick={() => router.push('/avaliacoes/nova')}
            style={{ backgroundColor: '#a855f7' }} // Purple accent for evaluation
          >
            <IconActivity /> Nova Avaliação
          </button>

          <button 
            className={`${styles.actionButton} ${styles.btnPrimary}`}
            onClick={() => router.push('/alunos/cadastro')}
          >
            <IconPlus /> Novo Aluno
          </button>
          
          <button 
            className={`${styles.actionButton} ${styles.btnSecondary}`}
            onClick={() => router.push('/alunos')}
          >
            <IconUsers /> Ver Base de Alunos
          </button>

          <button 
            className={`${styles.actionButton} ${styles.btnSecondary}`}
            onClick={() => router.push('/relatorios')}
          >
            <IconClipboard /> Acessar Relatórios
          </button>
        </div>
      </section>

    </div>
  );
}