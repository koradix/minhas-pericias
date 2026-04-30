// ─── Email service ────────────────────────────────────────────────────────────
// Uses Resend (https://resend.com) when RESEND_API_KEY is set.
// Falls back to console.log in development so the app works without credentials.

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Resend free tier requires verified domain or onboarding@resend.dev
const FROM = process.env.EMAIL_FROM ?? 'Perilab <onboarding@resend.dev>'

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
    console.log(`[email] RESEND_API_KEY not set. Verification link:\n${link}`)
    return
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Confirme seu e-mail — Perilab',
    html: `
      <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:0;background:#ffffff">
        <!-- Header -->
        <div style="background:#0f172a;padding:32px 32px 24px;text-align:center">
          <h1 style="font-size:22px;font-weight:900;color:#a3e635;margin:0;letter-spacing:2px;text-transform:uppercase">
            Perilab
          </h1>
          <p style="font-size:12px;color:#94a3b8;margin:6px 0 0;letter-spacing:1px;text-transform:uppercase">
            Plataforma do Perito Judicial
          </p>
        </div>

        <!-- Body -->
        <div style="padding:36px 32px">
          <h2 style="font-size:20px;font-weight:800;color:#1f2937;margin:0 0 12px">
            Bem-vindo ao Perilab!
          </h2>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 8px">
            Sua conta foi criada com sucesso. Para ativar o acesso completo
            à plataforma, confirme seu endereço de e-mail clicando no botão abaixo.
          </p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px">
            Com o Perilab, você terá acesso a ferramentas para gerenciar suas
            perícias, acompanhar nomeações, planejar rotas de prospecção e
            gerar propostas de honorários com inteligência artificial.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:0 0 28px">
            <a href="${link}"
               style="display:inline-block;background:#a3e635;color:#0f172a;font-weight:800;
                      text-decoration:none;padding:14px 36px;border-radius:0;font-size:13px;
                      letter-spacing:1.5px;text-transform:uppercase">
              Confirmar meu e-mail
            </a>
          </div>

          <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0 0 8px">
            Este link expira em 24 horas. Se você não criou uma conta no Perilab,
            pode ignorar este e-mail com segurança.
          </p>
          <p style="color:#cbd5e1;font-size:11px;line-height:1.5;margin:0">
            Se o botão não funcionar, copie e cole este link no navegador:<br/>
            <a href="${link}" style="color:#94a3b8;word-break:break-all">${link}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center">
          <p style="font-size:11px;color:#94a3b8;margin:0;letter-spacing:0.5px">
            Perilab — Inteligência para o Perito Judicial
          </p>
        </div>
      </div>
    `,
  })
}
