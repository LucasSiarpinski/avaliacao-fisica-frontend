// app/(main)/alunos/page.js

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from './alunos.module.css'; // Certifique-se que este CSS tem o estilo para ':disabled'
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

export default function AlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(null); // Mantemos o estado de seleção

  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaBusca, setCategoriaBusca] = useState('nome');
  const { isAuthenticated } = useAuth();

  const fetchAlunos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/alunos');
      setAlunos(response.data);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      toast.error("Não foi possível carregar a lista de alunos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlunos();
    }
  }, [isAuthenticated]);

  const handleExcluirAluno = async () => {
    if (!alunoSelecionadoId) return; // Segurança extra
    const confirmar = window.confirm("Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.");
    if (!confirmar) return;

    try {
      await api.delete(`/alunos/${alunoSelecionadoId}`);
      toast.success("Aluno excluído com sucesso!");
      setAlunoSelecionadoId(null); // Limpa a seleção após excluir
      await fetchAlunos();
    } catch (error) {
      console.error("Erro ao excluir aluno:", error);
      toast.error("Não foi possível excluir o aluno.");
    }
  };

  const alunosFiltrados = alunos.filter(aluno => {
    if (!termoBusca) return true;
    const buscaLowerCase = termoBusca.toLowerCase();
    switch (categoriaBusca) {
      case 'id': return String(aluno.id).includes(termoBusca);
      case 'matricula': return String(aluno.matricula).toLowerCase().includes(buscaLowerCase);
      case 'cpf': return aluno.cpf?.includes(termoBusca);
      case 'nome': default: return aluno.nome.toLowerCase().includes(buscaLowerCase);
    }
  });

  return (
    <div className={styles.container}>
      {/* --- CABEÇALHO COM BOTÕES SEMPRE VISÍVEIS --- */}
      <header className={styles.header}>
        <h1 className={styles.title}>Gerenciamento de Alunos</h1>
        <div className={styles.headerActions}>
          <button onClick={() => router.push('/alunos/novo')} className={styles.newStudentButton}>
            + Novo Aluno
          </button>

          {/* Os botões agora estão sempre aqui */}
          <button
            onClick={() => router.push(`/alunos/${alunoSelecionadoId}`)}
            className={`${styles.actionButton} ${styles.editButton}`}
            // 1. ADICIONAMOS O ATRIBUTO 'disabled'
            // O botão fica desabilitado se 'alunoSelecionadoId' for null (ou seja, ninguém selecionado)
            disabled={!alunoSelecionadoId}
          >
            Editar Selecionado
          </button>
          <button
            onClick={handleExcluirAluno}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            // 2. ADICIONAMOS O ATRIBUTO 'disabled' AQUI TAMBÉM
            disabled={!alunoSelecionadoId}
          >
            Excluir Selecionado
          </button>
        </div>
      </header>

      <div className={styles.searchContainer}>
        <select
          className={styles.searchCategory}
          value={categoriaBusca}
          onChange={(e) => setCategoriaBusca(e.target.value)}
        >
          <option value="nome">Nome</option>
          <option value="id">ID</option>
          <option value="matricula">Matrícula</option>
          <option value="cpf">CPF</option>
        </select>
        <input
          type="text"
          placeholder={`Buscar por ${categoriaBusca}...`}
          className={styles.searchBar}
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
      </div>

      {/* --- TABELA COM SELEÇÃO NA LINHA (Continua igual) --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>Matrícula</th>
              <th>Nome Completo</th>
              <th>CPF</th>
              <th>Status Anamnese</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">Carregando alunos...</td></tr>
            ) : alunosFiltrados.length === 0 ? (
              <tr><td colSpan="6">Nenhum aluno encontrado.</td></tr>
            ) : (
              alunosFiltrados.map((aluno) => (
                <tr
                  key={aluno.id}
                  className={aluno.id === alunoSelecionadoId ? styles.selectedRow : ''}
                  onClick={() => setAlunoSelecionadoId(aluno.id)}
                >
                  <td>
                    {/* O feedback visual da seleção (ícone ou cor) */}
                    {aluno.id === alunoSelecionadoId && <span className={styles.checkIcon}>✓</span>}
                    {/* Você pode esconder o input real se quiser */}
                    <input
                      type="radio"
                      name="alunoSelecionado"
                      checked={aluno.id === alunoSelecionadoId}
                      readOnly
                      style={{ display: 'none' }} // Esconde a bolinha
                    />
                  </td>
                  <td>{aluno.id}</td>
                  <td>{aluno.matricula}</td>
                  <td>{aluno.nome}</td>
                  <td>{aluno.cpf || 'N/A'}</td>
                  <td>{aluno.anamneseStatus}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}