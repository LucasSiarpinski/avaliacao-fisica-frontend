// app/(main)/layout.js

import SideBar from '@/components/SideBar'; // Verifique se o caminho está correto
import styles from '@/components/SideBar.module.css'; // Vamos usar CSS Modules

export default function MainLayout({ children }) {
  return (
    <div className={styles.mainWrapper}>
      {/* Coluna da Esquerda: Navegação Lateral Fixa */}
      <SideBar />

      {/* Coluna da Direita: Conteúdo Principal que mudará */}
      <main className={styles.contentWrapper}>
        {children} {/* << AQUI ENTRARÁ O CONTEÚDO DE CADA page.js */}
      </main>
    </div>
  );
}