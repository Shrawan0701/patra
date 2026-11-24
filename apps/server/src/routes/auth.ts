import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthedRequest, requireAuth, signAuthToken } from '../middleware/auth';
import { sendOtpEmail } from '../services/brevo';

export const authRouter = Router();

function generateReferralCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, 'P');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PATRA-${prefix}${suffix}`;
}

function serializeUser(u: {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  exportCredits: number;
  planTier: string;
  planExportsRemaining: number;
  planRenewsAt: Date | null;
  autoRenewCancelled: boolean;
  createdAt: Date;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    referralCode: u.referralCode,
    exportCredits: Math.max(0, u.exportCredits),
    planTier: u.planTier,
    planExportsRemaining: Math.max(0, u.planExportsRemaining),
    planRenewsAt: u.planRenewsAt?.toISOString() ?? null,
    autoRenewCancelled: u.autoRenewCancelled,
    createdAt: u.createdAt.toISOString(),
  };
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
  referralCode: z.string().trim().optional(),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data' });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  let referredById: string | undefined;
  if (parsed.data.referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: parsed.data.referralCode.toUpperCase() },
    });
    if (referrer) {
      referredById = referrer.id;
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const referralCode = generateReferralCode(parsed.data.name);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      referralCode,
      referredById,
    },
  });

  const token = signAuthToken(user.id);
  return res.status(201).json({ token, user: serializeUser(user) });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please enter a valid email and password' });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signAuthToken(user.id);
  return res.json({ token, user: serializeUser(user) });
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: serializeUser(user) });
});

authRouter.post('/push-token', requireAuth, async (req: AuthedRequest, res) => {
  const token = String(req.body?.expoPushToken || '').trim();
  if (!token) return res.status(400).json({ error: 'Missing push token' });

  await prisma.user.update({
    where: { id: req.userId },
    data: { expoPushToken: token },
  });
  return res.json({ ok: true });
});

authRouter.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success message to avoid email enumeration
  if (!user) {
    return res.json({ ok: true, message: 'If an account exists, an OTP has been sent to your email.' });
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const otpHash = await bcrypt.hash(otp, 8);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.passwordResetOtp.create({
    data: {
      userId: user.id,
      otpHash,
      expiresAt,
    },
  });

  await sendOtpEmail(user.email, user.name, otp);
  return res.json({ ok: true, message: 'A 6-digit verification code has been sent to your email.' });
});

authRouter.post('/verify-otp', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  if (!email || otp.length !== 6) {
    return res.status(400).json({ error: 'Valid email and 6-digit OTP are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired OTP' });

  const latest = await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) return res.status(400).json({ error: 'OTP expired or not found' });

  const match = await bcrypt.compare(otp, latest.otpHash);
  if (!match) return res.status(400).json({ error: 'Incorrect OTP code' });

  return res.json({ ok: true });
});

authRouter.post('/reset-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  const newPassword = String(req.body?.newPassword || '');

  if (!email || otp.length !== 6 || newPassword.length < 6) {
    return res.status(400).json({ error: 'Email, 6-digit OTP, and password (6+ chars) are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: 'Invalid request' });

  const latest = await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) return res.status(400).json({ error: 'OTP expired or already used' });

  const match = await bcrypt.compare(otp, latest.otpHash);
  if (!match) return res.status(400).json({ error: 'Incorrect OTP code' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetOtp.update({ where: { id: latest.id }, data: { usedAt: new Date() } }),
  ]);

  return res.json({ ok: true, message: 'Password updated! You can now sign in.' });
});
