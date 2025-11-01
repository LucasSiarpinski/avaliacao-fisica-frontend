"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./avaliacao.module.css"; 
import { useAuth } from "../../../../contexts/AuthContext"; 
import api from "../../../../services/api"; 

// --- FUNÇÃO HELPER ---
// (Coloquei fora do componente para melhor organização)
function calcularIdade(dataNasc) {
  if (!dataNasc) return "---";
  try {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  } catch (error) {
    console.error("Erro ao calcular idade:", error);
    return "---";
  }
}

// --- Componentes de Abas ---
// (Movidos para fora do componente principal para clareza)

// --- COMPONENTE ABA 3: Antropometria ---
const TabAntropometria = ({ data, handleChange }) => {
  return (
    <div className={`${styles.formGrid} ${styles.threeColumns}`}>
      <h3 className={styles.formSectionTitle}>Antropometria Básica</h3>
      <div className={styles.formGroup}>
        <label htmlFor="peso">Peso (kg)</label>
        <input type="number" step="0.1" name="peso" id="peso" value={data.peso || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="altura">Altura (m)</label>
        <input type="number" step="0.01" name="altura" id="altura" value={data.altura || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label>IMC (Calculado)</label>
        <input type="text" disabled value={
            (data.peso && data.altura)
              ? (data.peso / (data.altura * data.altura)).toFixed(2)
              : "---"
          }
        />
      </div>

      <h3 className={styles.formSectionTitle}>Perimetria (cm)</h3>
      <div className={styles.formGroup}>
        <label htmlFor="circCintura">Cintura</label>
        <input type="number" step="0.1" name="circCintura" id="circCintura" value={data.circCintura || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="circAbdomem">Abdômen</label>
        <input type="number" step="0.1" name="circAbdomem" id="circAbdomem" value={data.circAbdomem || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="circQuadril">Quadril</label>
        <input type="number" step="0.1" name="circQuadril" id="circQuadril" value={data.circQuadril || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="circBracoRelaxadoD">Braço Relaxado (D)</label>
        <input type="number" step="0.1" name="circBracoRelaxadoD" id="circBracoRelaxadoD" value={data.circBracoRelaxadoD || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="circBracoRelaxadoE">Braço Relaxado (E)</label>
        <input type="number" step="0.1" name="circBracoRelaxadoE" id="circBracoRelaxadoE" value={data.circBracoRelaxadoE || ""} onChange={handleChange} />
      </div>

      <h3 className={styles.formSectionTitle}>Dobras Cutâneas (mm)</h3>
      <div className={styles.formGroup}>
        <label htmlFor="dcTriceps">Tríceps</label>
        <input type="number" step="0.1" name="dcTriceps" id="dcTriceps" value={data.dcTriceps || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="dcSubescapular">Subescapular</label>
        <input type="number" step="0.1" name="dcSubescapular" id="dcSubescapular" value={data.dcSubescapular || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="dcPeitoral">Peitoral (Torácica)</label>
        <input type="number" step="0.1" name="dcPeitoral" id="dcPeitoral" value={data.dcPeitoral || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="dcAxilarMedia">Axilar Média</label>
        <input type="number" step="0.1" name="dcAxilarMedia" id="dcAxilarMedia" value={data.dcAxilarMedia || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="dcSuprailiaca">Supra-ilíaca</label>
        <input type="number" step="0.1" name="dcSuprailiaca" id="dcSuprailiaca" value={data.dcSuprailiaca || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="dcAbdominal">Abdominal</label>
        <input type="number" step="0.1" name="dcAbdominal" id="dcAbdominal" value={data.dcAbdominal || ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="dcCoxa">Coxa</label>
        <input type="number" step="0.1" name="dcCoxa" id="dcCoxa" value={data.dcCoxa || ""} onChange={handleChange} />
      </div>
    </div>
  );
};

// --- COMPONENTE ABA 2: Anamnese (Snapshot) ---
const TabAnamnese = ({ data, handleChange }) => {
  return (
    <div className={`${styles.formGrid} ${styles.twoColumns}`}>
      <h3 className={styles.formSectionTitle}>Anamnese (Snapshot)</h3>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label htmlFor="objetivos">Quais são seus principais objetivos? (Ex: hipertrofia, emagrecimento, saúde)</label>
        <textarea name="objetivos" id="objetivos" rows="3" value={data.objetivos || ""} onChange={handleChange}></textarea>
      </div>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label htmlFor="historicoMedico">Você possui algum problema de saúde ou histórico de doença? (Ex: diabetes, hipertensão, lesões)</label>
        <textarea name="historicoMedico" id="historicoMedico" rows="3" value={data.historicoMedico || ""} onChange={handleChange}></textarea>
      </div>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label htmlFor="medicamentosEmUso">Você utiliza algum medicamento continuamente?</label>
        <textarea name="medicamentosEmUso" id="medicamentosEmUso" rows="2" value={data.medicamentosEmUso || ""} onChange={handleChange}></textarea>
      </div>
       <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label htmlFor="habitos">Descreva seus hábitos (Ex: fumante, bebe álcool, nível de estresse, qualidade do sono)</label>
        <textarea name="habitos" id="habitos" rows="3" value={data.habitos || ""} onChange={handleChange}></textarea>
      </div>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label htmlFor="observacoes">Observações adicionais:</label>
        <textarea name="observacoes" id="observacoes" rows="3" value={data.observacoes || ""} onChange={handleChange}></textarea>
      </div>
    </div>
  );
};

// --- COMPONENTE Reutilizável: PAR-Q (Snapshot) ---
// (Agora é um componente separado para ser usado na Aba 1)
const ParQForm = ({ data, handleChange }) => {
  const ParQQuestion = ({ name, question }) => (
    <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
      <label>{question}</label>
      <div className={styles.radioOptionsContainer}>
        <div className={styles.radioOption}>
          <input type="radio" id={`${name}_sim`} name={name} value="SIM" checked={data[name] === "SIM"} onChange={handleChange} />
          <label htmlFor={`${name}_sim`}>Sim</label>
        </div>
        <div className={styles.radioOption}>
          <input type="radio" id={`${name}_nao`} name={name} value="NAO" checked={data[name] === "NAO"} onChange={handleChange} />
          <label htmlFor={`${name}_nao`}>Não</label>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`${styles.formGrid} ${styles.twoColumns}`}>
      <h3 className={styles.formSectionTitle}>Questionário PAR-Q (Snapshot)</h3>
      <ParQQuestion name="parq_q1" question="1. Seu médico já mencionou que você possui um problema do coração e que só fizesse atividade física sob supervisão médica?" />
      <ParQQuestion name="parq_q2" question="2. Você sente dor no tórax quando realiza atividade física?" />
      <ParQQuestion name="parq_q3" question="3. No último mês, você sentiu dor no tórax quando estava em repouso?" />
      <ParQQuestion name="parq_q4" question="4. Você perde o equilíbrio devido à tontura ou alguma vez perdeu a consciência?" />
      <ParQQuestion name="parq_q5" question="5. Você tem algum problema ósseo ou articular (Ex: costas, joelho ou quadril) que poderia ser agravado pela atividade física?" />
      <ParQQuestion name="parq_q6" question="6. Seu médico está (atualmente) prescrevendo medicamentos para sua pressão arterial ou problema de coração?" />
      <ParQQuestion name="parq_q7" question="7. Você conhece alguma outra razão pela qual você não deveria praticar atividade física?" />
    </div>
  );
};


// --- COMPONENTE ABA 1: Dados Pessoais & PAR-Q (NOVA) ---
const TabDadosPessoaisEParQ = ({ avaliacao, handleChange }) => {
  // O 'aluno' vem de dentro da 'avaliacao'
  const aluno = avaliacao.aluno;
  const idade = calcularIdade(aluno?.dataNasc);

  return (
    <>
      {/* --- Seção de Dados Pessoais (Read-Only) --- */}
      <div className={`${styles.formGrid} ${styles.twoColumns}`}>
        <h3 className={styles.formSectionTitle}>Dados do Aluno</h3>
        <div className={styles.formGroup}>
          <label>Nome</label>
          <input type="text" disabled value={aluno?.nome || "Carregando..."} />
        </div>
        <div className={styles.formGroup}>
          <label>Idade</label>
          <input type="text" disabled value={idade} />
        </div>
      </div>

      {/* --- Divisor --- */}
      <div style={{ height: '1px', background: '#333', margin: '2.5rem 0' }}></div>

      {/* --- Seção do PAR-Q (Editável) --- */}
      <ParQForm data={avaliacao} handleChange={handleChange} />
    </>
  );
};


// --- PÁGINA PRINCIPAL ---
export default function AvaliacaoPage() {
  const router = useRouter();
  const params = useParams(); // Hook para pegar o [id] da URL
  const { id } = params;

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [avaliacao, setAvaliacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // A aba padrão agora é 'dadosPessoais'
  const [activeTab, setActiveTab] = useState("dadosPessoais"); 

  // --- BUSCA DE DADOS ---
  const fetchAvaliacao = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/avaliacoes/${id}`);
      setAvaliacao(response.data);
    } catch (error) {
      console.error("Erro ao buscar avaliação:", error);
      if (error.response?.status === 404) {
        toast.error("Avaliação não encontrada.");
        router.push("/avaliacoes");
      } else {
        toast.error("Não foi possível carregar os dados da avaliação.");
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // --- EFEITOS ---
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

  // --- HANDLERS (Formulário) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAvaliacao((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/avaliacoes/${id}`, avaliacao);
      toast.success("Avaliação salva com sucesso!");
      // Opcional: Recarregar os dados após salvar
      // fetchAvaliacao(); 
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      toast.error("Não foi possível salvar a avaliação.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDERIZAÇÃO ---
  if (loading || authLoading || !avaliacao) {
    return <div style={{ color: "white", padding: "2rem" }}>Carregando dados da avaliação...</div>;
  }

  // --- Renderização condicional das Abas ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "dadosPessoais":
        return <TabDadosPessoaisEParQ avaliacao={avaliacao} handleChange={handleChange} />;
      case "anamnese":
        return <TabAnamnese data={avaliacao} handleChange={handleChange} />;
      case "antropometria":
        return <TabAntropometria data={avaliacao} handleChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* --- Cabeçalho --- */}
      <header className={styles.header}>
        <h1>
          Avaliando: <span className={styles.alunoName}>{avaliacao.aluno?.nome || "Aluno"}</span>
        </h1>
        <div className={styles.actions}>
          <button
            onClick={() => router.push("/avaliacoes")}
            className={styles.backButton}
          >
            Voltar para Lista
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </header>

      {/* --- Abas (Atualizadas) --- */}
      <nav className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'dadosPessoais' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('dadosPessoais')}
        >
          Dados Pessoais & PAR-Q
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'anamnese' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('anamnese')}
        >
          Anamnese
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'antropometria' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('antropometria')}
        >
          Antropometria
        </button>
      </nav>

      {/* --- Conteúdo da Aba Ativa --- */}
      <main className={styles.content}>
        {renderTabContent()}
      </main>
    </div>
  );
}