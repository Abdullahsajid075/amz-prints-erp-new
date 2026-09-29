import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { useHomeLauncher } from '@/context/HomeLauncherContext';
import { ERP_HOME_APPS, ERP_LEGAL_NAME } from '@/utils/erpApps';

const ErpHomeLauncher = () => {
  const navigate = useNavigate();
  const { user, canAccessModule } = useAuth();
  const { company, primary } = useBrand();
  const { open, leaving, closeHome } = useHomeLauncher();
  const name = getUserDisplayName(user);
  const accent = primary || '#ff6d00';
  const legal = ERP_LEGAL_NAME;
  const brandName = company?.name || legal;

  if (!open && !leaving) return null;

  const apps = ERP_HOME_APPS.filter((app) => canAccessModule(app.module));
  const main = apps.filter((a) => a.group === 'main');
  const more = apps.filter((a) => a.group === 'more');

  const openApp = (app) => {
    navigate(app.path);
    closeHome();
  };

  return (
    <div
      className={`erp-home-overlay ${leaving ? 'erp-home-leave' : 'erp-home-enter'}`}
      data-testid="erp-home-launcher"
      role="dialog"
      aria-label="ERP home"
    >
      <div className="erp-home-glow" />

      <div className="erp-home-topbrand">
        {company?.logo ? (
          <img src={company.logo} alt="" className="h-8 w-auto max-w-[88px] object-contain brightness-0 invert" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-display font-bold">
            A
          </div>
        )}
        <div className="min-w-0 text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/75">ERP Apps</p>
          <p className="font-display font-bold text-white text-sm leading-tight truncate">{legal}</p>
        </div>
      </div>

      <h1 className="erp-home-headline">
        Welcome, {name}
      </h1>
      <p className="erp-home-sub">Open any app — every module stays the same</p>

      <div className="hidden lg:flex erp-home-float erp-home-float-left">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Customer</p>
        <p className="text-lg font-display font-bold text-white mt-1">Balances</p>
        <p className="text-xs text-white/70 mt-1">Open Customers from Apps</p>
      </div>
      <div className="hidden lg:flex erp-home-float erp-home-float-right">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Bills</p>
        <p className="text-lg font-display font-bold text-white mt-1">Invoices</p>
        <p className="text-xs text-white/70 mt-1">Orange + blue print set</p>
      </div>
      <div className="hidden lg:flex erp-home-float erp-home-float-expense">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Expense</p>
        <div className="erp-home-bars" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
      </div>

      <div className="erp-home-phone" data-testid="erp-home-window">
        <div className="erp-home-phone-bar" style={{ background: `linear-gradient(90deg, ${accent} 0%, #0747a3 100%)` }}>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/80">Welcome</p>
            <h2 className="font-display text-lg font-bold text-white truncate leading-tight">
              {name}
            </h2>
          </div>
          <button
            type="button"
            className="erp-home-close"
            onClick={closeHome}
            aria-label="Hide home"
            data-testid="erp-home-close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="erp-home-phone-body">
          <div className="flex items-center gap-2 mb-3">
            {company?.logo ? (
              <img src={company.logo} alt="" className="h-9 w-auto max-w-[72px] object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold" style={{ backgroundColor: accent }}>
                A
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display font-bold text-[13px] leading-tight" style={{ color: '#0747a3' }}>{legal}</p>
              <p className="text-[10px] text-slate-500 truncate">{brandName}</p>
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">Apps</p>
          <div className="grid grid-cols-3 gap-2">
            {main.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  type="button"
                  className="erp-home-app"
                  onClick={() => openApp(app)}
                  data-testid={`erp-home-app-${app.id}`}
                >
                  <span className="erp-home-app-icon" style={{ backgroundColor: `${app.tint}18`, color: app.tint }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="erp-home-app-label">{app.label}</span>
                </button>
              );
            })}
          </div>

          {more.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mt-4 mb-2">More</p>
              <div className="grid grid-cols-3 gap-2">
                {more.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className="erp-home-app"
                      onClick={() => openApp(app)}
                      data-testid={`erp-home-app-${app.id}`}
                    >
                      <span className="erp-home-app-icon" style={{ backgroundColor: `${app.tint}18`, color: app.tint }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="erp-home-app-label">{app.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="erp-home-legal">{legal}</p>
    </div>
  );
};

export default ErpHomeLauncher;
