import React, { useEffect, useState } from 'react';
import { Bell, CreditCard, Monitor, Moon, Sparkles, Sun, XCircle } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { PaymentReturnModal } from '../components/PaymentReturnModal';
import { PaywallModal } from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { ThemePreference, useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { preference, setPreference } = useTheme();
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof api.getBillingActivity>> | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadActivity = async () => {
    try {
      const res = await api.getBillingActivity();
      setActivity(res);
    } catch {
      setActivity(null);
    }
  };

  useEffect(() => {
    void loadActivity();
  }, []);

  const handleCancelAutoRenew = async () => {
    if (!window.confirm('Cancel auto-renewal? Your remaining downloads remain active until the end of your current billing period.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await api.cancelSubscription();
      setNotice(res.message);
      await refreshUser();
      await loadActivity();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to cancel auto-renewal');
    } finally {
      setCancelling(false);
    }
  };

  const handleMarkRead = async () => {
    await api.markNotificationsRead();
    await loadActivity();
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960 }}>
        <div>
          <span className="badge-pill">Account & Billing</span>
          <h1 style={{ margin: '10px 0 4px', fontSize: 30, fontWeight: 800 }}>
            {user?.name || 'Creator Account'}
          </h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>{user?.email}</p>
        </div>

        {notice && <div className="success-banner">{notice}</div>}

        <div className="bento-2">
          {/* Subscription Card */}
          <div className="card-glass" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge-pill">
                  <Sparkles size={13} /> Current Plan
                </span>
                {user?.planRenewsAt && user.planTier !== 'NONE' && (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {user.autoRenewCancelled ? 'Ends on ' : 'Renews '}
                    {new Date(user.planRenewsAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h2 style={{ margin: 0, fontSize: 22 }}>
                {user?.planTier === 'MONTHLY_CREATOR'
                  ? 'Monthly Creator Pass'
                  : user?.planTier === 'YEARLY_ALL_ACCESS'
                  ? 'Yearly Studio All-Access'
                  : 'Single Download / Free Mode'}
              </h2>
              {(() => {
                const planRemaining = Math.max(0, user?.planExportsRemaining ?? 0);
                const singleCredits = Math.max(0, user?.exportCredits ?? 0);
                const onPaidPlan = Boolean(user?.planTier && user.planTier !== 'NONE');
                return (
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                    {onPaidPlan ? (
                      <>
                        Plan downloads remaining: <strong>{planRemaining}</strong>
                        {singleCredits > 0 && (
                          <>
                            {' '}
                            · Single download credits: <strong>{singleCredits}</strong>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        Single download credits: <strong>{singleCredits}</strong>
                      </>
                    )}
                  </p>
                );
              })()}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-primary" onClick={() => setPaywallOpen(true)}>
                <CreditCard size={15} /> Upgrade / Buy Downloads
              </button>

              {user && user.planTier !== 'NONE' && !user.autoRenewCancelled && (
                <button
                  type="button"
                  className="btn"
                  disabled={cancelling}
                  onClick={() => void handleCancelAutoRenew()}
                >
                  <XCircle size={15} /> {cancelling ? 'Cancelling...' : 'Cancel Auto-Renewal'}
                </button>
              )}
            </div>
          </div>

          {/* Appearance Settings Surface (3-state control per dark-mode-toggle guide) */}
          <div className="card-glass" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Display Appearance</h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)' }}>
                Follow your system appearance automatically or pin Light or Dark mode for evening editing.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(
                [
                  ['system', 'System', Monitor],
                  ['light', 'Light', Sun],
                  ['dark', 'Dark', Moon],
                ] as [ThemePreference, string, typeof Monitor][]
              ).map(([val, label, Icon]) => (
                <button
                  key={val}
                  type="button"
                  className={`chip-btn ${preference === val ? 'active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px' }}
                  onClick={() => setPreference(val)}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications & Payment History */}
        <div className="bento-2">
          <div className="card-glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={18} color="var(--accent)" />
                <h2 style={{ margin: 0, fontSize: 18 }}>
                  Notifications ({activity?.unreadCount ?? 0} unread)
                </h2>
              </div>
              {(activity?.unreadCount ?? 0) > 0 && (
                <button type="button" className="btn btn-sm" onClick={() => void handleMarkRead()}>
                  Mark all read
                </button>
              )}
            </div>

            {!activity || activity.notifications.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13.5 }}>No billing alerts yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {activity.notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: n.isRead ? 'var(--bg-paper)' : 'var(--accent-soft)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{n.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: 18 }}>Payment History</h2>
            </div>

            {!activity || activity.payments.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13.5 }}>No payments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {activity.payments.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: 'var(--bg-paper)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.planName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>
                        {p.currency} {p.amount}
                      </div>
                      <span className="badge-pill" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PaywallModal
        visible={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={() => {
          setPaywallOpen(false);
          void refreshUser();
          void loadActivity();
        }}
      />

      <PaymentReturnModal
        onVerified={() => {
          void refreshUser();
          void loadActivity();
        }}
      />
    </AppLayout>
  );
}
