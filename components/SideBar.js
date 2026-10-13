"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import styles from './SideBar.module.css';

// 1. IMPORTANDO ÍCONES
import { 
    LuLayoutDashboard, 
    LuUsers, 
    LuSettings, 
    LuLogOut, 
    LuUserCog, // Ícone para Professores (Admin)
    LuHeartPulse, // Ícone temático para Avaliação Física
    LuX // Ícone para fechar no mobile
} from "react-icons/lu";

export default function SideBar({ isOpen, closeMenu }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // 2. ITENS PRINCIPAIS DE NAVEGAÇÃO
    const allNavItems = [
        { href: '/home', label: 'Dashboard', icon: <LuLayoutDashboard />, role: 'ALL' },
        { href: '/alunos', label: 'Alunos', icon: <LuUsers />, role: 'ALL' },
        { href: '/avaliacoes', label: 'Avaliação Física', icon: <LuHeartPulse />, role: 'ALL' },
        // Item exclusivo para ADMIN
        { href: '/professores', label: 'Professores', icon: <LuUserCog />, role: 'ADMIN' },
    ];

    const navItems = allNavItems.filter(item => {
        if (item.role === 'ALL') return true;
        return item.role === user?.role;
    });

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.mobileOpen : ''}`}>
            
            <div className={styles.header}>
                <div className={styles.logo}>UNOESC Portal</div>
                <button onClick={closeMenu} className={styles.mobileCloseButton} aria-label="Fechar menu">
                    <LuX />
                </button>
            </div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map(item => (
                        <li key={item.href}>
                            <Link 
                                href={item.href} 
                                onClick={closeMenu}
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
                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
                        <div className={styles.userMeta}>
                            <span className={styles.userName}>{user?.name}</span>
                            <span className={styles.userRole}>{user?.role === 'ADMIN' ? 'Administrador' : 'Professor'}</span>
                        </div>
                    </div>
                    <Link 
                        href="/configuracoes" 
                        className={styles.settingsIconButton}
                        title="Configurações e Preferências"
                        onClick={closeMenu}
                    >
                        <LuSettings />
                    </Link>
                </div>

                <button onClick={signOut} className={styles.logoutButton}>
                    <span className={styles.icon}><LuLogOut /></span>
                    <span className={styles.label}>Sair</span>
                </button>
                
                <div className={styles.copyright}>
                    <p>Avaliação Física</p>
                    <p>© 2025 UNOESC</p>
                </div>
            </div>
        </aside>
    );
}