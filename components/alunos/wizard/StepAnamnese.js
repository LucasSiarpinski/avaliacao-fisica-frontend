import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import styles from './anamneseWizard.module.css';

const ToggleSwitch = ({ name, label, register }) => (
  <div className={styles.switchGroup}>
    <span className={styles.switchLabel}>{label}</span>
    <label className={styles.switch}>
      <input type="checkbox" {...register(name)} />
      <span className={styles.slider}></span>
    </label>
  </div>
);

const ChipSelect = ({ options, name, setValue, watchValue }) => (
  <div className={styles.chipGroup}>
    {options.map((opt) => (
      <div
        key={opt.value}
        className={`${styles.chip} ${watchValue === opt.value ? styles.selected : ''}`}
        onClick={() => setValue(name, opt.value)}
      >
        {opt.label}
      </div>
    ))}
  </div>
);

const MultiChipSelect = ({ options, name, setValue, watchValues = [] }) => {
  const toggle = (val) => {
    const current = Array.isArray(watchValues) ? watchValues : [];
    if (current.includes(val)) {
      setValue(name, current.filter(v => v !== val));
    } else {
      setValue(name, [...current, val]);
    }
  };
  return (
    <div className={styles.chipGroup}>
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`${styles.chip} ${watchValues?.includes(opt.value) ? styles.selected : ''}`}
          onClick={() => toggle(opt.value)}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
};

