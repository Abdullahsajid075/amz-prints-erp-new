import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardList, X } from 'lucide-react';

const SURVEY_PREFIX = 'amz_erp_home_survey_v1';

/**
 * Guided-tour steps. Each step is gated behind `module` — a user who can't
 * access that module never sees (or can navigate into) that step, so the
 * tour never advertises or links to data the current user isn't authorized
 * to see (see `filterSteps` below).
 */
const STEPS = [
  {
    id: 'balances',
    module: 'customers',
    kicker: 'Customers',
    title: 'Customer balances',
    body: 'Open Customers to see who owes money and who has credit. This is the live receivables list.',
    action: 'Open Customers',
    path: '/customers',
    color: '#0747a3',
    bars: [42, 68, 36, 88, 54],
    place: { top: '34%', left: '1.5rem', right: 'auto', bottom: 'auto' },
    cardClass: 'erp-survey-card-balances',
  },
  {
    id: 'bills',
    module: 'invoices',
    kicker: 'Bills',
    title: 'Invoices',
    body: 'Create and print invoices in orange + blue. Paid, partial, and due amounts stay on the same document.',
    action: 'Open Invoices',
    path: '/invoices',
    color: '#ff6d00',
    bars: [55, 30, 78, 46, 92],
    place: { top: '26%', right: '1.5rem', left: 'auto', bottom: 'auto' },
    cardClass: 'erp-survey-card-bills',
  },
  {
    id: 'expense',
    module: 'accounts',
    kicker: 'Spend',
    title: 'Expenses',
    body: 'Record cash out here. The Overview net position uses Payments in minus Payments out.',
    action: 'Open Expenses',
    path: '/accounts/expenses',
    color: '#0EA5E9',
    bars: [28, 60, 44, 80, 50],
    place: { bottom: '6%', right: '2rem', left: 'auto', top: 'auto' },
    cardClass: 'erp-survey-card-expense',
  },
];

function surveyKey(user) {
  const id = String(user?.id || user?.email || user?.username || 'staff').trim().toLowerCase();
  return `${SURVEY_PREFIX}:${id}`;
}

export function hasCompletedHomeSurvey(user) {
  try {
    return localStorage.getItem(surveyKey(user)) === '1';
  } catch {
    return false;
  }
}

export function markHomeSurveyDone(user) {
  try { localStorage.setItem(surveyKey(user), '1'); } catch { /* ignore */ }
}

/**
 * Permission-aware guided tour, mountable once in the app shell so its
 * entry point (the floating "Survey" pill) and overlay are reachable from
 * every authenticated screen — not just the home launcher. Steps whose
 * `module` the current user can't access are dropped entirely, and if that
 * leaves nothing to show, the whole thing renders nothing (no button, no
 * data about modules the user isn't authorized to see).
 *
 * `originModule` — the module key for whatever screen the Survey button was
 * opened from (see MainLayout). When a step matches that module, the tour
 * opens straight to it instead of always restarting at step 0, so the tour
 * stays contextual to where the user asked for help from.
 */
const AppSurvey = ({ user, canAccessModule, autoStart = false, originModule = null }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => {
    const canSee = typeof canAccessModule === 'function' ? canAccessModule : () => true;
    return STEPS.filter((s) => !s.module || canSee(s.module));
  }, [canAccessModule]);

  const current = steps[step] || steps[0];
  const last = step >= steps.length - 1;

  useEffect(() => {
    if (!autoStart) return;
    if (!steps.length) return;
    if (hasCompletedHomeSurvey(user)) return;
    setOpen(true);
    setStep(0);
  }, [autoStart, user, steps.length]);

  const start = () => {
    const matchIndex = originModule ? steps.findIndex((s) => s.module === originModule) : -1;
    setStep(matchIndex >= 0 ? matchIndex : 0);
    setOpen(true);
  };

  const finish = () => {
    markHomeSurveyDone(user);
    setOpen(false);
    setStep(0);
  };

  const next = () => {
    if (last) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  if (!steps.length) return null;

  return (
    <>
      <button
        type="button"
        className="erp-survey-launch"
        onClick={start}
        data-testid="erp-home-survey"
        title="Guided tour"
      >
        <ClipboardList className="h-4 w-4" />
        Survey
      </button>

      {open && (
        <div className="erp-survey-stage" data-testid="erp-survey-stage">
          {steps.map((card, i) => {
            const active = step === i;
            return (
              <article
                key={card.id}
                className={`erp-survey-card ${card.cardClass} ${active ? 'is-active' : 'is-dim'}`}
                style={{
                  background: `linear-gradient(160deg, ${card.color} 0%, ${card.color}bb 100%)`,
                  zIndex: active ? 34 : 28,
                  ...card.place,
                }}
                data-testid={`erp-survey-card-${card.id}`}
              >
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">{card.kicker}</p>
                <p className="text-lg font-display font-bold text-white mt-1">{card.title}</p>
                {active && <p className="text-xs text-white/90 mt-2 leading-relaxed">{card.body}</p>}
                <div className="erp-home-bars" aria-hidden="true">
                  {card.bars.map((h, idx) => (
                    <span key={idx} style={{ height: `${h}%`, background: 'rgba(255,255,255,0.92)' }} />
                  ))}
                </div>
                {active && (
                  <button
                    type="button"
                    className="erp-survey-card-go"
                    onClick={() => navigate(card.path)}
                  >
                    {card.action}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {open && current && (
        <div className="erp-survey-overlay" data-testid="erp-survey-overlay">
          <div className="erp-survey-dock">
            <p className="text-xs font-semibold text-white/80">
              Step {step + 1} of {steps.length}
            </p>
            <p className="font-display font-bold text-white text-sm">{current.title}</p>
            <div className="flex items-center gap-2 mt-3">
              <button type="button" className="erp-survey-btn ghost" onClick={finish} data-testid="erp-survey-skip">
                <X className="h-3.5 w-3.5" />
                Skip
              </button>
              <button type="button" className="erp-survey-btn" onClick={next} data-testid="erp-survey-next">
                {last ? 'Finish' : 'Next'}
                {!last && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppSurvey;
