import { useFormContext } from 'react-hook-form';
import styles from '../../../app/(MAIN)/alunos/cadastro/wizard.module.css';

export default function StepPersonalData() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className={styles.formContent}>
      <h2>1. Dados Pessoais</h2>
      
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Nome Completo *</label>
          <input type="text" {...register('nome')} placeholder="Ex: João da Silva" />
          {errors.nome && <span className={styles.errorText}>{errors.nome.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>E-mail *</label>
          <input type="email" {...register('email')} placeholder="joao@exemplo.com" />
          {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Data de Nascimento *</label>
          <input type="date" {...register('dataNasc')} />
          {errors.dataNasc && <span className={styles.errorText}>{errors.dataNasc.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>CPF</label>
          <input type="text" {...register('cpf')} placeholder="000.000.000-00" />
          {errors.cpf && <span className={styles.errorText}>{errors.cpf.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Gênero</label>
          <select {...register('genero')}>
            <option value="">Selecione...</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
            <option value="OUTRO">Outro</option>
          </select>
          {errors.genero && <span className={styles.errorText}>{errors.genero.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Telefone</label>
          <input type="text" {...register('telefone')} placeholder="(00) 00000-0000" />
          {errors.telefone && <span className={styles.errorText}>{errors.telefone.message}</span>}
        </div>
      </div>
    </div>
  );
}
