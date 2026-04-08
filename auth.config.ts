import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const role = (auth?.user as { role?: string })?.role ?? 'perito'

      const peritoOnlyPrefixes = [
        '/pericias', '/rotas', '/visitas', '/financeiro', '/recebimentos',
        '/nomeacoes', '/alertas-nomeacoes', '/relatorios', '/documentos',
        '/contatos', '/parceiros', '/demandas', '/integracoes',
      ]
      const isPeritoOnly = peritoOnlyPrefixes.some((p) => nextUrl.pathname.startsWith(p))
      const isParceiroRoute = nextUrl.pathname.startsWith('/parceiro')
      const isDashboard = nextUrl.pathname === '/dashboard'
      const isConfiguracao = nextUrl.pathname.startsWith('/configuracoes')
      const isAppRoute = isPeritoOnly || isParceiroRoute || isDashboard || isConfiguracao

      if (isAppRoute && !isLoggedIn) return false

      // Block credential users with unverified email from app routes
      if (isAppRoute && isLoggedIn) {
        const emailVerified = (auth?.user as { emailVerified?: Date | null })?.emailVerified
        if (!emailVerified) {
          return Response.redirect(new URL('/verify-email/pending', nextUrl))
        }
      }

      // Parceiro tentando acessar rota exclusiva do perito
      if (isPeritoOnly && role === 'parceiro') {
        return Response.redirect(new URL('/parceiro/dashboard', nextUrl))
      }
      // Parceiro indo para /dashboard → redireciona para /parceiro/dashboard
      if (isDashboard && role === 'parceiro') {
        return Response.redirect(new URL('/parceiro/dashboard', nextUrl))
      }
      // Perito ou admin tentando acessar rota do parceiro
      if (isParceiroRoute && role !== 'parceiro') {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'perito'
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null
      }
      return session
    },
  },
  providers: [],
}
