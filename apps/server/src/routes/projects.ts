import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']).default('9:16'),
  musicId: z.string().default('shehnai_bliss'),
  rooms: z.array(z.any()).min(1).max(4),
});

projectsRouter.get('/', async (req: AuthedRequest, res) => {
  const rows = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({
    projects: rows.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      aspectRatio: p.aspectRatio,
      musicId: p.musicId,
      rooms: p.roomsJson,
      reexportGraceUntil: p.reexportGraceUntil?.toISOString() ?? null,
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
});

projectsRouter.post('/', async (req: AuthedRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project' });
  }

  const created = await prisma.project.create({
    data: {
      userId: req.userId!,
      title: parsed.data.title,
      category: parsed.data.category,
      aspectRatio: parsed.data.aspectRatio,
      musicId: parsed.data.musicId,
      roomsJson: parsed.data.rooms,
    },
  });

  return res.status(201).json({
    project: {
      id: created.id,
      title: created.title,
      category: created.category,
      aspectRatio: created.aspectRatio,
      musicId: created.musicId,
      rooms: created.roomsJson,
      reexportGraceUntil: created.reexportGraceUntil?.toISOString() ?? null,
      updatedAt: created.updatedAt.toISOString(),
    },
  });
});

projectsRouter.get('/:id', async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  return res.json({
    project: {
      id: project.id,
      title: project.title,
      category: project.category,
      aspectRatio: project.aspectRatio,
      musicId: project.musicId,
      rooms: project.roomsJson,
      reexportGraceUntil: project.reexportGraceUntil?.toISOString() ?? null,
      updatedAt: project.updatedAt.toISOString(),
    },
  });
});

projectsRouter.put('/:id', async (req: AuthedRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project update' });
  }

  const existing = await prisma.project.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const updated = await prisma.project.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      aspectRatio: parsed.data.aspectRatio,
      musicId: parsed.data.musicId,
      roomsJson: parsed.data.rooms,
    },
  });

  return res.json({
    project: {
      id: updated.id,
      title: updated.title,
      category: updated.category,
      aspectRatio: updated.aspectRatio,
      musicId: updated.musicId,
      rooms: updated.roomsJson,
      reexportGraceUntil: updated.reexportGraceUntil?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

projectsRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: String(req.params.id), userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  await prisma.project.delete({ where: { id: existing.id } });
  return res.json({ ok: true });
});
