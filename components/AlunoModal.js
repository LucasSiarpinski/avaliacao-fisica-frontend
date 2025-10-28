"use client";

import React, { useState } from 'react';
import styles from './AlunoModal.module.css'; // Crie um CSS para o modal se não tiver

// O modal agora aceita uma nova propriedade: 'errorMessage'
export default function AlunoModal({ onClose, onSubmit, errorMessage }) {
  // Estado para controlar TODOS os campos do formulário
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    cpf: '',
    email: '',
    dataNasc: '', // Formato YYYY-MM-DD para o input type="date"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData); // Envia o objeto de dados completo
      onClose(); // Fecha o modal APENAS se o onSubmit for bem-sucedido
    } catch (error) {
      // Se o onSubmit (a chamada da API) falhar, o erro será tratado na página pai.
      // O modal não fecha, permitindo que o usuário veja a mensagem de erro.
      console.log("Falha ao submeter o formulário no modal.");
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit}>
          <h2>Cadastrar Novo Aluno</h2>
          
          {/* Campo Nome */}
          <input type="text" name="nome" placeholder="Nome Completo" value={formData.nome} onChange={handleChange} required />
          
          {/* NOVO CAMPO: Email */}
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />

          {/* NOVO CAMPO: Data de Nascimento */}
          <input type="date" name="dataNasc" placeholder="Data de Nascimento" value={formData.dataNasc} onChange={handleChange} required />

          {/* Campo Matrícula */}
          <input type="text" name="matricula" placeholder="Matrícula" value={formData.matricula} onChange={handleChange} required />

          {/* Campo CPF */}
          <input type="text" name="cpf" placeholder="CPF (opcional)" value={formData.cpf} onChange={handleChange} />

          {/* ÁREA DE ERRO: Só aparece se houver uma mensagem de erro */}
          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.submitButton}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}