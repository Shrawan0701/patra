import React, { useEffect, useRef, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { CurrencyCode, PRICING_PLANS, PlanId, detectRegionalCurrency } from '@patra/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  visible: boolean;
  projectId?: string;
  subscriptionOnly?: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export function PaywallModal({ visible, projectId, subscriptionOnly = false, onClose, onUnlocked }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { refreshUser } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>(() => detectRegionalCurrency());
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    void api
      .getPlans()
      .then((res) => {
        if (res.detectedCurrency) setCurrency(res.detectedCurrency);
      })
      .catch(() => {});
  }, [visible]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (visible && !dialog.open) {
      dialog.showModal();
    } else if (!visible && dialog.open) {
      dialog.close();
    }
  }, [visible]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      if (visible) onClose();
    };
    dialog.addEventListener('close', handleClose);

    let cleanupOutside: (() => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onDown);
      dialog.addEventListener('pointerup', onUp);
      cleanupOutside = () => {
        dialog.removeEventListener('pointerdown', onDown);
        dialog.removeEventListener('pointerup', onUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      cleanupOutside?.();
    };
  }, [onClose, visible]);

  const handleCheckout = async (planId: PlanId) => {
    setBusyPlan(planId);
    setError(null);
    setMessage(null);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}`;
      const session = await api.createCheckout({ planId, currency, projectId, returnUrl });
      if (session.mode === 'dev_sandbox') {
        await api.devConfirmPayment(session.paymentId);
        await refreshUser();
        onUnlocked();
        return;
      }
      window.location.assign(session.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout');
      setBusyPlan(null);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="patra-dialog"
      aria-labelledby="paywall-title"
      {...({ closedby: 'any' } as Record<string, unknown>)}
    >
      <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span className="badge-pill">
            <Sparkles size={13} /> Patra Download Pass
          </span>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div>
          <h1 id="paywall-title" style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700 }}>
            {subscriptionOnly ? 'Upgrade for Pro Studio Features' : 'Unlock Your Download'}
          </h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>
            {subscriptionOnly
              ? 'Wax-Seal Envelope Openings & 3D Atmosphere require Monthly Creator or Yearly All-Access. Design & preview everything live for free.'
              : 'Design and preview every template freely. Unlock watermark-free videos & cards when ready to download.'}
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {message && (
          <div className="success-banner" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span>{message}</span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                await refreshUser();
                onUnlocked();
              }}
            >
              Refresh Status &amp; Download
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PRICING_PLANS.filter((p) => !subscriptionOnly || p.id !== 'SINGLE_PASS').map((plan) => {
            const priceText = currency === 'INR' ? `₹${plan.priceInr}` : `$${plan.priceUsd}`;
            const isPopular = Boolean(plan.badge);
            const periodLabel =
              plan.billingCycle === 'monthly'
                ? 'per month'
                : plan.billingCycle === 'yearly'
                ? 'per year'
                : 'one-time pass';
            return (
              <div
                key={plan.id}
                style={{
                  borderRadius: 6,
                  padding: 16,
                  border: isPopular ? '2px solid var(--ink)' : '1px solid var(--border-strong)',
                  background: isPopular ? 'var(--bg-subtle)' : 'var(--bg-page)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{plan.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 22 }}>{priceText}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{periodLabel}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {plan.features.slice(0, 3).map((feat) => (
                    <span
                      key={feat}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-soft)' }}
                    >
                      <Check size={13} color="var(--accent)" /> {feat}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className={`btn ${isPopular ? 'btn-primary' : ''}`}
                  disabled={busyPlan !== null}
                  onClick={() => void handleCheckout(plan.id)}
                >
                  {busyPlan === plan.id ? 'Starting Checkout...' : `Continue with ${plan.name} (${priceText})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
