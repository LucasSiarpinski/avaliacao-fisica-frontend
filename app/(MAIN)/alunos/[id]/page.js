// app/(main)/alunos/[id]/page.js

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "../../../../services/api";
import styles from "./alunoDetalhe.module.css";
import { calculateAge } from "../../../../utils/date"; // Ajuste o caminho se necessário

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

  useEffect(() => {
    if (!isCreating && id) {
      const fetchAluno = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/alunos/${id}`);
          const dataFormatada = response.data.dataNasc
            ? response.data.dataNasc.split("T")[0]
            : "";
          setAluno({ ...response.data, dataNasc: dataFormatada });
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
    setAluno((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isCreating) {
        const response = await api.post("/alunos", aluno);
        toast.success("Aluno criado com sucesso!");
        router.push(`/alunos/${response.data.id}`);
      } else {
        await api.put(`/alunos/${id}`, aluno);
        toast.success("Dados do aluno atualizados com sucesso!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Ocorreu um erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 1. A NOVA FUNÇÃO PARA ALTERAR O STATUS ---
  const handleToggleStatus = async () => {
    // Determina qual será o novo status, o oposto do atual
    const novoStatus = aluno.status === "ATIVO" ? "INATIVO" : "ATIVO";
    // Pede confirmação ao usuário para uma ação importante
    const confirmar = window.confirm(
      `Tem certeza que deseja ${novoStatus.toLowerCase()} este aluno?`
    );
    if (!confirmar) return;

    try {
      // Chama a nova rota PATCH que criamos no backend
      const response = await api.patch(`/alunos/${id}/status`, {
        status: novoStatus,
      });
      // ATUALIZA O ESTADO LOCAL com a resposta da API, para que a tela mude instantaneamente
      setAluno(response.data);
      toast.success(`Aluno ${novoStatus.toLowerCase()} com sucesso!`);
    } catch (error) {
      toast.error("Não foi possível alterar o status do aluno.");
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
          <button
            onClick={() => router.push("/alunos")}
            className={styles.backButton}
            disabled={isSaving}
          >
            Voltar para Lista
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      <div className={styles.tabContainer}>
        <button
          onClick={() => setActiveTab("dadosPessoais")}
          className={activeTab === "dadosPessoais" ? styles.activeTab : ""}
        >
          Dados Pessoais
        </button>
        <button
          onClick={() => setActiveTab("avaliacoes")}
          disabled={isCreating}
          className={activeTab === "avaliacoes" ? styles.activeTab : ""}
        >
          Questionário Anamnese
        </button>
        <button
          onClick={() => setActiveTab("documentos")}
          disabled={isCreating}
          className={activeTab === "documentos" ? styles.activeTab : ""}
        >
          Questionário PAR-Q
        </button>
        <button
          onClick={() => setActiveTab("arquivos")}
          disabled={isCreating}
          className={activeTab === "arquivos" ? styles.activeTab : ""}
        >
          Arquivos
        </button>
      </div>

      <main className={styles.content}>
        {activeTab === "dadosPessoais" && (
          <div className={styles.formGrid}>
            {/* --- SEÇÃO DE STATUS (MOVIDA PARA DENTRO DA GRID) --- */}
            {!isCreating && (
              <div className={`${styles.statusSection} ${styles.fullWidth}`}>
                <h3 className={styles.formSectionTitle}>Status</h3>
                <div className={styles.formGroupRadio}>
                  <label>Ativo:</label>
                  <div className={styles.radioOptionsContainer}>
                    <div className={styles.radioOption}>
                      <input
                        type="radio"
                        id="statusAtivo"
                        name="status"
                        value="ATIVO"
                        checked={aluno.status === "ATIVO"}
                        onChange={handleChange}
                      />
                      <label htmlFor="statusAtivo">Sim</label>
                    </div>
                    <div className={styles.radioOption}>
                      <input
                        type="radio"
                        id="statusInativo"
                        name="status"
                        value="INATIVO"
                        checked={aluno.status === "INATIVO"}
                        onChange={handleChange}
                      />
                      <label htmlFor="statusInativo">Não</label>
                    </div>
                  </div>
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
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="telefone">Telefone</label>
              <input
                id="telefone"
                name="telefone"
                value={aluno.telefone || ""}
                onChange={handleChange}
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

            {/* --- SEÇÃO DE ANAMNESE (REMOVIDA DESTA ABA) --- */}
            
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

          </div>
        )}
        
        {activeTab === "documentos" && (
          <div className={styles.formGrid}>
            <h3 className={styles.formSectionTitle}>Questionário PAR-Q</h3>
            <p className={`${styles.formDescription} ${styles.fullWidth}`}>
              Este questionário visa identificar riscos à saúde. Se o aluno responder "SIM" a qualquer pergunta, recomende uma avaliação médica antes de iniciar os testes físicos de esforço.
            </p>

            {/* Pergunta 1 */}
            <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
              <label>1. Seu médico já mencionou alguma vez que você possui um problema do coração e lhe recomendou que só fizesse atividade física sob supervisão médica?</label>
              <div className={styles.radioOptionsContainer}>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq1_sim" name="parq_q1" value="SIM" 
                         checked={aluno.parq_q1 === "SIM"} onChange={handleChange} />
                  <label htmlFor="parq1_sim">Sim</label>
                </div>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq1_nao" name="parq_q1" value="NAO" 
                         checked={aluno.parq_q1 === "NAO"} onChange={handleChange} />
                  <label htmlFor="parq1_nao">Não</label>
                </div>
              </div>
            </div>

            {/* Pergunta 2 */}
            <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
              <label>2. Você sente dor no tórax quando realiza atividade física?</label>
              <div className={styles.radioOptionsContainer}>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq2_sim" name="parq_q2" value="SIM" 
                         checked={aluno.parq_q2 === "SIM"} onChange={handleChange} />
                  <label htmlFor="parq2_sim">Sim</label>
                </div>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq2_nao" name="parq_q2" value="NAO" 
                         checked={aluno.parq_q2 === "NAO"} onChange={handleChange} />
                  <label htmlFor="parq2_nao">Não</label>
                </div>
              </div>
            </div>

            {/* Pergunta 3 */}
            <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
              <label>3. Você sentiu dor no tórax quando estava realizando atividade física no último mês?</label>
              <div className={styles.radioOptionsContainer}>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq3_sim" name="parq_q3" value="SIM" 
                         checked={aluno.parq_q3 === "SIM"} onChange={handleChange} />
                  <label htmlFor="parq3_sim">Sim</label>
                </div>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq3_nao" name="parq_q3" value="NAO" 
                         checked={aluno.parq_q3 === "NAO"} onChange={handleChange} />
                  <label htmlFor="parq3_nao">Não</label>
                </div>
              </div>
            </div>

            {/* Pergunta 4 */}
            <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
              <label>4. Você já perdeu o equilíbrio por causa de tontura ou alguma vez perdeu a consciência?</label>
              <div className={styles.radioOptionsContainer}>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq4_sim" name="parq_q4" value="SIM" 
                         checked={aluno.parq_q4 === "SIM"} onChange={handleChange} />
                  <label htmlFor="parq4_sim">Sim</label>
                </div>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq4_nao" name="parq_q4" value="NAO" 
                         checked={aluno.parq_q4 === "NAO"} onChange={handleChange} />
                  <label htmlFor="parq4_nao">Não</label>
                </div>
              </div>
            </div>

            {/* Pergunta 5 */}
            <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
              <label>5. Você tem algum problema ósseo ou articular que poderia ser agravado com a prática de atividade física?</label>
              <div className={styles.radioOptionsContainer}>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq5_sim" name="parq_q5" value="SIM" 
                         checked={aluno.parq_q5 === "SIM"} onChange={handleChange} />
                  <label htmlFor="parq5_sim">Sim</label>
                </div>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq5_nao" name="parq_q5" value="NAO" 
                         checked={aluno.parq_q5 === "NAO"} onChange={handleChange} />
                  <label htmlFor="parq5_nao">Não</label>
                </div>
              </div>
            </div>

             {/* Pergunta 6 */}
            <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
              <label>6. Seu médico está prescrevendo uso de medicamentos para a sua pressão arterial ou coração?</label>
              <div className={styles.radioOptionsContainer}>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq6_sim" name="parq_q6" value="SIM" 
                         checked={aluno.parq_q6 === "SIM"} onChange={handleChange} />
                  <label htmlFor="parq6_sim">Sim</label>
                </div>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq6_nao" name="parq_q6" value="NAO" 
                         checked={aluno.parq_q6 === "NAO"} onChange={handleChange} />
                  <label htmlFor="parq6_nao">Não</label>
                </div>
              </div>
            </div>

             {/* Pergunta 7 */}
            <div className={`${styles.parqQuestion} ${styles.fullWidth}`}>
              <label>7. Você conhece alguma outra razão pela qual você não deveria praticar atividade física?</label>
              <div className={styles.radioOptionsContainer}>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq7_sim" name="parq_q7" value="SIM" 
                         checked={aluno.parq_q7 === "SIM"} onChange={handleChange} />
                  <label htmlFor="parq7_sim">Sim</label>
                </div>
                <div className={styles.radioOption}>
                  <input type="radio" id="parq7_nao" name="parq_q7" value="NAO" 
                         checked={aluno.parq_q7 === "NAO"} onChange={handleChange} />
                  <label htmlFor="parq7_nao">Não</label>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === "arquivos" && (
          <div>
            <h2>Aba para inserir e visualizar arquivos</h2>
            <p>Em breve</p>
          </div>
        )}
      </main>
    </div>
  );
}