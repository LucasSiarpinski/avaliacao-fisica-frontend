// components/SideBar.js

import Link from 'next/link'; // Importa o componente de Link do Next.js
import styles from './SideBar.module.css'; // Importa nossos estilos

export default function SideBar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>UNOESC Portal</div>
      
      <nav>
        <ul className={styles.navList}>
          <li>
            <Link href="/home" className={styles.navItem}>
              {/* Você pode adicionar um ícone SVG aqui depois */}
              <span>🏠</span> Dashboard
            </Link>
          </li>
          <li>
            <Link href="/alunos" className={styles.navItem}>
              <span>👤</span> Alunos
            </Link>
          </li>
          <li>
            <Link href="/configuracoes" className={styles.navItem}>
              <span>⚙️</span> Configurações
            </Link>
          </li>
          <li>
            <Link href="/relatorios" className={styles.navItem}>
              {/* Você pode adicionar um ícone SVG aqui depois */}
              <span>🏠</span> Relatórios
            </Link>
          </li>
        </ul>
      </nav>

      <div className={styles.footer}>
        <p>Minhas Disciplinas</p>
        <p>© 2025 UNOESC - Todos os direitos reservados.</p>
      </div>
    </aside>
  );
}