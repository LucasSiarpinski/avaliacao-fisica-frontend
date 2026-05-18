"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from './wizard.module.css';

// Importando as Etapas (Componentes Modulares)
import StepSelecaoAluno from '../../../../components/avaliacoes/wizard/StepSelecaoAluno';
import StepComposicao from '../../../../components/avaliacoes/wizard/StepComposicao';
import StepPerimetros from '../../../../components/avaliacoes/wizard/StepPerimetros';
import StepDobras from '../../../../components/avaliacoes/wizard/StepDobras';
import StepTestes from '../../../../components/avaliacoes/wizard/StepTestes';
import StepResultados from '../../../../components/avaliacoes/wizard/StepResultados';

const STEPS = [
  { id: 1, label: 'Aluno' },
  { id: 2, label: 'Composição' },
  { id: 3, label: 'Perímetros' },
  { id: 4, label: 'Dobras' },
  { id: 5, label: 'Testes Func.' },
  { id: 6, label: 'Resultados' }
];

export default function NovaAvaliacaoWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Mock de Salvamento Final
      toast.success("Avaliação salva com sucesso! (Fluxo MOCKADO)");
      router.push('/home');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.push('/home');
    }
  };

  // Renderiza a etapa atual
  const renderStep = () => {
    switch(currentStep) {
      case 1: return <StepSelecaoAluno styles={styles} formData={formData} setFormData={setFormData} />;
      case 2: return <StepComposicao styles={styles} formData={formData} setFormData={setFormData} />;
      case 3: return <StepPerimetros styles={styles} formData={formData} setFormData={setFormData} />;
      case 4: return <StepDobras styles={styles} formData={formData} setFormData={setFormData} />;
      case 5: return <StepTestes styles={styles} formData={formData} setFormData={setFormData} />;
      case 6: return <StepResultados styles={styles} formData={formData} />;
      default: return null;
    }
  };

  return (
    <div className={styles.container}>
      
      {/* Header do Wizard */}
      <header className={styles.header}>
        <h1 className={styles.title}>Nova Avaliação Física</h1>
        <p className={styles.subtitle}>Siga o passo a passo para registrar as métricas do seu aluno.</p>
      </header>

      {/* Indicador de Progresso (Stepper) */}
      <div className={styles.stepper}>
        {STEPS.map((step) => {
          let stepClass = styles.step;
          if (step.id === currentStep) stepClass += ` ${styles.stepActive}`;
          if (step.id < currentStep) stepClass += ` ${styles.stepCompleted}`;

          return (
            <div key={step.id} className={stepClass}>
              <div className={styles.stepIcon}>
                {step.id < currentStep ? '✓' : step.id}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Área Principal de Conteúdo */}
      <main className={styles.contentArea}>
        {renderStep()}
      </main>

      {/* Controles Base */}
      <footer className={styles.controls}>
        <button 
          className={`${styles.btn} ${styles.btnBack}`} 
          onClick={handleBack}
        >
          {currentStep === 1 ? 'Cancelar' : '← Voltar'}
        </button>

        <button 
          className={`${styles.btn} ${styles.btnNext}`} 
          onClick={handleNext}
          disabled={currentStep === 1 && !formData.alunoId} // Trava navegação se não selecionou aluno
        >
          {currentStep === STEPS.length ? 'Finalizar e Salvar' : 'Avançar →'}
        </button>
      </footer>

    </div>
  );
}
