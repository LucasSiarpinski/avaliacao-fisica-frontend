"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { alunoSchema } from '../../../../schemas/alunoSchema';
import api from '../../../../services/api';

import StepPersonalData from '../../../../components/alunos/wizard/StepPersonalData';
import StepAddressGoals from '../../../../components/alunos/wizard/StepAddressGoals';
import StepAnamnese from '../../../../components/alunos/wizard/StepAnamnese';
import styles from './wizard.module.css';

const steps = [
  { id: 1, title: 'Dados Pessoais' },
  { id: 2, title: 'Perfil' },
  { id: 3, title: 'Anamnese' }
];

export default function CadastroAlunoWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    resolver: zodResolver(alunoSchema),
    mode: 'onTouched', // Valida o campo ao sair dele
    defaultValues: {
      objetivo: 'SAUDE',
      status: 'ATIVO',
      dadosMedicos: {},
      habitos: {},
      parq: {},
      termoAceite: false
    }
  });

  const { trigger, getValues } = methods;

  const handleNext = async () => {
    // Define quais campos validar baseado na etapa atual
    let fieldsToValidate = [];
    if (currentStep === 0) fieldsToValidate = ['nome', 'email', 'dataNasc', 'cpf', 'telefone'];
    if (currentStep === 1) fieldsToValidate = ['matricula', 'objetivo'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error("Preencha os campos obrigatórios corretamente.");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // 1. Criar o Aluno (Base)
      const alunoResponse = await api.post('/alunos', {
        nome: data.nome,
        email: data.email,
        dataNasc: data.dataNasc,
        matricula: data.matricula,
        cpf: data.cpf,
        genero: data.genero,
        telefone: data.telefone,
        endereco: data.endereco,
        profissao: data.profissao,
        objetivo: data.objetivo,
        observacoes: data.observacoes,
        status: data.status
      });

      const alunoId = alunoResponse.data.id;

      // Lógica de empacotamento dos campos virtuais do Stepper da Anamnese
      const cleanDadosMedicos = { ...(data.dadosMedicos || {}) };
      if (data.virtual && Object.keys(data.virtual).length > 0) {
        cleanDadosMedicos.observacoes = (cleanDadosMedicos.observacoes || '') + '\n\n[DADOS COMPLEMENTARES]:\n' + JSON.stringify(data.virtual, null, 2);
      }

      // 2. Salvar a Anamnese (POST pois agora é 1:N)
      await api.post(`/alunos/${alunoId}/anamnese`, {
        termoAceite: data.termoAceite,
        dadosMedicos: cleanDadosMedicos,
        habitos: data.habitos,
        parq: data.parq
      });

      toast.success('Aluno e Anamnese salvos com sucesso!');
      router.push('/alunos');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Erro ao salvar o cadastro completo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Novo Aluno</h1>
        <p style={{ color: '#aaa' }}>Complete o cadastro em {steps.length} etapas simples.</p>
      </div>

      <div className={styles.stepper}>
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className={`${styles.stepIndicator} ${currentStep === index ? styles.active : ''} ${currentStep > index ? styles.completed : ''}`}
            title={step.title}
          >
            {currentStep > index ? '✓' : step.id}
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className={styles.formContent}>
          
          {currentStep === 0 && <StepPersonalData />}
          {currentStep === 1 && <StepAddressGoals />}
          {currentStep === 2 && <StepAnamnese />}

          <div className={styles.actions}>
            <button 
              type="button" 
              className={styles.btnBack} 
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
            >
              Voltar
            </button>

            {currentStep < steps.length - 1 ? (
              <button type="button" className={styles.btnNext} onClick={handleNext}>
                Avançar
              </button>
            ) : (
              <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
