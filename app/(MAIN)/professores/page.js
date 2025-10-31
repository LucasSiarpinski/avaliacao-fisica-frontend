"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './professores.module.css';
// import toast from 'react-hot-toast'; 

// Componente principal da lista
export default function ProfessoresPage() {
    const router = useRouter();

    // --- ESTADOS ---
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

    // --- BUSCA DE DADOS ---
    useEffect(() => {
        const fetchProfessores = async () => {
            setIsLoading(true);
            try {
                // ✅ CORREÇÃO: Usando a URL completa da API a partir da variável de ambiente
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/professores`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao buscar os professores.');
                }
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfessores();
    }, []);

    // --- FILTRO (sem alterações) ---
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- NAVEGAÇÃO (sem alterações) ---
    const handleNewProfessor = () => {
        router.push('/professores/novo');
    };

    const handleEditSelected = () => {
        if (!selectedUserId) {
            alert("Nenhum professor selecionado.");
            return;
        }
        router.push(`/professores/${selectedUserId}`);
    };

    // --- DELEÇÃO ---
    const handleDeleteSelected = async () => {
        if (!selectedUserId) {
            alert("Nenhum professor selecionado.");
            return;
        }
        if (window.confirm(`Tem certeza que deseja excluir o usuário ID ${selectedUserId}?`)) {
            try {
                // ✅ CORREÇÃO: Usando a URL completa da API aqui também
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/professores/${selectedUserId}`;
                const response = await fetch(apiUrl, { method: 'DELETE' });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao excluir.');
                }
                // toast.success("Usuário excluído com sucesso!");
                setUsers(users.filter(u => u.id !== selectedUserId));
                setSelectedUserId(null);
            } catch (err) {
                console.error(err);
                // toast.error(err.message);
            }
        }
    };

    // --- LÓGICA DE SELEÇÃO (sem alterações) ---
    const handleSelectUser = (id) => {
        setSelectedUserId(prevId => (prevId === id ? null : id));
    };
    
    // --- RENDERIZAÇÃO (sem alterações) ---
    if (isLoading) return <p>Carregando professores...</p>;
    if (error) return <p>Erro: {error}</p>;

    // O JSX do seu return continua exatamente o mesmo
    return (
        <div className={styles.container}>
            {/* ... todo o seu JSX ... */}
            <header className={styles.header}>
                <h1 className={styles.title}>Gerenciamento de Professores</h1>
                
                <div className={styles.headerActions}>
                    <button onClick={handleNewProfessor} className={styles.newButton}>
                        + Novo Professor
                    </button>
                    <button onClick={handleEditSelected} className={`${styles.actionButton} ${styles.editButton}`} disabled={!selectedUserId}>
                        Editar Selecionado
                    </button>
                    <button onClick={handleDeleteSelected} className={`${styles.actionButton} ${styles.deleteButton}`} disabled={!selectedUserId}>
                        Excluir Selecionado
                    </button>
                </div>
            </header>

            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    className={styles.searchBar}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th></th> 
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Campus</th>
                            <th>Permissão</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr 
                                    key={user.id}
                                    onClick={() => handleSelectUser(user.id)}
                                    className={user.id === selectedUserId ? styles.selectedRow : ""}
                                >
                                    <td>
                                        {user.id === selectedUserId && <span className={styles.checkIcon}>✓</span>}
                                    </td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.campus?.name || 'N/A'}</td>
                                    <td>
                                        <span className={user.role === 'ADMIN' ? styles.roleAdmin : styles.roleProfessor}>{user.role}</span>
                                    </td>
                                    <td>
                                        <span className={user.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>{user.status}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className={styles.noResults}>Nenhum professor encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}