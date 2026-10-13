// app/(main)/alunos/page.js

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./alunos.module.css";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";
import { 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaCheck,
  FaHeartbeat 
} from "react-icons/fa";

export default function AlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStartingAvaliacao, setIsStartingAvaliacao] = useState(false);

  // --- 1. LÓGICA DE SELEÇÃO (QUE VOCÊ GOSTOU) ---
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(null);

  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaBusca, setCategoriaBusca] = useState("nome");

  const handleIniciarAvaliacaoSelecionado = async () => {
    if (!alunoSelecionadoId) return;

    // Localiza o aluno selecionado
    const alunoSel = alunos.find((a) => a.id === alunoSelecionadoId);
    if (alunoSel && alunoSel.status !== "ATIVO") {
      const confirmar = window.confirm(
        "Atenção: Este aluno está marcado como INATIVO. Deseja iniciar a avaliação física mesmo assim?"
      );
      if (!confirmar) return;
    }

    setIsStartingAvaliacao(true);
    try {
      const response = await api.post("/api/avaliacoes", {
        alunoId: parseInt(alunoSelecionadoId),
      });
      toast.success("Avaliação iniciada! Redirecionando...");
      router.push(`/avaliacoes/${response.data.id}`);
    } catch (error) {
      console.error("Erro ao iniciar avaliação:", error);
      toast.error(error.response?.data?.error || "Não foi possível iniciar a avaliação.");
      setIsStartingAvaliacao(false);
    }
  };

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
      const response = await api.get("/api/alunos");
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
      await api.delete(`/api/alunos/${alunoSelecionadoId}`);
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
            <FaUserPlus /> Novo Aluno
          </button>
          <button
            onClick={handleIniciarAvaliacaoSelecionado}
            className={`${styles.actionButton} ${styles.avaliarButton}`}
            disabled={!alunoSelecionadoId || isStartingAvaliacao}
            title={alunoSelecionadoId ? "Iniciar avaliação física para o aluno selecionado" : "Selecione um aluno na tabela"}
          >
            <FaHeartbeat /> {isStartingAvaliacao ? "Iniciando..." : "Avaliar Aluno"}
          </button>
          <button
            onClick={() => router.push(`/alunos/${alunoSelecionadoId}`)}
            className={`${styles.actionButton} ${styles.editButton}`}
            disabled={!alunoSelecionadoId || isStartingAvaliacao}
          >
            <FaEdit /> Editar
          </button>
          <button
            onClick={handleExcluirAluno}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            disabled={!alunoSelecionadoId || isStartingAvaliacao}
          >
            <FaTrash /> Excluir
          </button>
        </div>
      </header>

      {/* --- BARRA DE BUSCA E FILTROS MODERNA --- */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchInputsGroup}>
          <div className={styles.filterSelectWrapper}>
            <FaFilter className={styles.filterIcon} />
            <select
              className={styles.searchCategory}
              value={categoriaBusca}
              onChange={(e) => setCategoriaBusca(e.target.value)}
              title="Filtrar por"
            >
              <option value="nome">Nome</option>
              <option value="matricula">Matrícula</option>
              <option value="cpf">CPF</option>
              <option value="id">ID</option>
            </select>
          </div>

          <div className={styles.searchBarWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchBar}
              placeholder={`Buscar aluno por ${categoriaBusca}...`}
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            {termoBusca && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setTermoBusca("")}
                title="Limpar busca"
              >
                <FaTimes size={13} />
              </button>
            )}
          </div>
        </div>

        <span className={styles.countBadge}>
          {alunosFiltrados.length} {alunosFiltrados.length === 1 ? "aluno encontrado" : "alunos encontrados"}
        </span>
      </div>

      {/* --- TABELA ATUALIZADA --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "45px", textAlign: "center" }}></th>
              <th>Nome Completo</th>
              <th>Matrícula</th>
              <th>Status</th> 
              <th>Status Anamnese</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.length === 0 && !loading ? (
              <tr>
                <td colSpan="5" className={styles.noResults}>
                  Nenhum aluno encontrado para os critérios de busca.
                </td>
              </tr>
            ) : (
              alunosFiltrados.map((aluno) => {
                const isSelected = aluno.id === alunoSelecionadoId;
                const isAtivo = aluno.status === "ATIVO";

                let anamneseLabel = "Pendente";
                let anamneseClass = styles.anamnesePending;
                if (aluno.anamneseStatus === "COMPLETED") {
                  anamneseLabel = "Concluída";
                  anamneseClass = styles.anamneseCompleted;
                } else if (aluno.anamneseStatus === "SENT") {
                  anamneseLabel = "Enviada";
                  anamneseClass = styles.anamneseSent;
                }

                return (
                  <tr
                    key={aluno.id}
                    className={isSelected ? styles.selectedRow : ""}
                    onClick={() => setAlunoSelecionadoId(aluno.id)}
                    onDoubleClick={() => router.push(`/alunos/${aluno.id}`)}
                    title="Clique duas vezes para editar este aluno"
                  >
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`${styles.checkIndicator} ${
                          isSelected ? styles.checkIndicatorActive : ""
                        }`}
                      >
                        {isSelected && <FaCheck size={10} />}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#fff" }}>{aluno.nome}</strong>
                    </td>
                    <td>{aluno.matricula}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          isAtivo ? styles.statusAtivo : styles.statusInativo
                        }`}
                      >
                        <span
                          className={`${styles.badgeDot} ${
                            isAtivo ? styles.badgeDotGreen : styles.badgeDotRed
                          }`}
                        ></span>
                        {aluno.status}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.anamneseBadge} ${anamneseClass}`}>
                        {anamneseLabel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
