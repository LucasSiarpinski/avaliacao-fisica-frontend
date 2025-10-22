// app/alunos/page.js

"use client";

import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Importe se precisar de navegação

// --- DADOS MOCK (Serão substituídos pela chamada da API no backend) ---
const mockAlunos = [
    { id: 1, nome: "Ana Silva", matricula: "1001", avaliacoes: 3, data: "2025-10-15" },
    { id: 2, nome: "Bruno Costa", matricula: "1002", avaliacoes: 1, data: "2025-09-20" },
    { id: 3, nome: "Carlos Souza", matricula: "1003", avaliacoes: 0, data: "2025-10-01" },
];

export default function AlunosPage() {
    const [alunos, setAlunos] = useState(mockAlunos);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Lógica de busca
    const filteredAlunos = alunos.filter(aluno =>
        aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.matricula.includes(searchTerm)
    );

    // Lógica para ABRIR o modal de cadastro/edição
    const handleCreateEdit = (aluno = null) => {
        // Implementar lógica de preenchimento do formulário se for edição
        setIsModalOpen(true);
    };

    // Lógica para EXCLUIR (será uma chamada de API)
    const handleDelete = (id) => {
        if (confirm("Tem certeza que deseja excluir este aluno?")) {
            setAlunos(alunos.filter(a => a.id !== id));
            // Chamada de API para o backend será feita aqui
        }
    };
    
    // Lógica para INICIAR AVALIAÇÃO (Navegação para a próxima rota)
    const handleStartEvaluation = (id) => {
        // Implementar router.push(`/avaliacao/${id}`);
        console.log(`Iniciando avaliação para o aluno ID: ${id}`);
    };

    return (
        <div className="crud-page-wrapper">
            <main className="crud-main-content">
                <div className="crud-header">
                    <h1 className="crud-title">Gerenciamento de Alunos</h1>
                    
                    <div className="crud-actions">
                        {/* Botão de Cadastro */}
                        <button 
                            onClick={() => handleCreateEdit(null)} 
                            className="create-button"
                        >
                            + Novo Aluno
                        </button>
                        
                        {/* Campo de Busca */}
                        <input
                            type="text"
                            placeholder="Buscar por nome ou matrícula..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabela de Alunos */}
                <div className="table-container">
                    <table className="alunos-table">
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Nome Completo</th>
                                <th>Avaliações</th>
                                <th>Última Avaliação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAlunos.length > 0 ? (
                                filteredAlunos.map((aluno) => (
                                    <tr key={aluno.id}>
                                        <td>{aluno.matricula}</td>
                                        <td>{aluno.nome}</td>
                                        <td>{aluno.avaliacoes}</td>
                                        <td>{aluno.avaliacoes > 0 ? aluno.data : 'N/A'}</td>
                                        <td className="action-buttons-cell">
                                            <button onClick={() => handleStartEvaluation(aluno.id)} className="action-btn-primary">
                                                Avaliar
                                            </button>
                                            <button onClick={() => handleCreateEdit(aluno)} className="action-btn-secondary">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(aluno.id)} className="action-btn-danger">
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-results">Nenhum aluno encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
            
            {/* Modal de Cadastro/Edição (A ser implementado) */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{aluno ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</h2>
                        {/* Formulário de Cadastro Simples */}
                        <p>Formulário de cadastro/edição aqui...</p>
                        <button onClick={() => setIsModalOpen(false)}>Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
}