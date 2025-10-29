// components/SideBar.js

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import styles from './SideBar.module.css';

// 1. IMPORTANDO ÍCONES PROFISSIONAIS
import { LuLayoutDashboard, LuUsers, LuSettings, LuFileText, LuLogOut } from "react-icons/lu";

export default function SideBar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // 2. LISTA DE ITENS COM OS NOVOS ÍCONES
    const navItems = [
        { href: '/home', label: 'Dashboard', icon: <LuLayoutDashboard /> },
        { href: '/alunos', label: 'Alunos', icon: <LuUsers /> },
        { href: '/configuracoes', label: 'Configurações', icon: <LuSettings /> },
        { href: '/relatorios', label: 'Relatórios', icon: <LuFileText /> },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>UNOESC Portal</div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map(item => (
                        <li key={item.href}>
                            <Link href={item.href} className={pathname.startsWith(item.href) ? `${styles.navItem} ${styles.active}` : styles.navItem}>
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