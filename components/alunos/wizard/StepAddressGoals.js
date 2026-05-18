import { useFormContext } from 'react-hook-form';
import styles from '../../../app/(MAIN)/alunos/cadastro/wizard.module.css';

export default function StepAddressGoals() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className={styles.formContent}>
      <h2>2. Perfil e Endereço</h2>
      
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Matrícula *</label>
          <input type="text" {...register('matricula')} placeholder="Gerada automaticamente ou manual" />
          {errors.matricula && <span className={styles.errorText}>{errors.matricula.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Endereço</label>
          <input type="text" {...register('endereco')} placeholder="Rua, Número, Bairro" />
          {errors.endereco && <span className={styles.errorText}>{errors.endereco.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Profissão</label>
          <input type="text" {...register('profissao')} placeholder="Ex: Engenheiro, Estudante" />
          {errors.profissao && <span className={styles.errorText}>{errors.profissao.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Objetivo Principal *</label>
          <select {...register('objetivo')}>
            <option value="SAUDE">Saúde e Bem Estar</option>
            <option value="EMAGRECIMENTO">Emagrecimento</option>
            <option value="HIPERTROFIA">Hipertrofia</option>
            <option value="CONDICIONAMENTO">Condicionamento Físico</option>
            <option value="PERFORMANCE">Performance Esportiva</option>
          </select>
          {errors.objetivo && <span className={styles.errorText}>{errors.objetivo.message}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Observações Gerais</label>
        <textarea 
          {...register('observacoes')} 
          placeholder="Alguma anotação importante sobre o aluno..."
          rows={4}
        />
        {errors.observacoes && <span className={styles.errorText}>{errors.observacoes.message}</span>}
      </div>
    </div>
  );
}
