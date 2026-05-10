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
      const response = await api.get("/professores"); // Esta rota já busca os usuários
      setProfessores(response.data);
    } catch (error) {
      console.error("Erro ao buscar professores:", error);
      toast.error("Não foi possível carregar a lista de professores.");
    } finally {
      setLoading(false);
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
          {/* Adicione o botão Excluir se precisar */}
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
    </div>
  );
}