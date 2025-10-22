// app/(main)/home/page.js

import styles from './home.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      
      {/* Seção do Cabeçalho */}
      <header className={styles.header}>
        <h1 className={styles.title}>Olá, Lucas!</h1>
        <p className={styles.subtitle}>Bem-vindo ao seu painel de avaliação física.</p>
      </header>

      {/* Seção das Estatísticas */}
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
      
      {/* Seção de Ações Rápidas */}
      <section>
          <h2 style={{color: '#ccc'}}>Ações Rápidas</h2>
          <div className={styles.actionsContainer}>
              <button className={styles.actionButton}>Cadastrar Novo Aluno</button>
              <button className={styles.actionButton}>Iniciar Avaliação</button>
          </div>
      </section>

    </div>
  );
}