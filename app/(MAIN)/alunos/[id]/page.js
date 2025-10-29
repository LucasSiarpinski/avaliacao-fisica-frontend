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
          Dados Pessoais & Anamnese
        </button>
        <button
          onClick={() => setActiveTab("avaliacoes")}
          disabled={isCreating}
          className={activeTab === "avaliacoes" ? styles.activeTab : ""}
        >
          Histórico de Avaliações
        </button>
        <button
          onClick={() => setActiveTab("documentos")}
          disabled={isCreating}
          className={activeTab === "documentos" ? styles.activeTab : ""}
        >
          Documentos
        </button>
      </div>

      <main className={styles.content}>
        {activeTab === "dadosPessoais" && (
          // O Fragment <> foi removido pois agora tudo está dentro da formGrid
          <div className={styles.formGrid}>
            {/* --- SEÇÃO DE STATUS (MOVIDA PARA DENTRO DA GRID) --- */}
            {!isCreating && (
              // Adicionamos a classe "fullWidth" para ocupar todo o espaço horizontal
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

            {/* --- SEÇÃO DE ANAMNESE --- */}
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

        {activeTab === "avaliacoes" && (
          <div>
            <h2>Histórico de Avaliações (Em breve)</h2>
          </div>
        )}
        {activeTab === "documentos" && (
          <div>
            <h2>Documentos e Anamnese (Em breve)</h2>
          </div>
        )}
      </main>
    </div>
  );
}
