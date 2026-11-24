import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';

export const referralsRouter = Router();
referralsRouter.use(requireAuth);

referralsRouter.get('/me', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      referrals: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          payments: {
            where: { status: 'SUCCEEDED' },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const totalReferred = user.referrals.length;
  const paidReferrals = user.referrals.filter((r) => r.payments.length > 0).length;

  res.json({
    referralCode: user.referralCode,
    exportCredits: user.exportCredits,
    totalReferred,
    paidReferrals,
    freeExportsEarned: paidReferrals,
    shareMessage: `Create interactive 3D pop-up invitations for weddings, Haldi, birthdays & parties on Patra! Sign up with my code ${user.referralCode} and unlock yours: https://patra.app/r/${user.referralCode}`,
    friends: user.referrals.map((r) => ({
      id: r.id,
      name: r.name,
      hasPaid: r.payments.length > 0,
      joinedAt: r.createdAt.toISOString(),
    })),
  });
});
