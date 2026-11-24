import React, { useEffect, useState } from 'react';
import { Check, Copy, Gift, Users } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { api } from '../lib/api';

export function ReferPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.getReferralStats>> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void api.getReferralStats().then(setStats).catch(() => setStats(null));
  }, []);

  const inviteLink = stats ? `${window.location.origin}/register?ref=${stats.referralCode}` : '';

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(`${stats?.shareMessage || ''}\nJoin with my code ${stats?.referralCode}: ${inviteLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 880 }}>
        <div>
          <span className="badge-pill">
            <Gift size={13} /> Referral Program
          </span>
          <h1 style={{ margin: '10px 0 4px', fontSize: 30, fontWeight: 800 }}>Invite Friends, Earn Free 3D Downloads</h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14.5 }}>
            Whenever a friend signs up with your referral code and unlocks their first paid download or plan, you receive +1 free 4K download credit.
          </p>
        </div>

        <div className="card-glass" style={{ background: 'linear-gradient(155deg, var(--accent-soft), var(--bg-cream))' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>YOUR REFERRAL CODE</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.04em' }}>
              {stats?.referralCode || 'Loading...'}
            </div>
            <button type="button" className="btn btn-primary" onClick={() => void copyInvite()} disabled={!stats}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied Invite Link' : 'Copy Invite Link'}
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          <div className="card-glass">
            <div className="metric-val">{stats?.exportCredits ?? 0}</div>
            <div className="metric-label">Available Download Credits</div>
          </div>
          <div className="card-glass">
            <div className="metric-val">{stats?.totalReferred ?? 0}</div>
            <div className="metric-label">Friends Joined</div>
          </div>
          <div className="card-glass">
            <div className="metric-val">{stats?.freeExportsEarned ?? 0}</div>
            <div className="metric-label">Free Downloads Earned</div>
          </div>
        </div>

        <div className="card-glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: 18 }}>Referred Friends</h2>
          </div>
          {!stats || stats.friends.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>
              No friends referred yet. Share your link above to start earning free downloads.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.friends.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'var(--bg-paper)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Joined {new Date(f.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="badge-pill">{f.hasPaid ? '+1 Earned' : 'Designing'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
