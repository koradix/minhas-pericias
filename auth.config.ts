import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAppRoute = nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/pericias') ||
        nextUrl.pathname.startsWith('/contatos') ||
        nextUrl.pathname.startsWith('/visitas') ||
        nextUrl.pathname.startsWith('/financeiro') ||
        nextUrl.pathname.startsWith('/recebimentos') ||
        nextUrl.pathname.startsWith('/demandas') ||
        nextUrl.pathname.startsWith('/documentos') ||
        nextUrl.pathname.startsWith('/rotas') ||
        nextUrl.pathname.startsWith('/nomeacoes') ||
        nextUrl.pathname.startsWith('/relatorios') ||
        nextUrl.pathname.startsWith('/alertas-nomeacoes') ||
        nextUrl.pathname.startsWith('/integracoes') ||
        nextUrl.pathname.startsWith('/configuracoes') ||
        nextUrl.pathname.startsWith('/parceiros')

      if (isAppRoute) {
        if (isLoggedIn) return true
        return false
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'perito'
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [],
}
