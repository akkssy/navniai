/**
 * Email helper — sends via Resend if RESEND_API_KEY is set,
 * otherwise logs the link to the console (dev mode).
 *
 * To enable real email:
 *   1. Sign up at https://resend.com (free tier: 100 emails/day)
 *   2. Add RESEND_API_KEY=re_xxx to your .env
 *   3. Add RESEND_FROM=noreply@yourdomain.com to your .env
 */

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; devLink?: string }> {
  const apiKey = process.env.RESEND_API_KEY

  if (apiKey) {
    // Real email via Resend
    const from = process.env.RESEND_FROM || 'NavniAI <noreply@navniai.com>'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html }),
    })
    return { ok: res.ok }
  }

  // Dev fallback — extract the first href link from HTML and log it
  const match = payload.html.match(/href="([^"]+)"/)
  const devLink = match?.[1]
  console.log('\n📧 [DEV] Email not configured. Use this link directly:')
  console.log(`   To: ${payload.to}`)
  console.log(`   Subject: ${payload.subject}`)
  if (devLink) console.log(`   Link: ${devLink}`)
  console.log()
  return { ok: true, devLink }
}

export function passwordResetEmail(resetUrl: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">Reset your password</h2>
      <p style="font-size:14px;color:#555;margin:0 0 24px">
        Click the button below to reset your NavniAI password. This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none">
        Reset Password
      </a>
      <p style="font-size:12px;color:#999;margin:24px 0 0">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `
}
