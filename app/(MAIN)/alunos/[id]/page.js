"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { alunoSchema } from '../../../../schemas/alunoSchema';
import api from '../../../../services/api';

import StepPersonalData from '../../../../components/alunos/wizard/StepPersonalData';
import StepAddressGoals from '../../../../components/alunos/wizard/StepAddressGoals';
import StepAnamnese from '../../../../components/alunos/wizard/StepAnamnese';
import styles from './alunoDetalhe.module.css';

export default function AlunoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [activeTab, setActiveTab] = useState('dadosGerais');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [historicoAnamneses, setHistoricoAnamneses] = useState([]);

  const methods = useForm({
    resolver: zodResolver(alunoSchema),
    mode: 'onTouched'
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (id) {
      const fetchAluno = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/alunos/${id}`);
          const alunoData = response.data;
          console.log('Fetched aluno data', alunoData);
          console.log('Anamneses:', alunoData.anamneses);
          const anamneses = alunoData.anamneses || [];
          setHistoricoAnamneses(anamneses);
          const ultimaAnamnese = anamneses.length > 0 ? anamneses[0] : null;

          let virtualData = {};
          let cleanObservacoes = ultimaAnamnese?.dadosMedicos?.observacoes || '';
          if (cleanObservacoes.includes('[DADOS COMPLEMENTARES]:')) {
            const parts = cleanObservacoes.split('\n\n[DADOS COMPLEMENTARES]:\n');
            cleanObservacoes = parts[0];
            try {
              virtualData = JSON.parse(parts[1]);
            } catch (e) {}
          }

          // Mapeamento EXATO do DTO do backend para os defaultValues do React Hook Form
          reset({
            nome: alunoData.nome || '',
            email: alunoData.email || '',
            dataNasc: alunoData.dataNasc ? alunoData.dataNasc.split('T')[0] : '',
            matricula: alunoData.matricula || '',
            cpf: alunoData.cpf || '',
            genero: alunoData.genero || '',
            telefone: alunoData.telefone || '',
            endereco: alunoData.endereco || '',
            profissao: alunoData.profissao || '',
            objetivo: alunoData.objetivo || 'SAUDE',
            status: alunoData.status || 'ATIVO',
            observacoes: alunoData.observacoes || '',
            
            // Dados da Anamnese (Hydration Seguro)
            dadosMedicos: { ...(ultimaAnamnese?.dadosMedicos || {}), observacoes: cleanObservacoes },
            habitos: ultimaAnamnese?.habitos || {},
            parq: ultimaAnamnese?.parq || {},
            virtual: virtualData,
            termoAceite: ultimaAnamnese?.termoAceite || false
          });

          console.log('Anamnese carregada:', {
            dadosMedicos: ultimaAnamnese?.dadosMedicos,
            habitos: ultimaAnamnese?.habitos,
            parq: ultimaAnamnese?.parq
          });

        } catch (error) {
          console.error(error);
          toast.error("Não foi possível carregar os dados do aluno.");
          router.push('/alunos');
        } finally {
          setLoading(false);
        }
      };
      fetchAluno();
    }
  }, [id, router, reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    console.log('--- ONSUBMIT TRIGGERED ---');
    console.log('Full form data received:', data);
    try {
      // 1. Construir payload filtrando valores vazios/undefined
      const payload = {
        nome: data.nome,
        email: data.email,
        dataNasc: data.dataNasc ? data.dataNasc : undefined,
        matricula: data.matricula,
        cpf: data.cpf,
        genero: data.genero,
        telefone: data.telefone,
        endereco: data.endereco,
        profissao: data.profissao,
        objetivo: data.objetivo,
        observacoes: data.observacoes,
        status: data.status
      };
      // Remover chaves com undefined ou string vazia
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });
      console.log('PUT payload', payload);
      const putResponse = await api.put(`/alunos/${id}`, payload);
      console.log('PUT response', putResponse);

      // 2. Registrar nova entrada de Anamnese (Histórico Clínico 1:N) somente se houver dados
      const hasAnamneseData =
        (data.dadosMedicos && Object.keys(data.dadosMedicos).length) ||
        (data.habitos && Object.keys(data.habitos).length) ||
        (data.parq && Object.keys(data.parq).length);

      if (hasAnamneseData) {
        const cleanDadosMedicos = { ...(data.dadosMedicos || {}) };
        delete cleanDadosMedicos.id;
        delete cleanDadosMedicos.anamneseId;

        // --- MANIPULAÇÃO DE ESTADO (VIRTUAL FIELDS) ---
        // Empacota todos os campos virtuais em um JSON dentro de observacoes
        if (data.virtual && Object.keys(data.virtual).length > 0) {
          cleanDadosMedicos.observacoes = (cleanDadosMedicos.observacoes || '') + '\n\n[DADOS COMPLEMENTARES]:\n' + JSON.stringify(data.virtual, null, 2);
        }

        const cleanHabitos = { ...(data.habitos || {}) };
        delete cleanHabitos.id;
        delete cleanHabitos.anamneseId;

        const cleanParq = { ...(data.parq || {}) };
        delete cleanParq.id;
        delete cleanParq.anamneseId;

        const postResponse = await api.post(`/alunos/${id}/anamnese`, {
          termoAceite: data.termoAceite,
          dadosMedicos: cleanDadosMedicos,
          habitos: cleanHabitos,
          parq: cleanParq
        });
        console.log('POST response (anamnese)', postResponse);
      } else {
        console.log('Nenhuma anamnese para salvar');
      }


      toast.success("Dados do aluno atualizados com sucesso!");
      
      // Opcional: Voltar para a lista ou recarregar os dados
      // router.push('/alunos');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Ocorreu um erro ao salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#fff' }}>Carregando dados completos do aluno...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Editando Aluno</h1>
        <div className={styles.actions}>
          <button type="button" onClick={() => router.push('/alunos')} className={styles.backButton} disabled={isSaving}>
            Voltar para Lista
          </button>
          <button onClick={handleSubmit(onSubmit, (errors) => {
            console.log('Erros de validação do RHF:', errors);
            toast.error("Preencha os campos corretamente. Verifique se faltou alguma Aba.");
          })} className={styles.saveButton} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </header>

      <div className={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('dadosGerais')} 
          className={activeTab === 'dadosGerais' ? styles.activeTab : ''}
        >
          Dados Gerais e Contato
        </button>
        <button 
          onClick={() => setActiveTab('anamnese')} 
          className={activeTab === 'anamnese' ? styles.activeTab : ''}
        >
          Saúde e Anamnese
        </button>
        <button 
          onClick={() => setActiveTab('historico')} 
          className={activeTab === 'historico' ? styles.activeTab : ''}
        >
          Histórico de Avaliações
        </button>
      </div>

      <main className={styles.content}>
        <FormProvider {...methods}>
          <form id="editForm" onSubmit={handleSubmit(onSubmit)}>
            
            <div style={{ display: activeTab === 'dadosGerais' ? 'block' : 'none' }}>
              {/* Usando os mesmos componentes do fluxo de criação */}
              <div style={{ marginBottom: '2rem', backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '8px' }}>
                <StepPersonalData />
              </div>
              <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '8px' }}>
                <StepAddressGoals />
              </div>
            </div>

            <div style={{ display: activeTab === 'anamnese' ? 'block' : 'none' }}>
              <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px', borderLeft: '4px solid #8a2be2' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Histórico Clínico (1:N)</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#bbb' }}>
                    O aluno possui <strong>{historicoAnamneses.length}</strong> registro(s) de anamnese. 
                    Ao salvar alterações nesta aba, uma nova versão do histórico de saúde será salva para garantir integridade.
                  </p>
                </div>
                <StepAnamnese isEdit={true} />
              </div>
            </div>

          </form>
        </FormProvider>

        {activeTab === 'historico' && (
          <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#888' }}>
            <h2>Histórico Físico</h2>
            <p>Em breve: Módulo de Bioimpedância e Dobras Cutâneas.</p>
          </div>
        )}
      </main>
    </div>
  );
}