"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./avaliacao.module.css"; 
import SkinfoldInput from "../../../../components/SkinfoldInput";
import { useAuth } from "../../../../contexts/AuthContext"; 
import api from "../../../../services/api";
import { 
  calcularIMC, 
  calcularRCQ, 
  calcularComposicaoPollock7,
  calcularTestesFisicos
} from "../../../../utils/calculosFisicos";
import { maskCPF, maskPhone } from "../../../../utils/masks";
import { 
  FaWeight, 
  FaRulerVertical, 
  FaHeartbeat, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaPrint, 
  FaArrowLeft, 
  FaArrowRight, 
  FaSave, 
  FaInfoCircle, 
  FaChevronDown, 
  FaChevronUp,
  FaLayerGroup,
  FaFileAlt,
  FaDumbbell,
  FaEnvelope,
  FaPaperPlane,
  FaTimes
} from "react-icons/fa";

function calcularIdade(dataNasc) {
  if (!dataNasc) return 25;
  try {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return isNaN(idade) ? 25 : idade;
  } catch {
    return 25;
  }
}

export default function AvaliacaoWizardPage() {
  const router = useRouter();
  const params = useParams(); 
  const { id } = params;

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [avaliacao, setAvaliacao] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showMedicalSnapshot, setShowMedicalSnapshot] = useState(false);
  const [viewMode, setViewMode] = useState("wizard"); // "wizard" ou "single"

  // Estados para o envio do relatório por e-mail
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDestino, setEmailDestino] = useState("");
  const [emailAssunto, setEmailAssunto] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("@TCC:avaliacaoViewMode");
      if (savedMode === "single" || savedMode === "wizard") {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("@TCC:avaliacaoViewMode", mode);
    }
    toast.success(mode === "single" ? "Modo Página Única ativado!" : "Modo Em Etapas ativado!");
  };

  const handleNavigateTo = (stepNum, elementId) => {
    if (viewMode === "wizard") {
      setCurrentStep(stepNum);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      if (typeof window !== "undefined") {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };


  // --- BUSCA DE DADOS ---
  const fetchAvaliacao = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/avaliacoes/${id}`);
      const data = response.data;
      const tfSalvos = data.resultados?.testesFisicos || {};
      setAvaliacao({
        ...data,
        resistenciaAbdominal:
          tfSalvos.resistenciaAbdominal !== undefined && tfSalvos.resistenciaAbdominal !== null
            ? String(tfSalvos.resistenciaAbdominal)
            : "",
        preensaoManualD:
          tfSalvos.preensaoManualD !== undefined && tfSalvos.preensaoManualD !== null
            ? String(tfSalvos.preensaoManualD)
            : "",
        preensaoManualE:
          tfSalvos.preensaoManualE !== undefined && tfSalvos.preensaoManualE !== null
            ? String(tfSalvos.preensaoManualE)
            : "",
      });
      setEmailDestino(data.aluno?.email || "");
      setEmailAssunto(
        `Relatório de Avaliação Física - ${data.aluno?.nome || "Aluno"} (UNOESC)`
      );
    } catch (error) {
      console.error("Erro ao buscar avaliação:", error);
      toast.error("Não foi possível carregar os dados da avaliação.");
      router.push("/avaliacoes");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchAvaliacao();
    }
  }, [isAuthenticated, fetchAvaliacao]);

  // Disparo automático de impressão se acessado via ?print=true
  useEffect(() => {
    if (avaliacao && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("print") === "true") {
        const timer = setTimeout(() => {
          window.print();
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [avaliacao]);

  // --- HANDLERS DO FORMULÁRIO ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAvaliacao((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- CÁLCULOS EM TEMPO REAL ---
  const aluno = avaliacao?.aluno;
  const idade = useMemo(() => calcularIdade(aluno?.dataNasc), [aluno?.dataNasc]);
  const genero = aluno?.genero || "M";

  const imcData = useMemo(() => {
    if (!avaliacao) return null;
    return calcularIMC(avaliacao.peso, avaliacao.altura);
  }, [avaliacao?.peso, avaliacao?.altura]);

  const rcqData = useMemo(() => {
    if (!avaliacao) return null;
    return calcularRCQ(avaliacao.circCintura, avaliacao.circQuadril, genero);
  }, [avaliacao?.circCintura, avaliacao?.circQuadril, genero]);

  const composicaoData = useMemo(() => {
    if (!avaliacao) return { completo: false, faltantes: [] };
    return calcularComposicaoPollock7(avaliacao, idade, genero, avaliacao.peso);
  }, [avaliacao, idade, genero]);

  const testesFisicosData = useMemo(() => {
    if (!avaliacao) return { completo: false, parcial: false, abdominal: null, preensao: null };
    return calcularTestesFisicos(avaliacao, idade, genero);
  }, [
    avaliacao?.resistenciaAbdominal,
    avaliacao?.preensaoManualD,
    avaliacao?.preensaoManualE,
    idade,
    genero,
  ]);

  // --- STATUS DE PRONTIDÃO DE CADA PASSO ---
  const stepStatus = useMemo(() => {
    if (!avaliacao) return { step1: "gray", step2: "gray", step3: "gray" };

    // Passo 1: Peso e Altura
    const p1Filled = Boolean(parseFloat(avaliacao.peso) > 0 && parseFloat(avaliacao.altura) > 0);
    const p1Partial = Boolean(parseFloat(avaliacao.peso) > 0 || parseFloat(avaliacao.altura) > 0);
    const step1 = p1Filled ? "green" : p1Partial ? "yellow" : "gray";

    // Passo 2: Perimetria
    const p2Filled = Boolean(parseFloat(avaliacao.circCintura) > 0 && parseFloat(avaliacao.circQuadril) > 0);
    const p2Partial = Boolean(
      parseFloat(avaliacao.circCintura) > 0 || 
      parseFloat(avaliacao.circAbdomem) > 0 || 
      parseFloat(avaliacao.circQuadril) > 0 ||
      parseFloat(avaliacao.circBracoRelaxadoD) > 0
    );
    const step2 = p2Filled ? "green" : p2Partial ? "yellow" : "gray";

    // Passo 3: Dobras Pollock + Testes Físicos
    const step3 = composicaoData.completo 
      ? "green" 
      : composicaoData.faltantes.length < 7 || testesFisicosData.parcial
        ? "yellow" 
        : "gray";

    return { step1, step2, step3 };
  }, [avaliacao, composicaoData, testesFisicosData]);

  // --- PERSISTÊNCIA / SALVAMENTO ---
  const handleSave = async (showSuccessToast = true) => {
    if (!avaliacao) return false;
    setIsSaving(true);
    try {
      const resultadosCalculados = {
        ...(avaliacao.resultados || {}),
        imc: imcData,
        rcq: rcqData,
        composicao: composicaoData,
        testesFisicos: testesFisicosData,
        calculadoEm: new Date().toISOString(),
      };

      await api.put(`/api/avaliacoes/${id}`, {
        ...avaliacao,
        resultados: resultadosCalculados,
      });

      setAvaliacao((prev) => ({
        ...prev,
        resultados: resultadosCalculados,
      }));

      if (showSuccessToast) {
        toast.success("Dados da avaliação salvos com sucesso!");
      }
      return true;
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      toast.error("Não foi possível salvar os dados da avaliação.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Gera o resumo textual estruturado para envio do relatório por e-mail
  const gerarResumoRelatorioTexto = useCallback(() => {
    if (!avaliacao) return "";
    const dataAval = new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR");
    const linhas = [
      `RELATÓRIO DE AVALIAÇÃO FÍSICA — UNOESC`,
      `Laudo Técnico Nº #${avaliacao.id} | Data: ${dataAval}`,
      `Aluno(a): ${aluno?.nome || "---"} | Matrícula: ${aluno?.matricula || "---"}`,
      `Avaliador(a): ${avaliacao.avaliador?.name || "Professor Avaliador"}`,
      `--------------------------------------------------`,
      `1. ANTROPOMETRIA & IMC:`,
      `• Peso: ${avaliacao.peso ? `${avaliacao.peso} kg` : "Não informado"}`,
      `• Altura: ${avaliacao.altura ? `${avaliacao.altura}` : "Não informada"}`,
      `• IMC: ${imcData ? `${imcData.valor} kg/m² (${imcData.classificacao})` : "Não calculado"}`,
      ``,
      `2. PERIMETRIA & RCQ:`,
      `• Cintura: ${avaliacao.circCintura ? `${avaliacao.circCintura} cm` : "--"} | Abdômen: ${avaliacao.circAbdomem ? `${avaliacao.circAbdomem} cm` : "--"} | Quadril: ${avaliacao.circQuadril ? `${avaliacao.circQuadril} cm` : "--"}`,
      `• RCQ: ${rcqData ? `${rcqData.valor} (${rcqData.risco})` : "Não calculado"}`,
      ``,
      `3. COMPOSIÇÃO CORPORAL (POLLOCK 7 DOBRAS):`,
      composicaoData.completo
        ? `• % de Gordura: ${composicaoData.percGordura}% (${composicaoData.classificacaoGordura})\n• Densidade Corporal: ${composicaoData.densidadeCorporal} g/cm³ | Soma 7 Dobras: ${composicaoData.somaDobras} mm\n• Massa Magra: ${composicaoData.massaMagra ?? "--"} kg | Massa Gorda: ${composicaoData.massaGorda ?? "--"} kg`
        : `• Protocolo Pollock 7 Dobras parcial/não mensurado nesta sessão.`,
      ``,
      `4. TESTES FÍSICOS NEUROMOTORES:`,
      testesFisicosData.abdominal
        ? `• Resistência Abdominal (1 min): ${testesFisicosData.abdominal.repeticoes} repetições — Classificação: ${testesFisicosData.abdominal.classificacao} (${testesFisicosData.abdominal.pontuacao} pts)`
        : `• Resistência Abdominal: Não realizado`,
      testesFisicosData.preensao
        ? `• Preensão Manual (Dinamometria): Direita ${testesFisicosData.preensao.direita ?? "--"} kgf | Esquerda ${testesFisicosData.preensao.esquerda ?? "--"} kgf (Máx: ${testesFisicosData.preensao.maior} kgf) — Classificação: ${testesFisicosData.preensao.classificacao} (${testesFisicosData.preensao.pontuacao} pts)`
        : `• Preensão Manual: Não realizado`,
      ``,
      `5. PARECER TÉCNICO DO AVALIADOR:`,
      avaliacao.observacoes || "Sem observações adicionais registradas.",
    ];
    return linhas.join("\n");
  }, [avaliacao, aluno, imcData, rcqData, composicaoData, testesFisicosData]);

  const handleOpenEmailModal = () => {
    setEmailDestino(aluno?.email || "");
    setEmailAssunto(
      `Relatório de Avaliação Física - ${aluno?.nome || "Aluno"} (UNOESC)`
    );
    setShowEmailModal(true);
  };

  const handleSendEmailSystem = async () => {
    if (!emailDestino || !emailDestino.includes("@")) {
      toast.error("Informe um endereço de e-mail válido para o destinatário.");
      return;
    }

    setSendingEmail(true);
    try {
      await handleSave(false);
      const mensagem = gerarResumoRelatorioTexto();
      const res = await api.post(`/api/avaliacoes/${id}/enviar-email`, {
        destinatario: emailDestino.trim(),
        assunto: emailAssunto,
        mensagem,
      });

      setAvaliacao((prev) => ({
        ...prev,
        resultados: {
          ...(prev.resultados || {}),
          ultimoEnvioEmail: res.data.envio,
        },
      }));

      toast.success(res.data.message || `Relatório enviado para ${emailDestino}!`);
      setShowEmailModal(false);
    } catch (error) {
      console.error("Erro ao enviar relatório por e-mail:", error);
      toast.error(
        error.response?.data?.error || "Não foi possível enviar o relatório por e-mail."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenMailto = async () => {
    await handleSave(false);
    const body = encodeURIComponent(gerarResumoRelatorioTexto());
    const subject = encodeURIComponent(
      emailAssunto || `Relatório de Avaliação Física - ${aluno?.nome || "Aluno"}`
    );
    const to = encodeURIComponent(emailDestino || aluno?.email || "");
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    toast.success("Cliente de e-mail aberto com o relatório preenchido!");
  };

  const handleFinalizar = async (tipoRelatorio = "completo") => {
    const saved = await handleSave(false);
    if (!saved) return;

    if (tipoRelatorio === "antropometrico") {
      toast.success("Relatório Antropométrico emitido com sucesso!");
    } else {
      toast.success("Avaliação Física concluída com Laudo Completo!");
    }

    // Abre janela de impressão ou relatório formatado
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const isAvaliacaoConcluida = Boolean(parseFloat(avaliacao?.peso) > 0 && parseFloat(avaliacao?.altura) > 0);

  if (loading || authLoading || !avaliacao) {
    return (
      <div className={styles.container} style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Carregando avaliação física...</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* --- CABEÇALHO --- */}
      <header className={styles.header}>
        <div className={styles.headerTitleBlock}>
          <h1 className={styles.title}>
            <FaHeartbeat className={styles.titleIcon} />
            <span className={styles.titlePrefix}>Avaliação Física:</span>
            <span className={styles.alunoName} title={aluno?.nome || "Aluno"}>
              {aluno?.nome || "Aluno"}
            </span>
          </h1>
          <div className={styles.alunoMetaRow}>
            <span className={styles.alunoMetaBadge}>
              {idade} anos • {genero === "F" ? "Feminino" : "Masculino"}
            </span>
            {aluno?.matricula && (
              <span className={styles.alunoMetaBadge}>
                Matrícula: {aluno.matricula}
              </span>
            )}
            {isAvaliacaoConcluida ? (
              <span className={styles.statusBadgeConcluida} title="Avaliação com medidas registradas">
                ✓ Concluída
              </span>
            ) : (
              <span className={styles.statusBadgeAndamento} title="Avaliação em andamento (aguardando preenchimento)">
                ⏳ Em Andamento
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {/* Seletor de Modo de Visualização */}
          <div className={styles.viewModeToggle}>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === "wizard" ? styles.viewModeBtnActive : ""}`}
              onClick={() => handleToggleViewMode("wizard")}
              title="Visualização Passo a Passo em 4 Etapas"
            >
              <FaLayerGroup /> Etapas
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === "single" ? styles.viewModeBtnActive : ""}`}
              onClick={() => handleToggleViewMode("single")}
              title="Visualização em Página Única Contínua"
            >
              <FaFileAlt /> Página Única
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleFinalizar("imprimir")}
            className={styles.printHeaderButton}
            title="Emitir Laudo Clínico Oficial e Imprimir"
          >
            <FaPrint /> Imprimir Laudo
          </button>
          <button
            type="button"
            onClick={handleOpenEmailModal}
            className={styles.emailHeaderButton}
            title="Exportar e enviar relatório de avaliação por e-mail para o aluno"
          >
            <FaEnvelope /> Enviar por E-mail
          </button>
          <button
            type="button"
            onClick={() => router.push("/avaliacoes")}
            className={styles.backButton}
            disabled={isSaving}
          >
            <FaArrowLeft /> Lista de Avaliações
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className={styles.saveButton}
            disabled={isSaving}
          >
            <FaSave /> {isSaving ? "Salvando..." : "Salvar Rascunho"}
          </button>
        </div>
      </header>

      {/* --- NAVEGAÇÃO SUPERIOR: STEPPER OU ATALHOS --- */}
      {viewMode === "wizard" ? (
      <div className={styles.stepperContainer}>
        <div className={styles.stepperNav}>
          {/* Passo 1 */}
          <button
            type="button"
            className={`${styles.stepButton} ${currentStep === 1 ? styles.stepActive : ""} ${stepStatus.step1 === "green" ? styles.stepCompleted : ""}`}
            onClick={() => setCurrentStep(1)}
          >
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepText}>
              <span className={styles.stepTitle}>Básicos & IMC</span>
              <span className={styles.stepSubtitle}>Peso, Altura, Data</span>
            </div>
            <span className={`${styles.stepStatusDot} ${
              stepStatus.step1 === "green" ? styles.statusDotGreen : stepStatus.step1 === "yellow" ? styles.statusDotYellow : styles.statusDotGray
            }`}></span>
          </button>

          {/* Passo 2 */}
          <button
            type="button"
            className={`${styles.stepButton} ${currentStep === 2 ? styles.stepActive : ""} ${stepStatus.step2 === "green" ? styles.stepCompleted : ""}`}
            onClick={() => setCurrentStep(2)}
          >
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepText}>
              <span className={styles.stepTitle}>Perimetria & RCQ</span>
              <span className={styles.stepSubtitle}>Circunferências (cm)</span>
            </div>
            <span className={`${styles.stepStatusDot} ${
              stepStatus.step2 === "green" ? styles.statusDotGreen : stepStatus.step2 === "yellow" ? styles.statusDotYellow : styles.statusDotGray
            }`}></span>
          </button>

          {/* Passo 3 */}
          <button
            type="button"
            className={`${styles.stepButton} ${currentStep === 3 ? styles.stepActive : ""} ${stepStatus.step3 === "green" ? styles.stepCompleted : ""}`}
            onClick={() => setCurrentStep(3)}
          >
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepText}>
              <span className={styles.stepTitle}>Dobras & Testes</span>
              <span className={styles.stepSubtitle}>Pollock 7 + Neuromotores</span>
            </div>
            <span className={`${styles.stepStatusDot} ${
              stepStatus.step3 === "green" ? styles.statusDotGreen : stepStatus.step3 === "yellow" ? styles.statusDotYellow : styles.statusDotGray
            }`}></span>
          </button>

          {/* Passo 4 */}
          <button
            type="button"
            className={`${styles.stepButton} ${currentStep === 4 ? styles.stepActive : ""}`}
            onClick={() => setCurrentStep(4)}
          >
            <span className={styles.stepNumber}>4</span>
            <div className={styles.stepText}>
              <span className={styles.stepTitle}>Revisão & Laudo</span>
              <span className={styles.stepSubtitle}>PDF e Envio p/ E-mail</span>
            </div>
          </button>
        </div>
      </div>
      ) : (
        <div className={styles.singlePageNav}>
          <span className={styles.singlePageNavLabel}>Atalhos:</span>
          <button
            type="button"
            className={styles.singlePageNavLink}
            onClick={() => handleNavigateTo(1, "secao-antropometria")}
          >
            <FaWeight /> 1. Antropometria & IMC
          </button>
          <button
            type="button"
            className={styles.singlePageNavLink}
            onClick={() => handleNavigateTo(2, "secao-perimetria")}
          >
            <FaRulerVertical /> 2. Perimetria & RCQ
          </button>
          <button
            type="button"
            className={styles.singlePageNavLink}
            onClick={() => handleNavigateTo(3, "secao-dobras")}
          >
            <FaHeartbeat /> 3. Dobras & Testes Físicos
          </button>
          <button
            type="button"
            className={styles.singlePageNavLink}
            onClick={() => handleNavigateTo(4, "secao-laudo")}
          >
            <FaCheckCircle /> 4. Diagnóstico & Laudo
          </button>
        </div>
      )}

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className={styles.content}>
        {viewMode === "wizard" ? (
          <>
            {currentStep === 1 && (
              <div className={styles.formGrid}>
            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>IMC Calculado</span>
                <span className={styles.calcCardValue}>
                  {imcData ? `${imcData.valor} kg/m²` : "Aguardando medidas..."}
                  {imcData && (
                    <span 
                      className={styles.calcBadge} 
                      style={{ backgroundColor: `${imcData.cor}22`, color: imcData.cor, border: `1px solid ${imcData.cor}` }}
                    >
                      {imcData.classificacao}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Status da Etapa</span>
                <span style={{ color: stepStatus.step1 === "green" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                  {stepStatus.step1 === "green" ? "✓ Pronto para cálculos" : "Preencha Peso e Altura"}
                </span>
              </div>
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaWeight /> Antropometria Básica
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="peso">Peso Atual (kg) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="peso" 
                id="peso" 
                placeholder="Ex: 72.5" 
                value={avaliacao.peso || ""} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="altura">Altura (cm ou m) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="altura" 
                id="altura" 
                placeholder="Ex: 1.75 ou 175" 
                value={avaliacao.altura || ""} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Data da Avaliação</label>
              <input 
                type="date" 
                value={avaliacao.dataAvaliacao ? avaliacao.dataAvaliacao.split("T")[0] : ""} 
                disabled 
              />
            </div>

            {/* Acordeão de Anamnese / PAR-Q para consulta rápida */}
            <div className={styles.fullWidth} style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setShowMedicalSnapshot(!showMedicalSnapshot)}
                style={{
                  background: "#222a1f",
                  border: "1px solid #364630",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  color: "#a4c979",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaInfoCircle /> Consultar Histórico Clínico & PAR-Q do Aluno
                </span>
                {showMedicalSnapshot ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showMedicalSnapshot && (
                <div style={{ background: "#1c221a", padding: "1.25rem", borderRadius: "8px", border: "1px solid #2e3a2b", marginTop: "0.75rem" }}>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1" }}>
                    <strong>Objetivos:</strong> {avaliacao.objetivos || "Não informado"}
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1" }}>
                    <strong>Histórico Médico:</strong> {avaliacao.historicoMedico || "Nenhum histórico informado"}
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1" }}>
                    <strong>Medicamentos em uso:</strong> {avaliacao.medicamentosEmUso || "Nenhum"}
                  </p>
                  <p style={{ margin: "0", color: "#cbd5e1" }}>
                    <strong>Hábitos:</strong> {avaliacao.habitos || "Não informado"}
                  </p>
                </div>
              )}
            </div>
          </div>
            )}

            {currentStep === 2 && (
              <div className={styles.formGrid}>
            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Relação Cintura-Quadril (RCQ)</span>
                <span className={styles.calcCardValue}>
                  {rcqData ? `${rcqData.valor}` : "Preencha Cintura e Quadril"}
                  {rcqData && (
                    <span 
                      className={styles.calcBadge} 
                      style={{ backgroundColor: `${rcqData.cor}22`, color: rcqData.cor, border: `1px solid ${rcqData.cor}` }}
                    >
                      {rcqData.risco}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Status da Perimetria</span>
                <span style={{ color: stepStatus.step2 === "green" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                  {stepStatus.step2 === "green" ? "✓ Cintura e Quadril completos" : "Cintura e Quadril recomendados p/ RCQ"}
                </span>
              </div>
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaRulerVertical /> Circunferências Tronco (cm)
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="circCintura">Cintura (cm) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="circCintura" 
                id="circCintura" 
                placeholder="Ex: 82.5" 
                value={avaliacao.circCintura || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circAbdomem">Abdômen (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                name="circAbdomem" 
                id="circAbdomem" 
                placeholder="Ex: 86.0" 
                value={avaliacao.circAbdomem || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circQuadril">Quadril (cm) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="circQuadril" 
                id="circQuadril" 
                placeholder="Ex: 98.0" 
                value={avaliacao.circQuadril || ""} 
                onChange={handleChange} 
              />
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaRulerVertical /> Membros Superiores (cm)
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="circBracoRelaxadoD">Braço Relaxado Direito</label>
              <input 
                type="number" 
                step="0.1" 
                name="circBracoRelaxadoD" 
                id="circBracoRelaxadoD" 
                placeholder="Ex: 34.0" 
                value={avaliacao.circBracoRelaxadoD || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circBracoRelaxadoE">Braço Relaxado Esquerdo</label>
              <input 
                type="number" 
                step="0.1" 
                name="circBracoRelaxadoE" 
                id="circBracoRelaxadoE" 
                placeholder="Ex: 33.5" 
                value={avaliacao.circBracoRelaxadoE || ""} 
                onChange={handleChange} 
              />
            </div>
          </div>
            )}

            {currentStep === 3 && (
              <div className={styles.formGrid}>
            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Soma das 7 Dobras</span>
                <span className={styles.calcCardValue}>
                  {composicaoData.somaDobras ? `${composicaoData.somaDobras} mm` : "Preenchendo..."}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>% Gordura Estimado</span>
                <span className={styles.calcCardValue}>
                  {composicaoData.percGordura ? `${composicaoData.percGordura}%` : "Aguardando as 7 dobras"}
                  {composicaoData.classificacaoGordura && (
                    <span className={styles.calcBadge} style={{ backgroundColor: "#10b98122", color: "#34d399", border: "1px solid #10b981" }}>
                      {composicaoData.classificacaoGordura}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Faltantes</span>
                <span style={{ color: composicaoData.completo ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                  {composicaoData.completo ? "✓ Todas preenchidas" : `Faltam ${composicaoData.faltantes.length} dobras`}
                </span>
              </div>
            </div>

            <h3 className={styles.formSectionTitle}>
              Protocolo Jackson & Pollock (7 Dobras Cutâneas em mm)
            </h3>

            <SkinfoldInput
              label="1. Tríceps"
              name="dcTriceps"
              id="dcTriceps"
              value={avaliacao.dcTriceps}
              onChange={handleChange}
              placeholder="Ex: 12.5"
            />

            <SkinfoldInput
              label="2. Subescapular"
              name="dcSubescapular"
              id="dcSubescapular"
              value={avaliacao.dcSubescapular}
              onChange={handleChange}
              placeholder="Ex: 14.0"
            />

            <SkinfoldInput
              label="3. Peitoral / Torácica"
              name="dcPeitoral"
              id="dcPeitoral"
              value={avaliacao.dcPeitoral}
              onChange={handleChange}
              placeholder="Ex: 10.0"
            />

            <SkinfoldInput
              label="4. Axilar Média"
              name="dcAxilarMedia"
              id="dcAxilarMedia"
              value={avaliacao.dcAxilarMedia}
              onChange={handleChange}
              placeholder="Ex: 11.5"
            />

            <SkinfoldInput
              label="5. Supra-ilíaca"
              name="dcSuprailiaca"
              id="dcSuprailiaca"
              value={avaliacao.dcSuprailiaca}
              onChange={handleChange}
              placeholder="Ex: 15.0"
            />

            <SkinfoldInput
              label="6. Abdominal"
              name="dcAbdominal"
              id="dcAbdominal"
              value={avaliacao.dcAbdominal}
              onChange={handleChange}
              placeholder="Ex: 18.0"
            />

            <SkinfoldInput
              label="7. Coxa"
              name="dcCoxa"
              id="dcCoxa"
              value={avaliacao.dcCoxa}
              onChange={handleChange}
              placeholder="Ex: 16.5"
            />

            {/* --- SEÇÃO DE TESTES FÍSICOS NEUROMOTORES --- */}
            <h3 className={styles.formSectionTitle} style={{ marginTop: "2rem" }}>
              <FaDumbbell /> Testes Físicos Neuromotores (Resistência Abdominal & Preensão Manual)
            </h3>

            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Resistência Abdominal (1 min)</span>
                <span className={styles.calcCardValue}>
                  {testesFisicosData.abdominal
                    ? `${testesFisicosData.abdominal.repeticoes} rep`
                    : "Aguardando..."}
                  {testesFisicosData.abdominal && (
                    <span
                      className={styles.calcBadge}
                      style={{
                        backgroundColor: `${testesFisicosData.abdominal.cor}22`,
                        color: testesFisicosData.abdominal.cor,
                        border: `1px solid ${testesFisicosData.abdominal.cor}`,
                      }}
                    >
                      {testesFisicosData.abdominal.classificacao} ({testesFisicosData.abdominal.pontuacao} pts)
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Preensão Manual Máx. (Dinamometria)</span>
                <span className={styles.calcCardValue}>
                  {testesFisicosData.preensao
                    ? `${testesFisicosData.preensao.maior} kgf`
                    : "Aguardando..."}
                  {testesFisicosData.preensao && (
                    <span
                      className={styles.calcBadge}
                      style={{
                        backgroundColor: `${testesFisicosData.preensao.cor}22`,
                        color: testesFisicosData.preensao.cor,
                        border: `1px solid ${testesFisicosData.preensao.cor}`,
                      }}
                    >
                      {testesFisicosData.preensao.classificacao} ({testesFisicosData.preensao.pontuacao} pts)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <SkinfoldInput
              label="Resistência Abdominal (1 min)"
              name="resistenciaAbdominal"
              id="resistenciaAbdominal"
              value={avaliacao.resistenciaAbdominal}
              onChange={handleChange}
              placeholder="Ex: 35"
              step={1}
              min={0}
              unit="rep"
            />

            <SkinfoldInput
              label="Preensão Manual Direita (Dinamometria)"
              name="preensaoManualD"
              id="preensaoManualD"
              value={avaliacao.preensaoManualD}
              onChange={handleChange}
              placeholder="Ex: 44.5"
              step={0.5}
              min={0}
              unit="kgf"
            />

            <SkinfoldInput
              label="Preensão Manual Esquerda (Dinamometria)"
              name="preensaoManualE"
              id="preensaoManualE"
              value={avaliacao.preensaoManualE}
              onChange={handleChange}
              placeholder="Ex: 42.0"
              step={0.5}
              min={0}
              unit="kgf"
            />
          </div>
            )}

            {currentStep === 4 && (
              <div className={styles.readinessContainer}>
            {/* Banner de Prontidão */}
            <div className={styles.readinessBanner}>
              <div className={styles.readinessHeader}>
                <h3>
                  <FaCheckCircle style={{ color: "#34d399" }} /> Diagnóstico e Prontidão do Relatório
                </h3>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Verificação automática antes da emissão
                </span>
              </div>

              <div className={styles.checklistGrid}>
                {/* Item 1: Básicos */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>1. Antropometria Básica</span>
                    <span className={`${styles.checkItemStatus} ${stepStatus.step1 === "green" ? styles.checkSuccess : styles.checkDanger}`}>
                      {stepStatus.step1 === "green" ? "Concluído" : "Incompleto"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {stepStatus.step1 === "green" 
                      ? `Peso: ${avaliacao.peso}kg • Altura: ${avaliacao.altura} • IMC: ${imcData?.valor}`
                      : "Peso e Altura são obrigatórios para qualquer laudo."}
                  </p>
                  {stepStatus.step1 !== "green" && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(1, "secao-antropometria")}>
                      Corrigir no Passo 1 ➔
                    </button>
                  )}
                </div>

                {/* Item 2: Perimetria */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>2. Perimetria (RCQ)</span>
                    <span className={`${styles.checkItemStatus} ${stepStatus.step2 === "green" ? styles.checkSuccess : styles.checkWarning}`}>
                      {stepStatus.step2 === "green" ? "Concluído" : "Opcional"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {rcqData 
                      ? `RCQ: ${rcqData.valor} (${rcqData.risco})`
                      : "Cintura e Quadril ausentes. Laudo seguirá sem o índice de RCQ."}
                  </p>
                  {stepStatus.step2 !== "green" && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(2, "secao-perimetria")}>
                      Preencher no Passo 2 ➔
                    </button>
                  )}
                </div>

                {/* Item 3: Dobras Pollock */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>3. Dobras Cutâneas</span>
                    <span className={`${styles.checkItemStatus} ${composicaoData.completo ? styles.checkSuccess : styles.checkWarning}`}>
                      {composicaoData.completo ? "Concluído (100%)" : "Incompleto"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {composicaoData.completo 
                      ? `7 dobras • ${composicaoData.percGordura}% Gordura (${composicaoData.classificacaoGordura})`
                      : `Faltam ${composicaoData.faltantes.length} dobras: ${composicaoData.faltantes.slice(0, 3).join(", ")}${composicaoData.faltantes.length > 3 ? "..." : ""}`}
                  </p>
                  {!composicaoData.completo && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(3, "secao-dobras")}>
                      Completar Dobras no Passo 3 ➔
                    </button>
                  )}
                </div>

                {/* Item 4: Testes Físicos */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>4. Testes Físicos</span>
                    <span className={`${styles.checkItemStatus} ${testesFisicosData.completo ? styles.checkSuccess : styles.checkWarning}`}>
                      {testesFisicosData.completo ? "Concluído" : testesFisicosData.parcial ? "Parcial" : "Opcional"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {testesFisicosData.parcial
                      ? `Abdominal: ${testesFisicosData.abdominal ? `${testesFisicosData.abdominal.repeticoes} rep (${testesFisicosData.abdominal.classificacao})` : "--"} • Preensão: ${testesFisicosData.preensao ? `${testesFisicosData.preensao.maior} kgf (${testesFisicosData.preensao.classificacao})` : "--"}`
                      : "Resistência abdominal e preensão manual disponíveis no Passo 3."}
                  </p>
                  {!testesFisicosData.completo && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(3, "secao-dobras")}>
                      Preencher Testes no Passo 3 ➔
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dashboard de Métricas Calculadas */}
            <div className={styles.resultsDashboard}>
              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Índice de Massa Corporal</span>
                <p className={styles.resultCardNumber}>
                  {imcData ? `${imcData.valor}` : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: imcData?.cor || "#aaa" }}>
                  {imcData?.classificacao || "Aguardando medidas"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Relação Cintura-Quadril</span>
                <p className={styles.resultCardNumber}>
                  {rcqData ? `${rcqData.valor}` : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: rcqData?.cor || "#aaa" }}>
                  {rcqData?.risco || "Opcional"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>% de Gordura Corporal</span>
                <p className={styles.resultCardNumber}>
                  {composicaoData.percGordura ? `${composicaoData.percGordura}%` : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: "#34d399" }}>
                  {composicaoData.classificacaoGordura || "Requer 7 dobras"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Massa Magra vs Gorda</span>
                <p className={styles.resultCardNumber} style={{ fontSize: "1.3rem" }}>
                  {composicaoData.massaMagra ? `${composicaoData.massaMagra} kg` : "--"}
                </p>
                <span className={styles.resultCardSub}>
                  {composicaoData.massaGorda ? `Gordura: ${composicaoData.massaGorda} kg` : "Aguardando cálculo"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Testes Físicos (Força & Abd.)</span>
                <p className={styles.resultCardNumber} style={{ fontSize: "1.25rem" }}>
                  {testesFisicosData.abdominal || testesFisicosData.preensao
                    ? `${testesFisicosData.abdominal ? `${testesFisicosData.abdominal.repeticoes} rep` : "--"} / ${testesFisicosData.preensao ? `${testesFisicosData.preensao.maior} kgf` : "--"}`
                    : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: testesFisicosData.abdominal?.cor || testesFisicosData.preensao?.cor || "#94a3b8" }}>
                  {testesFisicosData.abdominal || testesFisicosData.preensao
                    ? `Abd: ${testesFisicosData.abdominal?.classificacao || "--"} • Preensão: ${testesFisicosData.preensao?.classificacao || "--"}`
                    : "Abdominal e Preensão"}
                </span>
              </div>
            </div>

            {/* Parecer do Avaliador */}
            <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
              <label htmlFor="observacoes" style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                Parecer Técnico e Recomendações do Avaliador
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows="4"
                placeholder="Insira as orientações de treino, observações metabólicas e metas para a próxima reavaliação..."
                value={avaliacao.observacoes || ""}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* Ações Inteligentes de Emissão do Laudo */}
            <div style={{ background: "#20281d", border: "1px solid #36462f", borderRadius: "12px", padding: "1.5rem", marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#a4d864" }}>
                Opções de Emissão e Envio de Relatório:
              </h4>

              {stepStatus.step1 !== "green" ? (
                <div style={{ color: "#f87171", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaExclamationTriangle />
                  <span>Para emitir qualquer relatório, é indispensável preencher o Peso e a Altura no Passo 1.</span>
                </div>
              ) : composicaoData.completo ? (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleFinalizar("completo")}
                    className={styles.finishButton}
                  >
                    <FaPrint /> Emitir Laudo Completo em PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenEmailModal}
                    className={styles.emailHeaderButton}
                  >
                    <FaEnvelope /> Enviar Relatório por E-mail
                  </button>
                  <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                    ✓ Todas as 7 dobras e medidas estão 100% preenchidas.
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaExclamationTriangle />
                    <span>
                      Faltam {composicaoData.faltantes.length} dobras cutâneas para o cálculo de Pollock. Você pode emitir o relatório antropométrico parcial, enviar por e-mail ou voltar e preenchê-las:
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleFinalizar("antropometrico")}
                      className={styles.finishButton}
                      style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
                    >
                      <FaPrint /> Emitir Relatório em PDF (IMC + Perimetria)
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenEmailModal}
                      className={styles.emailHeaderButton}
                    >
                      <FaEnvelope /> Enviar Relatório por E-mail
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className={styles.backButton}
                      style={{ border: "1px solid #5d812e", color: "#a4d864" }}
                    >
                      Voltar ao Passo 3 e Preencher Dobras ➔
                    </button>
                  </div>
                </div>
              )}

              {avaliacao.resultados?.ultimoEnvioEmail && (
                <div style={{ marginTop: "0.85rem", fontSize: "0.82rem", color: "#4ade80" }}>
                  ✓ Último envio por e-mail registrado para <strong>{avaliacao.resultados.ultimoEnvioEmail.enviadoPara}</strong> em{" "}
                  {new Date(avaliacao.resultados.ultimoEnvioEmail.enviadoEm).toLocaleString("pt-BR")}
                </div>
              )}
            </div>
          </div>
            )}

            {/* --- NAVEGAÇÃO INFERIOR DO WIZARD --- */}
        <footer className={styles.wizardFooter}>
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                className={styles.backButton}
              >
                <FaArrowLeft /> Etapa Anterior
              </button>
            )}
          </div>

          <div className={styles.wizardFooterActions}>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className={styles.backButton}
              disabled={isSaving}
            >
              <FaSave /> Salvar Rascunho
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 4))}
                className={styles.finishButton}
              >
                Próxima Etapa <FaArrowRight />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className={styles.saveButton}
                disabled={isSaving}
              >
                <FaSave /> Salvar Alterações
              </button>
            )}
          </div>
        </footer>
          </>
        ) : (
          <div className={styles.singlePageContainer}>
            <section id="secao-antropometria" className={styles.singleSectionCard}>
              <div className={styles.singleSectionHeader}>
                <h3 className={styles.singleSectionTitle}>
                  <FaWeight /> 1. Antropometria Básica & IMC
                </h3>
                <span className={styles.calcBadge} style={{ background: "#5d812e33", color: "#8da96d" }}>Seção 1 de 4</span>
              </div>
              <div className={styles.formGrid}>
            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>IMC Calculado</span>
                <span className={styles.calcCardValue}>
                  {imcData ? `${imcData.valor} kg/m²` : "Aguardando medidas..."}
                  {imcData && (
                    <span 
                      className={styles.calcBadge} 
                      style={{ backgroundColor: `${imcData.cor}22`, color: imcData.cor, border: `1px solid ${imcData.cor}` }}
                    >
                      {imcData.classificacao}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Status da Etapa</span>
                <span style={{ color: stepStatus.step1 === "green" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                  {stepStatus.step1 === "green" ? "✓ Pronto para cálculos" : "Preencha Peso e Altura"}
                </span>
              </div>
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaWeight /> Antropometria Básica
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="peso">Peso Atual (kg) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="peso" 
                id="peso" 
                placeholder="Ex: 72.5" 
                value={avaliacao.peso || ""} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="altura">Altura (cm ou m) *</label>
              <input 
                type="number" 
                step="0.01" 
                name="altura" 
                id="altura" 
                placeholder="Ex: 1.75 ou 175" 
                value={avaliacao.altura || ""} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Data da Avaliação</label>
              <input 
                type="date" 
                value={avaliacao.dataAvaliacao ? avaliacao.dataAvaliacao.split("T")[0] : ""} 
                disabled 
              />
            </div>

            {/* Acordeão de Anamnese / PAR-Q para consulta rápida */}
            <div className={styles.fullWidth} style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setShowMedicalSnapshot(!showMedicalSnapshot)}
                style={{
                  background: "#222a1f",
                  border: "1px solid #364630",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  color: "#a4c979",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaInfoCircle /> Consultar Histórico Clínico & PAR-Q do Aluno
                </span>
                {showMedicalSnapshot ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showMedicalSnapshot && (
                <div style={{ background: "#1c221a", padding: "1.25rem", borderRadius: "8px", border: "1px solid #2e3a2b", marginTop: "0.75rem" }}>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1" }}>
                    <strong>Objetivos:</strong> {avaliacao.objetivos || "Não informado"}
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1" }}>
                    <strong>Histórico Médico:</strong> {avaliacao.historicoMedico || "Nenhum histórico informado"}
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1" }}>
                    <strong>Medicamentos em uso:</strong> {avaliacao.medicamentosEmUso || "Nenhum"}
                  </p>
                  <p style={{ margin: "0", color: "#cbd5e1" }}>
                    <strong>Hábitos:</strong> {avaliacao.habitos || "Não informado"}
                  </p>
                </div>
              )}
            </div>
          </div>
            </section>

            <section id="secao-perimetria" className={styles.singleSectionCard}>
              <div className={styles.singleSectionHeader}>
                <h3 className={styles.singleSectionTitle}>
                  <FaRulerVertical /> 2. Perimetria & RCQ (Circunferências)
                </h3>
                <span className={styles.calcBadge} style={{ background: "#5d812e33", color: "#8da96d" }}>Seção 2 de 4</span>
              </div>
              <div className={styles.formGrid}>
            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Relação Cintura-Quadril (RCQ)</span>
                <span className={styles.calcCardValue}>
                  {rcqData ? `${rcqData.valor}` : "Preencha Cintura e Quadril"}
                  {rcqData && (
                    <span 
                      className={styles.calcBadge} 
                      style={{ backgroundColor: `${rcqData.cor}22`, color: rcqData.cor, border: `1px solid ${rcqData.cor}` }}
                    >
                      {rcqData.risco}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Status da Perimetria</span>
                <span style={{ color: stepStatus.step2 === "green" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                  {stepStatus.step2 === "green" ? "✓ Cintura e Quadril completos" : "Cintura e Quadril recomendados p/ RCQ"}
                </span>
              </div>
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaRulerVertical /> Circunferências Tronco (cm)
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="circCintura">Cintura (cm) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="circCintura" 
                id="circCintura" 
                placeholder="Ex: 82.5" 
                value={avaliacao.circCintura || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circAbdomem">Abdômen (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                name="circAbdomem" 
                id="circAbdomem" 
                placeholder="Ex: 86.0" 
                value={avaliacao.circAbdomem || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circQuadril">Quadril (cm) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="circQuadril" 
                id="circQuadril" 
                placeholder="Ex: 98.0" 
                value={avaliacao.circQuadril || ""} 
                onChange={handleChange} 
              />
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaRulerVertical /> Membros Superiores (cm)
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="circBracoRelaxadoD">Braço Relaxado Direito</label>
              <input 
                type="number" 
                step="0.1" 
                name="circBracoRelaxadoD" 
                id="circBracoRelaxadoD" 
                placeholder="Ex: 34.0" 
                value={avaliacao.circBracoRelaxadoD || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circBracoRelaxadoE">Braço Relaxado Esquerdo</label>
              <input 
                type="number" 
                step="0.1" 
                name="circBracoRelaxadoE" 
                id="circBracoRelaxadoE" 
                placeholder="Ex: 33.5" 
                value={avaliacao.circBracoRelaxadoE || ""} 
                onChange={handleChange} 
              />
            </div>
          </div>
            </section>

            <section id="secao-dobras" className={styles.singleSectionCard}>
              <div className={styles.singleSectionHeader}>
                <h3 className={styles.singleSectionTitle}>
                  <FaHeartbeat /> 3. Dobras Cutâneas (Pollock 7)
                </h3>
                <span className={styles.calcBadge} style={{ background: "#5d812e33", color: "#8da96d" }}>Seção 3 de 4</span>
              </div>
              <div className={styles.formGrid}>
            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Soma das 7 Dobras</span>
                <span className={styles.calcCardValue}>
                  {composicaoData.somaDobras ? `${composicaoData.somaDobras} mm` : "Preenchendo..."}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>% Gordura Estimado</span>
                <span className={styles.calcCardValue}>
                  {composicaoData.percGordura ? `${composicaoData.percGordura}%` : "Aguardando as 7 dobras"}
                  {composicaoData.classificacaoGordura && (
                    <span className={styles.calcBadge} style={{ backgroundColor: "#10b98122", color: "#34d399", border: "1px solid #10b981" }}>
                      {composicaoData.classificacaoGordura}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Faltantes</span>
                <span style={{ color: composicaoData.completo ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                  {composicaoData.completo ? "✓ Todas preenchidas" : `Faltam ${composicaoData.faltantes.length} dobras`}
                </span>
              </div>
            </div>

            <h3 className={styles.formSectionTitle}>
              Protocolo Jackson & Pollock (7 Dobras Cutâneas em mm)
            </h3>

            <SkinfoldInput
              label="1. Tríceps"
              name="dcTriceps"
              id="dcTricepsSingle"
              value={avaliacao.dcTriceps}
              onChange={handleChange}
              placeholder="Ex: 12.5"
            />

            <SkinfoldInput
              label="2. Subescapular"
              name="dcSubescapular"
              id="dcSubescapularSingle"
              value={avaliacao.dcSubescapular}
              onChange={handleChange}
              placeholder="Ex: 14.0"
            />

            <SkinfoldInput
              label="3. Peitoral / Torácica"
              name="dcPeitoral"
              id="dcPeitoralSingle"
              value={avaliacao.dcPeitoral}
              onChange={handleChange}
              placeholder="Ex: 10.0"
            />

            <SkinfoldInput
              label="4. Axilar Média"
              name="dcAxilarMedia"
              id="dcAxilarMediaSingle"
              value={avaliacao.dcAxilarMedia}
              onChange={handleChange}
              placeholder="Ex: 11.5"
            />

            <SkinfoldInput
              label="5. Supra-ilíaca"
              name="dcSuprailiaca"
              id="dcSuprailiacaSingle"
              value={avaliacao.dcSuprailiaca}
              onChange={handleChange}
              placeholder="Ex: 15.0"
            />

            <SkinfoldInput
              label="6. Abdominal"
              name="dcAbdominal"
              id="dcAbdominalSingle"
              value={avaliacao.dcAbdominal}
              onChange={handleChange}
              placeholder="Ex: 18.0"
            />

            <SkinfoldInput
              label="7. Coxa"
              name="dcCoxa"
              id="dcCoxaSingle"
              value={avaliacao.dcCoxa}
              onChange={handleChange}
              placeholder="Ex: 16.5"
            />

            {/* --- SEÇÃO DE TESTES FÍSICOS NEUROMOTORES (MODO PÁGINA ÚNICA) --- */}
            <h3 className={styles.formSectionTitle} style={{ marginTop: "2rem" }}>
              <FaDumbbell /> Testes Físicos Neuromotores (Resistência Abdominal & Preensão Manual)
            </h3>

            <div className={styles.calcSummaryCard}>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Resistência Abdominal (1 min)</span>
                <span className={styles.calcCardValue}>
                  {testesFisicosData.abdominal
                    ? `${testesFisicosData.abdominal.repeticoes} rep`
                    : "Aguardando..."}
                  {testesFisicosData.abdominal && (
                    <span
                      className={styles.calcBadge}
                      style={{
                        backgroundColor: `${testesFisicosData.abdominal.cor}22`,
                        color: testesFisicosData.abdominal.cor,
                        border: `1px solid ${testesFisicosData.abdominal.cor}`,
                      }}
                    >
                      {testesFisicosData.abdominal.classificacao} ({testesFisicosData.abdominal.pontuacao} pts)
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.calcCardItem}>
                <span className={styles.calcCardLabel}>Preensão Manual Máx. (Dinamometria)</span>
                <span className={styles.calcCardValue}>
                  {testesFisicosData.preensao
                    ? `${testesFisicosData.preensao.maior} kgf`
                    : "Aguardando..."}
                  {testesFisicosData.preensao && (
                    <span
                      className={styles.calcBadge}
                      style={{
                        backgroundColor: `${testesFisicosData.preensao.cor}22`,
                        color: testesFisicosData.preensao.cor,
                        border: `1px solid ${testesFisicosData.preensao.cor}`,
                      }}
                    >
                      {testesFisicosData.preensao.classificacao} ({testesFisicosData.preensao.pontuacao} pts)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <SkinfoldInput
              label="Resistência Abdominal (1 min)"
              name="resistenciaAbdominal"
              id="resistenciaAbdominalSingle"
              value={avaliacao.resistenciaAbdominal}
              onChange={handleChange}
              placeholder="Ex: 35"
              step={1}
              min={0}
              unit="rep"
            />

            <SkinfoldInput
              label="Preensão Manual Direita (Dinamometria)"
              name="preensaoManualD"
              id="preensaoManualDSingle"
              value={avaliacao.preensaoManualD}
              onChange={handleChange}
              placeholder="Ex: 44.5"
              step={0.5}
              min={0}
              unit="kgf"
            />

            <SkinfoldInput
              label="Preensão Manual Esquerda (Dinamometria)"
              name="preensaoManualE"
              id="preensaoManualESingle"
              value={avaliacao.preensaoManualE}
              onChange={handleChange}
              placeholder="Ex: 42.0"
              step={0.5}
              min={0}
              unit="kgf"
            />
          </div>
            </section>

            <section id="secao-laudo" className={styles.singleSectionCard}>
              <div className={styles.singleSectionHeader}>
                <h3 className={styles.singleSectionTitle}>
                  <FaCheckCircle /> 4. Diagnóstico, Parecer Técnico & Emissão de Laudo
                </h3>
                <span className={styles.calcBadge} style={{ background: "#5d812e33", color: "#8da96d" }}>Seção 4 de 4</span>
              </div>
              <div className={styles.readinessContainer}>
            {/* Banner de Prontidão */}
            <div className={styles.readinessBanner}>
              <div className={styles.readinessHeader}>
                <h3>
                  <FaCheckCircle style={{ color: "#34d399" }} /> Diagnóstico e Prontidão do Relatório
                </h3>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Verificação automática antes da emissão
                </span>
              </div>

              <div className={styles.checklistGrid}>
                {/* Item 1: Básicos */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>1. Antropometria Básica</span>
                    <span className={`${styles.checkItemStatus} ${stepStatus.step1 === "green" ? styles.checkSuccess : styles.checkDanger}`}>
                      {stepStatus.step1 === "green" ? "Concluído" : "Incompleto"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {stepStatus.step1 === "green" 
                      ? `Peso: ${avaliacao.peso}kg • Altura: ${avaliacao.altura} • IMC: ${imcData?.valor}`
                      : "Peso e Altura são obrigatórios para qualquer laudo."}
                  </p>
                  {stepStatus.step1 !== "green" && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(1, "secao-antropometria")}>
                      Corrigir no Passo 1 ➔
                    </button>
                  )}
                </div>

                {/* Item 2: Perimetria */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>2. Perimetria (RCQ)</span>
                    <span className={`${styles.checkItemStatus} ${stepStatus.step2 === "green" ? styles.checkSuccess : styles.checkWarning}`}>
                      {stepStatus.step2 === "green" ? "Concluído" : "Opcional"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {rcqData 
                      ? `RCQ: ${rcqData.valor} (${rcqData.risco})`
                      : "Cintura e Quadril ausentes. Laudo seguirá sem o índice de RCQ."}
                  </p>
                  {stepStatus.step2 !== "green" && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(2, "secao-perimetria")}>
                      Preencher no Passo 2 ➔
                    </button>
                  )}
                </div>

                {/* Item 3: Dobras Pollock */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>3. Dobras Cutâneas</span>
                    <span className={`${styles.checkItemStatus} ${composicaoData.completo ? styles.checkSuccess : styles.checkWarning}`}>
                      {composicaoData.completo ? "Concluído (100%)" : "Incompleto"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {composicaoData.completo 
                      ? `7 dobras • ${composicaoData.percGordura}% Gordura (${composicaoData.classificacaoGordura})`
                      : `Faltam ${composicaoData.faltantes.length} dobras: ${composicaoData.faltantes.slice(0, 3).join(", ")}${composicaoData.faltantes.length > 3 ? "..." : ""}`}
                  </p>
                  {!composicaoData.completo && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(3, "secao-dobras")}>
                      Completar Dobras no Passo 3 ➔
                    </button>
                  )}
                </div>

                {/* Item 4: Testes Físicos */}
                <div className={styles.checkItem}>
                  <div className={styles.checkItemHeader}>
                    <span className={styles.checkItemTitle}>4. Testes Físicos</span>
                    <span className={`${styles.checkItemStatus} ${testesFisicosData.completo ? styles.checkSuccess : styles.checkWarning}`}>
                      {testesFisicosData.completo ? "Concluído" : testesFisicosData.parcial ? "Parcial" : "Opcional"}
                    </span>
                  </div>
                  <p className={styles.checkItemDesc}>
                    {testesFisicosData.parcial
                      ? `Abdominal: ${testesFisicosData.abdominal ? `${testesFisicosData.abdominal.repeticoes} rep (${testesFisicosData.abdominal.classificacao})` : "--"} • Preensão: ${testesFisicosData.preensao ? `${testesFisicosData.preensao.maior} kgf (${testesFisicosData.preensao.classificacao})` : "--"}`
                      : "Resistência abdominal e preensão manual disponíveis na Seção 3."}
                  </p>
                  {!testesFisicosData.completo && (
                    <button type="button" className={styles.fixButton} onClick={() => handleNavigateTo(3, "secao-dobras")}>
                      Preencher Testes na Seção 3 ➔
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dashboard de Métricas Calculadas */}
            <div className={styles.resultsDashboard}>
              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Índice de Massa Corporal</span>
                <p className={styles.resultCardNumber}>
                  {imcData ? `${imcData.valor}` : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: imcData?.cor || "#aaa" }}>
                  {imcData?.classificacao || "Aguardando medidas"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Relação Cintura-Quadril</span>
                <p className={styles.resultCardNumber}>
                  {rcqData ? `${rcqData.valor}` : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: rcqData?.cor || "#aaa" }}>
                  {rcqData?.risco || "Opcional"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>% de Gordura Corporal</span>
                <p className={styles.resultCardNumber}>
                  {composicaoData.percGordura ? `${composicaoData.percGordura}%` : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: "#34d399" }}>
                  {composicaoData.classificacaoGordura || "Requer 7 dobras"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Massa Magra vs Gorda</span>
                <p className={styles.resultCardNumber} style={{ fontSize: "1.3rem" }}>
                  {composicaoData.massaMagra ? `${composicaoData.massaMagra} kg` : "--"}
                </p>
                <span className={styles.resultCardSub}>
                  {composicaoData.massaGorda ? `Gordura: ${composicaoData.massaGorda} kg` : "Aguardando cálculo"}
                </span>
              </div>

              <div className={styles.resultCard}>
                <span className={styles.resultCardTitle}>Testes Físicos (Força & Abd.)</span>
                <p className={styles.resultCardNumber} style={{ fontSize: "1.25rem" }}>
                  {testesFisicosData.abdominal || testesFisicosData.preensao
                    ? `${testesFisicosData.abdominal ? `${testesFisicosData.abdominal.repeticoes} rep` : "--"} / ${testesFisicosData.preensao ? `${testesFisicosData.preensao.maior} kgf` : "--"}`
                    : "--"}
                </p>
                <span className={styles.resultCardSub} style={{ color: testesFisicosData.abdominal?.cor || testesFisicosData.preensao?.cor || "#94a3b8" }}>
                  {testesFisicosData.abdominal || testesFisicosData.preensao
                    ? `Abd: ${testesFisicosData.abdominal?.classificacao || "--"} • Preensão: ${testesFisicosData.preensao?.classificacao || "--"}`
                    : "Abdominal e Preensão"}
                </span>
              </div>
            </div>

            {/* Parecer do Avaliador */}
            <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
              <label htmlFor="observacoes" style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                Parecer Técnico e Recomendações do Avaliador
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows="4"
                placeholder="Insira as orientações de treino, observações metabólicas e metas para a próxima reavaliação..."
                value={avaliacao.observacoes || ""}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* Ações Inteligentes de Emissão do Laudo */}
            <div style={{ background: "#20281d", border: "1px solid #36462f", borderRadius: "12px", padding: "1.5rem", marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#a4d864" }}>
                Opções de Emissão e Envio de Relatório:
              </h4>

              {stepStatus.step1 !== "green" ? (
                <div style={{ color: "#f87171", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaExclamationTriangle />
                  <span>Para emitir qualquer relatório, é indispensável preencher o Peso e a Altura no Passo 1.</span>
                </div>
              ) : composicaoData.completo ? (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleFinalizar("completo")}
                    className={styles.finishButton}
                  >
                    <FaPrint /> Emitir Laudo Completo em PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenEmailModal}
                    className={styles.emailHeaderButton}
                  >
                    <FaEnvelope /> Enviar Relatório por E-mail
                  </button>
                  <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                    ✓ Todas as 7 dobras e medidas estão 100% preenchidas.
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaExclamationTriangle />
                    <span>
                      Faltam {composicaoData.faltantes.length} dobras cutâneas para o cálculo de Pollock. Você pode emitir o relatório antropométrico parcial, enviar por e-mail ou voltar e preenchê-las:
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleFinalizar("antropometrico")}
                      className={styles.finishButton}
                      style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
                    >
                      <FaPrint /> Emitir Relatório em PDF (IMC + Perimetria)
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenEmailModal}
                      className={styles.emailHeaderButton}
                    >
                      <FaEnvelope /> Enviar Relatório por E-mail
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateTo(3, "secao-dobras")}
                      className={styles.backButton}
                      style={{ border: "1px solid #5d812e", color: "#a4d864" }}
                    >
                      Ir para Seção 3 e Preencher Dobras ➔
                    </button>
                  </div>
                </div>
              )}

              {avaliacao.resultados?.ultimoEnvioEmail && (
                <div style={{ marginTop: "0.85rem", fontSize: "0.82rem", color: "#4ade80" }}>
                  ✓ Último envio por e-mail registrado para <strong>{avaliacao.resultados.ultimoEnvioEmail.enviadoPara}</strong> em{" "}
                  {new Date(avaliacao.resultados.ultimoEnvioEmail.enviadoEm).toLocaleString("pt-BR")}
                </div>
              )}
            </div>
          </div>
            </section>

            <footer className={styles.singlePageFooter}>
              <button
                type="button"
                onClick={() => router.push("/avaliacoes")}
                className={styles.backButton}
                disabled={isSaving}
              >
                <FaArrowLeft /> Voltar para Lista
              </button>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleFinalizar("imprimir")}
                  className={styles.printHeaderButton}
                >
                  <FaPrint /> Imprimir Laudo Oficial
                </button>
                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className={styles.emailHeaderButton}
                >
                  <FaEnvelope /> Enviar por E-mail
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  <FaSave /> {isSaving ? "Salvando..." : "Salvar Avaliação"}
                </button>
              </div>
            </footer>
          </div>
        )}
      </main>

      {/* ========================================================
          DOCUMENTO OFICIAL IMPRESSO (LAUDO CLÍNICO & COMPOSIÇÃO)
          Visível exclusivamente ao imprimir (@media print)
         ======================================================== */}
      <div className={styles.printableDocument}>
        {/* Cabeçalho Institucional */}
        <div className={styles.printHeader}>
          <div className={styles.printBrand}>
            <div className={styles.printLogoBadge}>UNOESC</div>
            <div>
              <h2 className={styles.printInstitutionName}>Universidade do Oeste de Santa Catarina</h2>
              <p className={styles.printInstitutionDept}>
                Curso de Educação Física • Laboratório de Cineantropometria e Avaliação Funcional
              </p>
            </div>
          </div>
          <div className={styles.printDocInfo}>
            <span className={styles.printDocId}>Laudo Técnico Nº #{avaliacao.id}</span>
            <span className={styles.printDocDate}>
              Data da Coleta: {new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR")}
            </span>
            <span className={styles.printDocDate}>
              Emissão: {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>

        <div className={styles.printDocTitleBanner}>
          <h1>Relatório de Avaliação Física e Composição Corporal</h1>
        </div>

        {/* 1. Identificação do Aluno / Avaliado */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>1. Dados de Identificação do Avaliado</h3>
          <table className={styles.printTable}>
            <tbody>
              <tr>
                <td style={{ width: "20%", fontWeight: 700 }}>Nome Completo:</td>
                <td style={{ width: "45%" }}>{aluno?.nome || "---"}</td>
                <td style={{ width: "15%", fontWeight: 700 }}>Matrícula:</td>
                <td style={{ width: "20%" }}>{aluno?.matricula || "---"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Idade:</td>
                <td>{idade} anos</td>
                <td style={{ fontWeight: 700 }}>Gênero:</td>
                <td>{genero === "F" ? "Feminino" : "Masculino"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>CPF:</td>
                <td>{aluno?.cpf ? maskCPF(aluno.cpf) : "Não informado"}</td>
                <td style={{ fontWeight: 700 }}>Telefone:</td>
                <td>{aluno?.telefone ? maskPhone(aluno.telefone) : "Não informado"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Avaliador Resp.:</td>
                <td colSpan="3">{avaliacao.avaliador?.name || "Professor Avaliador"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Resumo da Composição Corporal */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>2. Resumo da Composição Corporal</h3>
          <div className={styles.printKpiGrid}>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Estatura / Altura</span>
              <p className={styles.printKpiValue}>{avaliacao.altura ? `${avaliacao.altura} cm` : "--"}</p>
              <span className={styles.printKpiSub}>Estatímetro</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Massa Corporal Total</span>
              <p className={styles.printKpiValue}>{avaliacao.peso ? `${avaliacao.peso} kg` : "--"}</p>
              <span className={styles.printKpiSub}>Balança Antropométrica</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Índice IMC (OMS)</span>
              <p className={styles.printKpiValue}>{imcData ? imcData.valor : "--"}</p>
              <span className={styles.printKpiSub}>
                {imcData?.classificacao || "Pendente"}
              </span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Relação Cintura-Quadril</span>
              <p className={styles.printKpiValue}>{rcqData ? rcqData.valor : "--"}</p>
              <span className={styles.printKpiSub}>
                {rcqData?.risco || "Não calculado"}
              </span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>% de Gordura Corporal</span>
              <p className={styles.printKpiValue}>
                {composicaoData.percGordura ? `${composicaoData.percGordura}%` : "--"}
              </p>
              <span className={styles.printKpiSub}>
                {composicaoData.classificacaoGordura || "Pollock 7 Dobras"}
              </span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Massa Magra Livre</span>
              <p className={styles.printKpiValue}>
                {composicaoData.massaMagra ? `${composicaoData.massaMagra} kg` : "--"}
              </p>
              <span className={styles.printKpiSub}>Músculo & Massa Óssea</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Massa Gorda Estimada</span>
              <p className={styles.printKpiValue}>
                {composicaoData.massaGorda ? `${composicaoData.massaGorda} kg` : "--"}
              </p>
              <span className={styles.printKpiSub}>Tecido Adiposo</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Protocolo Científico</span>
              <p className={styles.printKpiValue} style={{ fontSize: "9.5pt" }}>
                Pollock 7 Dobras
              </p>
              <span className={styles.printKpiSub}>Equação de Siri (1961)</span>
            </div>
          </div>
        </div>

        {/* 3 e 4. Perimetria e Dobras Cutâneas */}
        <div className={styles.printTwoCols}>
          <div className={styles.printCol}>
            <h3 className={styles.printSectionTitle}>3. Perimetria / Circunferências (cm)</h3>
            <table className={styles.printTable}>
              <thead>
                <tr>
                  <th>Região Anatômica</th>
                  <th style={{ textAlign: "right" }}>Medida (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Circunferência da Cintura</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.circCintura ? `${avaliacao.circCintura} cm` : "--"}</td>
                </tr>
                <tr>
                  <td>Circunferência do Abdômen</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.circAbdomem ? `${avaliacao.circAbdomem} cm` : "--"}</td>
                </tr>
                <tr>
                  <td>Circunferência do Quadril</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.circQuadril ? `${avaliacao.circQuadril} cm` : "--"}</td>
                </tr>
                <tr>
                  <td>Braço Relaxado Direito</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.circBracoRelaxadoD ? `${avaliacao.circBracoRelaxadoD} cm` : "--"}</td>
                </tr>
                <tr>
                  <td>Braço Relaxado Esquerdo</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.circBracoRelaxadoE ? `${avaliacao.circBracoRelaxadoE} cm` : "--"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.printCol}>
            <h3 className={styles.printSectionTitle}>4. Dobras Cutâneas (mm) - Pollock 7</h3>
            {composicaoData.completo ? (
              <table className={styles.printTable}>
                <thead>
                  <tr>
                    <th>Dobra Cutânea</th>
                    <th style={{ textAlign: "right" }}>Espessura (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tríceps</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.dcTriceps ? `${avaliacao.dcTriceps} mm` : "--"}</td>
                  </tr>
                  <tr>
                    <td>Subescapular</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.dcSubescapular ? `${avaliacao.dcSubescapular} mm` : "--"}</td>
                  </tr>
                  <tr>
                    <td>Peitoral (Torácica)</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.dcPeitoral ? `${avaliacao.dcPeitoral} mm` : "--"}</td>
                  </tr>
                  <tr>
                    <td>Axilar Média</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.dcAxilarMedia ? `${avaliacao.dcAxilarMedia} mm` : "--"}</td>
                  </tr>
                  <tr>
                    <td>Supra-ilíaca</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.dcSuprailiaca ? `${avaliacao.dcSuprailiaca} mm` : "--"}</td>
                  </tr>
                  <tr>
                    <td>Abdominal</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.dcAbdominal ? `${avaliacao.dcAbdominal} mm` : "--"}</td>
                  </tr>
                  <tr>
                    <td>Coxa Medial</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{avaliacao.dcCoxa ? `${avaliacao.dcCoxa} mm` : "--"}</td>
                  </tr>
                  <tr style={{ background: "#f8fafc" }}>
                    <td style={{ fontWeight: 800 }}>Somatório das 7 Dobras:</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>{composicaoData.somaDobras} mm</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className={styles.printNoticePartial}>
                <p><strong>Relatório Antropométrico Simplificado:</strong></p>
                <p>
                  As 7 dobras cutâneas do protocolo Jackson & Pollock não foram integralmente mensuradas nesta sessão. O percentual de gordura foi omitido para assegurar fidelidade métrica.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 5. Testes Físicos Neuromotores */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>5. Testes Físicos Neuromotores (Força e Resistência Muscular)</h3>
          <table className={styles.printTable}>
            <thead>
              <tr>
                <th>Teste Físico / Protocolo</th>
                <th>Resultado Obtido</th>
                <th>Classificação</th>
                <th style={{ textAlign: "right" }}>Pontuação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Resistência Abdominal (1 minuto)</td>
                <td style={{ fontWeight: 700 }}>
                  {testesFisicosData.abdominal ? `${testesFisicosData.abdominal.repeticoes} repetições` : "--"}
                </td>
                <td>{testesFisicosData.abdominal ? testesFisicosData.abdominal.classificacao : "Não avaliado"}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {testesFisicosData.abdominal ? `${testesFisicosData.abdominal.pontuacao} pts` : "--"}
                </td>
              </tr>
              <tr>
                <td>Força de Preensão Manual — Dinamometria (Dir. / Esq.)</td>
                <td style={{ fontWeight: 700 }}>
                  {testesFisicosData.preensao
                    ? `D: ${testesFisicosData.preensao.direita ?? "--"} kgf | E: ${testesFisicosData.preensao.esquerda ?? "--"} kgf (Máx: ${testesFisicosData.preensao.maior} kgf)`
                    : "--"}
                </td>
                <td>{testesFisicosData.preensao ? testesFisicosData.preensao.classificacao : "Não avaliado"}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {testesFisicosData.preensao ? `${testesFisicosData.preensao.pontuacao} pts` : "--"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. Parecer Técnico do Avaliador */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>6. Parecer Técnico e Orientações do Avaliador</h3>
          <div className={styles.printNotesBox}>
            {avaliacao.observacoes ? (
              <p style={{ margin: 0, whiteSpace: "pre-line" }}>{avaliacao.observacoes}</p>
            ) : (
              <p style={{ margin: 0, fontStyle: "italic", color: "#64748b" }}>
                Nenhuma contraindicação clínica ou recomendação específica foi registrada nesta avaliação. O aluno foi orientado quanto aos resultados antropométricos obtidos.
              </p>
            )}
          </div>
        </div>

        {/* 7. Assinaturas Oficiais */}
        <div className={styles.printSignatures}>
          <div className={styles.printSignBlock}>
            <div className={styles.printSignLine}></div>
            <p className={styles.printSignName}>{avaliacao.avaliador?.name || "Profissional Avaliador"}</p>
            <p className={styles.printSignRole}>Profissional de Educação Física / Avaliador</p>
          </div>

          <div className={styles.printSignBlock}>
            <div className={styles.printSignLine}></div>
            <p className={styles.printSignName}>{aluno?.nome || "Aluno Avaliado"}</p>
            <p className={styles.printSignRole}>Assinatura do Aluno / Avaliado</p>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL RESPONSIVO DE ENVIO DE RELATÓRIO POR E-MAIL
         ======================================================== */}
      {showEmailModal && (
        <div className={styles.emailModalOverlay} onClick={() => setShowEmailModal(false)}>
          <div className={styles.emailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.emailModalHeader}>
              <h3>
                <FaEnvelope style={{ color: "#a4d864" }} /> Enviar Relatório de Avaliação por E-mail
              </h3>
              <button
                type="button"
                className={styles.emailModalClose}
                onClick={() => setShowEmailModal(false)}
                aria-label="Fechar modal"
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.emailModalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="emailDestinoInput">E-mail do Destinatário (Aluno) *</label>
                <input
                  id="emailDestinoInput"
                  type="email"
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  placeholder="aluno@exemplo.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="emailAssuntoInput">Assunto da Mensagem</label>
                <input
                  id="emailAssuntoInput"
                  type="text"
                  value={emailAssunto}
                  onChange={(e) => setEmailAssunto(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Resumo do Laudo a ser Enviado</label>
                <textarea
                  rows="7"
                  value={gerarResumoRelatorioTexto()}
                  readOnly
                  className={styles.emailPreviewBox}
                />
              </div>
            </div>

            <div className={styles.emailModalFooter}>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleOpenMailto}
                title="Abre seu aplicativo de e-mail padrão já preenchido"
              >
                <FaEnvelope /> Abrir no App de E-mail
              </button>
              <button
                type="button"
                className={styles.printHeaderButton}
                onClick={() => handleFinalizar("completo")}
                title="Salva o PDF oficial para anexar caso deseje"
              >
                <FaPrint /> Baixar PDF
              </button>
              <button
                type="button"
                className={styles.finishButton}
                onClick={handleSendEmailSystem}
                disabled={sendingEmail}
              >
                <FaPaperPlane /> {sendingEmail ? "Enviando..." : "Enviar pelo Sistema"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}