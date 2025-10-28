// app/layout.js

import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast'; // <-- 1. IMPORTE O TOASTER
import './globals.css';

// ... (seu metadata) ...

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