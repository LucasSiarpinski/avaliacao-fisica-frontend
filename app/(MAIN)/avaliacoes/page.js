"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./avaliacoes.module.css";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../services/api";
import { format } from "date-fns";
import { 
  FaPlus, 
  FaEdit, 
  FaPrint, 
  FaTrash, 
  FaSearch, 
  FaTimes, 
  FaFilter,
  FaHeartbeat,
  FaCheckCircle,
  FaClock
} from "react-icons/fa";
import NovaAvaliacaoModal from "../../../components/NovaAvaliacaoModal";

export default function AvaliacoesPage() {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos"); // "todos" | "concluidas" | "andamento"

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("todos");

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
      const response = await api.get("/api/avaliacoes");
      setAvaliacoes(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      toast.error("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    if (!selecionadoId) return;
    router.push(`/avaliacoes/${selecionadoId}`);
  };

  const handleImprimir = (idParaImprimir) => {
    const targetId = idParaImprimir || selecionadoId;
    if (!targetId) return;

    const targetAva = avaliacoes.find((a) => a.id === targetId);
    if (targetAva && !isCompleted(targetAva)) {
      toast.error("Esta avaliação está em andamento. Preencha o peso e altura antes de emitir o laudo.");
      return;
    }

    router.push(`/avaliacoes/${targetId}?print=true`);
  };

  const handleExcluir = async (idParaExcluir) => {
    const targetId = idParaExcluir || selecionadoId;
    if (!targetId) return;

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta avaliação física? Esta ação é irreversível."
    );
    if (!confirmar) return;

    try {
      await api.delete(`/api/avaliacoes/${targetId}`);
      toast.success("Avaliação excluída com sucesso!");
      setAvaliacoes((prev) => prev.filter((a) => a.id !== targetId));
      if (selecionadoId === targetId) {
        setSelecionadoId(null);
      }
    } catch (err) {
      console.error("Erro ao excluir avaliação:", err);
      toast.error("Não foi possível excluir a avaliação.");
    }
  };

  const handleRowClick = (id) => {
    if (id === selecionadoId) {
      setSelecionadoId(null);
    } else {
      setSelecionadoId(id);
    }
  };

  // Helper para verificar se a avaliação foi preenchida/concluída
  const isCompleted = (ava) => Boolean(ava.peso && ava.altura);

  // Filtro em tempo real (Busca + Status)
  const avaliacoesFiltradas = useMemo(() => {
    return avaliacoes.filter((ava) => {
      // 1. Filtro por status
      if (statusFilter === "concluidas" && !isCompleted(ava)) return false;
      if (statusFilter === "andamento" && isCompleted(ava)) return false;

      // 2. Filtro por termo de busca
      if (!searchTerm.trim()) return true;

      const termo = searchTerm.toLowerCase();
      const nome = (ava.aluno?.nome || "").toLowerCase();
      const matricula = (ava.aluno?.matricula || "").toLowerCase();
      const avaliador = (ava.avaliador?.name || "").toLowerCase();

      switch (searchCategory) {
        case "aluno":
          return nome.includes(termo);
        case "matricula":
          return matricula.includes(termo);
        case "avaliador":
          return avaliador.includes(termo);
        case "todos":
        default:
          return (
            nome.includes(termo) ||
            matricula.includes(termo) ||
            avaliador.includes(termo)
          );
      }
    });
  }, [avaliacoes, searchTerm, searchCategory, statusFilter]);

  if (authLoading || loading) {
    return (
      <div className={styles.container} style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Carregando histórico de avaliações...</h2>
      </div>
    );
  }

  return (
    <>
      <NovaAvaliacaoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className={styles.container}>
        {/* --- CABEÇALHO --- */}
        <header className={styles.header}>
          <h1 className={styles.title}>Gerenciamento de Avaliações Físicas</h1>
          <div className={styles.headerActions}>
            <button
              onClick={() => setIsModalOpen(true)}
              className={styles.newStudentButton}
            >
              <FaPlus /> Nova Avaliação
            </button>
          <button
            onClick={handleEditar}
            className={`${styles.actionButton} ${styles.editButton}`}
            disabled={!selecionadoId}
          >
            <FaEdit /> Visualizar / Editar
          </button>
          <button
            onClick={() => handleImprimir()}
            className={`${styles.actionButton} ${styles.printButton}`}
            disabled={!selecionadoId}
          >
            <FaPrint /> Emitir Laudo
          </button>
          <button
            onClick={() => handleExcluir()}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            disabled={!selecionadoId}
          >
            <FaTrash /> Excluir
          </button>
        </div>
      </header>

      {/* --- BARRA DE BUSCA E FILTROS --- */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchInputsGroup}>
          <div className={styles.filterSelectWrapper}>
            <FaFilter className={styles.filterIcon} />
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className={styles.searchCategory}
            >
              <option value="todos">Todos os campos</option>
              <option value="aluno">Nome do Aluno</option>
              <option value="matricula">Matrícula</option>
              <option value="avaliador">Avaliador</option>
            </select>
          </div>

          <div className={styles.searchBarWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={
                searchCategory === "aluno"
                  ? "Filtrar por nome do aluno..."
                  : searchCategory === "matricula"
                  ? "Filtrar por matrícula..."
                  : searchCategory === "avaliador"
                  ? "Filtrar por avaliador..."
                  : "Buscar por aluno, matrícula ou avaliador..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className={styles.clearSearchBtn}
                title="Limpar pesquisa"
              >
                <FaTimes />
              </button>
            )}
          </div>
          {/* Abas de Filtro de Status */}
          <div className={styles.filterStatusTabs}>
            <button
              type="button"
              className={`${styles.filterStatusBtn} ${statusFilter === "todos" ? styles.filterStatusBtnActive : ""}`}
              onClick={() => setStatusFilter("todos")}
            >
              Todas ({avaliacoes.length})
            </button>
            <button
              type="button"
              className={`${styles.filterStatusBtn} ${statusFilter === "concluidas" ? styles.filterStatusBtnActive : ""}`}
              onClick={() => setStatusFilter("concluidas")}
            >
              <FaCheckCircle style={{ marginRight: 4 }} /> Concluídas ({avaliacoes.filter(isCompleted).length})
            </button>
            <button
              type="button"
              className={`${styles.filterStatusBtn} ${statusFilter === "andamento" ? styles.filterStatusBtnActive : ""}`}
              onClick={() => setStatusFilter("andamento")}
            >
              <FaClock style={{ marginRight: 4 }} /> Em Andamento ({avaliacoes.filter(a => !isCompleted(a)).length})
            </button>
          </div>
        </div>

        <div className={styles.resultsCount}>
          {avaliacoesFiltradas.length}{" "}
          {avaliacoesFiltradas.length === 1 ? "avaliação" : "avaliações"}{" "}
          encontrada(s)
        </div>
      </div>

      {/* --- TABELA --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
              <th>Aluno</th>
              <th>Matrícula</th>
              <th>Avaliador</th>
              <th>Data da Aferição</th>
              <th>Status</th>
              <th>Métricas Principais</th>
              <th style={{ textAlign: "right" }}>Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {avaliacoesFiltradas.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.noResults}>
                  {searchTerm
                    ? "Nenhuma avaliação encontrada para os critérios informados."
                    : "Nenhuma avaliação física cadastrada no sistema."}
                </td>
              </tr>
            ) : (
              avaliacoesFiltradas.map((ava) => {
                const imc = ava.resultados?.imc;
                const composicao = ava.resultados?.composicao;
                const completed = isCompleted(ava);

                return (
                  <tr
                    key={ava.id}
                    className={ava.id === selecionadoId ? styles.selectedRow : ""}
                    onClick={() => handleRowClick(ava.id)}
                    onDoubleClick={() => router.push(`/avaliacoes/${ava.id}`)}
                    title="Clique duas vezes para abrir o wizard de avaliação"
                  >
                    <td>
                      {ava.id === selecionadoId ? (
                        <span className={styles.checkIcon}>✓</span>
                      ) : (
                        <span style={{ color: "#444" }}>•</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {ava.aluno?.nome || "Aluno não encontrado"}
                    </td>
                    <td>{ava.aluno?.matricula || "---"}</td>
                    <td>{ava.avaliador?.name || "Avaliador não informado"}</td>
                    <td>
                      {format(new Date(ava.dataAvaliacao), "dd/MM/yyyy 'às' HH:mm")}
                    </td>
                    <td>
                      {completed ? (
                        <span className={styles.statusBadgeConcluida}>
                          <FaCheckCircle size={11} /> Concluída
                        </span>
                      ) : (
                        <span className={styles.statusBadgeAndamento}>
                          <FaClock size={11} /> Em Andamento
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        {ava.peso ? (
                          <span className={styles.metricTag}>
                            {ava.peso} kg
                          </span>
                        ) : null}
                        {imc?.valor ? (
                          <span 
                            className={styles.metricTag}
                            style={{ color: imc.cor || "#a4d864" }}
                          >
                            IMC: {imc.valor}
                          </span>
                        ) : null}
                        {composicao?.percGordura ? (
                          <span 
                            className={styles.metricTag}
                            style={{ color: "#34d399" }}
                          >
                            {composicao.percGordura}% Gordura
                          </span>
                        ) : null}
                        {!ava.peso && !imc?.valor && (
                          <span className={styles.metricWaiting}>
                            Aguardando preenchimento
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className={styles.tableRowActions} style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/avaliacoes/${ava.id}`);
                          }}
                          className={styles.quickRowBtn}
                          title="Abrir avaliação"
                        >
                          <FaHeartbeat /> Abrir
                        </button>
                        {completed && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImprimir(ava.id);
                            }}
                            className={styles.quickRowBtn}
                            title="Emitir laudo impresso"
                          >
                            <FaPrint /> Laudo
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExcluir(ava.id);
                          }}
                          className={styles.quickRowBtn}
                          style={{ color: "#f87171" }}
                          title="Excluir avaliação"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- CARDS LIST PARA TELAS MOBILE (< 768px) --- */}
      <div className={styles.mobileCardsList}>
        {avaliacoesFiltradas.length === 0 ? (
          <div className={styles.noResultsCard}>
            {searchTerm
              ? "Nenhuma avaliação encontrada para os critérios informados."
              : "Nenhuma avaliação física cadastrada no sistema."}
          </div>
        ) : (
          avaliacoesFiltradas.map((ava) => {
            const imc = ava.resultados?.imc;
            const composicao = ava.resultados?.composicao;
            const completed = isCompleted(ava);

            return (
              <div
                key={ava.id}
                className={styles.mobileCard}
                onClick={() => router.push(`/avaliacoes/${ava.id}`)}
              >
                <div className={styles.mobileCardHeader}>
                  <div>
                    <h4 className={styles.mobileCardStudentName}>
                      {ava.aluno?.nome || "Aluno não encontrado"}
                    </h4>
                    <span className={styles.mobileCardMatricula}>
                      Matrícula: {ava.aluno?.matricula || "---"}
                    </span>
                  </div>
                  {completed ? (
                    <span className={styles.statusBadgeConcluida}>
                      <FaCheckCircle size={11} /> Concluída
                    </span>
                  ) : (
                    <span className={styles.statusBadgeAndamento}>
                      <FaClock size={11} /> Em Andamento
                    </span>
                  )}
                </div>

                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardMeta}>
                    <span className={styles.mobileCardMetaLabel}>Avaliador:</span>
                    <span className={styles.mobileCardMetaVal}>
                      {ava.avaliador?.name || "Não informado"}
                    </span>
                  </div>
                  <div className={styles.mobileCardMeta}>
                    <span className={styles.mobileCardMetaLabel}>Data:</span>
                    <span className={styles.mobileCardMetaVal}>
                      {format(new Date(ava.dataAvaliacao), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>

                  <div className={styles.mobileCardMetrics}>
                    {ava.peso ? (
                      <span className={styles.metricTag}>{ava.peso} kg</span>
                    ) : null}
                    {imc?.valor ? (
                      <span
                        className={styles.metricTag}
                        style={{ color: imc.cor || "#a4d864" }}
                      >
                        IMC: {imc.valor}
                      </span>
                    ) : null}
                    {composicao?.percGordura ? (
                      <span
                        className={styles.metricTag}
                        style={{ color: "#34d399", fontWeight: 700 }}
                      >
                        {composicao.percGordura}% Gordura
                      </span>
                    ) : null}
                    {!ava.peso && !imc?.valor && (
                      <span className={styles.metricWaiting}>
                        Aguardando preenchimento
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.mobileCardFooter}>
                  <button
                    type="button"
                    className={styles.mobileOpenBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/avaliacoes/${ava.id}`);
                    }}
                  >
                    <FaHeartbeat /> Acessar Avaliação
                  </button>
                  {completed && (
                    <button
                      type="button"
                      className={styles.mobilePrintBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImprimir(ava.id);
                      }}
                      title="Emitir laudo impresso"
                    >
                      <FaPrint /> Laudo
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.mobileDeleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExcluir(ava.id);
                    }}
                    title="Excluir avaliação"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </>
);
}