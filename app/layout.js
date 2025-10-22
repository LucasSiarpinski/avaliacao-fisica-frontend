// app/layout.js
// Remova o import { redirect } se ele não for mais usado
import "./globals.css";

export default function RootLayout({ children }) {
  // Se o usuário acessar '/', o 'page.js' fará o redirect primeiro.
  // Caso contrário, renderiza a estrutura de HTML.
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}