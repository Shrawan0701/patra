import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkles, X, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface PaymentReturnModalProps {
  onVerified?: () => void;
}

export function PaymentReturnModal({ onVerified }: PaymentReturnModalProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const paymentId = searchParams.get('paymentId');
  const isReturn = searchParams.get('checkout') === 'return' || Boolean(paymentId);

  const [state, setState] = useState<'idle' | 'verifying' | 'succeeded' | 'failed'>('idle');
  const [details, setDetails] = useState<{
    planName: string;
    exportsRemaining: number;
    credits: number;
    renewsAt: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isReturn || !paymentId) return;

    let cancelled = false;
    setState('verifying');

    const pollStatus = async () => {
      for (let attempt = 0; attempt < 15; attempt++) {
        if (cancelled) return;
        try {
          const res = await api.getPaymentStatus(paymentId);
          if (res.status === 'SUCCEEDED') {
            await refreshUser();
            if (cancelled) return;
            setDetails({
              planName: res.planName,
              exportsRemaining: res.user?.planExportsRemaining ?? 0,
              credits: res.user?.exportCredits ?? 0,
              renewsAt: res.user?.planRenewsAt ?? null,
            });
            setState('succeeded');
            onVerified?.();
            return;
          }
          if (res.status === 'FAILED') {
            setState('failed');
            return;
          }
        } catch {
          // Retry while webhook settles
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) {
        await refreshUser();
        setState('failed');
      }
    };

    void pollStatus();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, isReturn]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state !== 'idle' && !dialog.open) {
      dialog.showModal();
    } else if (state === 'idle' && dialog.open) {
      dialog.close();
    }
  }, [state]);

  const dismiss = () => {
    setState('idle');
    const next = new URLSearchParams(searchParams);
    next.delete('paymentId');
    next.delete('checkout');
    next.delete('status');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      dialog.returnValue = '';
      if (state !== 'idle') dismiss();
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, searchParams]);

  return (
    <dialog ref={dialogRef} className="patra-dialog" aria-labelledby="payment-return-title">
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge-pill">
            <Sparkles size={13} /> Payment Verification
          </span>
          {state !== 'verifying' && (
            <button type="button" className="btn btn-sm" onClick={dismiss} aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {state === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '16px 0' }}>
            <Loader2 size={36} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
            <h1 id="payment-return-title" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              Confirming your payment...
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
              Please wait a moment while we activate your Patra plan in this tab.
            </p>
          </div>
        )}

        {state === 'succeeded' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={36} color="var(--accent)" />
              <div>
                <h1 id="payment-return-title" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                  Plan Activated Successfully!
                </h1>
                <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  {details?.planName} is now active on your account.
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 6,
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-strong)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 14,
              }}
            >
              <div>
                Available downloads: <strong>{(details?.exportsRemaining ?? 0) + (details?.credits ?? 0)}</strong>
              </div>
              {details?.renewsAt && (
                <div>
                  Active until:{' '}
                  <strong>
                    {new Date(details.renewsAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              )}
            </div>

            <button type="button" className="btn btn-primary btn-lg" onClick={dismiss}>
              Continue
            </button>
          </div>
        )}

        {state === 'failed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle size={34} color="#c83e37" />
              <div>
                <h1 id="payment-return-title" style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>
                  Payment Not Confirmed Yet
                </h1>
                <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  If funds were deducted, your plan will activate shortly. You can check notifications in Account &amp; Plans.
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-lg" onClick={dismiss}>
              Close
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
