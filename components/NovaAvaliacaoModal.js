"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  FaHeartbeat, 
  FaSearch, 
  FaTimes, 
  FaArrowRight, 
  FaUserPlus 
} from "react-icons/fa";
import api from "../services/api";
import styles from "./NovaAvaliacaoModal.module.css";

export default function NovaAvaliacaoModal({ isOpen, onClose }) {
  const router = useRouter();

  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isStartingId, setIsStartingId] = useState(null);

  // Fecha no Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Busca alunos ativos ao abrir
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchAlunos = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/alunos");
        if (isMounted) {
          const ativos = (res.data || []).filter((a) => a.status === "ATIVO");
          setAlunos(ativos);
        }
      } catch (err) {
        console.error("Erro ao buscar alunos:", err);
        toast.error("Não foi possível carregar a lista de alunos.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAlunos();
    setSearchTerm("");
    setIsStartingId(null);

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Filtro de alunos em tempo real
  const filteredAlunos = useMemo(() => {
    if (!searchTerm.trim()) return alunos;
    const term = searchTerm.toLowerCase();
    return alunos.filter(
      (a) =>
        (a.nome || "").toLowerCase().includes(term) ||
        (a.matricula || "").toLowerCase().includes(term)
    );
  }, [alunos, searchTerm]);

  // Iniciar avaliação ao selecionar o aluno
  const handleSelecionarAluno = async (aluno) => {
    if (isStartingId) return;

    setIsStartingId(aluno.id);
    try {
      const response = await api.post("/api/avaliacoes", {
        alunoId: aluno.id,
      });

      toast.success(`Avaliação iniciada para ${aluno.nome}!`);
      onClose();
      router.push(`/avaliacoes/${response.data.id}`);
    } catch (error) {
      console.error("Erro ao iniciar avaliação:", error);
      toast.error(
        error.response?.data?.error || "Não foi possível iniciar a avaliação."
      );
      setIsStartingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <header className={styles.header}>
          <div>
            <h2 className={styles.headerTitle}>
              <FaHeartbeat /> Iniciar Nova Avaliação
            </h2>
            <p className={styles.headerSubtitle}>
              Selecione o aluno abaixo para abrir a ficha de avaliação física.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            <FaTimes />
          </button>
        </header>

        {/* Busca */}
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              autoFocus
              className={styles.searchInput}
              placeholder="Buscar aluno por nome ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearchTerm("")}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Alunos */}
        <div className={styles.bodyList}>
          {loading ? (
            <div className={styles.loadingSpinner}></div>
          ) : filteredAlunos.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                {searchTerm
                  ? `Nenhum aluno encontrado para "${searchTerm}".`
                  : "Nenhum aluno ativo disponível para avaliação."}
              </p>
              <button
                type="button"
                className={styles.newStudentBtn}
                onClick={() => {
                  onClose();
                  router.push("/alunos/novo");
                }}
              >
                <FaUserPlus style={{ marginRight: 6 }} /> Cadastrar Novo Aluno
              </button>
            </div>
          ) : (
            filteredAlunos.map((aluno) => {
              const inicial = aluno.nome ? aluno.nome.charAt(0).toUpperCase() : "?";
              const isSelected = isStartingId === aluno.id;

              return (
                <button
                  key={aluno.id}
                  type="button"
                  className={styles.studentCard}
                  onClick={() => handleSelecionarAluno(aluno)}
                  disabled={isStartingId !== null}
                >
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar}>{inicial}</div>
                    <div className={styles.studentDetails}>
                      <span className={styles.studentName}>{aluno.nome}</span>
                      <span className={styles.studentMeta}>
                        Matrícula: {aluno.matricula || "S/M"}
                        {aluno.genero && ` • ${aluno.genero === "F" ? "Feminino" : "Masculino"}`}
                      </span>
                    </div>
                  </div>

                  <span className={styles.actionBadge}>
                    {isSelected ? "Iniciando..." : (
                      <>
                        Avaliar <FaArrowRight />
                      </>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <footer className={styles.footer}>
          <span>
            {alunos.length} aluno(s) ativo(s) cadastrado(s)
          </span>
          <button
            type="button"
            className={styles.footerCancelBtn}
            onClick={onClose}
          >
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
}
