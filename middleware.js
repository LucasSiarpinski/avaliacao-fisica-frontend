
import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. Tenta pegar o cookie de autenticação que o backend enviou
  const token = request.cookies.get('auth-token')?.value;

  // 2. Pega a URL que o usuário está tentando acessar
  const { pathname } = request.nextUrl;

  // Se já existe um token e o usuário tenta acessar a página de login,
  // redireciona ele para a home, pois ele já está logado.
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Se NÃO existe um token E a página que ele tenta acessar NÃO É a de login,
  // barra o acesso e redireciona para o login.
  // ESTA REGRA VAI PROTEGER TANTO /home QUANTO /alunos E QUALQUER OUTRA PÁGINA.
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se nenhuma das condições acima for atendida, permite o acesso.
  return NextResponse.next();
}

// 3. Configuração: define em quais rotas o middleware deve rodar.
// Esta configuração protege TUDO, exceto rotas de API e arquivos estáticos.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};