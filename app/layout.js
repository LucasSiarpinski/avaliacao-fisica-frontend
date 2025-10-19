// app/layout.js
import { redirect } from "next/navigation";
import "./globals.css"; // se tiver estilos globais

export default function RootLayout({ children }) {
  // Redireciona apenas se a rota atual for a raiz "/"
  if (typeof window !== "undefined" && window.location.pathname === "/") {
    redirect("/login");
  }

  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
