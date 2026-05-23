import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail, passwordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    // Always return success — don't reveal whether the email exists
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Invalidate any existing unused tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true },
    })

    // Create a new token (expires in 1 hour)
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    await prisma.passwordResetToken.create({
      data: { email: email.toLowerCase(), token, expires },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    const { devLink } = await sendEmail({
      to: email,
      subject: 'Reset your NavniAI password',
      html: passwordResetEmail(resetUrl),
    })

    // In dev (no email configured), return the link so the UI can show it
    return NextResponse.json({ ok: true, ...(devLink ? { devLink } : {}) })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
