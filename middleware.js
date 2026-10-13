
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Proteção é feita no frontend com useAuth()
  return NextResponse.next();
}

// 3. Configuração: define em quais rotas o middleware deve rodar.
// Esta configuração protege TUDO, exceto rotas de API e arquivos estáticos.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};