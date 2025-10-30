// app/(main)/alunos/page.js

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./alunos.module.css";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";

export default function AlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LÓGICA DE SELEÇÃO (QUE VOCÊ GOSTOU) ---
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(null);

  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaBusca, setCategoriaBusca] = useState("nome");

  // --- 2. LÓGICA DE PROTEÇÃO (A SEGURANÇA) ---
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Protege a rota: se não estiver logado, redireciona para o login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Busca os dados apenas se o usuário estiver autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAlunos();
    }
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchAlunos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/alunos");
      setAlunos(response.data);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      toast.error("Não foi possível carregar la lista de alunos.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirAluno = async () => {
    if (!alunoSelecionadoId) return;
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
    );
    if (!confirmar) return;

    try {
      await api.delete(`/alunos/${alunoSelecionadoId}`);
      toast.success("Aluno excluído com sucesso!");
      setAlunoSelecionadoId(null);
      await fetchAlunos();
    } catch (error) {
      console.error("Erro ao excluir aluno:", error);
      toast.error("Não foi possível excluir o aluno.");
    }
  };

  const alunosFiltrados = alunos.filter((aluno) => {
    if (!termoBusca) return true;
    const buscaLowerCase = termoBusca.toLowerCase();
    switch (categoriaBusca) {
      case "id":
        return String(aluno.id).includes(termoBusca);
      case "matricula":
        return String(aluno.matricula).toLowerCase().includes(buscaLowerCase);
      case "cpf":
        return aluno.cpf?.includes(termoBusca);
      case "nome":
      default:
        return aluno.nome.toLowerCase().includes(buscaLowerCase);
    }
  });

  // --- 3. TELA DE CARREGAMENTO ROBUSTA ---
  if (authLoading || loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      {/* --- CABEÇALHO --- */}
      <header className={styles.header}>
        <h1 className={styles.title}>Gerenciamento de Alunos</h1>
        <div className={styles.headerActions}>
          <button
            onClick={() => router.push("/alunos/novo")}
            className={styles.newStudentButton}
          >
            + Novo Aluno
          </button>
          <button
            onClick={() => router.push(`/alunos/${alunoSelecionadoId}`)}
            className={`${styles.actionButton} ${styles.editButton}`}
            disabled={!alunoSelecionadoId}
          >
            Editar Selecionado
          </button>
          <button
            onClick={handleExcluirAluno}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            disabled={!alunoSelecionadoId}
          >
            Excluir Selecionado
          </button>
        </div>
      </header>

      {/* --- BUSCA --- */}
      <div className={styles.searchContainer}>
        {/* ... seu select e input ... */}
      </div>

      {/* --- TABELA ATUALIZADA --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead><tr>
              <th></th>
              <th>Nome Completo</th>
              <th>Matrícula</th>
              <th>Status</th> 
              <th>Status Anamnese</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.length === 0 && !loading ? (
              <tr>
                <td colSpan="5">Nenhum aluno encontrado.</td>
              </tr>
            ) : (
              alunosFiltrados.map((aluno) => (
                <tr
                  key={aluno.id}
                  className={
                    aluno.id === alunoSelecionadoId ? styles.selectedRow : ""
                  }
                  onClick={() => setAlunoSelecionadoId(aluno.id)}
                >
                  <td>
                    {aluno.id === alunoSelecionadoId && (
                      <span className={styles.checkIcon}>✓</span>
                    )}
                  </td>
                  <td>{aluno.nome}</td>
                  <td>{aluno.matricula}</td>
                  {/* <-- 2. NOVA CÉLULA PARA EXIBIR O STATUS --> */}
                  <td>
                    <span
                      className={
                        aluno.status === "ATIVO"
                          ? styles.statusAtivo
                          : styles.statusInativo
                      }
                    >
                      {aluno.status}
                    </span>
                  </td>
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
