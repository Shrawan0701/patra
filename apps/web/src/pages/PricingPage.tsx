import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { CurrencyCode, PRICING_PLANS, detectRegionalCurrency } from '@patra/shared';
import { MarketingLayout } from '../components/MarketingLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function PricingPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>(() => detectRegionalCurrency());

  useEffect(() => {
    void api
      .getPlans()
      .then((res) => {
        if (res.detectedCurrency) setCurrency(res.detectedCurrency);
      })
      .catch(() => {});
  }, []);

  return (
    <MarketingLayout>
      <section className="ol-hero" style={{ minHeight: 'auto', padding: '132px 0 48px' }}>
        <div className="container">
          <span className="badge-pill">
            <Sparkles size={13} /> Simple Pricing
          </span>
          <h1 className="ol-hero-title" style={{ marginTop: 14 }}>
            Flexible plans for every celebration.
          </h1>
          <p className="ol-hero-sub" style={{ maxWidth: 620 }}>
            Choose a single-event pass or a studio subscription designed around your upcoming calendar.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pricing-grid">
            {PRICING_PLANS.map((plan) => {
              const price = currency === 'INR' ? `₹${plan.priceInr}` : `$${plan.priceUsd}`;
              const isPopular = Boolean(plan.badge);
              const periodLabel =
                plan.billingCycle === 'monthly'
                  ? 'per month'
                  : plan.billingCycle === 'yearly'
                  ? 'per year'
                  : 'one-time';
              return (
                <div key={plan.id} className={`price-card ${isPopular ? 'popular' : ''}`}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <strong style={{ fontSize: 19 }}>{plan.name}</strong>
                      {plan.badge && <span className="badge-pill">{plan.badge}</span>}
                    </div>
                    <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-soft)' }}>{plan.description}</p>
                    <div className="price-amount">
                      {price}{' '}
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>
                        / {periodLabel}
                      </span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
                      {plan.features.map((feat) => (
                        <li key={feat} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Check size={15} color="var(--accent)" /> <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link to={user ? '/app/profile' : '/register'} className={`btn ${isPopular ? 'btn-primary' : ''} btn-lg`}>
                    {user ? 'Open Billing & Plans' : 'Create Free Account'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
