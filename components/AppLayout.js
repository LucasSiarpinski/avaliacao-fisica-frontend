// Caminho CORRETO: app/(MAIN)/layout.js

"use client";

import { useState } from 'react';
// 1. Ajuste o caminho para buscar DENTRO da pasta 'components'
import SideBar from '@/components/SideBar'; 
import styles from '@/components/AppLayout.module.css'; // 2. Ajuste o caminho

import { LuMenu } from "react-icons/lu";

export default function AppLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className={styles.layoutWrapper}>
            {isMobileMenuOpen && (
                <div className={styles.mobileOverlay} onClick={toggleMenu}></div>
            )}

            <SideBar 
                isOpen={isMobileMenuOpen} 
                toggleMenu={toggleMenu} // Você pode renomear para 'onClose' se preferir
            />

            <main className={styles.mainContent}>
                
                <header className={styles.mobileHeader}>
                    <button onClick={toggleMenu} className={styles.mobileToggle}>
                        <LuMenu />
                    </button>
                    <div className={styles.mobileLogo}>UNOESC</div>
                </header>
                
                <div className={styles.pageContent}>
                    {children}
                </div>
            </main>
        </div>
    );
}