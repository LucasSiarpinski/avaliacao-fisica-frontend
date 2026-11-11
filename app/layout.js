// app/layout.js

import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
  title: 'Avaliação Física - UNOESC',
  description: 'Sistema de Avaliação Física e Cineantropometria',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <Toaster position="top-right" /> {/* <-- 2. ADICIONE O COMPONENTE */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}