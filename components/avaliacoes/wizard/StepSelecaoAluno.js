export default function StepSelecaoAluno({ styles, formData, setFormData }) {
  // Mock data para a busca de alunos
  const mockAlunos = [
    { id: 1, nome: "João Silva", idade: 28, sexo: "M" },
    { id: 2, nome: "Maria Oliveira", idade: 34, sexo: "F" },
    { id: 3, nome: "Carlos Souza", idade: 45, sexo: "M" }
  ];

  const handleSelect = (e) => {
    const alunoId = e.target.value;
    if (!alunoId) return;
    
    const aluno = mockAlunos.find(a => a.id == alunoId);
    if (aluno) {
      setFormData(prev => ({
        ...prev,
        alunoId: aluno.id,
        nome: aluno.nome,
        idade: aluno.idade,
        sexo: aluno.sexo
      }));
    }
  };

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>1. Seleção do Aluno</h2>
      
      <div className={styles.inputGroup} style={{ marginBottom: '2rem' }}>
        <label className={styles.label}>Buscar Aluno Cadastrado</label>
        <select 
          className={styles.input} 
          onChange={handleSelect}
          value={formData.alunoId || ""}
        >
          <option value="">Selecione um aluno...</option>
          {mockAlunos.map(a => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>
        <div style={{ marginTop: '0.5rem' }}>
          <span style={{ color: '#71717a', fontSize: '0.9rem' }}>Ou </span>
          <button style={{ 
            background: 'none', border: 'none', color: '#a855f7', 
            cursor: 'pointer', fontWeight: '500', padding: 0 
          }}>
            + Cadastrar Novo Aluno
          </button>
        </div>
      </div>

      {formData.alunoId && (
        <div style={{ 
          backgroundColor: '#18181b', padding: '1.5rem', 
          borderRadius: '8px', border: '1px solid #27272a' 
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#e4e4e7' }}>Dados Pré-preenchidos</h3>
          <div className={styles.grid3}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nome</label>
              <input type="text" className={styles.input} value={formData.nome || ''} readOnly disabled />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Idade (anos)</label>
              <input type="text" className={styles.input} value={formData.idade || ''} readOnly disabled />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Sexo Biológico</label>
              <input type="text" className={styles.input} value={formData.sexo === 'M' ? 'Masculino' : 'Feminino'} readOnly disabled />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
