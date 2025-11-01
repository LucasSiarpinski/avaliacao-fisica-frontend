"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import styles from './SideBar.module.css';

// 1. IMPORTANDO ÍCONES (Incluindo ícones de Admin e Fechar)
import { 
    LuLayoutDashboard, 
    LuUsers, 
    LuSettings, 
    LuFileText, 
    LuLogOut, 
    LuUserCog, // Ícone para Professores (Admin)
    LuX // Ícone para fechar no mobile
} from "react-icons/lu";

// 2. O COMPONENTE AGORA ACEITA 'closeMenu' no lugar de 'toggleMenu'
export default function SideBar({ isOpen, closeMenu }) { // <-- MUDANÇA 1
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // 3. LÓGICA DE PERMISSÕES (PERFEITA, SEM MUDANÇAS)
    const allNavItems = [
        { href: '/home', label: 'Dashboard', icon: <LuLayoutDashboard />, role: 'ALL' },
        { href: '/alunos', label: 'Alunos', icon: <LuUsers />, role: 'ALL' },
        { href: '/relatorios', label: 'Relatórios', icon: <LuFileText />, role: 'ALL' },
        // Itens que exigem permissão de ADMIN
        { href: '/professores', label: 'Professores', icon: <LuUserCog />, role: 'ADMIN' },
        { href: '/configuracoes', label: 'Configurações', icon: <LuSettings />, role: 'ADMIN' },
        { href: '/avaliacoes', label: 'Avaliacao Fisica', icon: <LuSettings />, role: 'ALL' },
    ];

    const navItems = allNavItems.filter(item => {
        if (item.role === 'ALL') return true; // Mostra para todos
        return item.role === user?.role; // Mostra apenas se a role bater
    });

    return (
        // 4. APLICA A CLASSE 'mobileOpen' (SEM MUDANÇAS)
        <aside className={`${styles.sidebar} ${isOpen ? styles.mobileOpen : ''}`}>
            
            <div className={styles.header}>
                <div className={styles.logo}>UNOESC Portal</div>
                {/* 5. BOTÃO DE FECHAR (AGORA CHAMA 'closeMenu') */}
                <button onClick={closeMenu} className={styles.mobileCloseButton}> {/* <-- MUDANÇA 2 */}
                    <LuX />
                </button>
            </div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map(item => (
                        <li key={item.href}>
                            <Link 
                                href={item.href} 
                                // Fecha o menu ao clicar em um link (AGORA CHAMA 'closeMenu')
                                onClick={closeMenu} // <-- MUDANÇA 3
                                className={pathname.startsWith(item.href) ? `${styles.navItem} ${styles.active}` : styles.navItem}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.label}>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className={styles.footer}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
                    <span className={styles.userName}>{user?.name}</span>
                </div>

                <button onClick={signOut} className={styles.logoutButton}>
                    <span className={styles.icon}><LuLogOut /></span>
                    <span className={styles.label}>Sair</span>
                </button>
                
                <div className={styles.copyright}>
                    <p>Minhas Disciplinas</p>
                    <p>© 2025 UNOESC</p>
                </div>
            </div>
        </aside>
    );
}