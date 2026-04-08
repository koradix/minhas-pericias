// ─── Email service ────────────────────────────────────────────────────────────
// Uses Resend (https://resend.com) when RESEND_API_KEY is set.
// Falls back to console.log in development so the app works without credentials.

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.EMAIL_FROM ?? 'PeriLaB <no-reply@perilab.com.br>'

function appUrl(): string {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  )
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = `${appUrl()}/verify-email?token=${token}`

  if (!resend) {
    // Development fallback — print link so devs can test without an API key
    console.log(`[email] RESEND_API_KEY not set. Verification link:\n${link}`)
    return
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Confirme seu e-mail — PeriLaB',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:24px;font-weight:800;color:#1f2937;margin:0 0 8px">
          Confirme seu e-mail
        </h1>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
          Clique no botão abaixo para ativar sua conta no PeriLaB.
          O link expira em 24 horas.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#84cc16;color:#fff;font-weight:700;
                  text-decoration:none;padding:12px 28px;border-radius:10px;font-size:15px">
          Verificar e-mail
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:28px 0 0">
          Se você não criou uma conta no PeriLaB, ignore este e-mail.
        </p>
      </div>
    `,
  })
}
