// app/(main)/alunos/[id]/page.js

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import styles from './alunoDetalhe.module.css';

export default function AlunoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const isCreating = id === 'novo';

  const [aluno, setAluno] = useState({
    nome: '',
    email: '',
    dataNasc: '',
    matricula: '',
    cpf: '',
    genero: '',
    telefone: '',
    observacoes: ''
  });
  const [activeTab, setActiveTab] = useState('dadosPessoais');
  const [loading, setLoading] = useState(!isCreating);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isCreating && id) {
      const fetchAluno = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/alunos/${id}`);
          const dataFormatada = response.data.dataNasc ? response.data.dataNasc.split('T')[0] : '';
          setAluno({ ...response.data, dataNasc: dataFormatada });
        } catch (error) {
          toast.error("Não foi possível carregar os dados do aluno.");
          router.push('/alunos');
        } finally {
          setLoading(false);
        }
      };
      fetchAluno();
    }
  }, [id, isCreating, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAluno(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isCreating) {
        const response = await api.post('/alunos', aluno);
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

  if (loading) {
    return <div>Carregando dados do aluno...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{isCreating ? "Cadastrar Novo Aluno" : `Editando: ${aluno.nome}`}</h1>
        <div className={styles.actions}>
          <button onClick={() => router.push('/alunos')} className={styles.backButton} disabled={isSaving}>
            Voltar para Lista
          </button>
          <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      <div className={styles.tabContainer}>
        <button onClick={() => setActiveTab('dadosPessoais')} className={activeTab === 'dadosPessoais' ? styles.activeTab : ''}>Dados Pessoais</button>
        <button onClick={() => setActiveTab('avaliacoes')} disabled={isCreating} className={activeTab === 'avaliacoes' ? styles.activeTab : ''}>Histórico de Avaliações</button>
        <button onClick={() => setActiveTab('documentos')} disabled={isCreating} className={activeTab === 'documentos' ? styles.activeTab : ''}>Documentos</button>
      </div>

      <main className={styles.content}>
        {activeTab === 'dadosPessoais' && (
          <div className={styles.formGrid}>

            {/* --- CAMPO DE ID ADICIONADO AQUI --- */}
            {/* Renderiza condicionalmente: só aparece se NÃO for 'novo' */}
            {!isCreating && (
              <div className={styles.formGroup}>
                <label htmlFor="alunoId">ID do Aluno</label>
                <input
                  id="alunoId"
                  name="id" // O 'name' não é crucial aqui, pois é desabilitado
                  value={aluno.id || ''} // Mostra o ID do estado 'aluno'
                  disabled // Torna o campo não editável
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="nome">Nome Completo *</label>
              <input id="nome" name="nome" value={aluno.nome} onChange={handleChange} required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input id="email" name="email" type="email" value={aluno.email} onChange={handleChange} required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dataNasc">Data de Nascimento *</label>
              <input id="dataNasc" name="dataNasc" type="date" value={aluno.dataNasc || ''} onChange={handleChange} required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="matricula">Matrícula *</label>
              <input id="matricula" name="matricula" value={aluno.matricula} onChange={handleChange} required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cpf">CPF</label>
              <input id="cpf" name="cpf" value={aluno.cpf || ''} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefone">Telefone</label>
              <input id="telefone" name="telefone" value={aluno.telefone || ''} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="genero">Gênero</label>
              <input id="genero" name="genero" value={aluno.genero || ''} onChange={handleChange} />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="observacoes">Observações</label>
              <textarea id="observacoes" name="observacoes" value={aluno.observacoes || ''} onChange={handleChange}></textarea>
            </div>

          </div>
        )}

        {activeTab === 'avaliacoes' && ( <div><h2>Histórico de Avaliações (Em breve)</h2></div> )}
        {activeTab === 'documentos' && ( <div><h2>Documentos e Anamnese (Em breve)</h2></div> )}
      </main>
    </div>
  );
}