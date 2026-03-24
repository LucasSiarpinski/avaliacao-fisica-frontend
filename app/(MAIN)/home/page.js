"use client"; // Necessário para usar hooks como useAuth e useRouter

import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext'; // Ajuste o caminho se necessário
import styles from './home.module.css';

// Dados de exemplo para o wireframe
const mockRecentActivity = [
  { id: 1, type: 'Avaliação', student: 'Lucas Miotto S', date: '01/11/2025', status: 'pending' },
  { id: 2, type: 'Novo Aluno', student: 'Erick', date: '01/11/2025', status: 'active' },
  { id: 3, type: 'Avaliação', student: 'Maria Clara', date: '31/10/2025', status: 'pending' },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth(); // Puxa o usuário logado do contexto

  // Pega o primeiro nome para o "Olá"
  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário';

  return (
    <div className={styles.container}>
      
      {/* Seção do Cabeçalho (Personalizada) */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          Olá, <span className={styles.userName}>{firstName}</span>!
        </h1>
        <p className={styles.subtitle}>Bem-vindo ao seu painel de avaliação física.</p>
      </header>

      {/* Seção das Estatísticas (Atualizada) */}
      <section>
        <div className={styles.statsGrid}>
          
          <div className={styles.statCard}>
            <p className={styles.statValue}>12</p>
            <p className={styles.statLabel}>Alunos Ativos</p>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statValue}>5</p>
            <p className={styles.statLabel}>Avaliações Hoje</p>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statValue}>2</p>
            <p className={styles.statLabel}>Relatórios Pendentes</p>
          </div>

        </div>
      </section>

      {/* NOVA SEÇÃO: Ações Rápidas */}
      <section>
        <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
        <div className={styles.quickActionsGrid}>
          <button 
            className={styles.actionButton}
            onClick={() => router.push('/avaliacoes/novo')}
          >
            + Iniciar Nova Avaliação
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => router.push('/alunos/novo')} // Assumindo que você tem essa rota
          >
            + Cadastrar Novo Aluno
          </button>
        </div>
      </section>

      {/* NOVA SEÇÃO: Atividade Recente */}
      <section>
        <h2 className={styles.sectionTitle}>Atividade Recente</h2>
        <div className={styles.tableContainer}>
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
              {mockRecentActivity.map((item) => (
                <tr key={item.id}>
                  <td>{item.type}</td>
                  <td>{item.student}</td>
                  <td>{item.date}</td>
                  <td>
                    <span 
                      className={item.status === 'active' ? styles.statusAtivo : styles.statusPendente}
                    >
                      {item.status === 'active' ? 'Ativo' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}