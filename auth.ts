import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { authConfig } from '@/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    // signIn callback — handles OAuth user creation/linking (Node.js only, uses Prisma)
    async signIn({ user, account }) {
      // Credentials sign-in: user already validated by authorize()
      if (!account || account.provider === 'credentials') return true

      // OAuth sign-in (Google, etc.)
      const { prisma } = await import('@/lib/prisma')
      const email = user.email
      if (!email) return false

      // Find or create User
      let dbUser = await prisma.user.findUnique({ where: { email } })
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name ?? email.split('@')[0],
            passwordHash: null,
            role: 'perito',
            emailVerified: new Date(), // Google/OAuth emails are pre-verified
          },
        })
        // Create an empty PeritoPerfil for the new user
        await prisma.peritoPerfil.create({ data: { userId: dbUser.id } }).catch(() => {})
      } else if (!dbUser.emailVerified) {
        // Linking existing credentials account via OAuth → auto-verify email
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { emailVerified: new Date() },
        })
        dbUser = { ...dbUser, emailVerified: new Date() }
      }

      // Upsert Account link (idempotent)
      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        create: {
          userId: dbUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token:  account.access_token  as string | undefined,
          refresh_token: account.refresh_token as string | undefined,
          expires_at:    account.expires_at    as number | undefined,
          token_type:    account.token_type    as string | undefined,
          scope:         account.scope         as string | undefined,
          id_token:      account.id_token      as string | undefined,
        },
        update: {
          access_token:  account.access_token  as string | undefined,
          refresh_token: account.refresh_token as string | undefined,
        },
      })

      // Mutate user so jwt callback receives the correct id/role/emailVerified
      user.id = dbUser.id
      ;(user as Record<string, unknown>).role = dbUser.role
      ;(user as Record<string, unknown>).emailVerified = dbUser.emailVerified

      return true
    },
  },
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Credentials({
      credentials: {
        email:    { label: 'E-mail',  type: 'email'    },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const { prisma } = await import('@/lib/prisma')
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        // Return full user including emailVerified so it ends up in the JWT
        return {
          id:            user.id,
          email:         user.email,
          name:          user.name,
          role:          user.role,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
})
