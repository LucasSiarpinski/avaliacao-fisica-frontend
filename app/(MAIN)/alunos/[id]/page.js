// app/(main)/alunos/[id]/page.js

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "../../../../services/api";
import styles from "./alunoDetalhe.module.css";
import { calculateAge } from "../../../../utils/date"; // Ajuste o caminho se necessário
import { maskCPF, maskPhone, validateCPF, validatePhone, unmask } from "../../../../utils/masks";
import { calcularIMC, calcularRCQ } from "../../../../utils/calculosFisicos";
import { 
  FaFilePdf, 
  FaFileWord, 
  FaFileImage, 
  FaCloudUploadAlt, 
  FaTrash, 
  FaExternalLinkAlt, 
  FaInfoCircle,
  FaHeartbeat,
  FaPrint,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaPlus,
  FaChartLine,
  FaCalendarAlt,
  FaUserCheck,
  FaArrowLeft,
  FaArrowRight,
  FaCheck
} from "react-icons/fa";

const parqQuestions = [
  {
    id: "parq_q1",
    num: "01",
    text: "Seu médico já mencionou alguma vez que você possui um problema do coração e lhe recomendou que só fizesse atividade física sob supervisão médica?",
  },
  {
    id: "parq_q2",
    num: "02",
    text: "Você sente dor no tórax quando realiza atividade física?",
  },
  {
    id: "parq_q3",
    num: "03",
    text: "Você sentiu dor no tórax quando estava realizando atividade física no último mês?",
  },
  {
    id: "parq_q4",
    num: "04",
    text: "Você já perdeu o equilíbrio por causa de tontura ou alguma vez perdeu a consciência?",
  },
  {
    id: "parq_q5",
    num: "05",
    text: "Você tem algum problema ósseo ou articular que poderia ser agravado com a prática de atividade física?",
  },
  {
    id: "parq_q6",
    num: "06",
    text: "Seu médico está prescrevendo uso de medicamentos para a sua pressão arterial ou coração?",
  },
  {
    id: "parq_q7",
    num: "07",
    text: "Você conhece alguma outra razão pela qual você não deveria praticar atividade física?",
  },
];

