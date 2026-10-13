"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  LuSettings, 
  LuUser, 
  LuLayers, 
  LuFileSpreadsheet, 
  LuCheck, 
  LuInfo,
  LuSave 
} from "react-icons/lu";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./configuracoes.module.css";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [viewMode, setViewMode] = useState("wizard"); // "wizard" ou "single"

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("@TCC:avaliacaoViewMode");
      if (savedMode === "single" || savedMode === "wizard") {
        setViewMode(savedMode);
      }
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSalvarPreferencias = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("@TCC:avaliacaoViewMode", viewMode);
      toast.success("Preferências salvas com sucesso!");
    }
  };

  if (authLoading) {
    return (
      <div className={styles.container}>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <LuSettings /> Configurações & Preferências
          </h1>
          <p className={styles.subtitle}>
            Gerencie seus dados de acesso e personalize a forma de preenchimento das avaliações físicas.
          </p>
        </div>
      </header>

      <div className={styles.cardsGrid}>
        {/* Card de Perfil */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <LuUser /> Informações do Usuário
          </div>
          <div className={styles.profileGrid}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Nome Completo</span>
              <div className={styles.fieldValue}>{user?.name || "Não informado"}</div>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>E-mail</span>
              <div className={styles.fieldValue}>{user?.email || "Não informado"}</div>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Nível de Acesso</span>
              <div className={styles.fieldValue}>
                {user?.role === "ADMIN" ? "Administrador do Sistema" : "Professor / Avaliador"}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Status da Conta</span>
              <div className={styles.fieldValue}>Ativo</div>
            </div>
          </div>
        </section>

        {/* Card de Preferências de Visualização (Item 3) */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <LuLayers /> Padrão de Visualização da Avaliação Física
          </div>
          <p style={{ color: "#aaa", fontSize: "0.95rem", margin: 0 }}>
            Escolha como prefere que a tela de avaliação física abra por padrão ao criar ou editar uma avaliação:
          </p>

          <div className={styles.viewModeOptions}>
            <div
              className={`${styles.viewModeCard} ${viewMode === "wizard" ? styles.viewModeCardSelected : ""}`}
              onClick={() => setViewMode("wizard")}
            >
              <div className={styles.viewModeHeader}>
                <span className={styles.viewModeTitle}>
                  <LuLayers /> Em Etapas (Passo a Passo)
                </span>
                {viewMode === "wizard" && (
                  <span className={styles.viewModeBadge}>
                    <LuCheck style={{ marginRight: 4 }} /> Ativo
                  </span>
                )}
              </div>
              <p className={styles.viewModeDesc}>
                Divide o preenchimento em 4 etapas guiadas (Antropometria → Perimetria → Dobras Pollock 7 → Resultados). 
                Ideal para foco, telas menores ou preenchimento sequencial.
              </p>
            </div>

            <div
              className={`${styles.viewModeCard} ${viewMode === "single" ? styles.viewModeCardSelected : ""}`}
              onClick={() => setViewMode("single")}
            >
              <div className={styles.viewModeHeader}>
                <span className={styles.viewModeTitle}>
                  <LuFileSpreadsheet /> Página Única (Contínuo)
                </span>
                {viewMode === "single" && (
                  <span className={styles.viewModeBadge}>
                    <LuCheck style={{ marginRight: 4 }} /> Ativo
                  </span>
                )}
              </div>
              <p className={styles.viewModeDesc}>
                Exibe todos os campos em uma única tela contínua com rolagem. 
                Ideal para avaliadores experientes com anotações em prancheta para digitação rápida.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSalvarPreferencias}
          >
            <LuSave /> Salvar Preferência
          </button>
        </section>

        {/* Card de Informações do Sistema */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <LuInfo /> Sobre o Sistema
          </div>
          <div style={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.6 }}>
            <p><strong>Projeto:</strong> Sistema de Avaliação Física & Gestão de Alunos (TCC)</p>
            <p><strong>Instituição:</strong> Universidade do Oeste de Santa Catarina (UNOESC)</p>
            <p><strong>Protocolo Padrão:</strong> Pollock 7 Dobras Cutâneas, Perimetria e Bioimpedância/Antropometria.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
