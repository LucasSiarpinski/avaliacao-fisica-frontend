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
  LuSave,
  LuMail,
  LuEye,
  LuEyeOff,
  LuShieldAlert
} from "react-icons/lu";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./configuracoes.module.css";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [viewMode, setViewMode] = useState("wizard"); // "wizard" ou "single"
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.gmail.com",
    port: "587",
    user: "lucasmiottosiarpinski@gmail.com",
    pass: "mzwo kcnw zlam ygbf",
  });

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
      const savedSmtp = localStorage.getItem("@TCC:smtpConfig");
      if (savedSmtp) {
        try {
          const parsed = JSON.parse(savedSmtp);
          setSmtpConfig((prev) => ({
            host: parsed.host || prev.host,
            port: parsed.port || prev.port,
            user: parsed.user || prev.user,
            pass: parsed.pass || prev.pass,
          }));
        } catch (e) {
          console.error("Erro ao ler configuração SMTP local:", e);
        }
      }
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSalvarPreferencias = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("@TCC:avaliacaoViewMode", viewMode);
      toast.success("Preferências salvas com sucesso!");
    }
  };

  const handleSalvarSmtp = (e) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("@TCC:smtpConfig", JSON.stringify(smtpConfig));
      toast.success("Configuração de e-mail remetente (SMTP) salva com sucesso!");
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

        {/* Card de Configuração de E-mail Remetente (SMTP) — EXCLUSIVO ADMIN (RBAC) */}
        {isAdmin && (
          <section className={styles.card}>
            <div className={styles.cardHeader} style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <LuMail /> E-mail de Origem (SMTP) para Envio de Laudos em PDF
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  backgroundColor: "rgba(255, 193, 7, 0.15)",
                  color: "#ffc107",
                  border: "1px solid rgba(255, 193, 7, 0.35)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "12px",
                }}
              >
                <LuShieldAlert size={13} /> Exclusivo Admin
              </span>
            </div>
            <p style={{ color: "#aaa", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
              Configure aqui a conta global de e-mail remetente (ex.: Gmail com <strong>Senha de App de 16 caracteres</strong>) para que o sistema envie automaticamente o Laudo em PDF anexado para o aluno. Esta seção é restrita a usuários com permissão <strong>ADMIN</strong>.
            </p>

            <form onSubmit={handleSalvarSmtp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "0.5rem" }} autoComplete="off">
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Servidor SMTP (Host)</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig((prev) => ({ ...prev, host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  style={{ width: "100%", minHeight: "44px", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #3c4936", background: "#1c2219", color: "#fff" }}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Porta SMTP</label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig((prev) => ({ ...prev, port: e.target.value }))}
                  placeholder="587"
                  style={{ width: "100%", minHeight: "44px", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #3c4936", background: "#1c2219", color: "#fff" }}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>E-mail de Origem (Remetente)</label>
                <input
                  type="email"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig((prev) => ({ ...prev, user: e.target.value }))}
                  placeholder="seuemail@gmail.com"
                  autoComplete="new-password"
                  style={{ width: "100%", minHeight: "44px", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #3c4936", background: "#1c2219", color: "#fff" }}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Senha de App (16 letras) / Senha SMTP</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                  <input
                    type={showSmtpPass ? "text" : "password"}
                    value={smtpConfig.pass}
                    onChange={(e) => setSmtpConfig((prev) => ({ ...prev, pass: e.target.value }))}
                    placeholder="xxxx xxxx xxxx xxxx"
                    autoComplete="new-password"
                    style={{ width: "100%", minHeight: "44px", padding: "0.65rem 2.6rem 0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #3c4936", background: "#1c2219", color: "#fff" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass((prev) => !prev)}
                    title={showSmtpPass ? "Ocultar senha SMTP" : "Visualizar senha SMTP"}
                    style={{
                      position: "absolute",
                      right: "0.65rem",
                      background: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.25rem",
                    }}
                  >
                    {showSmtpPass ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" className={styles.saveButton}>
                  <LuSave /> Salvar E-mail Remetente (SMTP)
                </button>
              </div>
            </form>
          </section>
        )}

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
