export default function StepResultados({ styles, formData }) {
  // Dados Mockados para apresentação da interface (Dashboard Final)
  const mockResultados = {
    imc: 24.2,
    imcClassificacao: "Peso Normal",
    gorduraCorporal: 18.5,
    gorduraClassificacao: "Bom",
    massaMagraKg: 61.5,
    massaGordaKg: 14.0,
    pesoIdeal: 72.0
  };

  return (
    <div className={styles.formSection}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#fff' }}>Resultados da Avaliação</h2>
        <p style={{ color: '#a1a1aa', margin: 0 }}>Validação de interface (Cálculos MOCKADOS)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Card IMC */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a', textAlign: 'center' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>IMC</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', margin: '0 0 0.5rem 0' }}>{mockResultados.imc}</p>
          <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '500' }}>
            {mockResultados.imcClassificacao}
          </span>
        </div>

        {/* Card Gordura */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a', textAlign: 'center' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>% de Gordura Corporal</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', margin: '0 0 0.5rem 0' }}>{mockResultados.gorduraCorporal}%</p>
          <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '500' }}>
            {mockResultados.gorduraClassificacao}
          </span>
        </div>

        {/* Card Peso Ideal */}
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a', textAlign: 'center' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Peso Ideal Estimado</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', margin: '0 0 0.5rem 0' }}>{mockResultados.pesoIdeal} <span style={{fontSize: '1rem', color: '#a1a1aa'}}>kg</span></p>
        </div>
      </div>

      {/* Composição Corporal Detalhada */}
      <div style={{ backgroundColor: '#09090b', padding: '2rem', borderRadius: '12px', border: '1px solid #3f3f46' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#e4e4e7', margin: '0 0 1.5rem 0' }}>Composição Corporal (kg)</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#a1a1aa' }}>Massa Magra</span>
              <strong style={{ color: '#fff' }}>{mockResultados.massaMagraKg} kg</strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '81.5%', height: '100%', backgroundColor: '#3b82f6' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#a1a1aa' }}>Massa Gorda</span>
              <strong style={{ color: '#fff' }}>{mockResultados.massaGordaKg} kg</strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '18.5%', height: '100%', backgroundColor: '#ef4444' }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
