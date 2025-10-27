// components/AlunoModal.js
"use client";

import React, { useState } from 'react';
import styles from './AlunoModal.module.css';

// O 'initialData' é para quando formos editar um aluno no futuro
export default function AlunoModal({ onClose, onSubmit, initialData = null }) {
  // Estado para guardar os dados do formulário
  const [formData, setFormData] = useState({
    nome: initialData?.nome || '',
    matricula: initialData?.matricula || '',
    cpf: initialData?.cpf || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Impede que a página recarregue ao enviar o form
    onSubmit(formData); // Envia os dados para a função do componente pai
  };

  return (
    // O overlay escuro que cobre a tela
    <div className={styles.overlay} onClick={onClose}>
      {/* O container do modal em si. O e.stopPropagation impede que o clique no modal feche ele */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{initialData ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="nome">Nome Completo</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="matricula">Matrícula</label>
            <input
              type="text"
              id="matricula"
              name="matricula"
              value={formData.matricula}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}