import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { ERP_HOME_APPS, ERP_LEGAL_NAME } from '@/utils/erpApps';
import { ordersAPI, productsAPI, purchasesAPI, customersAPI } from '@/services/api';
import { isOpenOrder } from '@/utils/constants';
import { buildPurchaseNeeds, buildLowQuantityAlerts } from '@/utils/purchaseNeeds';
import { countOpenCrmQueries } from '@/utils/crmStages';
import BrandLockup from './BrandLockup';
import HomeSurvey from './HomeSurvey';

/** Full-width Apps strip. Used on the dashboard above the original KPI view. */
const ErpHomeLauncher = () => {
  const navigate = useNavigate();
  const { user, canAccessModule } = useAuth();
  const { company, primary } = useBrand();
  const name = getUserDisplayName(user);
  const accent = primary || '#ff6d00';
  const legal = ERP_LEGAL_NAME;

  const [counts, setCounts] = useState({ orders: 0, acks: 0, crm: 0 });

  const apps = ERP_HOME_APPS.filter((app) => canAccessModule(app.module));
  const main = apps.filter((a) => a.group === 'main');
  const more = apps.filter((a) => a.group === 'more');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next = { orders: 0, acks: 0, crm: 0 };
      try {
        if (canAccessModule('orders')) {
          const res = await ordersAPI.getAll();
          const list = Array.isArray(res.data) ? res.data : [];
          next.orders = list.filter(isOpenOrder).length;
        }
      } catch { /* keep 0 */ }
      try {
        if (canAccessModule('crm')) {
          const res = await customersAPI.getAll();
          next.crm = countOpenCrmQueries(Array.isArray(res.data) ? res.data : []);
        }
      } catch { /* keep 0 */ }
      try {
        if (canAccessModule('acknowledgments')) {
          const [ordRes, prodRes, poRes] = await Promise.all([
            ordersAPI.getAll(),
            productsAPI.getAll(),
            purchasesAPI.getAll().catch(() => ({ data: [] })),
          ]);
          next.acks = buildPurchaseNeeds({
            orders: Array.isArray(ordRes.data) ? ordRes.data : [],
            products: Array.isArray(prodRes.data) ? prodRes.data : [],
            purchases: Array.isArray(poRes.data) ? poRes.data : [],
          }).length
            + buildLowQuantityAlerts({ products: Array.isArray(prodRes.data) ? prodRes.data : [] }).length;
        }
      } catch { /* keep 0 */ }
      if (!cancelled) setCounts(next);
    };
    load();
    return () => { cancelled = true; };
  }, [canAccessModule]);

  const badgeFor = (app) => {
    if (app.id === 'orders') return { n: counts.orders, color: '#0747a3' };
    if (app.id === 'acks') return { n: counts.acks, color: '#ff6d00' };
    if (app.id === 'crm') return { n: counts.crm, color: '#7c3aed' };
    return { n: 0, color: '#0747a3' };
  };

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
        const badge = badgeFor(app);
        return (
          <button
            key={app.id}
            type="button"
            className="erp-home-app"
            onClick={() => openApp(app)}
            data-testid={`erp-home-app-${app.id}`}
          >
            {badge.n > 0 && (
              <span
                className="erp-home-app-badge"
                style={{ backgroundColor: badge.color }}
                title={`${badge.n}`}
                data-testid={`erp-home-badge-${app.id}`}
              >
                {badge.n > 99 ? '99+' : badge.n}
              </span>
            )}
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

      <div className="erp-home-toplogo">
        <BrandLockup company={company} accent={accent} invert />
      </div>

      <h1 className="erp-home-headline">Welcome, {name}</h1>
      <p className="erp-home-sub">Open an app, or scroll for the operations dashboard</p>

      <HomeSurvey user={user} autoStart />

      <div className="erp-home-panel" data-testid="erp-home-window">
        <div className="erp-home-panel-bar" style={{ background: `linear-gradient(90deg, ${accent} 0%, #0747a3 100%)` }}>
          <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-white/90">Apps</p>
          <p className="text-[11px] font-semibold text-white/80 truncate">{legal}</p>
        </div>

        <div className="erp-home-panel-body">
          {renderGrid(main)}
          {more.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mt-5 mb-3">More</p>
              {renderGrid(more)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErpHomeLauncher;
