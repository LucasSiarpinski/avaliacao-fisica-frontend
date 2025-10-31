"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../professores.module.css';
// import toast from 'react-hot-toast';

export default function FormProfessorPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const isEditing = id !== 'novo';

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'PROFESSOR', campusId: '',
    });
    const [campus, setCampus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditing);
    const [formError, setFormError] = useState(null);

    // ✅ USAREMOS A VARIÁVEL DE AMBIENTE AQUI
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const fetchData = async () => {
            // --- BUSCAR CAMPUS ---
            try {
                const campusResponse = await fetch(`${API_URL}/campus`); // Rota para Campus
                if (!campusResponse.ok) throw new Error('Falha ao buscar campus.');
                const campusData = await campusResponse.json();
                setCampus(campusData);

                // Define um campus padrão se for um novo professor
                if (!isEditing && campusData.length > 0) {
                    setFormData(prev => ({ ...prev, campusId: campusData[0].id }));
                }

            } catch (err) {
                setFormError(err.message);
                // toast.error(err.message);
            }

            // --- BUSCAR DADOS DO PROFESSOR (SE ESTIVER EDITANDO) ---
            if (isEditing) {
                try {
                    const profResponse = await fetch(`${API_URL}/professores/${id}`);
                    if (!profResponse.ok) throw new Error('Professor não encontrado.');
                    const professor = await profResponse.json();
                    setFormData({
                        name: professor.name,
                        email: professor.email,
                        role: professor.role,
                        campusId: professor.campusId,
                        password: ''
                    });
                } catch (err) {
                    setFormError(err.message);
                    // toast.error(err.message);
                } finally {
                    setPageLoading(false);
                }
            }
        };

        fetchData();
    }, [id, isEditing, API_URL]);

    // O resto do seu componente (handleChange, handleSave, JSX) continua igual...
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormError(null);

        // ...sua validação de senha aqui...

        const url = isEditing ? `${API_URL}/professores/${id}` : `${API_URL}/professores`;
        const method = isEditing ? 'PUT' : 'POST';

        const bodyData = { ...formData };
        if (isEditing && !bodyData.password) {
            delete bodyData.password;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao salvar os dados.');
            }
            // toast.success('Salvo com sucesso!');
            router.push('/professores');
            router.refresh(); 
        } catch (error) {
            setFormError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <p>Carregando dados do professor...</p>;

    return (
        <div className={styles.formContainer}> {/* Crie este estilo se necessário */}
            <h1 className={styles.title}>{isEditing ? 'Editar Professor' : 'Cadastrar Novo Professor'}</h1>
            
            {formError && <p className={styles.errorMessage}>{formError}</p>}

            <form onSubmit={handleSave} className={styles.modalForm}> {/* Reutilizando estilos */}
                <label className={styles.formLabel}>Nome:</label>
                <input name="name" value={formData.name} onChange={handleChange} className={styles.formInput} required />

                <label className={styles.formLabel}>Email:</label>
                <input name="email" value={formData.email} onChange={handleChange} className={styles.formInput} type="email" required />

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

                <label className={styles.formLabel}>Permissão:</label>
                <select name="role" value={formData.role} onChange={handleChange} className={styles.formSelect}>
                    <option value="PROFESSOR">PROFESSOR</option>
                    <option value="ADMIN">ADMIN</option>
                </select>

                <label className={styles.formLabel}>Campus:</label>
                <select name="campusId" value={formData.campusId} onChange={handleChange} className={styles.formSelect} required>
                    <option value="" disabled>Selecione um campus</option>
                    {campus.map(campus => (
                        <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                </select>
                
                <div className={styles.modalActions}>
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
};