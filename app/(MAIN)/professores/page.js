"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./professores.module.css"; // Você já tem este arquivo
import { useAuth } from "../../../contexts/AuthContext"; // Ajuste o caminho se necessário
import api from "../../../services/api"; // Ajuste o caminho se necessário

export default function ProfessoresPage() {
  const router = useRouter();
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [professorSelecionadoId, setProfessorSelecionadoId] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // --- 1. ESTADOS PARA O FILTRO ---
  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaBusca, setCategoriaBusca] = useState("name"); // 'name' é o campo no seu 'model User'

  const { isAuthenticated, loading: authLoading } = useAuth();

  // Proteção de Rota
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchProfessores();
    }
  }, [isAuthenticated, authLoading, router]);

  // Busca os dados (sem alteração)
  const fetchProfessores = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/professores"); // Esta rota já busca os usuários
      setProfessores(response.data);
    } catch (error) {
      console.error("Erro ao buscar professores:", error);
      toast.error("Não foi possível carregar a lista de professores.");
    } finally {
      setLoading(false);
    }
  };

  const professorSelecionado = professores.find((p) => p.id === professorSelecionadoId);

  const handleToggleStatusProfessor = async () => {
    if (!professorSelecionado) return;
    const novoStatus = professorSelecionado.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusLoading(true);
    try {
      await api.patch(`/api/professores/${professorSelecionado.id}/status`, {
        status: novoStatus,
      });
      toast.success(
        novoStatus === "ACTIVE"
          ? "Professor ativado com sucesso! Acesso liberado."
          : "Professor desativado! Acesso ao sistema restrito."
      );
      setIsStatusModalOpen(false);
      await fetchProfessores();
    } catch (error) {
      console.error("Erro ao alterar status do professor:", error);
      toast.error("Não foi possível alterar o status do professor.");
    } finally {
      setStatusLoading(false);
    }
  };

  // --- 2. LÓGICA DE FILTRO (no Frontend) ---
  const professoresFiltrados = professores.filter((prof) => {
    if (!termoBusca) return true;
    const buscaLowerCase = termoBusca.toLowerCase();

    switch (categoriaBusca) {
      case "id":
        return String(prof.id).includes(termoBusca);
      case "email":
        return prof.email.toLowerCase().includes(buscaLowerCase);
      case "name":
      default:
        return prof.name.toLowerCase().includes(buscaLowerCase);
    }
  });

  if (authLoading || loading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Carregando...</div>;
  }

  return (
    // Seu CSS 'container' já está estilizado como um card
    <div className={styles.container}>
      
      {/* --- CABEÇALHO --- */}
      <header className={styles.header}>
        <h1 className={styles.title}>Gerenciamento de Professores</h1>
        <div className={styles.headerActions}>
          <button
            onClick={() => router.push('/professores/novo')}
            className={styles.newButton} 
          >
            + Novo Professor
          </button>
          <button
            onClick={() => router.push(`/professores/${professorSelecionadoId || 'novo'}`)}
            className={`${styles.actionButton} ${styles.editButton}`}
            disabled={!professorSelecionadoId}
          >
            Editar Selecionado
          </button>
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className={`${styles.actionButton} ${
              professorSelecionado?.status === "ACTIVE"
                ? styles.deactivateButton
                : styles.activateButton
            }`}
            disabled={!professorSelecionadoId || statusLoading}
          >
            {professorSelecionado?.status === "ACTIVE" ? "Desativar" : "Ativar"}
          </button>
        </div>
      </header>

      {/* --- 3. JSX DA BUSCA ATUALIZADO --- */}
      <div className={styles.searchContainer}>
        {/* Seletor de Categoria (ID, Nome, Email) */}
        <select
          className={styles.searchCategory} // Você já deve ter este estilo
          value={categoriaBusca}
          onChange={(e) => setCategoriaBusca(e.target.value)}
        >
          <option value="name">Nome</option>
          <option value="email">Email</option>
          <option value="id">ID</option>
        </select>
        
        {/* Barra de Busca (Input) */}
        <input
          type="text"
          className={styles.searchBar}
          placeholder="Buscar por..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
      </div>


      {/* --- 3. JSX DA TABELA ATUALIZADO --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {/* Coluna de Check (se você usa seleção) */}
              <th style={{ width: "40px" }}></th> 
              
              {/* --- NOVA COLUNA DE ID --- */}
              <th style={{ width: "60px" }}>ID</th>
              
              <th>Nome</th>
              <th>Email</th>
              <th>Campus</th>
              <th>Permissão</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {professoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.noResults}>
                  Nenhum professor encontrado.
                </td>
              </tr>
            ) : (
              professoresFiltrados.map((prof) => (
                <tr
                  key={prof.id}
                  className={prof.id === professorSelecionadoId ? styles.selectedRow : ""}
                  onClick={() => setProfessorSelecionadoId(prof.id)}
                >
                  <td>
                    {/* Lógica do CheckIcon aqui */}
                  </td>
                  
                  {/* --- NOVA CÉLULA DE ID --- */}
                  <td>{prof.id}</td>

                  <td>{prof.name}</td>
                  <td>{prof.email}</td>
                  <td>{prof.campus?.name || "N/A"}</td>
                  <td>
                    {/* Estilos 'roleAdmin' e 'roleProfessor' do seu CSS */}
                    <span
                      className={
                        prof.role === "ADMIN"
                          ? styles.roleAdmin
                          : styles.roleProfessor
                      }
                    >
                      {prof.role}
                    </span>
                  </td>
                  <td>
                    {/* Estilos 'statusActive' e 'statusInactive' do seu CSS */}
                    <span
                      className={
                        prof.status === "ACTIVE"
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      {prof.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DE CONFIRMAÇÃO DE STATUS (ATIVAR/DESATIVAR) --- */}
      {isStatusModalOpen && professorSelecionado && (
        <div className={styles.modalOverlay} onClick={() => !statusLoading && setIsStatusModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {professorSelecionado.status === "ACTIVE" ? "Confirmar Desativação" : "Confirmar Ativação"}
            </h2>
            <p style={{ color: "#d1d5db", fontSize: "0.95rem", lineHeight: 1.5, margin: "1rem 0" }}>
              {professorSelecionado.status === "ACTIVE"
                ? `Ao desativar o professor "${professorSelecionado.name}", o acesso deste usuário ao sistema será restrito e ele não conseguirá mais realizar login até ser reativado. Deseja prosseguir com a desativação?`
                : `Deseja reativar o acesso do professor "${professorSelecionado.name}"? O usuário poderá voltar a realizar login normalmente no sistema.`}
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setIsStatusModalOpen(false)}
                disabled={statusLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={
                  professorSelecionado.status === "ACTIVE"
                    ? styles.deactivateButton
                    : styles.activateButton
                }
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
                onClick={handleToggleStatusProfessor}
                disabled={statusLoading}
              >
                {statusLoading
                  ? "Salvando..."
                  : professorSelecionado.status === "ACTIVE"
                  ? "Sim, Desativar"
                  : "Sim, Ativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}