export default function StepAnamnese({ isEdit = false }) {
  const [currentStep, setCurrentStep] = useState(1);
  const { register, setValue, control, formState: { errors } } = useFormContext();

  // Watchers para lógica condicional
  const dadosMedicos = useWatch({ control, name: 'dadosMedicos' }) || {};
  const habitos = useWatch({ control, name: 'habitos' }) || {};
  const parq = useWatch({ control, name: 'parq' }) || {};
  const virtual = useWatch({ control, name: 'virtual' }) || {};

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Lógica do PAR-Q
  const isParqPositive = [
    parq.pergunta1, parq.pergunta2, parq.pergunta3, 
    parq.pergunta4, parq.pergunta5, parq.pergunta6, parq.pergunta7
  ].some(Boolean);

  const steps = [
    { id: 1, title: 'Saúde Geral' },
    { id: 2, title: 'PAR-Q' },
    { id: 3, title: 'Histórico Clínico' },
    { id: 4, title: 'Estilo de Vida' },
    { id: 5, title: 'Prescrição' }
  ];

  const renderSaudeGeral = () => (
    <div className={styles.card}>
      {isEdit && <h3 className={styles.cardTitle}>1. Saúde Geral</h3>}
      {!isEdit && <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>Mapeamento de patologias crônicas.</p>}
      
      <ToggleSwitch label="Hipertensão Arterial" name="dadosMedicos.hipertensao" register={register} />
      {dadosMedicos.hipertensao && (
        <div className={styles.subBlock}>
          <label>Medicamentos para Hipertensão</label>
          <input type="text" className={styles.inputField} {...register('virtual.med_hipertensao')} placeholder="Ex: Losartana 50mg" />
        </div>
      )}

      <ToggleSwitch label="Diabetes Mellitus" name="dadosMedicos.diabetes" register={register} />
      {dadosMedicos.diabetes && (
        <div className={styles.subBlock}>
          <label>Detalhes/Medicamentos</label>
          <input type="text" className={styles.inputField} {...register('virtual.med_diabetes')} placeholder="Ex: Insulina, Metformina" />
        </div>
      )}

      <ToggleSwitch label="Cardiopatias (Problema Cardíaco)" name="dadosMedicos.problemaCardiaco" register={register} />
      {dadosMedicos.problemaCardiaco && (
        <div className={styles.subBlock}>
          <label>Detalhes do quadro clínico</label>
          <input type="text" className={styles.inputField} {...register('virtual.detalhe_cardiaco')} placeholder="Descreva brevemente" />
        </div>
      )}

      <ToggleSwitch label="Colesterol Alto / Dislipidemia" name="virtual.colesterol" register={register} />
      <ToggleSwitch label="Doenças Respiratórias (Asma, Bronquite)" name="virtual.respiratorias" register={register} />
      <ToggleSwitch label="Problemas Articulares/Ósseos" name="virtual.articulares" register={register} />
    </div>
  );

  const renderParq = () => (
    <div className={styles.card}>
      {isEdit && <h3 className={styles.cardTitle}>2. PAR-Q (Questionário de Prontidão)</h3>}
      {!isEdit && <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Questionário de Prontidão para Atividade Física.</p>}
      
      <ToggleSwitch label="Algum médico já disse que você possui um problema de coração e que só deve realizar atividade física supervisionado?" name="parq.pergunta1" register={register} />
      <ToggleSwitch label="Você sente dores no peito quando está em repouso / sem realizar atividade física?" name="parq.pergunta2" register={register} />
      <ToggleSwitch label="No último mês, você sentiu dores no peito quando praticava atividade física?" name="parq.pergunta3" register={register} />
      <ToggleSwitch label="Você perde o equilíbrio devido a tonturas ou alguma vez perdeu a consciência/desmaiou?" name="parq.pergunta4" register={register} />
      <ToggleSwitch label="Você possui algum problema ósseo ou articular que poderia piorar com a atividade física?" name="parq.pergunta5" register={register} />
      <ToggleSwitch label="Você toma atualmente algum medicamento de uso contínuo para pressão arterial ou problema de coração?" name="parq.pergunta6" register={register} />
      <ToggleSwitch label="Sabe de alguma outra razão médica pela qual você não deva realizar atividade física?" name="parq.pergunta7" register={register} />

      {isParqPositive ? (
        <div className={styles.parqAlert}>
          <strong>⚠️ Atenção: Risco Identificado</strong>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>O aluno respondeu 'SIM' a uma ou mais perguntas do PAR-Q. Recomenda-se avaliação médica antes de iniciar os treinos.</p>
          <label style={{ color: '#fff', marginTop: '0.5rem' }}>Observação Clínica Obrigatória *</label>
          <textarea className={styles.inputField} rows="2" {...register('virtual.parq_observacao')} placeholder="Justifique a liberação ou restrição..."></textarea>
          {errors.virtual?.parq_observacao && (
            <span style={{ color: '#ff4d4f', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
              {errors.virtual.parq_observacao.message}
            </span>
          )}
        </div>
      ) : (
        <div className={styles.parqSuccess}>
          <span>✅</span> Apto para atividade física sem restrições graves pelo PAR-Q.
        </div>
      )}
    </div>
  );

  const renderHistorico = () => (
    <div className={styles.card}>
      {isEdit && <h3 className={styles.cardTitle} style={{ border: 'none', padding: 0 }}>3. Histórico Clínico</h3>}
      <div className={styles.formGroup} style={isEdit ? {marginTop: '1rem'} : {}}>
        <label className={styles.cardTitle}>Lesões Prévias (Musculares/Ligamentares)</label>
        <textarea className={styles.inputField} rows="2" {...register('dadosMedicos.lesoes')} placeholder="Ex: Ruptura LCA joelho direito, tendinite ombro..." style={{marginTop: '0.5rem'}}></textarea>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.cardTitle}>Cirurgias e Internações</label>
        <textarea className={styles.inputField} rows="2" {...register('dadosMedicos.cirurgias')} placeholder="Ex: Apendicite em 2018, Artroscopia em 2020..." style={{marginTop: '0.5rem'}}></textarea>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.cardTitle}>Fraturas, Placas ou Pinos</label>
        <textarea className={styles.inputField} rows="2" {...register('virtual.fraturas')} placeholder="Possui alguma sequela de fratura?" style={{marginTop: '0.5rem'}}></textarea>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.cardTitle}>Dores Recorrentes</label>
        <textarea className={styles.inputField} rows="2" {...register('virtual.dores')} placeholder="Ex: Dor lombar ao ficar muito tempo em pé" style={{marginTop: '0.5rem'}}></textarea>
      </div>
    </div>
  );

  const renderEstiloVida = () => (
    <div className={styles.card}>
      {isEdit && <h3 className={styles.cardTitle} style={{ border: 'none', padding: 0 }}>4. Estilo de Vida e Hábitos</h3>}
      <div className={styles.formGroup} style={{marginBottom: '1rem', marginTop: isEdit ? '1rem' : 0}}>
        <label className={styles.cardTitle} style={{border: 'none'}}>Consumo de Álcool</label>
        <ChipSelect 
          name="virtual.consumoAlcool" 
          setValue={setValue} 
          watchValue={virtual.consumoAlcool}
          options={[
            { label: 'Não consome', value: 'NAO' },
            { label: 'Socialmente', value: 'SOCIAL' },
            { label: 'Frequentemente', value: 'FREQUENTE' }
          ]} 
        />
      </div>

      <div className={styles.formGroup} style={{marginBottom: '1rem'}}>
        <label className={styles.cardTitle} style={{border: 'none'}}>Qualidade do Sono</label>
        <ChipSelect 
          name="habitos.qualidadeSono" 
          setValue={setValue} 
          watchValue={habitos.qualidadeSono}
          options={[
            { label: 'Péssimo', value: 'PESSIMO' },
            { label: 'Ruim', value: 'RUIM' },
            { label: 'Regular', value: 'REGULAR' },
            { label: 'Bom', value: 'BOM' },
            { label: 'Excelente', value: 'EXCELENTE' }
          ]} 
        />
      </div>

      <div className={styles.formGroup} style={{marginBottom: '1rem'}}>
        <label className={styles.cardTitle} style={{border: 'none'}}>Nível de Estresse Diário</label>
        <ChipSelect 
          name="habitos.nivelEstresse" 
          setValue={setValue} 
          watchValue={habitos.nivelEstresse}
          options={[
            { label: 'Baixo', value: 'BAIXO' },
            { label: 'Moderado', value: 'MODERADO' },
            { label: 'Alto', value: 'ALTO' }
          ]} 
        />
      </div>

      <div className={styles.formGroup} style={{marginBottom: '1rem'}}>
        <label className={styles.cardTitle} style={{border: 'none'}}>Frequência de Treino Atual</label>
        <ChipSelect 
          name="virtual.freqTreino" 
          setValue={setValue} 
          watchValue={virtual.freqTreino}
          options={[
            { label: '0 vezes (Sedentário)', value: '0' },
            { label: '1 a 2 vezes', value: '1_2' },
            { label: '3 a 5 vezes', value: '3_5' },
            { label: 'Mais de 5 vezes', value: '5_PLUS' }
          ]} 
        />
      </div>

      <ToggleSwitch label="É Fumante?" name="habitos.fumante" register={register} />
    </div>
  );

  const renderPrescricao = () => (
    <div className={styles.card}>
      {isEdit && <h3 className={styles.cardTitle} style={{ border: 'none', padding: 0 }}>5. Prescrição e Objetivos</h3>}
      <div className={styles.formGroup} style={isEdit ? {marginTop: '1rem'} : {}}>
        <label className={styles.cardTitle} style={{border: 'none'}}>Objetivos Principais (Selecione um ou mais)</label>
        <MultiChipSelect 
          name="virtual.objetivosMulti" 
          setValue={setValue} 
          watchValues={virtual.objetivosMulti}
          options={[
            { label: 'Hipertrofia', value: 'HIPERTROFIA' },
            { label: 'Emagrecimento', value: 'EMAGRECIMENTO' },
            { label: 'Condicionamento', value: 'CONDICIONAMENTO' },
            { label: 'Saúde/Qualidade', value: 'SAUDE' },
            { label: 'Performance', value: 'PERFORMANCE' },
            { label: 'Reabilitação', value: 'REABILITACAO' }
          ]} 
        />
      </div>

      <div className={styles.formGroup} style={{marginTop: '1.5rem'}}>
        <label className={styles.cardTitle}>Exercícios Proibidos / Vetados</label>
        <textarea className={styles.inputField} rows="2" {...register('virtual.exerciciosProibidos')} placeholder="Ex: Agachamento profundo, corrida em esteira..." style={{marginTop: '0.5rem'}}></textarea>
      </div>

      <div className={styles.formGroup} style={{marginTop: '1.5rem'}}>
        <label className={styles.cardTitle}>Restrições Físicas Gerais</label>
        <textarea className={styles.inputField} rows="2" {...register('dadosMedicos.restricoes')} placeholder="Restrições que o instrutor deve saber..." style={{marginTop: '0.5rem'}}></textarea>
      </div>

      <div className={styles.formGroup} style={{marginTop: '1.5rem'}}>
        <label className={styles.cardTitle}>Observações Finais do Profissional</label>
        <textarea className={styles.inputField} rows="3" {...register('dadosMedicos.observacoes')} placeholder="Detalhes adicionais da avaliação..." style={{marginTop: '0.5rem'}}></textarea>
      </div>

      {/* TERMO DE ACEITE */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #444' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer' }}>
          <input type="checkbox" {...register('termoAceite')} style={{ marginTop: '0.2rem', transform: 'scale(1.2)' }} />
          <div>
            <strong>Declaração de Responsabilidade *</strong>
            <p style={{ fontSize: '0.85rem', color: '#bbb', margin: '0.3rem 0 0 0' }}>
              Declaro que as informações prestadas são verdadeiras e assumo total responsabilidade por omitir dados relevantes.
            </p>
          </div>
        </label>
        {errors.termoAceite && <span style={{ color: '#ff4d4f', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>{errors.termoAceite.message}</span>}
      </div>
    </div>
  );

  // Se for modo de Edição (isEdit = true), renderiza TUDO de uma vez, sem stepper
  if (isEdit) {
    return (
      <div className={styles.container} style={{ gap: '2rem', backgroundColor: 'transparent', padding: '0.5rem' }}>
        {renderSaudeGeral()}
        {renderParq()}
        {renderHistorico()}
        {renderEstiloVida()}
        {renderPrescricao()}
      </div>
    );
  }

  // Se for modo de Criação (Wizard)
  return (
    <div className={styles.container}>
      {/* Header do Stepper Interno */}
      <div className={styles.stepperHeader}>
        {steps.map((step) => (
          <div key={step.id} className={`${styles.stepIndicator} ${currentStep === step.id ? styles.active : ''} ${currentStep > step.id ? styles.completed : ''}`}>
            <div className={styles.stepCircle}>{currentStep > step.id ? '✓' : step.id}</div>
            <span style={{ display: 'none' }}>{step.title}</span>
          </div>
        ))}
      </div>

      <h2 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
        {steps[currentStep - 1].title}
      </h2>

      <div className={styles.stepContent}>
        {currentStep === 1 && renderSaudeGeral()}
        {currentStep === 2 && renderParq()}
        {currentStep === 3 && renderHistorico()}
        {currentStep === 4 && renderEstiloVida()}
        {currentStep === 5 && renderPrescricao()}
      </div>

      {/* Navegação do Stepper */}
      <div className={styles.navButtons}>
        {currentStep > 1 ? (
          <button type="button" onClick={prevStep} className={styles.btnBack}>&larr; Voltar</button>
        ) : <div></div>}
        
        {currentStep < 5 ? (
          <button type="button" onClick={nextStep} className={styles.btnNext}>Próxima Etapa &rarr;</button>
        ) : (
          <span style={{ color: '#aaa', fontSize: '0.9rem', alignSelf: 'center' }}>Revise os dados e clique em "Salvar" no fluxo principal.</span>
        )}
      </div>

    </div>
  );
}
