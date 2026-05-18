export default function StepPerimetros({ styles, formData, setFormData }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      perimetros: {
        ...(prev.perimetros || {}),
        [name]: value
      }
    }));
  };

  const perimetros = formData.perimetros || {};

  const InputPerimetro = ({ label, name }) => (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
        <input 
          type="number" 
          className={styles.input} 
          name={name}
          placeholder="0.0"
          value={perimetros[name] || ''}
          onChange={handleChange}
        />
        <span className={styles.unit}>cm</span>
      </div>
    </div>
  );

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>3. Perímetros e Circunferências</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Tronco */}
        <div>
          <h3 style={{ fontSize: '1rem', color: '#e4e4e7', marginBottom: '1rem' }}>Tronco</h3>
          <div className={styles.grid3}>
            <InputPerimetro label="Tórax" name="torax" />
            <InputPerimetro label="Cintura" name="cintura" />
            <InputPerimetro label="Abdômen" name="abdomen" />
            <InputPerimetro label="Quadril" name="quadril" />
            <InputPerimetro label="Pescoço" name="pescoco" />
          </div>
        </div>

        {/* Membros Superiores */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1rem', color: '#e4e4e7', marginBottom: '1rem' }}>Membros Superiores</h3>
          <div className={styles.grid2} style={{ gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <strong style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Lado Direito</strong>
              <InputPerimetro label="Braço Relaxado (D)" name="bracoRelaxadoDir" />
              <InputPerimetro label="Braço Contraído (D)" name="bracoContraidoDir" />
              <InputPerimetro label="Antebraço (D)" name="antebracoDir" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <strong style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Lado Esquerdo</strong>
              <InputPerimetro label="Braço Relaxado (E)" name="bracoRelaxadoEsq" />
              <InputPerimetro label="Braço Contraído (E)" name="bracoContraidoEsq" />
              <InputPerimetro label="Antebraço (E)" name="antebracoEsq" />
            </div>
          </div>
        </div>

        {/* Membros Inferiores */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1rem', color: '#e4e4e7', marginBottom: '1rem' }}>Membros Inferiores</h3>
          <div className={styles.grid2} style={{ gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <strong style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Lado Direito</strong>
              <InputPerimetro label="Coxa Medial (D)" name="coxaMedialDir" />
              <InputPerimetro label="Panturrilha (D)" name="panturrilhaDir" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <strong style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Lado Esquerdo</strong>
              <InputPerimetro label="Coxa Medial (E)" name="coxaMedialEsq" />
              <InputPerimetro label="Panturrilha (E)" name="panturrilhaEsq" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
