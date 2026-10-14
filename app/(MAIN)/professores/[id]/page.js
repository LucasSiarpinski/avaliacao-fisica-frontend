"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../professores.module.css';
import toast from 'react-hot-toast';
import api from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';

export default function FormProfessorPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const isEditing = id !== 'novo';

    const { isAuthenticated, loading: authLoading, user } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'PROFESSOR',
        campusId: '',
    });
    const [campus, setCampus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditing);
    const [formError, setFormError] = useState(null);

    // Proteção de autenticação e papel de administrador
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!authLoading && isAuthenticated && user && user.role !== 'ADMIN') {
            toast.error('Acesso negado. Apenas administradores podem gerenciar professores.');
            router.push('/home');
        }
    }, [isAuthenticated, authLoading, user, router]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            // --- 1. BUSCAR CAMPUS ---
            try {
                const campusRes = await api.get('/api/campus');
                const campusData = campusRes.data || [];
                setCampus(campusData);

                // Define campus padrão se for novo
                if (!isEditing && campusData.length > 0) {
                    setFormData(prev => ({ ...prev, campusId: String(campusData[0].id) }));
                }
            } catch (err) {
                console.error("Erro ao buscar campus:", err);
                const msg = err.response?.data?.message || err.response?.data?.error || 'Falha ao buscar lista de campus.';
                setFormError(msg);
            }

            // --- 2. BUSCAR DADOS DO PROFESSOR (SE ESTIVER EDITANDO) ---
            if (isEditing) {
                try {
                    const profRes = await api.get(`/api/professores/${id}`);
                    const professor = profRes.data;
                    setFormData({
                        name: professor.name || '',
                        email: professor.email || '',
                        role: professor.role || 'PROFESSOR',
                        campusId: professor.campusId ? String(professor.campusId) : '',
                        password: '',
                    });
                } catch (err) {
                    console.error("Erro ao buscar professor:", err);
                    const msg = err.response?.data?.message || err.response?.data?.error || 'Professor não encontrado.';
                    setFormError(msg);
                    toast.error(msg);
                } finally {
                    setPageLoading(false);
                }
            }
        };

        fetchData();
    }, [id, isEditing, isAuthenticated]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormError(null);

        const bodyData = {
            ...formData,
            campusId: parseInt(formData.campusId, 10),
        };

        if (isEditing && !bodyData.password) {
            delete bodyData.password;
        }

        try {
            if (isEditing) {
                await api.put(`/api/professores/${id}`, bodyData);
            } else {
                await api.post('/api/professores', bodyData);
            }
            toast.success('Professor salvo com sucesso!');
            router.push('/professores');
            router.refresh(); 
        } catch (error) {
            console.error("Erro ao salvar professor:", error);
            const msg = error.response?.data?.message || error.response?.data?.error || 'Falha ao salvar os dados do professor.';
            setFormError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || pageLoading) {
        return (
            <div className={styles.container} style={{ textAlign: "center", padding: "4rem" }}>
                <p>Carregando dados do professor...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    {isEditing ? 'Editar Professor' : 'Cadastrar Novo Professor'}
                </h1>
            </header>
            
            {formError && <p className={styles.errorMessage}>{formError}</p>}

            <form onSubmit={handleSave} className={styles.modalForm} style={{ maxWidth: "600px" }}>
                <label className={styles.formLabel}>Nome Completo:</label>
                <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className={styles.formInput} 
                    placeholder="Ex: Prof. João da Silva"
                    required 
                />

                <label className={styles.formLabel}>E-mail:</label>
                <input 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={styles.formInput} 
                    type="email" 
                    placeholder="email@unoesc.edu.br"
                    required 
                />

                <label className={styles.formLabel}>Senha:</label>
                <input 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    className={styles.formInput} 
                    type="password"
                    required={!isEditing}
                    placeholder={isEditing ? "Deixe em branco para não alterar" : "Senha obrigatória"}
                />

                <label className={styles.formLabel}>Nível de Acesso (Permissão):</label>
                <select name="role" value={formData.role} onChange={handleChange} className={styles.formSelect}>
                    <option value="PROFESSOR">PROFESSOR</option>
                    <option value="ADMIN">ADMIN</option>
                </select>

                <label className={styles.formLabel}>Campus:</label>
                <select name="campusId" value={formData.campusId} onChange={handleChange} className={styles.formSelect} required>
                    <option value="" disabled>Selecione um campus</option>
                    {campus.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                </select>
                
                <div className={styles.modalActions} style={{ marginTop: "2rem" }}>
                    <button type="submit" className={styles.saveButton} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" onClick={() => router.back()} className={styles.cancelButton} disabled={loading}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}