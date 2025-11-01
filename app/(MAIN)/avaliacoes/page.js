"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./avaliacoes.module.css"; // Usando o CSS copiado
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";
import { format } from 'date-fns'; // Ótimo para formatar datas

export default function AvaliacoesPage() {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionadoId, setSelecionadoId] = useState(null);

  const { isAuthenticated, loading: authLoading } = useAuth();

  // Proteção de Rota e Busca de Dados
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchAvaliacoes();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchAvaliacoes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/avaliacoes");
      setAvaliacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      toast.error("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    if (!selecionadoId) return;
    // O 'id' é um Int no seu Prisma, então está correto
    router.push(`/avaliacoes/${selecionadoId}`);
  };
  
  const handleNovo = () => {
    // Vamos criar esta página no próximo passo
    router.push("/avaliacoes/novo");
  };

  // Lógica para lidar com a seleção na tabela
  const handleRowClick = (id) => {
    if (id === selecionadoId) {
      setSelecionadoId(null); // Desmarca se clicar de novo
    } else {
      setSelecionadoId(id);
    }
  };

  if (authLoading || loading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      {/* --- CABEÇALHO --- */}
      <header className={styles.header}>
        <h1 className={styles.title}>Gerenciamento de Avaliações</h1>
        <div className={styles.headerActions}>
          <button
            onClick={handleNovo}
            className={styles.newStudentButton} // Reutilizando o estilo roxo
          >
            + Nova Avaliação
          </button>
          <button
            onClick={handleEditar}
            className={`${styles.actionButton} ${styles.editButton}`} // Reutilizando o estilo azul
            disabled={!selecionadoId}
          >
            Visualizar/Editar
          </button>
          {/* Você pode adicionar um botão de Excluir aqui se quiser */}
        </div>
      </header>

      {/* --- TABELA --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
              <th>Aluno</th>
              <th>Matrícula</th>
              <th>Avaliador</th>
              <th>Data da Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {avaliacoes.length === 0 ? (
              <tr>
                <td colSpan="5" className={styles.noResults}>
                  Nenhuma avaliação encontrada.
                </td>
              </tr>
            ) : (
              avaliacoes.map((ava) => (
                <tr
                  key={ava.id}
                  className={
                    ava.id === selecionadoId ? styles.selectedRow : ""
                  }
                  onClick={() => handleRowClick(ava.id)}
                >
                  <td>
                    {ava.id === selecionadoId && (
                      <span className={styles.checkIcon}>✓</span>
                    )}
                  </td>
                  <td>{ava.aluno?.nome || "Aluno não encontrado"}</td>
                  <td>{ava.aluno?.matricula || "---"}</td>
                  <td>{ava.avaliador?.nome || "Avaliador não encontrado"}</td>
                  <td>
                    {format(new Date(ava.dataAvaliacao), "dd/MM/yyyy 'às' HH:mm")}
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