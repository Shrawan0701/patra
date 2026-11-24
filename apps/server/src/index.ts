import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth';
import { exportsRouter } from './routes/exports';
import { dodoWebhookHandler, paymentsRouter } from './routes/payments';
import { projectsRouter } from './routes/projects';
import { referralsRouter } from './routes/referrals';
import { templatesRouter } from './routes/templates';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());

// Preserve rawBody for Dodo Payments webhook HMAC verification
app.use(
  express.json({
    limit: '4mb',
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8');
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'patra-server' });
});

app.use('/api/auth', authRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/exports', exportsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/referrals', referralsRouter);
app.post('/api/webhooks/dodo', dodoWebhookHandler);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Patra API listening on http://0.0.0.0:${PORT}`);
});
