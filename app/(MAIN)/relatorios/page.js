"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast'; 
import styles from './relatorios.module.css';

// --- Dados de exemplo (mock) para o wireframe ---
const mockAlunos = [
  { id: 4, nome: 'Lucas Miotto S', matricula: '406047' },
  { id: 1, nome: 'Erick', matricula: '125414' },
  { id: 3, nome: 'Rayssa Miotto', matricula: '43212' },
];

const mockAvaliacoes = [
  { id: 3, data: '03/11/2025' },
  { id: 2, data: '01/05/2025' },
];


// --- [NOVO!] Componente do Modal de Busca de Aluno ---
// (Coloquei aqui para ficar tudo em um arquivo só)
function AlunoSearchModal({ onClose, onSelectAluno }) {
  // Estado para a busca DENTRO do modal (apenas para o wireframe)
  const [searchTerm, setSearchTerm] = useState("");

  // Filtra os alunos baseado na busca (para o wireframe)
  const filteredAlunos = mockAlunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.matricula.includes(searchTerm)
  );

  const handleSelect = (aluno) => {
    onSelectAluno(aluno); // Passa o aluno de volta para a página principal
    onClose(); // Fecha o modal
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Buscar Aluno</h2>
          <button onClick={onClose} className={styles.modalCloseButton}>&times;</button>
        </header>

        <div className={styles.modalBody}>
          <input 
            type="text"
            className={styles.modalSearchInput}
            placeholder="Digite o nome ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <ul className={styles.modalResultList}>
            {filteredAlunos.length > 0 ? (
              filteredAlunos.map(aluno => (
                <li 
                  key={aluno.id}
                  className={styles.modalResultItem}
                  onClick={() => handleSelect(aluno)}
                >
                  {aluno.nome} (Matrícula: {aluno.matricula})
                </li>
              ))
            ) : (
              <li className={styles.modalResultItem} style={{textAlign: 'center', cursor: 'default'}}>
                Nenhum aluno encontrado.
              </li>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
}


// --- Página Principal de Relatórios ---
export default function RelatoriosPage() {
  
  // States para controlar o fluxo
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- NOVO

  // Função chamada pelo Modal quando um aluno é selecionado
  const handleSelectAluno = (aluno) => {
    setAlunoSelecionado(aluno);
    setAvaliacaoSelecionada(""); // Reseta a seleção de avaliação
  };

  const handleGerarPDF = () => {
    toast.success("Gerando PDF... (RF05 - TCC 2)");
  };

  const handleEnviarEmail = () => {
    toast.error("Funcionalidade (RF05) a ser implementada no TCC 2.");
  };

  return (
    <> {/* <-- Adiciona Fragment para o Modal ficar no nível raiz */}
      
      {/* --- O MODAL (só aparece se isModalOpen for true) --- */}
      {isModalOpen && (
        <AlunoSearchModal 
          onClose={() => setIsModalOpen(false)}
          onSelectAluno={handleSelectAluno}
        />
      )}

      {/* --- A PÁGINA --- */}
      <div className={styles.container}>
        
        <header className={styles.header}>
          <h1 className={styles.title}>Geração de Relatórios</h1>
        </header>

        <div className={styles.reportGenerator}>

          {/* --- [MUDADO!] PASSO 1: BUSCAR ALUNO --- */}
          <div className={styles.formGroup}>
            <label htmlFor="alunoDisplay">Passo 1: Selecione o Aluno</label>
            <div className={styles.searchContainer}>
              <input 
                id="alunoDisplay" 
                className={styles.searchInputDisplay} 
                readOnly // Impede digitação
                // Mostra o nome do aluno ou um placeholder
                value={alunoSelecionado ? `${alunoSelecionado.nome} (Matrícula: ${alunoSelecionado.matricula})` : 'Nenhum aluno selecionado...'}
              />
              <button 
                className={styles.searchButton}
                onClick={() => setIsModalOpen(true)} // <-- ABRE O MODAL
              >
                Buscar
              </button>
            </div>
          </div>

          {/* --- PASSO 2: SELECIONAR AVALIAÇÃO --- */}
          {/* (Só aparece se um aluno estiver selecionado) */}
          {alunoSelecionado && (
            <div className={styles.formGroup}>
              <label htmlFor="avaliacaoSelect">
                Passo 2: Selecionar Avaliação de <strong>{alunoSelecionado.nome}</strong>
              </label>
              <select 
                id="avaliacaoSelect" 
                className={styles.selectInput}
                value={avaliacaoSelecionada}
                onChange={(e) => setAvaliacaoSelecionada(e.target.value)}
              >
                <option value="">-- Selecione a data --</option>
                {mockAvaliacoes.map(ava => (
                  <option key={ava.id} value={ava.id}>
                    Avaliação de {ava.data}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* --- PASSO 3: AÇÕES --- */}
          <div className={styles.formGroup}>
            <label>Passo 3: Gerar Relatório</label>
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.actionButton} ${styles.pdfButton}`}
                onClick={handleGerarPDF}
                disabled={!alunoSelecionado || !avaliacaoSelecionada} 
              >
                Visualizar PDF
              </button>
              <button 
                className={`${styles.actionButton} ${styles.emailButton}`}
                onClick={handleEnviarEmail}
                disabled={!alunoSelecionado || !avaliacaoSelecionada}
              >
                Enviar por Email
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}