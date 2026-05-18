export default function StepDobras({ styles, formData, setFormData }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dobras: {
        ...(prev.dobras || {}),
        [name]: value
      }
    }));
  };

  const dobras = formData.dobras || {};

  const InputDobra = ({ label, name }) => (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
        <input 
          type="number" 
          className={styles.input} 
          name={name}
          placeholder="0.0"
          value={dobras[name] || ''}
          onChange={handleChange}
        />
        <span className={styles.unit}>mm</span>
      </div>
    </div>
  );

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>4. Dobras Cutâneas</h2>
      <p style={{ color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Insira os valores em milímetros (mm). O protocolo de cálculo (ex: Pollock 7 dobras) será aplicado na próxima tela.
      </p>

      <div className={styles.grid3}>
        <InputDobra label="Peitoral" name="peitoral" />
        <InputDobra label="Axilar Média" name="axilarMedia" />
        <InputDobra label="Tríceps" name="triceps" />
        <InputDobra label="Bíceps" name="biceps" />
        <InputDobra label="Subescapular" name="subescapular" />
        <InputDobra label="Suprailíaca" name="suprailiaca" />
        <InputDobra label="Abdominal" name="abdominal" />
        <InputDobra label="Coxa Medial" name="coxaMedial" />
        <InputDobra label="Panturrilha Medial" name="panturrilhaMedial" />
      </div>
    </div>
  );
}
