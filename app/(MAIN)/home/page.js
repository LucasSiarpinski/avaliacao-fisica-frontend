"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { FaUserPlus, FaHeartbeat } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import NovaAvaliacaoModal from '../../../components/NovaAvaliacaoModal';
import styles from './home.module.css';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isNovaAvaliacaoModalOpen, setIsNovaAvaliacaoModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAlunos: 0,
    alunosAtivos: 0,
    avaliacoesHoje: 0,
    totalAvaliacoes: 0,
    anamnesesPendentes: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Proteção de rota
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Carrega os dados reais do dashboard
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/dashboard');
      if (res.data) {
        setStats(res.data.stats || {
          totalAlunos: 0,
          alunosAtivos: 0,
          avaliacoesHoje: 0,
          totalAvaliacoes: 0,
          anamnesesPendentes: 0,
        });
        setRecentActivity(res.data.recentActivity || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast.error('Não foi possível carregar os dados em tempo real.');
    } finally {
      setLoading(false);
    }
  };

  // Primeiro nome para o "Olá"
  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário';

  const formatActivityDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const renderStatusBadge = (item) => {
    if (item.status === 'completed') {
      return <span className={styles.statusConcluida}>{item.statusLabel || 'Concluída'}</span>;
    }
    if (item.status === 'active') {
      return <span className={styles.statusAtivo}>{item.statusLabel || 'Ativo'}</span>;
    }
    if (item.status === 'inactive') {
      return <span className={styles.statusInativo}>{item.statusLabel || 'Inativo'}</span>;
    }
    return <span className={styles.statusPendente}>{item.statusLabel || 'Em Andamento'}</span>;
  };

  return (
    <>
      <NovaAvaliacaoModal
        isOpen={isNovaAvaliacaoModalOpen}
        onClose={() => setIsNovaAvaliacaoModalOpen(false)}
      />

      <div className={styles.container}>
        {/* Seção do Cabeçalho */}
        <header className={styles.header}>
          <h1 className={styles.title}>
            Olá, <span className={styles.userName}>{firstName}</span>!
          </h1>
          <p className={styles.subtitle}>Bem-vindo ao seu painel de avaliação física.</p>
        </header>

        {/* Seção das Estatísticas com dados reais */}
        <section>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statValue}>
                {loading ? '-' : stats.alunosAtivos}
              </p>
              <p className={styles.statLabel}>Alunos Ativos</p>
              <p className={styles.statDetail}>
                {loading ? 'Carregando...' : `De ${stats.totalAlunos} cadastrado(s)`}
              </p>
            </div>

            <div className={styles.statCard}>
              <p className={styles.statValue}>
                {loading ? '-' : stats.avaliacoesHoje}
              </p>
              <p className={styles.statLabel}>Avaliações Hoje</p>
              <p className={styles.statDetail}>
                {loading ? 'Carregando...' : 'Realizadas hoje'}
              </p>
            </div>

            <div className={styles.statCard}>
              <p className={styles.statValue}>
                {loading ? '-' : stats.totalAvaliacoes}
              </p>
              <p className={styles.statLabel}>Total de Avaliações</p>
              <p className={styles.statDetail}>
                {loading
                  ? 'Carregando...'
                  : `${stats.avaliacoesConcluidas || 0} concluída(s) • ${stats.avaliacoesEmAndamento || 0} em andamento`}
              </p>
            </div>

            <div className={styles.statCard}>
              <p className={styles.statValue}>
                {loading ? '-' : stats.anamnesesPendentes}
              </p>
              <p className={styles.statLabel}>Anamneses Pendentes</p>
              <p className={styles.statDetail}>
                {loading ? 'Carregando...' : 'Aguardando preenchimento'}
              </p>
            </div>
          </div>
        </section>

        {/* Ações Rápidas */}
        <section>
          <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
          <div className={styles.quickActionsGrid}>
            <button
              className={styles.actionButton}
              onClick={() => setIsNovaAvaliacaoModalOpen(true)}
            >
              <FaHeartbeat /> Iniciar Nova Avaliação
            </button>
          <button
            className={styles.actionButton}
            onClick={() => router.push('/alunos/novo')}
          >
            <FaUserPlus /> Cadastrar Novo Aluno
          </button>
        </div>
      </section>

      {/* Atividade Recente */}
      <section>
        <h2 className={styles.sectionTitle}>Atividade Recente</h2>
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Carregando atividades recentes...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className={styles.emptyState}>
              Nenhuma atividade recente registrada até o momento.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Aluno</th>
                  <th>Data</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item) => (
                  <tr
                    key={item.id}
                    className={styles.clickableRow}
                    onClick={() => item.link && router.push(item.link)}
                    title="Clique para ver os detalhes"
                  >
                    <td>{item.type}</td>
                    <td>{item.student}</td>
                    <td>{formatActivityDate(item.date)}</td>
                    <td>{renderStatusBadge(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      </div>
    </>
  );
}