export default function StepTestes({ styles, formData, setFormData }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      testes: {
        ...(prev.testes || {}),
        [name]: value
      }
    }));
  };

  const testes = formData.testes || {};

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>5. Testes Funcionais e Neuromotores</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Flexibilidade */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#e4e4e7', margin: '0 0 1rem 0' }}>Flexibilidade</h3>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Banco de Wells (Sentar e Alcançar)</label>
              <div className={styles.inputRow}>
                <input 
                  type="number" 
                  className={styles.input} 
                  name="bancoWells"
                  placeholder="Ex: 28"
                  value={testes.bancoWells || ''}
                  onChange={handleChange}
                />
                <span className={styles.unit}>cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resistência Muscular Localizada (RML) */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#e4e4e7', margin: '0 0 1rem 0' }}>Resistência Muscular</h3>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Abdominal (1 minuto)</label>
              <div className={styles.inputRow}>
                <input 
                  type="number" 
                  className={styles.input} 
                  name="abdominal1min"
                  placeholder="Ex: 40"
                  value={testes.abdominal1min || ''}
                  onChange={handleChange}
                />
                <span className={styles.unit}>reps</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Flexão de Braço</label>
              <div className={styles.inputRow}>
                <input 
                  type="number" 
                  className={styles.input} 
                  name="flexaoBraco"
                  placeholder="Ex: 25"
                  value={testes.flexaoBraco || ''}
                  onChange={handleChange}
                />
                <span className={styles.unit}>reps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cardiorrespiratório */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#e4e4e7', margin: '0 0 1rem 0' }}>Cardiorrespiratório (VO2)</h3>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Teste Escolhido</label>
              <select className={styles.input} name="testeCardio" value={testes.testeCardio || ''} onChange={handleChange}>
                <option value="">Selecione o protocolo...</option>
                <option value="COOPER">Cooper (12 min)</option>
                <option value="ROCKPORT">Caminhada de Rockport</option>
                <option value="ASTRAND">Cicloergômetro Astrand</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Distância ou Tempo atingido</label>
              <input 
                type="text" 
                className={styles.input} 
                name="cardioDesempenho"
                placeholder="Ex: 2400m ou 15:30"
                value={testes.cardioDesempenho || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
