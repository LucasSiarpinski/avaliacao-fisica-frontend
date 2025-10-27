// app/layout.js

import { AuthProvider } from '../contexts/AuthContext';
import './globals.css'; // Seu CSS global

export const metadata = {
  title: 'App de Avaliação Física',
  description: 'TCC de Lucas Miotto',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}