"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./novo.module.css";
import { useAuth } from "../../../../contexts/AuthContext"; // Ajuste o caminho se necessário
import api from "../../../../services/api"; // Ajuste o caminho se necessário

export default function NovaAvaliacaoPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Pegamos o 'user' para o ID do avaliador

  // Estado para a lista de alunos
  const [alunos, setAlunos] = useState([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);

  // Estado para o formulário
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Proteção de Rota
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Buscar a lista de alunos para preencher o <select>
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAlunos = async () => {
        try {
          setLoadingAlunos(true);
          // Usamos a API que você já tem de 'alunos'
          const response = await api.get("/alunos");
          // Filtramos para mostrar apenas alunos ATIVOS
          const alunosAtivos = response.data.filter(a => a.status === 'ATIVO');
          setAlunos(alunosAtivos);
        } catch (error) {
          console.error("Erro ao buscar alunos:", error);
          toast.error("Não foi possível carregar a lista de alunos.");
        } finally {
          setLoadingAlunos(false);
        }
      };
      fetchAlunos();
    }
  }, [isAuthenticated]); // Roda 1x quando autenticado

  // --- Função Principal ---
  const handleIniciarAvaliacao = async () => {
    if (!alunoSelecionadoId) {
      toast.error("Por favor, selecione um aluno.");
      return;
    }
    
    // O 'avaliadorId' é o ID do usuário logado
    // O backend já pega isso do 'req.user.id', mas é bom ter aqui
    // caso precisemos enviar no 'body' (o nosso backend POST espera só o alunoId)
    
    setIsCreating(true);
    try {
      // Chama a API POST que criamos no backend
      const response = await api.post("/avaliacoes", {
        alunoId: parseInt(alunoSelecionadoId), 
        // O avaliadorId é pego automaticamente no backend pelo token
      });
      
      const novaAvaliacao = response.data;
      
      toast.success("Avaliação iniciada! Redirecionando...");
      
      // Redireciona para a página de EDIÇÃO (o [id]/page.js)
      router.push(`/avaliacoes/${novaAvaliacao.id}`);

    } catch (error) {
      console.error("Erro ao iniciar avaliação:", error);
      toast.error("Não foi possível iniciar a avaliação.");
      setIsCreating(false);
    }
  };


  if (authLoading || loadingAlunos) {
    return <div style={{ color: "white", padding: "2rem" }}>Carregando...</div>;
  }
  
  return (
    <div className={styles.container}>
      {/* --- Cabeçalho --- */}
      <header className={styles.header}>
        <h1 className={styles.title}>Nova Avaliação Física</h1>
        <div className={styles.actions}>
          <button
            onClick={() => router.push("/avaliacoes")}
            className={styles.backButton}
          >
            Voltar para Lista
          </button>
          <button
            onClick={handleIniciarAvaliacao}
            className={styles.startButton}
            disabled={!alunoSelecionadoId || isCreating}
          >
            {isCreating ? "Iniciando..." : "Iniciar Avaliação"}
          </button>
        </div>
      </header>

      {/* --- Conteúdo --- */}
      <div className={styles.content}>
        <div className={styles.formGroup}>
          <label htmlFor="alunoSelect">
            Selecione o Aluno para avaliar:
          </label>
          
          {alunos.length > 0 ? (
            <select
              id="alunoSelect"
              className={styles.selectAluno}
              value={alunoSelecionadoId}
              onChange={(e) => setAlunoSelecionadoId(e.target.value)}
            >
              <option value="">-- Escolha um aluno --</option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome} (Matrícula: {aluno.matricula})
                </option>
              ))}
            </select>
          ) : (
             <p className={styles.loadingText}>Nenhum aluno ativo encontrado para avaliação.</p>
          )}

        </div>
      </div>
    </div>
  );
}