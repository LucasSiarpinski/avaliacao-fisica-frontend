"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  if (!dataNasc) return null;
  try {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    if (isNaN(idade) || idade < 5 || idade > 120) return null;
    return idade;
  } catch {
    return null;
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
  const [isLaudoOnly, setIsLaudoOnly] = useState(false);

  // Estados para o envio do relatório por e-mail e histórico longitudinal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDestino, setEmailDestino] = useState("");
  const [emailAssunto, setEmailAssunto] = useState("");
  const [emailMensagem, setEmailMensagem] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSmtpPanel, setShowSmtpPanel] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.gmail.com",
    port: "587",
    user: "lucasmiottosiarpinski@gmail.com",
    pass: "mzwo kcnw zlam ygbf",
  });
  const [historicoAvaliacoes, setHistoricoAvaliacoes] = useState([]);
  const hasAutoPrinted = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("modo") === "laudo" || urlParams.get("print") === "true") {
        setIsLaudoOnly(true);
      }
      const savedMode = localStorage.getItem("@TCC:avaliacaoViewMode");
      if (savedMode === "single" || savedMode === "wizard") {
        setViewMode(savedMode);
      }
      const savedSmtp = localStorage.getItem("@TCC:smtpConfig");
      if (savedSmtp) {
        try {
          const parsed = JSON.parse(savedSmtp);
          let cleanUser = (parsed.user || "").trim();
          if (cleanUser.endsWith("@gmail.co")) {
            cleanUser = `${cleanUser}m`;
          }
          const updated = {
            host: parsed.host || "smtp.gmail.com",
            port: parsed.port || "587",
            user: cleanUser || "lucasmiottosiarpinski@gmail.com",
            pass: parsed.pass || "mzwo kcnw zlam ygbf",
          };
          setSmtpConfig(updated);
          localStorage.setItem("@TCC:smtpConfig", JSON.stringify(updated));
        } catch (e) {
          console.error("Erro ao carregar SMTP local:", e);
        }
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
      const perimSalva = data.resultados?.perimetriaInferior || {};
      const anamSalva = data.resultados?.anamneseComplementar || {};

      // Separação inteligente de Histórico de Doenças vs Lesões
      const rawHist = data.historicoMedico || "";
      let doencasExtraidas = rawHist;
      let lesoesExtraidas = anamSalva.lesoes || "";
      if (rawHist.includes(" || Lesões: ")) {
        const parts = rawHist.split(" || Lesões: ");
        doencasExtraidas = parts[0].replace(/^Doenças:\s*/i, "").trim();
        if (!lesoesExtraidas) lesoesExtraidas = (parts[1] || "").trim();
      } else if (
        !lesoesExtraidas &&
        rawHist &&
        /^(cotovelo|joelho|ombro|coluna|lombar|tornozelo|punho|quadril|cervical|tendinite|bursite|entorse|fratura|cirurgia|h[eé]rnia|les[aã]o)$/i.test(
          rawHist.trim()
        )
      ) {
        lesoesExtraidas = `Histórico articular/muscular em ${rawHist.trim().toLowerCase()}`;
        doencasExtraidas = "Nenhuma patologia crônica relatada";
      }

      let objetivosNormalizados = data.objetivos || "";
      if (/^crescer$/i.test(objetivosNormalizados.trim())) {
        objetivosNormalizados = "Hipertrofia muscular (ganho de massa magra)";
      }

      setAvaliacao({
        ...data,
        historicoMedico: doencasExtraidas,
        lesoes: lesoesExtraidas,
        objetivos: objetivosNormalizados,
        registroAvaliador: data.resultados?.registroAvaliador || "",
        circCoxaProximalD:
          perimSalva.circCoxaProximalD !== undefined && perimSalva.circCoxaProximalD !== null
            ? String(perimSalva.circCoxaProximalD)
            : "",
        circCoxaProximalE:
          perimSalva.circCoxaProximalE !== undefined && perimSalva.circCoxaProximalE !== null
            ? String(perimSalva.circCoxaProximalE)
            : "",
        circCoxaMedialD:
          perimSalva.circCoxaMedialD !== undefined && perimSalva.circCoxaMedialD !== null
            ? String(perimSalva.circCoxaMedialD)
            : "",
        circCoxaMedialE:
          perimSalva.circCoxaMedialE !== undefined && perimSalva.circCoxaMedialE !== null
            ? String(perimSalva.circCoxaMedialE)
            : "",
        circPanturrilhaD:
          perimSalva.circPanturrilhaD !== undefined && perimSalva.circPanturrilhaD !== null
            ? String(perimSalva.circPanturrilhaD)
            : "",
        circPanturrilhaE:
          perimSalva.circPanturrilhaE !== undefined && perimSalva.circPanturrilhaE !== null
            ? String(perimSalva.circPanturrilhaE)
            : "",
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
        `Laudo Técnico de Avaliação Física — ${data.aluno?.nome || "Aluno"} (UNOESC)`
      );

      if (Array.isArray(data.aluno?.avaliacoes)) {
        setHistoricoAvaliacoes(data.aluno.avaliacoes);
      } else if (data.alunoId) {
        try {
          const histRes = await api.get(`/api/alunos/${data.alunoId}/avaliacoes`);
          setHistoricoAvaliacoes(histRes.data || []);
        } catch {
          setHistoricoAvaliacoes([]);
        }
      }
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

  // Disparo automático de impressão apenas UMA VEZ no carregamento inicial se acessado via ?print=true
  useEffect(() => {
    if (avaliacao && !hasAutoPrinted.current && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("print") === "true") {
        hasAutoPrinted.current = true;
        setIsLaudoOnly(true);
        // Remove ?print=true da barra de endereços mantendo modo=laudo
        window.history.replaceState({}, "", `${window.location.pathname}?modo=laudo`);
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

  const parqResumo = useMemo(() => {
    const parqObj =
      avaliacao?.respostasParq && typeof avaliacao.respostasParq === "object"
        ? avaliacao.respostasParq
        : aluno?.parq && typeof aluno.parq === "object"
        ? aluno.parq
        : null;
    const keys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];
    if (!parqObj) {
      return {
        respondido: false,
        respondidas: 0,
        afirmativas: 0,
        temAlerta: false,
      };
    }
    let respondidas = 0;
    let afirmativas = 0;
    keys.forEach((k) => {
      const val = parqObj[k];
      if (val === "SIM" || val === "NAO" || val === true || val === false) {
        respondidas++;
      }
      if (val === "SIM" || val === true) {
        afirmativas++;
      }
    });
    return {
      respondido: respondidas > 0,
      respondidas,
      afirmativas,
      temAlerta: afirmativas > 0,
    };
  }, [avaliacao?.respostasParq, aluno?.parq]);

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
      parseFloat(avaliacao.circBracoRelaxadoD) > 0 ||
      parseFloat(avaliacao.circCoxaProximalD) > 0 ||
      parseFloat(avaliacao.circCoxaMedialD) > 0 ||
      parseFloat(avaliacao.circPanturrilhaD) > 0
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
      const toNumOrNull = (val) => {
        if (val === undefined || val === null || val === "") return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
      };

      const perimetriaInferior = {
        circCoxaProximalD: toNumOrNull(avaliacao.circCoxaProximalD),
        circCoxaProximalE: toNumOrNull(avaliacao.circCoxaProximalE),
        circCoxaMedialD: toNumOrNull(avaliacao.circCoxaMedialD),
        circCoxaMedialE: toNumOrNull(avaliacao.circCoxaMedialE),
        circPanturrilhaD: toNumOrNull(avaliacao.circPanturrilhaD),
        circPanturrilhaE: toNumOrNull(avaliacao.circPanturrilhaE),
      };

      const anamneseComplementar = {
        lesoes: (avaliacao.lesoes || "").trim(),
        doencas: (avaliacao.historicoMedico || "").trim(),
        objetivos: (avaliacao.objetivos || "").trim(),
      };

      const resultadosCalculados = {
        ...(avaliacao.resultados || {}),
        imc: imcData,
        rcq: rcqData,
        composicao: composicaoData,
        testesFisicos: testesFisicosData,
        perimetriaInferior,
        anamneseComplementar,
        registroAvaliador: (avaliacao.registroAvaliador || "").trim(),
        calculadoEm: new Date().toISOString(),
      };

      const historicoCombinado = avaliacao.lesoes?.trim()
        ? `${avaliacao.historicoMedico?.trim() || "Nenhuma patologia crônica relatada"} || Lesões: ${avaliacao.lesoes.trim()}`
        : avaliacao.historicoMedico?.trim() || "";

      await api.put(`/api/avaliacoes/${id}`, {
        ...avaliacao,
        historicoMedico: historicoCombinado,
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

  // Gera o resumo padrão conciso (4 linhas) para o corpo do e-mail, pois o Laudo completo segue em PDF anexo
  const gerarResumoRelatorioTexto = useCallback(() => {
    if (!avaliacao) return "";
    const dataAval = new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR");
    const linhas = [
      `LAUDO TÉCNICO DE AVALIAÇÃO FÍSICA — UNOESC PORTAL`,
      `Laudo Técnico Nº #${avaliacao.id} | Data da Coleta: ${dataAval}`,
      `Avaliado(a): ${aluno?.nome || "---"} | Matrícula: ${aluno?.matricula || "---"}`,
      `Avaliador(a) Responsável: ${avaliacao.avaliador?.name || "Administrador"}`,
    ];
    return linhas.join("\n");
  }, [avaliacao, aluno]);

  const handleOpenEmailModal = () => {
    setEmailDestino(aluno?.email || "");
    setEmailAssunto(
      `Laudo Técnico de Avaliação Física — ${aluno?.nome || "Aluno"} (UNOESC)`
    );
    setEmailMensagem(gerarResumoRelatorioTexto());
    setShowEmailModal(true);
  };

  const handleSaveSmtpInline = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("@TCC:smtpConfig", JSON.stringify(smtpConfig));
      toast.success("E-mail remetente salvo! Agora clique em 'Enviar Laudo em PDF'.");
      setShowSmtpPanel(false);
    }
  };

  const handleSendEmailSystem = async () => {
    if (!emailDestino || !emailDestino.includes("@")) {
      toast.error("Informe um endereço de e-mail válido para o destinatário.");
      return;
    }

    if (typeof window !== "undefined" && smtpConfig.user) {
      localStorage.setItem("@TCC:smtpConfig", JSON.stringify(smtpConfig));
    }

    setSendingEmail(true);
    try {
      await handleSave(false);
      const mensagem = (emailMensagem || "").trim() || gerarResumoRelatorioTexto();
      const toNumOrNull = (val) => {
        if (val === undefined || val === null || val === "") return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
      };
      const avaliacaoCompleta = {
        ...avaliacao,
        resultados: {
          ...(avaliacao.resultados || {}),
          imc: imcData,
          rcq: rcqData,
          composicao: composicaoData,
          testesFisicos: testesFisicosData,
          perimetriaInferior: {
            circCoxaProximalD: toNumOrNull(avaliacao.circCoxaProximalD),
            circCoxaProximalE: toNumOrNull(avaliacao.circCoxaProximalE),
            circCoxaMedialD: toNumOrNull(avaliacao.circCoxaMedialD),
            circCoxaMedialE: toNumOrNull(avaliacao.circCoxaMedialE),
            circPanturrilhaD: toNumOrNull(avaliacao.circPanturrilhaD),
            circPanturrilhaE: toNumOrNull(avaliacao.circPanturrilhaE),
          },
          anamneseComplementar: {
            lesoes: (avaliacao.lesoes || "").trim(),
            doencas: (avaliacao.historicoMedico || "").trim(),
            objetivos: (avaliacao.objetivos || "").trim(),
          },
          registroAvaliador: (avaliacao.registroAvaliador || "").trim(),
        },
      };

      // Dispara o envio via rota interna do Next.js (Vercel), onde as portas 465/587 do Gmail não são bloqueadas pelo Render Free
      const response = await fetch("/api/enviar-laudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatario: emailDestino.trim(),
          assunto: emailAssunto,
          mensagem,
          avaliacao: avaliacaoCompleta,
          historicoAvaliacoes,
          smtpConfig,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao enviar o laudo em PDF.");
      }

      // Registra o histórico do envio no banco de dados (sem travar no SMTP do Render)
      api
        .post(`/api/avaliacoes/${id}/enviar-email`, {
          destinatario: emailDestino.trim(),
          assunto: emailAssunto,
          mensagem,
          jaEnviadoPeloFrontend: true,
          infoFrontend: data.envio,
        })
        .catch((err) => console.warn("Aviso ao registrar log de envio:", err));

      setAvaliacao((prev) => ({
        ...prev,
        resultados: {
          ...(prev.resultados || {}),
          ultimoEnvioEmail: data.envio,
        },
      }));

      toast.success(
        data.message || `Laudo em PDF enviado com sucesso para ${emailDestino}!`
      );
      setShowEmailModal(false);
    } catch (error) {
      console.error("Erro ao enviar relatório por e-mail:", error);
      toast.error(
        error.message || "Não foi possível enviar o relatório por e-mail."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenGmailWeb = async () => {
    await handleSave(false);
    const body = encodeURIComponent((emailMensagem || "").trim() || gerarResumoRelatorioTexto());
    const subject = encodeURIComponent(
      emailAssunto || `Laudo Técnico de Avaliação Física — ${aluno?.nome || "Aluno"} (UNOESC)`
    );
    const to = encodeURIComponent(emailDestino || aluno?.email || "");
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    toast.success("Página do Gmail aberta com destinatário e laudo preenchidos!");
  };

  const handleOpenMailto = async () => {
    await handleSave(false);
    const body = encodeURIComponent((emailMensagem || "").trim() || gerarResumoRelatorioTexto());
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
              {idade ? `${idade} anos` : "Idade não informada"} • {genero === "F" ? "Feminino" : "Masculino"}
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
          {!isLaudoOnly ? (
            <>
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
                onClick={() => {
                  setIsLaudoOnly(true);
                  handleFinalizar("imprimir");
                }}
                className={styles.printHeaderButton}
                title="Emitir Laudo Clínico Oficial e Imprimir"
              >
                <FaPrint /> Emitir Laudo
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
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className={styles.printHeaderButton}
                title="Imprimir ou Salvar Laudo em PDF"
              >
                <FaPrint /> Imprimir / Salvar PDF
              </button>
              <button
                type="button"
                onClick={handleOpenEmailModal}
                className={styles.emailHeaderButton}
                title="Enviar Laudo em PDF por E-mail"
              >
                <FaEnvelope /> Enviar por E-mail
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLaudoOnly(false);
                  if (typeof window !== "undefined") {
                    window.history.replaceState({}, "", window.location.pathname);
                  }
                }}
                className={styles.saveButton}
                title="Abrir formulário para editar medidas da avaliação"
              >
                <FaFileAlt /> Editar Avaliação
              </button>
              <button
                type="button"
                onClick={() => router.push("/avaliacoes")}
                className={styles.backButton}
              >
                <FaArrowLeft /> Lista de Avaliações
              </button>
            </>
          )}
        </div>
      </header>

      {/* --- NAVEGAÇÃO SUPERIOR: STEPPER OU ATALHOS (Apenas no modo Edição) --- */}
      {!isLaudoOnly && (viewMode === "wizard" ? (
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
      ))}

      {/* --- CONTEÚDO PRINCIPAL (Oculto quando estiver apenas visualizando/emitindo o Laudo) --- */}
      {!isLaudoOnly && (
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

            {/* Acordeão de Anamnese / PAR-Q para consulta e ajuste rápido */}
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
                  <FaInfoCircle /> Consultar / Ajustar Anamnese Estruturada & PAR-Q do Aluno
                </span>
                {showMedicalSnapshot ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showMedicalSnapshot && (
                <div
                  className={styles.formGrid}
                  style={{
                    background: "#1c221a",
                    padding: "1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #2e3a2b",
                    marginTop: "0.75rem",
                  }}
                >
                  <div className={styles.formGroup}>
                    <label htmlFor="objetivosWiz">Objetivos com o Treinamento</label>
                    <input
                      type="text"
                      id="objetivosWiz"
                      name="objetivos"
                      placeholder="Ex: Hipertrofia muscular e ganho de força"
                      value={avaliacao.objetivos || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lesoesWiz">Lesões, Cirurgias ou Limitações Físicas</label>
                    <input
                      type="text"
                      id="lesoesWiz"
                      name="lesoes"
                      placeholder="Ex: Tendinite no cotovelo ou 'Nenhuma lesão relatada'"
                      value={avaliacao.lesoes || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="historicoMedicoWiz">Histórico de Doenças / Patologias</label>
                    <input
                      type="text"
                      id="historicoMedicoWiz"
                      name="historicoMedico"
                      placeholder="Ex: Nenhuma patologia crônica diagnosticada"
                      value={avaliacao.historicoMedico || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="medicamentosEmUsoWiz">Uso de Medicamentos</label>
                    <input
                      type="text"
                      id="medicamentosEmUsoWiz"
                      name="medicamentosEmUso"
                      placeholder="Ex: Não utiliza medicamentos contínuos"
                      value={avaliacao.medicamentosEmUso || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="habitosWiz">Prática de Exercícios e Hábitos Relevantes</label>
                    <input
                      type="text"
                      id="habitosWiz"
                      name="habitos"
                      placeholder="Ex: Musculação 4x/semana, não tabagista, sono regular"
                      value={avaliacao.habitos || ""}
                      onChange={handleChange}
                    />
                  </div>
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
              <label htmlFor="circBracoRelaxadoD">Braço Relaxado Direito (cm)</label>
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
              <label htmlFor="circBracoRelaxadoE">Braço Relaxado Esquerdo (cm)</label>
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

            <h3 className={styles.formSectionTitle}>
              <FaRulerVertical /> Membros Inferiores — Coxa e Panturrilha (cm)
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaProximalD">Coxa Proximal Direita (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaProximalD"
                id="circCoxaProximalD"
                placeholder="Ex: 58.0"
                value={avaliacao.circCoxaProximalD || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaProximalE">Coxa Proximal Esquerda (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaProximalE"
                id="circCoxaProximalE"
                placeholder="Ex: 57.5"
                value={avaliacao.circCoxaProximalE || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaMedialD">Coxa Medial Direita (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaMedialD"
                id="circCoxaMedialD"
                placeholder="Ex: 53.0"
                value={avaliacao.circCoxaMedialD || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaMedialE">Coxa Medial Esquerda (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaMedialE"
                id="circCoxaMedialE"
                placeholder="Ex: 52.5"
                value={avaliacao.circCoxaMedialE || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circPanturrilhaD">Panturrilha Direita (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circPanturrilhaD"
                id="circPanturrilhaD"
                placeholder="Ex: 38.5"
                value={avaliacao.circPanturrilhaD || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circPanturrilhaE">Panturrilha Esquerda (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circPanturrilhaE"
                id="circPanturrilhaE"
                placeholder="Ex: 38.5"
                value={avaliacao.circPanturrilhaE || ""}
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
              label="Preensão Manual Direita"
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
              label="Preensão Manual Esquerda"
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

            {/* Parecer Técnico e Considerações Finais do Avaliador */}
            <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
              <label htmlFor="observacoes" style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                Considerações Finais / Parecer Técnico Detalhado do Avaliador
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows="4"
                placeholder="Insira as considerações finais, análise da composição corporal, prescrição de treinamento e metas para a próxima reavaliação..."
                value={avaliacao.observacoes || ""}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "0.75rem" }}>
              <label htmlFor="registroAvaliador" style={{ fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1" }}>
                Identificação Profissional / CREF ou Assinatura Digital (Opcional)
              </label>
              <input
                type="text"
                id="registroAvaliador"
                name="registroAvaliador"
                placeholder="Ex: CREF 012345-G/SC — Assinado Digitalmente"
                value={avaliacao.registroAvaliador || ""}
                onChange={handleChange}
              />
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

            {/* Acordeão de Anamnese / PAR-Q para consulta e ajuste rápido */}
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
                  <FaInfoCircle /> Consultar / Ajustar Anamnese Estruturada & PAR-Q do Aluno
                </span>
                {showMedicalSnapshot ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showMedicalSnapshot && (
                <div
                  className={styles.formGrid}
                  style={{
                    background: "#1c221a",
                    padding: "1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #2e3a2b",
                    marginTop: "0.75rem",
                  }}
                >
                  <div className={styles.formGroup}>
                    <label htmlFor="objetivosSingle">Objetivos com o Treinamento</label>
                    <input
                      type="text"
                      id="objetivosSingle"
                      name="objetivos"
                      placeholder="Ex: Hipertrofia muscular e ganho de força"
                      value={avaliacao.objetivos || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lesoesSingle">Lesões, Cirurgias ou Limitações Físicas</label>
                    <input
                      type="text"
                      id="lesoesSingle"
                      name="lesoes"
                      placeholder="Ex: Tendinite no cotovelo ou 'Nenhuma lesão relatada'"
                      value={avaliacao.lesoes || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="historicoMedicoSingle">Histórico de Doenças / Patologias</label>
                    <input
                      type="text"
                      id="historicoMedicoSingle"
                      name="historicoMedico"
                      placeholder="Ex: Nenhuma patologia crônica diagnosticada"
                      value={avaliacao.historicoMedico || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="medicamentosEmUsoSingle">Uso de Medicamentos</label>
                    <input
                      type="text"
                      id="medicamentosEmUsoSingle"
                      name="medicamentosEmUso"
                      placeholder="Ex: Não utiliza medicamentos contínuos"
                      value={avaliacao.medicamentosEmUso || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="habitosSingle">Prática de Exercícios e Hábitos Relevantes</label>
                    <input
                      type="text"
                      id="habitosSingle"
                      name="habitos"
                      placeholder="Ex: Musculação 4x/semana, não tabagista, sono regular"
                      value={avaliacao.habitos || ""}
                      onChange={handleChange}
                    />
                  </div>
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
              <label htmlFor="circCinturaSingle">Cintura (cm) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="circCintura" 
                id="circCinturaSingle" 
                placeholder="Ex: 82.5" 
                value={avaliacao.circCintura || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circAbdomemSingle">Abdômen (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                name="circAbdomem" 
                id="circAbdomemSingle" 
                placeholder="Ex: 86.0" 
                value={avaliacao.circAbdomem || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circQuadrilSingle">Quadril (cm) *</label>
              <input 
                type="number" 
                step="0.1" 
                name="circQuadril" 
                id="circQuadrilSingle" 
                placeholder="Ex: 98.0" 
                value={avaliacao.circQuadril || ""} 
                onChange={handleChange} 
              />
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaRulerVertical /> Membros Superiores (cm)
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="circBracoRelaxadoDSingle">Braço Relaxado Direito (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                name="circBracoRelaxadoD" 
                id="circBracoRelaxadoDSingle" 
                placeholder="Ex: 34.0" 
                value={avaliacao.circBracoRelaxadoD || ""} 
                onChange={handleChange} 
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circBracoRelaxadoESingle">Braço Relaxado Esquerdo (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                name="circBracoRelaxadoE" 
                id="circBracoRelaxadoESingle" 
                placeholder="Ex: 33.5" 
                value={avaliacao.circBracoRelaxadoE || ""} 
                onChange={handleChange} 
              />
            </div>

            <h3 className={styles.formSectionTitle}>
              <FaRulerVertical /> Membros Inferiores — Coxa e Panturrilha (cm)
            </h3>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaProximalDSingle">Coxa Proximal Direita (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaProximalD"
                id="circCoxaProximalDSingle"
                placeholder="Ex: 58.0"
                value={avaliacao.circCoxaProximalD || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaProximalESingle">Coxa Proximal Esquerda (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaProximalE"
                id="circCoxaProximalESingle"
                placeholder="Ex: 57.5"
                value={avaliacao.circCoxaProximalE || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaMedialDSingle">Coxa Medial Direita (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaMedialD"
                id="circCoxaMedialDSingle"
                placeholder="Ex: 53.0"
                value={avaliacao.circCoxaMedialD || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circCoxaMedialESingle">Coxa Medial Esquerda (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circCoxaMedialE"
                id="circCoxaMedialESingle"
                placeholder="Ex: 52.5"
                value={avaliacao.circCoxaMedialE || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circPanturrilhaDSingle">Panturrilha Direita (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circPanturrilhaD"
                id="circPanturrilhaDSingle"
                placeholder="Ex: 38.5"
                value={avaliacao.circPanturrilhaD || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="circPanturrilhaESingle">Panturrilha Esquerda (cm)</label>
              <input
                type="number"
                step="0.1"
                name="circPanturrilhaE"
                id="circPanturrilhaESingle"
                placeholder="Ex: 38.5"
                value={avaliacao.circPanturrilhaE || ""}
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
              label="Preensão Manual Direita"
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
              label="Preensão Manual Esquerda"
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

            {/* Parecer Técnico e Considerações Finais do Avaliador */}
            <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
              <label htmlFor="observacoes" style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                Considerações Finais / Parecer Técnico Detalhado do Avaliador
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows="4"
                placeholder="Insira as considerações finais, análise da composição corporal, prescrição de treinamento e metas para a próxima reavaliação..."
                value={avaliacao.observacoes || ""}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "0.75rem" }}>
              <label htmlFor="registroAvaliador" style={{ fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1" }}>
                Identificação Profissional / CREF ou Assinatura Digital (Opcional)
              </label>
              <input
                type="text"
                id="registroAvaliador"
                name="registroAvaliador"
                placeholder="Ex: CREF 012345-G/SC — Assinado Digitalmente"
                value={avaliacao.registroAvaliador || ""}
                onChange={handleChange}
              />
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
      )}

      {/* ========================================================
          DOCUMENTO OFICIAL IMPRESSO (LAUDO CLÍNICO & COMPOSIÇÃO)
          Ordem de 9 seções validada pelo protocolo do TCC
          Visível ao imprimir (@media print) OU no modo Emitir Laudo (isLaudoOnly)
         ======================================================== */}
      <div className={`${styles.printableDocument} ${isLaudoOnly ? styles.laudoPreviewOnScreen : ""}`}>
        {/* Cabeçalho do Relatório */}
        <div className={styles.printHeader}>
          <div className={styles.printBrand}>
            <div className={styles.printLogoBadge}>UNOESC</div>
            <div>
              <h2 className={styles.printInstitutionName}>Universidade do Oeste de Santa Catarina</h2>
              <p className={styles.printInstitutionDept}>
                UNOESC Portal — Sistema de Avaliação Física • Laboratório de Cineantropometria
              </p>
            </div>
          </div>
          <div className={styles.printDocInfo}>
            <span className={styles.printDocId}>Laudo Técnico Nº #{avaliacao.id}</span>
            <span className={styles.printDocDate}>
              Data da coleta: {new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR")}
            </span>
            <span className={styles.printDocDate}>
              Data de emissão: {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>

        <div className={styles.printDocTitleBanner}>
          <h1>LAUDO TÉCNICO DE AVALIAÇÃO FÍSICA</h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "8.5pt", fontWeight: 600, color: "#475569" }}>
            Avaliação Física e Composição Corporal
          </p>
        </div>

        {/* 1. DADOS DE IDENTIFICAÇÃO DO AVALIADO */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>1. DADOS DE IDENTIFICAÇÃO DO AVALIADO</h3>
          <table className={styles.printTable}>
            <tbody>
              <tr>
                <td style={{ width: "20%", fontWeight: 700 }}>Nome:</td>
                <td style={{ width: "45%" }}>{aluno?.nome || "---"}</td>
                <td style={{ width: "15%", fontWeight: 700 }}>Matrícula:</td>
                <td style={{ width: "20%" }}>{aluno?.matricula || "---"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Idade:</td>
                <td>{idade ? `${idade} anos` : "Não informada"}</td>
                <td style={{ fontWeight: 700 }}>Gênero / Sexo:</td>
                <td>{genero === "F" ? "Feminino" : "Masculino"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>CPF:</td>
                <td>{aluno?.cpf ? maskCPF(aluno.cpf) : "Não informado"}</td>
                <td style={{ fontWeight: 700 }}>Telefone:</td>
                <td>{aluno?.telefone ? maskPhone(aluno.telefone) : "Não informado"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Avaliador responsável:</td>
                <td colSpan="3">{avaliacao.avaliador?.name || "Administrador"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. TRIAGEM PREVENTIVA — QUESTIONÁRIO PAR-Q */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>2. TRIAGEM PREVENTIVA — QUESTIONÁRIO PAR-Q</h3>
          <table className={styles.printTable}>
            <tbody>
              <tr>
                <td style={{ width: "22%", fontWeight: 700 }}>Status:</td>
                <td style={{ width: "28%" }}>
                  {parqResumo.respondido ? "Questionário respondido" : "Não registrado"}
                </td>
                <td style={{ width: "25%", fontWeight: 700 }}>Questões respondidas:</td>
                <td style={{ width: "25%" }}>{parqResumo.respondidas} de 7</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Respostas afirmativas:</td>
                <td style={{ fontWeight: 700, color: parqResumo.temAlerta ? "#b91c1c" : "#15803d" }}>
                  {parqResumo.afirmativas === 0 ? "Nenhuma" : `${parqResumo.afirmativas} resposta(s) "Sim"`}
                </td>
                <td style={{ fontWeight: 700 }}>Resultado:</td>
                <td style={{ fontWeight: 700, color: parqResumo.temAlerta ? "#b91c1c" : "#15803d" }}>
                  {parqResumo.temAlerta
                    ? "Alerta identificado na triagem preventiva"
                    : "Sem indicação de alerta na triagem preventiva"}
                </td>
              </tr>
            </tbody>
          </table>
          {parqResumo.temAlerta && (
            <div
              style={{
                marginTop: "4px",
                padding: "5px 8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "4px",
                color: "#991b1b",
                fontSize: "8pt",
                fontWeight: 700,
              }}
            >
              Atenção: foi identificada resposta afirmativa no PAR-Q. Recomenda-se avaliação de profissional de saúde antes da realização de atividades físicas intensas.
            </div>
          )}
        </div>

        {/* 3. ANAMNESE E HISTÓRICO DE SAÚDE */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>3. ANAMNESE E HISTÓRICO DE SAÚDE</h3>
          <table className={styles.printTable}>
            <thead>
              <tr>
                <th style={{ width: "34%" }}>Item Clínico / Anamnese</th>
                <th>Registro Estruturado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Histórico de doenças / patologias</td>
                <td>
                  {avaliacao.historicoMedico ||
                    aluno?.anamnese?.historicoMedico ||
                    "Nenhuma patologia crônica relatada"}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Lesões, cirurgias ou limitações físicas</td>
                <td>
                  {avaliacao.lesoes ||
                    avaliacao.resultados?.anamneseComplementar?.lesoes ||
                    aluno?.anamnese?.lesoes ||
                    "Nenhuma lesão ou limitação osteomioarticular relatada"}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Uso de medicamentos contínuos</td>
                <td>
                  {avaliacao.medicamentosEmUso ||
                    aluno?.anamnese?.medicamentos ||
                    "Não utiliza medicamentos contínuos"}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Objetivos com o treinamento</td>
                <td>{avaliacao.objetivos || "Condicionamento físico e promoção da saúde"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Prática de exercícios e hábitos de vida</td>
                <td>{avaliacao.habitos || "Informada no cadastro"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. RESUMO DA COMPOSIÇÃO CORPORAL + GRÁFICO DE PIZZA */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>4. RESUMO DA COMPOSIÇÃO CORPORAL</h3>
          <div className={styles.printKpiGrid}>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Estatura</span>
              <p className={styles.printKpiValue}>{avaliacao.altura ? `${avaliacao.altura}` : "--"}</p>
              <span className={styles.printKpiSub}>Estatímetro</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Massa Corporal</span>
              <p className={styles.printKpiValue}>{avaliacao.peso ? `${avaliacao.peso} kg` : "--"}</p>
              <span className={styles.printKpiSub}>Balança Antropométrica</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>IMC e Classificação</span>
              <p className={styles.printKpiValue}>{imcData ? `${imcData.valor} kg/m²` : "--"}</p>
              <span className={styles.printKpiSub}>{imcData?.classificacao || "Pendente"}</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Relação Cintura-Quadril</span>
              <p className={styles.printKpiValue}>{rcqData ? rcqData.valor : "--"}</p>
              <span className={styles.printKpiSub}>{rcqData?.risco || "Não calculado"}</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Percentual de Gordura</span>
              <p className={styles.printKpiValue}>
                {composicaoData.percGordura ? `${composicaoData.percGordura}%` : "--"}
              </p>
              <span className={styles.printKpiSub}>
                {composicaoData.classificacaoGordura || "Não calculado"}
              </span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Massa Livre de Gordura</span>
              <p className={styles.printKpiValue}>
                {composicaoData.massaMagra ? `${composicaoData.massaMagra} kg` : "--"}
              </p>
              <span className={styles.printKpiSub}>Massa Magra</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Massa Gorda</span>
              <p className={styles.printKpiValue}>
                {composicaoData.massaGorda ? `${composicaoData.massaGorda} kg` : "--"}
              </p>
              <span className={styles.printKpiSub}>Tecido Adiposo</span>
            </div>
            <div className={styles.printKpiCard}>
              <span className={styles.printKpiTitle}>Densidade Corporal</span>
              <p className={styles.printKpiValue} style={{ fontSize: "10pt" }}>
                {composicaoData.densidadeCorporal ? `${composicaoData.densidadeCorporal} g/cm³` : "--"}
              </p>
              <span className={styles.printKpiSub}>Equação de Siri (1961)</span>
            </div>
          </div>

          {/* Gráfico de Pizza Vetorial da Composição Corporal (Massa Gorda vs Massa Livre de Gordura) */}
          {(() => {
            const pesoTotal = parseFloat(avaliacao.peso) || 0;
            const mg = parseFloat(composicaoData.massaGorda) || 0;
            const mm = parseFloat(composicaoData.massaMagra) || (pesoTotal > 0 ? Math.max(pesoTotal - mg, 0) : 0);
            const percFat =
              parseFloat(composicaoData.percGordura) ||
              (pesoTotal > 0 && mg > 0 ? Number(((mg / pesoTotal) * 100).toFixed(1)) : 0);
            const percLean = percFat > 0 ? Number((100 - percFat).toFixed(1)) : 100;

            const cx = 42;
            const cy = 42;
            const r = 36;
            const clampedFat = Math.min(Math.max(percFat, 0.5), 99.5);
            const rad = (clampedFat / 100) * 2 * Math.PI;
            const x1 = cx;
            const y1 = cy - r;
            const x2 = cx + r * Math.sin(rad);
            const y2 = cy - r * Math.cos(rad);
            const largeArc = clampedFat > 50 ? 1 : 0;
            const slicePath = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

            return (
              <div
                style={{
                  marginTop: "5px",
                  padding: "6px 10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <svg
                    width="74"
                    height="74"
                    viewBox="0 0 84 84"
                    aria-label="Gráfico de Pizza de Composição Corporal"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx={cx} cy={cy} r={r} fill="#2e7d32" />
                    {percFat > 0 && (
                      <path
                        d={slicePath}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="0.8"
                    />
                  </svg>
                  <div style={{ fontSize: "8pt", color: "#0f172a", lineHeight: 1.45 }}>
                    <div style={{ fontWeight: 800, color: "#1b5e20", marginBottom: "2px", fontSize: "8.3pt" }}>
                      DISTRIBUIÇÃO DA COMPOSIÇÃO CORPORAL (GRÁFICO DE PROPORÇÃO)
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "9px",
                          height: "9px",
                          borderRadius: "2px",
                          background: "#2e7d32",
                        }}
                      ></span>
                      <span>
                        <strong>Massa Livre de Gordura (Magra):</strong>{" "}
                        {mm > 0 ? `${mm.toFixed(1)} kg (${percLean}%)` : "--"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "9px",
                          height: "9px",
                          borderRadius: "2px",
                          background: "#f59e0b",
                        }}
                      ></span>
                      <span>
                        <strong>Massa Gorda (Tecido Adiposo):</strong>{" "}
                        {mg > 0 ? `${mg.toFixed(1)} kg (${percFat}%)` : "--"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "7.6pt", color: "#334155", textAlign: "right", lineHeight: 1.4 }}>
                  <div>
                    <strong>Protocolo:</strong> Jackson & Pollock (7 dobras)
                  </div>
                  <div>
                    <strong>Equação:</strong> Siri (1961) •{" "}
                    <strong>Densidade:</strong>{" "}
                    {composicaoData.densidadeCorporal
                      ? `${composicaoData.densidadeCorporal} g/cm³`
                      : "Não calculada"}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 5 e 6. PERIMETRIA E DOBRAS CUTÂNEAS */}
        <div className={styles.printTwoCols}>
          <div className={styles.printCol}>
            <h3 className={styles.printSectionTitle}>
              5. PERIMETRIA E CIRCUNFERÊNCIAS CORPORAIS (cm)
            </h3>
            <table className={styles.printTable}>
              <thead>
                <tr>
                  <th>Região Corporal</th>
                  <th style={{ textAlign: "right" }}>Medida (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cintura</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {avaliacao.circCintura ? `${avaliacao.circCintura} cm` : "--"}
                  </td>
                </tr>
                <tr>
                  <td>Abdômen</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {avaliacao.circAbdomem ? `${avaliacao.circAbdomem} cm` : "--"}
                  </td>
                </tr>
                <tr>
                  <td>Quadril</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {avaliacao.circQuadril ? `${avaliacao.circQuadril} cm` : "--"}
                  </td>
                </tr>
                <tr>
                  <td>Braço relaxado (Direito / Esquerdo)</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {avaliacao.circBracoRelaxadoD || avaliacao.circBracoRelaxadoE
                      ? `${avaliacao.circBracoRelaxadoD ? `${avaliacao.circBracoRelaxadoD} cm` : "--"} / ${avaliacao.circBracoRelaxadoE ? `${avaliacao.circBracoRelaxadoE} cm` : "--"}`
                      : "--"}
                  </td>
                </tr>
                <tr>
                  <td>Coxa proximal (Direita / Esquerda)</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {avaliacao.circCoxaProximalD || avaliacao.circCoxaProximalE
                      ? `${avaliacao.circCoxaProximalD ? `${avaliacao.circCoxaProximalD} cm` : "--"} / ${avaliacao.circCoxaProximalE ? `${avaliacao.circCoxaProximalE} cm` : "--"}`
                      : "--"}
                  </td>
                </tr>
                <tr>
                  <td>Coxa medial (Direita / Esquerda)</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {avaliacao.circCoxaMedialD || avaliacao.circCoxaMedialE
                      ? `${avaliacao.circCoxaMedialD ? `${avaliacao.circCoxaMedialD} cm` : "--"} / ${avaliacao.circCoxaMedialE ? `${avaliacao.circCoxaMedialE} cm` : "--"}`
                      : "--"}
                  </td>
                </tr>
                <tr>
                  <td>Panturrilha (Direita / Esquerda)</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {avaliacao.circPanturrilhaD || avaliacao.circPanturrilhaE
                      ? `${avaliacao.circPanturrilhaD ? `${avaliacao.circPanturrilhaD} cm` : "--"} / ${avaliacao.circPanturrilhaE ? `${avaliacao.circPanturrilhaE} cm` : "--"}`
                      : "--"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.printCol}>
            <h3 className={styles.printSectionTitle}>
              6. DOBRAS CUTÂNEAS (mm) — PROTOCOLO DE JACKSON & POLLOCK
            </h3>
            <p style={{ margin: "0 0 4px 0", fontSize: "7.5pt", color: "#475569", fontStyle: "italic" }}>
              Jackson & Pollock — protocolo de 7 dobras cutâneas
            </p>
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
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {avaliacao.dcTriceps ? `${avaliacao.dcTriceps} mm` : "--"}
                    </td>
                  </tr>
                  <tr>
                    <td>Subescapular</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {avaliacao.dcSubescapular ? `${avaliacao.dcSubescapular} mm` : "--"}
                    </td>
                  </tr>
                  <tr>
                    <td>Peitoral torácica</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {avaliacao.dcPeitoral ? `${avaliacao.dcPeitoral} mm` : "--"}
                    </td>
                  </tr>
                  <tr>
                    <td>Axilar média</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {avaliacao.dcAxilarMedia ? `${avaliacao.dcAxilarMedia} mm` : "--"}
                    </td>
                  </tr>
                  <tr>
                    <td>Supra-ilíaca</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {avaliacao.dcSuprailiaca ? `${avaliacao.dcSuprailiaca} mm` : "--"}
                    </td>
                  </tr>
                  <tr>
                    <td>Abdominal</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {avaliacao.dcAbdominal ? `${avaliacao.dcAbdominal} mm` : "--"}
                    </td>
                  </tr>
                  <tr>
                    <td>Coxa medial</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {avaliacao.dcCoxa ? `${avaliacao.dcCoxa} mm` : "--"}
                    </td>
                  </tr>
                  <tr style={{ background: "#f8fafc" }}>
                    <td style={{ fontWeight: 800 }}>Somatório das sete dobras:</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {composicaoData.somaDobras} mm
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className={styles.printNoticePartial}>
                <p><strong>Jackson & Pollock — protocolo de 7 dobras cutâneas:</strong></p>
                <p>
                  As sete dobras cutâneas não foram integralmente mensuradas nesta sessão. O percentual de gordura foi omitido para assegurar fidelidade métrica.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 7. TESTES FÍSICOS NEUROMOTORES */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>7. TESTES FÍSICOS NEUROMOTORES</h3>
          <table className={styles.printTable}>
            <thead>
              <tr>
                <th>Teste/protocolo</th>
                <th>Resultado obtido</th>
                <th>Classificação</th>
                <th style={{ textAlign: "right" }}>Pontuação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Resistência abdominal — 1 minuto</td>
                <td style={{ fontWeight: 700 }}>
                  {testesFisicosData.abdominal
                    ? `${testesFisicosData.abdominal.repeticoes} repetições`
                    : "--"}
                </td>
                <td>
                  {testesFisicosData.abdominal
                    ? testesFisicosData.abdominal.classificacao
                    : "Não avaliado"}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {testesFisicosData.abdominal
                    ? `${testesFisicosData.abdominal.pontuacao} pontos`
                    : "--"}
                </td>
              </tr>
              <tr>
                <td>Força de preensão manual — dinamometria</td>
                <td style={{ fontWeight: 700 }}>
                  {testesFisicosData.preensao
                    ? `D: ${testesFisicosData.preensao.direita ?? "--"} kgf / E: ${testesFisicosData.preensao.esquerda ?? "--"} kgf`
                    : "--"}
                </td>
                <td>
                  {testesFisicosData.preensao
                    ? testesFisicosData.preensao.classificacao
                    : "Não avaliado"}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {testesFisicosData.preensao
                    ? `${testesFisicosData.preensao.pontuacao} pontos`
                    : "--"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 8. HISTÓRICO E EVOLUÇÃO DAS AVALIAÇÕES */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>8. HISTÓRICO E EVOLUÇÃO DAS AVALIAÇÕES</h3>
          {historicoAvaliacoes && historicoAvaliacoes.length > 1 ? (
            <table className={styles.printTable}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Massa corporal</th>
                  <th>IMC</th>
                  <th>Gordura corporal</th>
                  <th>Massa livre de gordura</th>
                </tr>
              </thead>
              <tbody>
                {historicoAvaliacoes.slice(0, 5).map((item) => {
                  const isCurrent = Number(item.id) === Number(avaliacao.id);
                  const hImc = isCurrent
                    ? imcData
                    : calcularIMC(item.peso, item.altura);
                  const hComp = isCurrent
                    ? composicaoData
                    : calcularComposicaoPollock7(item, idade, genero, item.peso);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: isCurrent ? 700 : 500 }}>
                        {new Date(item.dataAvaliacao).toLocaleDateString("pt-BR")}
                        {isCurrent ? " (Atual)" : ""}
                      </td>
                      <td>{item.peso ? `${item.peso} kg` : "--"}</td>
                      <td>
                        {hImc?.valor
                          ? String(hImc.valor).replace(".", ",")
                          : item.resultados?.imc?.valor || "--"}
                      </td>
                      <td>
                        {hComp?.percGordura
                          ? `${String(hComp.percGordura).replace(".", ",")}%`
                          : item.resultados?.composicao?.percGordura
                          ? `${item.resultados.composicao.percGordura}%`
                          : "--"}
                      </td>
                      <td>
                        {hComp?.massaMagra
                          ? `${String(hComp.massaMagra).replace(".", ",")} kg`
                          : item.resultados?.composicao?.massaMagra
                          ? `${item.resultados.composicao.massaMagra} kg`
                          : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.printNotesBox}>
              <p style={{ margin: 0, color: "#334155" }}>
                Este é o primeiro registro do avaliado. Ainda não existem avaliações anteriores para comparação.
              </p>
            </div>
          )}
        </div>

        {/* 9. CONSIDERAÇÕES FINAIS E PARECER TÉCNICO DO AVALIADOR */}
        <div className={styles.printSection}>
          <h3 className={styles.printSectionTitle}>
            9. CONSIDERAÇÕES FINAIS E PARECER TÉCNICO DO AVALIADOR
          </h3>
          <div className={styles.printNotesBox}>
            <p style={{ margin: 0, whiteSpace: "pre-line" }}>
              {avaliacao.observacoes ||
                "Os dados cineantropométricos e neuromotores foram coletados conforme os protocolos padronizados no sistema. Recomenda-se o acompanhamento periódico da composição corporal, prescrição individualizada de treinamento e realização de nova avaliação física conforme planejamento."}
            </p>
            {parqResumo.temAlerta && (
              <p style={{ margin: "4px 0 0 0", color: "#991b1b", fontWeight: 700 }}>
                Nota de Triagem (PAR-Q): Foi registrada resposta afirmativa no questionário PAR-Q. Recomenda-se orientação médica complementar antes de atividades de alta intensidade.
              </p>
            )}
          </div>
        </div>

        {/* ASSINATURAS FÍSICA OU DIGITAL E IDENTIFICAÇÃO FINAL */}
        <div className={styles.printSignatures}>
          <div className={styles.printSignBlock}>
            <div className={styles.printSignLine}></div>
            <p className={styles.printSignName}>
              Avaliador(a) Responsável: {avaliacao.avaliador?.name || "Administrador"}
            </p>
            <p className={styles.printSignRole}>
              {avaliacao.registroAvaliador ||
                avaliacao.resultados?.registroAvaliador ||
                "Profissional de Educação Física / Avaliador — Assinatura Física ou Digital"}
            </p>
          </div>

          <div className={styles.printSignBlock}>
            <div className={styles.printSignLine}></div>
            <p className={styles.printSignName}>{aluno?.nome || "Avaliado(a)"}</p>
            <p className={styles.printSignRole}>
              Assinatura física ou digital do(a) avaliado(a) • Código UNOESC-LAUDO-#{avaliacao.id}-
              {new Date(avaliacao.dataAvaliacao).getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL RESPONSIVO DE ENVIO DE RELATÓRIO POR E-MAIL (COM PDF ANEXO)
         ======================================================== */}
      {showEmailModal && (
        <div className={styles.emailModalOverlay} onClick={() => setShowEmailModal(false)}>
          <div className={styles.emailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.emailModalHeader}>
              <h3>
                <FaEnvelope style={{ color: "#a4d864" }} /> Enviar Laudo em PDF por E-mail
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
              {/* Banner limpo informando que o PDF é anexado automaticamente (configurações SMTP restritas ao Admin em Configurações) */}
              <div
                style={{
                  background: "#1c2618",
                  border: "1px solid #36462f",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ fontSize: "0.84rem", color: "#cbd5e1" }}>
                  📎 <strong>Anexo automático (idêntico ao Laudo impresso):</strong>{" "}
                  <span style={{ color: "#a4d864" }}>
                    Laudo_Avaliacao_Fisica_{avaliacao.id}.pdf
                  </span>
                </div>
              </div>

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
                <label>Resumo no Corpo do E-mail (além do Laudo completo em PDF anexo)</label>
                <textarea
                  rows="4"
                  value={emailMensagem}
                  onChange={(e) => setEmailMensagem(e.target.value)}
                  className={styles.emailPreviewBox}
                />
              </div>
            </div>

            <div className={styles.emailModalFooter}>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleOpenGmailWeb}
                title="Abre a página do Gmail no navegador já com destinatário, assunto e descrição preenchidos"
              >
                <FaEnvelope /> Abrir no Gmail
              </button>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleOpenMailto}
                title="Abre seu aplicativo de e-mail padrão já preenchido"
              >
                <FaEnvelope /> App de E-mail
              </button>
              <button
                type="button"
                className={styles.printHeaderButton}
                onClick={() => handleFinalizar("completo")}
                title="Salva o PDF oficial no computador"
              >
                <FaPrint /> Salvar PDF
              </button>
              <button
                type="button"
                className={styles.finishButton}
                onClick={handleSendEmailSystem}
                disabled={sendingEmail}
              >
                <FaPaperPlane /> {sendingEmail ? "Enviando (2s)..." : "Enviar Laudo em PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}