export default function AlunoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const isCreating = id === "novo";

  // 1. ESTADO INICIAL ATUALIZADO COM TODOS OS NOVOS CAMPOS
  const [aluno, setAluno] = useState({
    nome: "",
    email: "",
    dataNasc: "",
    matricula: "",
    cpf: "",
    genero: "",
    telefone: "",
    altura: "",
    peso: "",
    objetivos: "",
    historicoMedico: "",
    medicamentosEmUso: "",
    habitos: "",
    observacoes: "",
    parq_q1: null,
    parq_q2: null,
    parq_q3: null,
    parq_q4: null,
    parq_q5: null,
    parq_q6: null,
    parq_q7: null,
  });

  const [activeTab, setActiveTab] = useState("dadosPessoais");
  const [loading, setLoading] = useState(!isCreating);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingAvaliacao, setIsStartingAvaliacao] = useState(false);
  const [confirmStatusAction, setConfirmStatusAction] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleIniciarNovaAvaliacao = async () => {
    if (isCreating || !id) return;
    if (aluno.status !== "ATIVO") {
      const confirmar = window.confirm(
        "Atenção: Este aluno está marcado como INATIVO. Deseja iniciar a avaliação física mesmo assim?"
      );
      if (!confirmar) return;
    }

    setIsStartingAvaliacao(true);
    try {
      const response = await api.post("/api/avaliacoes", {
        alunoId: parseInt(id),
      });
      toast.success("Avaliação iniciada! Redirecionando...");
      router.push(`/avaliacoes/${response.data.id}`);
    } catch (error) {
      console.error("Erro ao iniciar avaliação:", error);
      toast.error(error.response?.data?.error || "Não foi possível iniciar a avaliação.");
      setIsStartingAvaliacao(false);
    }
  };

  // Estados para gerenciamento de documentos / arquivos
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocumentos = useCallback(async () => {
    if (!id || isCreating) return;
    try {
      setLoadingDocs(true);
      const res = await api.get(`/api/alunos/${id}/documentos`);
      setDocumentos(res.data);
    } catch (err) {
      console.error("Erro ao buscar documentos:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, [id, isCreating]);

  useEffect(() => {
    if (activeTab === "arquivos" && !isCreating) {
      fetchDocumentos();
    }
  }, [activeTab, isCreating, fetchDocumentos]);

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Formato inválido! Envie apenas PDF, Word (.doc, .docx), PNG ou JPEG.");
      e.target.value = "";
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("O arquivo excede o limite máximo de 25MB.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("arquivo", file);

    setUploading(true);
    try {
      await api.post(`/api/alunos/${id}/documentos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Arquivo enviado com sucesso!");
      fetchDocumentos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao enviar o arquivo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteDoc = async (docId) => {
    const confirmar = window.confirm("Tem certeza que deseja remover este documento?");
    if (!confirmar) return;

    try {
      await api.delete(`/api/documentos/${docId}`);
      toast.success("Documento excluído com sucesso!");
      setDocumentos((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível excluir o documento.");
    }
  };

  // Estados e funções para gerenciamento do histórico de avaliações físicas
  const [avaliacoesAluno, setAvaliacoesAluno] = useState([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);

  const fetchAvaliacoesAluno = useCallback(async () => {
    if (!id || isCreating) return;
    try {
      setLoadingAvaliacoes(true);
      const res = await api.get(`/api/alunos/${id}/avaliacoes`);
      setAvaliacoesAluno(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar histórico de avaliações do aluno:", err);
    } finally {
      setLoadingAvaliacoes(false);
    }
  }, [id, isCreating]);

  useEffect(() => {
    if (!isCreating && id) {
      fetchAvaliacoesAluno();
    }
  }, [id, isCreating, fetchAvaliacoesAluno]);

  const handleDeleteAvaliacao = async (avaId) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir esta avaliação física? Esta ação é irreversível.");
    if (!confirmar) return;

    try {
      await api.delete(`/api/avaliacoes/${avaId}`);
      toast.success("Avaliação excluída com sucesso!");
      setAvaliacoesAluno((prev) => prev.filter((a) => a.id !== avaId));
    } catch (err) {
      console.error("Erro ao excluir avaliação:", err);
      toast.error("Não foi possível excluir a avaliação.");
    }
  };

  useEffect(() => {
    if (!isCreating && id) {
      const fetchAluno = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/alunos/${id}`);
          const dataFormatada = response.data.dataNasc
            ? response.data.dataNasc.split("T")[0]
            : "";
          setAluno({
            ...response.data,
            dataNasc: dataFormatada,
            cpf: maskCPF(response.data.cpf || ""),
            telefone: maskPhone(response.data.telefone || ""),
          });
        } catch (error) {
          toast.error("Não foi possível carregar os dados do aluno.");
          router.push("/alunos");
        } finally {
          setLoading(false);
        }
      };
      fetchAluno();
    }
  }, [id, isCreating, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") {
      formattedValue = maskCPF(value);
    } else if (name === "telefone") {
      formattedValue = maskPhone(value);
    }

    setAluno((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSave = async () => {
    // Validação dos campos obrigatórios da aba Dados Pessoais
    if (!aluno.nome || !aluno.nome.trim()) {
      toast.error("Por favor, preencha o Nome Completo na aba Dados Pessoais.");
      setActiveTab("dadosPessoais");
      return;
    }

    if (!aluno.email || !aluno.email.trim()) {
      toast.error("Por favor, preencha o E-mail na aba Dados Pessoais.");
      setActiveTab("dadosPessoais");
      return;
    }

    if (!aluno.dataNasc) {
      toast.error("Por favor, preencha a Data de Nascimento na aba Dados Pessoais.");
      setActiveTab("dadosPessoais");
      return;
    }

    if (!aluno.matricula || !aluno.matricula.trim()) {
      toast.error("Por favor, preencha a Matrícula na aba Dados Pessoais.");
      setActiveTab("dadosPessoais");
      return;
    }

    // Validação de CPF
    if (aluno.cpf && unmask(aluno.cpf).length > 0) {
      if (unmask(aluno.cpf).length !== 11) {
        toast.error("O CPF deve conter 11 dígitos.");
        setActiveTab("dadosPessoais");
        return;
      }
      if (!validateCPF(aluno.cpf)) {
        toast.error("CPF inválido. Verifique os números digitados.");
        setActiveTab("dadosPessoais");
        return;
      }
    }

    // Validação de Telefone
    if (aluno.telefone && unmask(aluno.telefone).length > 0) {
      if (!validatePhone(aluno.telefone)) {
        toast.error("Telefone inválido. Informe o DDD e o número completo.");
        setActiveTab("dadosPessoais");
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        const response = await api.post("/api/alunos", aluno);
        toast.success("Aluno cadastrado com sucesso!");
        router.push(`/alunos/${response.data.id}`);
      } else {
        await api.put(`/api/alunos/${id}`, aluno);
        toast.success("Dados do aluno atualizados com sucesso!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Ocorreu um erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 1. FUNÇÃO PARA CONFIRMAR E ALTERAR O STATUS ---
  const handleConfirmToggleStatus = async () => {
    if (!confirmStatusAction) return;
    setStatusLoading(true);

    try {
      // Chama a rota PATCH no backend
      const response = await api.patch(`/api/alunos/${id}/status`, {
        status: confirmStatusAction,
      });
      // Atualiza o estado local para refletir na interface
      setAluno(response.data);
      toast.success(
        confirmStatusAction === "ATIVO"
          ? "Aluno ativado com sucesso! Habilitado para avaliações."
          : "Aluno inativado com sucesso!"
      );
      setConfirmStatusAction(null);
    } catch (error) {
      console.error("Erro ao alterar status do aluno:", error);
      toast.error("Não foi possível alterar o status do aluno.");
    } finally {
      setStatusLoading(false);
    }
  };

  // 2. CALCULAMOS A IDADE DINAMICAMENTE
  const idade = calculateAge(aluno.dataNasc);

  if (loading) {
    return <div>Carregando dados do aluno...</div>;
  }

 return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          {isCreating ? "Cadastrar Novo Aluno" : `Editando: ${aluno.nome}`}
        </h1>
        <div className={styles.actions}>
          {!isCreating && (
            <button
              type="button"
              onClick={handleIniciarNovaAvaliacao}
              className={styles.iniciarAvaliacaoButton}
              disabled={isStartingAvaliacao || isSaving}
              title="Iniciar uma nova avaliação física para este aluno"
            >
              <FaHeartbeat /> {isStartingAvaliacao ? "Iniciando..." : "Nova Avaliação Física"}
            </button>
          )}
          <button
            onClick={() => router.push("/alunos")}
            className={styles.backButton}
            disabled={isSaving || isStartingAvaliacao}
          >
            Voltar para Lista
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving || isStartingAvaliacao}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      <div className={styles.tabContainer}>
        <button
          type="button"
          onClick={() => setActiveTab("dadosPessoais")}
          className={activeTab === "dadosPessoais" ? styles.activeTab : ""}
        >
          Dados Pessoais
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("avaliacoes")}
          className={activeTab === "avaliacoes" ? styles.activeTab : ""}
        >
          Questionário Anamnese
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("documentos")}
          className={activeTab === "documentos" ? styles.activeTab : ""}
        >
          Questionário PAR-Q
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("avaliacoesFisicas")}
          className={activeTab === "avaliacoesFisicas" ? styles.activeTab : ""}
          title={isCreating ? "Disponível após salvar o cadastro do aluno" : "Histórico de avaliações físicas"}
        >
          <FaHeartbeat style={{ marginRight: 6 }} /> Avaliações Físicas {!isCreating && avaliacoesAluno.length > 0 ? `(${avaliacoesAluno.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("arquivos")}
          className={activeTab === "arquivos" ? styles.activeTab : ""}
          title={isCreating ? "Disponível após salvar o cadastro do aluno" : "Arquivos e exames anexados"}
        >
          Arquivos & Exames {!isCreating && documentos.length > 0 ? `(${documentos.length})` : ""}
        </button>
      </div>

      <main className={styles.content}>
        {activeTab === "dadosPessoais" && (
          <div className={styles.formGrid}>
            {/* --- SEÇÃO DE STATUS MODERNA --- */}
            {!isCreating && (
              <div className={styles.statusCard}>
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabelTitle}>Status da Matrícula</span>
                  <p className={styles.statusSubtitle}>
                    {aluno.status === "ATIVO"
                      ? "O aluno está ativo no sistema e apto para novas avaliações físicas."
                      : "O aluno está inativo no sistema e desabilitado para novas avaliações."}
                  </p>
                </div>
                <div className={styles.statusToggleGroup}>
                  <button
                    type="button"
                    className={`${styles.statusBtn} ${aluno.status === "ATIVO" ? styles.statusBtnActiveActive : ""}`}
                    onClick={() => {
                      if (aluno.status !== "ATIVO") setConfirmStatusAction("ATIVO");
                    }}
                  >
                    <span className={styles.statusDotGreen}></span>
                    Ativo
                  </button>
                  <button
                    type="button"
                    className={`${styles.statusBtn} ${aluno.status === "INATIVO" ? styles.statusBtnActiveInactive : ""}`}
                    onClick={() => {
                      if (aluno.status !== "INATIVO") setConfirmStatusAction("INATIVO");
                    }}
                  >
                    <span className={styles.statusDotRed}></span>
                    Inativo
                  </button>
                </div>
              </div>
            )}

            {/* --- SEÇÃO DE DADOS PESSOAIS --- */}
            <h3 className={styles.formSectionTitle}>Dados Pessoais</h3>

            {!isCreating && (
              <div className={styles.formGroup}>
                <label htmlFor="alunoId">ID do Aluno</label>
                <input id="alunoId" name="id" value={aluno.id} disabled />
              </div>
            )}
            <div className={styles.formGroup}>
              <label htmlFor="nome">Nome Completo *</label>
              <input
                id="nome"
                name="nome"
                value={aluno.nome || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={aluno.email || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="dataNasc">Data de Nascimento *</label>
              <input
                id="dataNasc"
                name="dataNasc"
                type="date"
                value={aluno.dataNasc || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="idade">Idade</label>
              <input
                id="idade"
                name="idade"
                value={idade !== null ? `${idade} anos` : "--"}
                disabled
                className={styles.disabledInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="matricula">Matrícula *</label>
              <input
                id="matricula"
                name="matricula"
                value={aluno.matricula || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                name="cpf"
                value={aluno.cpf || ""}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                name="telefone"
                value={aluno.telefone || ""}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                inputMode="numeric"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="genero">Gênero</label>
              <input
                id="genero"
                name="genero"
                value={aluno.genero || ""}
                onChange={handleChange}
              />
            </div>

            {/* --- SEÇÃO DE ANTROPOMETRIA --- */}
            <h3 className={styles.formSectionTitle}>Medidas Básicas</h3>
            <div className={styles.formGroup}>
              <label htmlFor="altura">Altura (cm)</label>
              <input
                id="altura"
                name="altura"
                type="number"
                value={aluno.altura || ""}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="peso">Peso (kg)</label>
              <input
                id="peso"
                name="peso"
                type="number"
                value={aluno.peso || ""}
                onChange={handleChange}
              />
            </div>

            {/* Footer de Navegação da Aba */}
            <div className={styles.tabFooterActions}>
              <button
                type="button"
                onClick={() => router.push("/alunos")}
                className={styles.btnPrevTab}
              >
                <FaArrowLeft /> Voltar para Lista
              </button>
              <div className={styles.tabFooterGroup}>
                <button
                  type="button"
                  onClick={() => setActiveTab("avaliacoes")}
                  className={styles.btnNextTab}
                >
                  Próximo: Anamnese <FaArrowRight />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  <FaCheck /> {isSaving ? "Salvando..." : isCreating ? "Salvar Aluno" : "Salvar Alterações"}
                </button>
              </div>
            </div>
            
          </div>
        )}

        {activeTab === "avaliacoesFisicas" && (
          <div className={styles.avaliacoesContainer}>
            <div className={styles.avaliacoesHeaderRow}>
              <div>
                <h3>
                  <FaHeartbeat color="#a4d864" /> Avaliações Físicas Registradas
                </h3>
                <p className={styles.avaliacoesSubtitle}>
                  Histórico completo de testes físicos, cálculos de composição corporal e evolução.
                </p>
              </div>

              {!isCreating && (
                <button
                  type="button"
                  onClick={handleIniciarNovaAvaliacao}
                  className={styles.btnNovaAvaliacaoTab}
                  disabled={isStartingAvaliacao}
                >
                  <FaPlus /> {isStartingAvaliacao ? "Iniciando..." : "Nova Avaliação Física"}
                </button>
              )}
            </div>

            {loadingAvaliacoes ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
                Carregando histórico de avaliações...
              </div>
            ) : isCreating ? (
              <div className={styles.emptyAvaliacoesBox}>
                <FaHeartbeat className={styles.emptyAvaliacoesIcon} />
                <h4>Avaliações Físicas disponíveis após salvar</h4>
                <p>
                  Para iniciar testes de composição corporal, perimetrias e dobras cutâneas (Pollock 7), primeiro conclua o cadastro básico do aluno.
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.btnNovaAvaliacaoTab}
                  disabled={isSaving}
                  style={{ marginTop: "0.5rem" }}
                >
                  <FaCheck /> {isSaving ? "Salvando..." : "Salvar Cadastro do Aluno"}
                </button>
              </div>
            ) : avaliacoesAluno.length === 0 ? (
              <div className={styles.emptyAvaliacoesBox}>
                <FaHeartbeat className={styles.emptyAvaliacoesIcon} />
                <h4>Nenhuma avaliação física registrada ainda</h4>
                <p>
                  Este aluno ainda não possui avaliações físicas salvas. Inicie a primeira avaliação para mensurar dobras cutâneas (Pollock 7), perimetrias e índice de massa corporal.
                </p>
                <button
                  type="button"
                  onClick={handleIniciarNovaAvaliacao}
                  className={styles.btnNovaAvaliacaoTab}
                  disabled={isStartingAvaliacao}
                  style={{ marginTop: "0.5rem" }}
                >
                  <FaHeartbeat /> Iniciar Primeira Avaliação
                </button>
              </div>
            ) : (
              <>
                {/* Banner de Evolução Comparativa (quando há 2 ou mais avaliações CONCLUÍDAS) */}
                {(() => {
                  const completedAvaliacoes = avaliacoesAluno.filter(
                    (a) => a.peso && a.altura
                  );
                  if (completedAvaliacoes.length < 2) return null;

                  const latest = completedAvaliacoes[0];
                  const previous = completedAvaliacoes[1];

                  const diffPeso = latest.peso && previous.peso 
                    ? (latest.peso - previous.peso).toFixed(1) 
                    : null;
                  
                  const fatLatest = latest.resultados?.composicao?.percGordura;
                  const fatPrev = previous.resultados?.composicao?.percGordura;
                  const diffGordura = fatLatest && fatPrev 
                    ? (fatLatest - fatPrev).toFixed(1) 
                    : null;

                  const leanLatest = latest.resultados?.composicao?.massaMagra;
                  const leanPrev = previous.resultados?.composicao?.massaMagra;
                  const diffMassaMagra = leanLatest && leanPrev 
                    ? (leanLatest - leanPrev).toFixed(1) 
                    : null;

                  return (
                    <div className={styles.evolutionBanner}>
                      <div className={styles.evolutionHeader}>
                        <div className={styles.evolutionTitle}>
                          <FaChartLine /> Evolução do Aluno (Última vs Penúltima Concluída)
                        </div>
                        <span className={styles.evolutionSub}>
                          Comparativo entre {new Date(previous.dataAvaliacao).toLocaleDateString('pt-BR')} e {new Date(latest.dataAvaliacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className={styles.evolutionGrid}>
                        <div className={styles.evolutionMetricCard}>
                          <span className={styles.evolutionMetricLabel}>Peso Atual</span>
                          <span className={styles.evolutionMetricCurrent}>
                            {latest.peso ? `${latest.peso} kg` : "--"}
                          </span>
                          {diffPeso !== null && (
                            <span className={`${styles.evolutionMetricDiff} ${parseFloat(diffPeso) <= 0 ? styles.diffGood : styles.diffNeutral}`}>
                              {parseFloat(diffPeso) > 0 ? `+${diffPeso} kg` : `${diffPeso} kg`}
                            </span>
                          )}
                        </div>

                        <div className={styles.evolutionMetricCard}>
                          <span className={styles.evolutionMetricLabel}>% Gordura Corporal</span>
                          <span className={styles.evolutionMetricCurrent}>
                            {fatLatest ? `${fatLatest}%` : "--"}
                          </span>
                          {diffGordura !== null && (
                            <span className={`${styles.evolutionMetricDiff} ${parseFloat(diffGordura) < 0 ? styles.diffGood : styles.diffWarn}`}>
                              {parseFloat(diffGordura) > 0 ? `+${diffGordura}%` : `${diffGordura}%`}
                            </span>
                          )}
                        </div>

                        <div className={styles.evolutionMetricCard}>
                          <span className={styles.evolutionMetricLabel}>Massa Magra</span>
                          <span className={styles.evolutionMetricCurrent}>
                            {leanLatest ? `${leanLatest} kg` : "--"}
                          </span>
                          {diffMassaMagra !== null && (
                            <span className={`${styles.evolutionMetricDiff} ${parseFloat(diffMassaMagra) >= 0 ? styles.diffGood : styles.diffWarn}`}>
                              {parseFloat(diffMassaMagra) > 0 ? `+${diffMassaMagra} kg` : `${diffMassaMagra} kg`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Lista de Avaliações */}
                <div className={styles.avaliacoesList}>
                  {avaliacoesAluno.map((ava, index) => {
                    const isLatest = index === 0;
                    const isConcluida = Boolean(ava.peso && ava.altura);
                    
                    const imc = ava.resultados?.imc || (ava.peso && ava.altura ? calcularIMC(ava.peso, ava.altura) : null);
                    const rcq = ava.resultados?.rcq || (ava.circCintura && ava.circQuadril ? calcularRCQ(ava.circCintura, ava.circQuadril, aluno.genero || "M") : null);
                    const composicao = ava.resultados?.composicao;

                    const dataFormatada = new Date(ava.dataAvaliacao).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div key={ava.id} className={styles.avaliacaoCard}>
                        <div className={styles.avaliacaoCardHeader}>
                          <div className={styles.avaliacaoDateInfo}>
                            <FaCalendarAlt color="#8da088" />
                            <span className={styles.avaliacaoDate}>{dataFormatada}</span>
                            {isLatest && (
                              <span className={styles.avaliacaoBadgeLatest}>
                                Mais Recente
                              </span>
                            )}
                            {isConcluida ? (
                              <span className={styles.statusBadgeConcluida}>
                                ✓ Concluída
                              </span>
                            ) : (
                              <span className={styles.statusBadgeAndamento}>
                                ⏳ Em Andamento
                              </span>
                            )}
                          </div>

                          <div className={styles.avaliacaoAvaliador}>
                            <FaUserCheck style={{ marginRight: 6 }} />
                            Avaliador: <strong>{ava.avaliador?.name || "Professor"}</strong>
                          </div>
                        </div>

                        <div className={styles.avaliacaoGridMetrics}>
                          <div className={styles.metricPill}>
                            <span className={styles.metricPillLabel}>Estatura / Peso</span>
                            <span className={styles.metricPillValue}>
                              {ava.peso ? `${ava.peso} kg` : "--"}
                            </span>
                            <span className={styles.metricPillSub} style={{ color: "#8da088" }}>
                              {ava.altura ? `${ava.altura} cm` : "-- cm"}
                            </span>
                          </div>

                          <div className={styles.metricPill}>
                            <span className={styles.metricPillLabel}>Índice IMC</span>
                            <span className={styles.metricPillValue}>
                              {imc ? imc.valor : "--"}
                            </span>
                            <span className={styles.metricPillSub} style={{ color: imc?.cor || "#aaa" }}>
                              {imc?.classificacao || "Pendente"}
                            </span>
                          </div>

                          <div className={styles.metricPill}>
                            <span className={styles.metricPillLabel}>% Gordura (Pollock)</span>
                            <span className={styles.metricPillValue}>
                              {composicao?.percGordura ? `${composicao.percGordura}%` : "--"}
                            </span>
                            <span className={styles.metricPillSub} style={{ color: composicao?.completo ? "#4ade80" : "#fbbf24" }}>
                              {composicao?.completo 
                                ? composicao.classificacaoGordura 
                                : ava.dcTriceps ? "Dobras parciais" : "Antropometria"}
                            </span>
                          </div>

                          <div className={styles.metricPill}>
                            <span className={styles.metricPillLabel}>Relação Cintura-Quadril</span>
                            <span className={styles.metricPillValue}>
                              {rcq ? rcq.valor : "--"}
                            </span>
                            <span className={styles.metricPillSub} style={{ color: rcq?.cor || "#aaa" }}>
                              {rcq?.risco || "Não aferido"}
                            </span>
                          </div>
                        </div>

                        <div className={styles.avaliacaoCardFooter}>
                          <div className={styles.avaliacaoObservationsBrief} title={ava.observacoes || ""}>
                            {ava.observacoes 
                              ? `Obs: ${ava.observacoes}` 
                              : "Sem observações adicionais gravadas."}
                          </div>

                          <div className={styles.avaliacaoCardBtns}>
                            <button
                              type="button"
                              onClick={() => router.push(`/avaliacoes/${ava.id}`)}
                              className={styles.btnOpenAva}
                              title={isConcluida ? "Visualizar ou editar avaliação" : "Continuar preenchimento da avaliação"}
                            >
                              <FaHeartbeat /> {isConcluida ? "Acessar Avaliação" : "Continuar Preenchimento"}
                            </button>

                            {isConcluida && (
                              <button
                                type="button"
                                onClick={() => router.push(`/avaliacoes/${ava.id}?print=true`)}
                                className={styles.btnPrintAva}
                                title="Emitir o Laudo Clínico oficial e imprimir"
                              >
                                <FaPrint /> Emitir Laudo
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteAvaliacao(ava.id)}
                              className={styles.btnDeleteAva}
                              title="Excluir esta avaliação"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "avaliacoes" && (
          // Reutilizamos a classe formGrid para manter o layout
          <div className={styles.formGrid}>
            
            {/* --- SEÇÃO DE ANAMNESE (MOVIDA PARA CÁ) --- */}
            <h3 className={styles.formSectionTitle}>Anamnese</h3>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="objetivos">Objetivos</label>
              <textarea
                id="objetivos"
                name="objetivos"
                value={aluno.objetivos || ""}
                onChange={handleChange}
              ></textarea>
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="habitos">Hábitos (fumante, álcool, etc.)</label>
              <textarea
                id="habitos"
                name="habitos"
                value={aluno.habitos || ""}
                onChange={handleChange}
              ></textarea>
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="historicoMedico">
                Histórico Médico (lesões, cirurgias, doenças)
              </label>
              <textarea
                id="historicoMedico"
                name="historicoMedico"
                value={aluno.historicoMedico || ""}
                onChange={handleChange}
              ></textarea>
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="medicamentosEmUso">Medicamentos em Uso</label>
              <textarea
                id="medicamentosEmUso"
                name="medicamentosEmUso"
                value={aluno.medicamentosEmUso || ""}
                onChange={handleChange}
              ></textarea>
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="observacoes">Observações Gerais</label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={aluno.observacoes || ""}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* Footer de Navegação da Aba */}
            <div className={styles.tabFooterActions}>
              <button
                type="button"
                onClick={() => setActiveTab("dadosPessoais")}
                className={styles.btnPrevTab}
              >
                <FaArrowLeft /> Voltar: Dados Pessoais
              </button>
              <div className={styles.tabFooterGroup}>
                <button
                  type="button"
                  onClick={() => setActiveTab("documentos")}
                  className={styles.btnNextTab}
                >
                  Próximo: PAR-Q <FaArrowRight />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  <FaCheck /> {isSaving ? "Salvando..." : isCreating ? "Salvar Aluno" : "Salvar Alterações"}
                </button>
              </div>
            </div>

          </div>
        )}
        
        {activeTab === "documentos" && (
          <div className={styles.formGrid}>
            <div className={styles.parqHeaderBanner}>
              <h4>
                <FaInfoCircle /> Questionário de Prontidão para Atividade Física (PAR-Q)
              </h4>
              <p>
                O PAR-Q identifica fatores de risco cardiovasculares e osteomusculares. Se o aluno assinalar <strong>"SIM"</strong> para qualquer pergunta, é indispensável recomendar uma avaliação médica prévia antes de submetê-lo a testes de esforço físico.
              </p>
            </div>

            {parqQuestions.map((q) => (
              <div key={q.id} className={styles.parqQuestionCard}>
                <div className={styles.parqQuestionContent}>
                  <span className={styles.parqQuestionNumber}>{q.num}</span>
                  <p className={styles.parqQuestionText}>{q.text}</p>
                </div>
                <div className={styles.parqOptions}>
                  <button
                    type="button"
                    className={`${styles.parqBtn} ${aluno[q.id] === "SIM" ? styles.parqBtnSimActive : ""}`}
                    onClick={() => setAluno((prev) => ({ ...prev, [q.id]: prev[q.id] === "SIM" ? null : "SIM" }))}
                  >
                    SIM
                  </button>
                  <button
                    type="button"
                    className={`${styles.parqBtn} ${aluno[q.id] === "NAO" ? styles.parqBtnNaoActive : ""}`}
                    onClick={() => setAluno((prev) => ({ ...prev, [q.id]: prev[q.id] === "NAO" ? null : "NAO" }))}
                  >
                    NÃO
                  </button>
                </div>
              </div>
            ))}

            {/* Footer de Navegação da Aba */}
            <div className={styles.tabFooterActions}>
              <button
                type="button"
                onClick={() => setActiveTab("avaliacoes")}
                className={styles.btnPrevTab}
              >
                <FaArrowLeft /> Voltar: Anamnese
              </button>
              <div className={styles.tabFooterGroup}>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  <FaCheck /> {isSaving ? "Salvando..." : isCreating ? "Salvar e Concluir Cadastro" : "Salvar Alterações"}
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === "arquivos" && (
          <div className={styles.arquivosContainer}>
            {isCreating ? (
              <div className={styles.noFilesNotice} style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <FaCloudUploadAlt style={{ fontSize: "3rem", color: "#5d812e", marginBottom: "1rem" }} />
                <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>Anexo de Arquivos & Exames disponível após salvar</h4>
                <p style={{ color: "#aaa", maxWidth: 500, margin: "0 auto 1.5rem" }}>
                  O upload de exames médicos, atestados e laudos estará liberado logo após a conclusão do cadastro deste aluno.
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  <FaCheck /> {isSaving ? "Salvando..." : "Salvar Cadastro do Aluno"}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.uploadDropzone}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                    onChange={handleUploadFile}
                    disabled={uploading}
                  />
                  <FaCloudUploadAlt className={styles.uploadIcon} />
                  <div className={styles.uploadTitle}>
                    {uploading ? "Enviando arquivo..." : "Clique ou arraste um arquivo para fazer upload"}
                  </div>
                  <p className={styles.uploadSubtitle}>
                    Formatos aceitos: PDF, Word (.doc, .docx), PNG e JPEG (máx. 25MB)
                  </p>
                </div>

                {loadingDocs ? (
                  <div style={{ color: "#aaa", textAlign: "center", padding: "2rem" }}>
                    Carregando arquivos do aluno...
                  </div>
                ) : documentos.length === 0 ? (
                  <div className={styles.noFilesNotice}>
                    <p>Nenhum documento anexado a este aluno ainda.</p>
                    <small>Faça upload de exames, atestados médicos, laudos ou fotos de avaliação.</small>
                  </div>
                ) : (
              <div className={styles.fileGrid}>
                {documentos.map((doc) => {
                  const ext = (doc.nome || "").split(".").pop().toLowerCase();
                  const isPdf = ext === "pdf" || doc.tipo?.includes("pdf");
                  const isWord = ["doc", "docx"].includes(ext) || doc.tipo?.includes("word");
                  const isImg = ["png", "jpg", "jpeg"].includes(ext) || doc.tipo?.startsWith("image/");
                  const backendBase = api.defaults.baseURL || "http://localhost:3333";
                  const fileUrl = `${backendBase}${doc.url}`;

                  return (
                    <div key={doc.id} className={styles.fileCard}>
                      <div className={styles.fileHeader}>
                        {isPdf && <FaFilePdf className={`${styles.fileTypeIcon} ${styles.fileIconPdf}`} />}
                        {isWord && <FaFileWord className={`${styles.fileTypeIcon} ${styles.fileIconWord}`} />}
                        {isImg && <FaFileImage className={`${styles.fileTypeIcon} ${styles.fileIconImage}`} />}
                        {!isPdf && !isWord && !isImg && (
                          <FaFilePdf className={`${styles.fileTypeIcon} ${styles.fileIconPdf}`} />
                        )}
                        <div className={styles.fileDetails}>
                          <p className={styles.fileName} title={doc.nome}>
                            {doc.nome}
                          </p>
                          <p className={styles.fileDate}>
                            {new Date(doc.uploadAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className={styles.fileActions}>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.fileViewBtn}
                        >
                          <FaExternalLinkAlt size={12} /> Abrir
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className={styles.fileDeleteBtn}
                          title="Excluir arquivo"
                        >
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </>
            )}
          </div>
        )}
      </main>

      {/* --- MODAL DE CONFIRMAÇÃO DE INATIVAÇÃO / ATIVAÇÃO --- */}
      {confirmStatusAction && (
        <div className={styles.modalOverlay} onClick={() => !statusLoading && setConfirmStatusAction(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {confirmStatusAction === "INATIVO" ? "Confirmar Inativação do Aluno" : "Confirmar Ativação do Aluno"}
            </h2>
            <p className={styles.modalDescription}>
              {confirmStatusAction === "INATIVO"
                ? `Ao inativar o aluno "${aluno.nome}", a matrícula ficará desabilitada para novas avaliações físicas, mas todo o histórico de avaliações, questionários (PAR-Q e Anamnese) e arquivos continuará preservado com total segurança. Deseja prosseguir com a inativação?`
                : `Deseja reativar a matrícula de "${aluno.nome}"? O aluno voltará a ficar imediatamente disponível para novas avaliações físicas no sistema.`}
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setConfirmStatusAction(null)}
                disabled={statusLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={
                  confirmStatusAction === "INATIVO"
                    ? styles.modalConfirmInactiveBtn
                    : styles.modalConfirmActiveBtn
                }
                onClick={handleConfirmToggleStatus}
                disabled={statusLoading}
              >
                {statusLoading
                  ? "Salvando..."
                  : confirmStatusAction === "INATIVO"
                  ? "Sim, Inativar Aluno"
                  : "Sim, Ativar Aluno"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}