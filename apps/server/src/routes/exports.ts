import { Router } from 'express';
import { PRICING_PLANS } from '@patra/shared';
import { prisma } from '../lib/prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { sendExpoPush } from '../services/push';

export const exportsRouter = Router();
exportsRouter.use(requireAuth);

exportsRouter.get('/history', async (req: AuthedRequest, res) => {
  const records = await prisma.exportRecord.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({
    exports: records.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      projectTitle: r.projectTitle,
      aspectRatio: r.aspectRatio,
      resolution: r.resolution,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

exportsRouter.delete('/:id', async (req: AuthedRequest, res) => {
  await prisma.exportRecord.deleteMany({
    where: { id: String(req.params.id), userId: req.userId },
  });
  return res.json({ ok: true });
});

exportsRouter.post('/authorize', async (req: AuthedRequest, res) => {
  const projectId = req.body?.projectId ? String(req.body.projectId) : null;
  const projectTitle = String(req.body?.projectTitle || 'Patra 3D Invite');
  const aspectRatio = String(req.body?.aspectRatio || '9:16');

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hasPlanAccess =
    user.planTier !== 'NONE' &&
    user.planExportsRemaining > 0 &&
    (!user.planRenewsAt || user.planRenewsAt > new Date());

  // Check 7-day free typo re-export grace window on exported project
  let hasFreeGrace = false;
  if (projectId) {
    const proj = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });
    if (proj?.reexportGraceUntil && proj.reexportGraceUntil > new Date()) {
      hasFreeGrace = true;
    }
  }

  const resolution: '1080p' | '4K' = '4K';
  let source: 'grace' | 'plan' | 'credit' | null = null;

  if (hasFreeGrace) {
    source = 'grace';
  } else if (hasPlanAccess) {
    source = 'plan';
  } else if (user.exportCredits > 0) {
    source = 'credit';
  }

  if (!source) {
    return res.status(402).json({
      error: 'Unlock 4K Video Export to download this 3D invitation',
      code: 'PAYWALL_REQUIRED',
      plans: PRICING_PLANS,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    let updatedUser = user;
    if (source === 'plan') {
      updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { planExportsRemaining: { decrement: 1 } },
      });
    } else if (source === 'credit') {
      updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { exportCredits: { decrement: 1 } },
      });
      // Grant 7-day free typo re-exports for this project
      if (projectId) {
        await tx.project.updateMany({
          where: { id: projectId, userId: user.id },
          data: { reexportGraceUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        });
      }
    }

    const record = await tx.exportRecord.create({
      data: {
        userId: user.id,
        projectId,
        projectTitle,
        aspectRatio,
        resolution,
      },
    });

    return { updatedUser, record };
  });

  void sendExpoPush(
    user.expoPushToken,
    'Patra 3D Video Ready',
    `"${projectTitle}" (${resolution}) is unlocked and saved to your Exports.`
  );

  return res.json({
    authorized: true,
    source,
    resolution,
    record: {
      id: result.record.id,
      projectId: result.record.projectId,
      projectTitle: result.record.projectTitle,
      aspectRatio: result.record.aspectRatio,
      resolution: result.record.resolution,
      createdAt: result.record.createdAt.toISOString(),
    },
    quota: {
      exportCredits: result.updatedUser.exportCredits,
      planTier: result.updatedUser.planTier,
      planExportsRemaining: result.updatedUser.planExportsRemaining,
    },
  });
});
