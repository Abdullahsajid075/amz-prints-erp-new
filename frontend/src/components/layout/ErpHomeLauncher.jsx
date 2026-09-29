import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { ERP_HOME_APPS, ERP_LEGAL_NAME } from '@/utils/erpApps';

/** Full-width Apps strip. Used on the dashboard above the original KPI view. */
const ErpHomeLauncher = () => {
  const navigate = useNavigate();
  const { user, canAccessModule } = useAuth();
  const { company, primary } = useBrand();
  const name = getUserDisplayName(user);
  const accent = primary || '#ff6d00';
  const legal = ERP_LEGAL_NAME;
  const brandName = company?.name || legal;

  const apps = ERP_HOME_APPS.filter((app) => canAccessModule(app.module));
  const main = apps.filter((a) => a.group === 'main');
  const more = apps.filter((a) => a.group === 'more');

  const openApp = (app) => {
    if (app.id === 'overview') {
      const el = document.getElementById('dashboard-ops');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    navigate(app.path);
  };

  const renderGrid = (list) => (
    <div className="erp-home-grid">
      {list.map((app) => {
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
              <Icon className="h-7 w-7" />
            </span>
            <span className="erp-home-app-label">{app.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="erp-home-page" data-testid="erp-home-launcher" aria-label="ERP apps">
      <div className="erp-home-glow" />

      <div className="erp-home-topbrand">
        {company?.logo ? (
          <img src={company.logo} alt="" className="h-8 w-auto max-w-[88px] object-contain brightness-0 invert" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-display font-bold">
            {(brandName || 'A').charAt(0)}
          </div>
        )}
        <div className="min-w-0 text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/75">Dashboard</p>
          <p className="font-display font-bold text-white text-sm leading-tight truncate">{legal}</p>
        </div>
      </div>

      <h1 className="erp-home-headline">Welcome, {name}</h1>
      <p className="erp-home-sub">Open an app, or scroll for the operations dashboard</p>

      <div className="erp-home-panel" data-testid="erp-home-window">
        <div className="erp-home-panel-bar" style={{ background: `linear-gradient(90deg, ${accent} 0%, #0747a3 100%)` }}>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/80">Welcome</p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white truncate leading-tight">{name}</h2>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {company?.logo ? (
              <img src={company.logo} alt="" className="h-10 w-auto max-w-[88px] object-contain bg-white rounded-md p-0.5" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                A
              </div>
            )}
            <div className="min-w-0 hidden sm:block">
              <p className="font-display font-bold text-sm leading-tight text-white">{legal}</p>
              <p className="text-[10px] text-white/75 truncate">{brandName}</p>
            </div>
          </div>
        </div>

        <div className="erp-home-panel-body">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3">Apps</p>
          {renderGrid(main)}
          {more.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mt-5 mb-3">More</p>
              {renderGrid(more)}
            </>
          )}
        </div>
      </div>

      <p className="erp-home-legal">{legal}</p>
    </div>
  );
};

export default ErpHomeLauncher;
