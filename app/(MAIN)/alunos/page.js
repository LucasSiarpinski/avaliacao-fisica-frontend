"use client";

import React, { useState } from 'react';
import styles from './alunos.module.css';
import AlunoModal from '@/components/AlunoModal'; // Importa o modal da pasta components

const mockAlunos = [
  { id: 101, matricula: '2025001', nome: 'Ana Silva', cpf: '111.222.333-44', ultimaAvaliacao: '2025-10-15' },
  { id: 102, matricula: '2025002', nome: 'Bruno Costa', cpf: '222.333.444-55', ultimaAvaliacao: '2025-09-20' },
  { id: 103, matricula: '2025003', nome: 'Carlos Souza', cpf: '333.444.555-66', ultimaAvaliacao: 'N/A' },
  { id: 104, matricula: '2025004', nome: 'Daniela Martins', cpf: '444.555.666-77', ultimaAvaliacao: '2025-10-18' },
  { id: 105, matricula: '2025005', nome: 'Bruno Almeida', cpf: '555.666.777-88', ultimaAvaliacao: '2025-10-20' },
];

export default function AlunosPage() { // <--- Note o nome correto
  const [alunos, setAlunos] = useState(mockAlunos);
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaBusca, setCategoriaBusca] = useState('nome');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FUNÇÃO ATUALIZADA ---
  const handleAdicionarAluno = (novoAluno) => {
    const alunoParaAdicionar = {
      ...novoAluno,
      id: Date.now(),
      ultimaAvaliacao: 'N/A',
      dataNascimento: novoAluno.dataNascimento || 'N/A',
      genero: novoAluno.genero || 'N/A',
      telefone: novoAluno.telefone || 'N/A',
      email: novoAluno.email || 'N/A',
    };
    
    setAlunos(prevAlunos => [...prevAlunos, alunoParaAdicionar]);
    
    // RETORNA o aluno recém-criado para o modal
    return alunoParaAdicionar; 
  };
  
  const alunosFiltrados = alunos.filter(aluno => {
    if (!termoBusca) return true;
    const buscaLowerCase = termoBusca.toLowerCase();
    switch (categoriaBusca) {
      case 'id': return String(aluno.id).includes(termoBusca);
      case 'matricula': return String(aluno.matricula).toLowerCase().includes(buscaLowerCase);
      case 'cpf': return aluno.cpf.includes(termoBusca);
      case 'nome': default: return aluno.nome.toLowerCase().includes(buscaLowerCase);
    }
  });

  return (
    <div className={styles.container}>
      
      {isModalOpen && (
        <AlunoModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAdicionarAluno}
        />
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>Gerenciamento de Alunos</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className={styles.newStudentButton}
        >
          + Novo Aluno
        </button>
      </header>

      <div className={styles.searchContainer}>
        <select
          className={styles.searchCategory}
          value={categoriaBusca}
          onChange={(e) => setCategoriaBusca(e.target.value)}
        >
          <option value="nome">Nome</option>
          <option value="id">ID</option>
          <option value="matricula">Matrícula</option>
          <option value="cpf">CPF</option>
        </select>
        <input
          type="text"
          placeholder={`Buscar por ${categoriaBusca}...`}
          className={styles.searchBar}
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Matrícula</th>
              <th>Nome Completo</th>
              <th>CPF</th>
              <th>Última Avaliação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.map((aluno) => (
              <tr key={aluno.id}>
                <td>{aluno.id}</td>
                <td>{aluno.matricula}</td>
                <td>{aluno.nome}</td>
                <td>{aluno.cpf}</td>
                <td>{aluno.ultimaAvaliacao}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={`${styles.actionButton} ${styles.editButton}`}>Editar</button>
                    <button className={`${styles.actionButton} ${styles.deleteButton}`}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

