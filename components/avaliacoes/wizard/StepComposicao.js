export default function StepComposicao({ styles, formData, setFormData }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>2. Dados Gerais e Composição Corporal</h2>
      
      <div className={styles.grid2}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Peso Atual</label>
          <div className={styles.inputRow}>
            <input 
              type="number" 
              className={styles.input} 
              name="peso"
              placeholder="Ex: 75.5"
              value={formData.peso || ''}
              onChange={handleChange}
            />
            <span className={styles.unit}>kg</span>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Estatura (Altura)</label>
          <div className={styles.inputRow}>
            <input 
              type="number" 
              className={styles.input} 
              name="altura"
              placeholder="Ex: 175"
              value={formData.altura || ''}
              onChange={handleChange}
            />
            <span className={styles.unit}>cm</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#18181b', borderRadius: '8px', border: '1px dashed #3f3f46', textAlign: 'center' }}>
        <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem' }}>
          O IMC e a classificação automática aparecerão aqui após inserir os dados.<br/>
          <span style={{ fontSize: '0.8rem' }}>(Cálculos serão implementados na próxima fase)</span>
        </p>
      </div>
    </div>
  );
}
