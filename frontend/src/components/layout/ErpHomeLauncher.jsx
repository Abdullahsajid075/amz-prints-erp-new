import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, rectSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCcw } from 'lucide-react';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { ERP_HOME_APPS } from '@/utils/erpApps';
import { ordersAPI, productsAPI, purchasesAPI, customersAPI } from '@/services/api';
import { isOpenOrder } from '@/utils/constants';
import { buildPurchaseNeeds, buildLowQuantityAlerts } from '@/utils/purchaseNeeds';
import { countOpenCrmQueries } from '@/utils/crmStages';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import HomeSurvey from './HomeSurvey';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function SortableApp({ app, badge, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });
  const Icon = app.icon;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
    cursor: isDragging ? 'grabbing' : undefined,
  };
  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className="erp-home-app cursor-grab active:cursor-grabbing touch-none"
      onClick={() => onOpen(app)}
      data-testid={`erp-home-app-${app.id}`}
      aria-roledescription="Draggable app icon. Press space or enter to pick up, arrow keys to move."
      {...attributes}
      {...listeners}
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
}

/**
 * Full-width Apps strip. Used on the dashboard above the original KPI view.
 *
 * `orders`/`customers`/`purchases` are optional pre-fetched lists. Dashboard
 * (the only current caller) already fetches all three for its own KPIs on
 * every page load — passing them down here instead of refetching avoids
 * firing duplicate, uncached /orders and /purchases requests (and a second
 * /customers request) on every single dashboard visit.
 *
 * `useSharedData` tells this component those lists are being supplied by the
 * parent and it should NOT fall back to fetching on its own even before the
 * parent's fetch resolves (the lists start out `undefined` for one render
 * while the parent's request is in flight) — without this flag, this
 * component's own mount effect would race ahead and self-fetch anyway before
 * the parent had a chance to pass the real arrays down, defeating the point.
 * Badge counts simply stay at 0 until the shared lists arrive. When
 * `useSharedData` is not set (e.g. a future standalone usage with no
 * parent supplying data), each list is fetched independently so the
 * component still works on its own.
 */
const ErpHomeLauncher = ({
  orders: ordersProp, customers: customersProp, purchases: purchasesProp, useSharedData = false,
} = {}) => {
  const navigate = useNavigate();
  const { user, canAccessModule } = useAuth();
  const { primary } = useBrand();
  const name = getUserDisplayName(user);
  const accent = primary || '#ff6d00';

  const [counts, setCounts] = useState({ orders: 0, acks: 0, crm: 0 });

  const apps = useMemo(() => ERP_HOME_APPS.filter((app) => canAccessModule(app.module)), [canAccessModule]);
  const appsById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const defaultGroups = useMemo(() => ({
    main: apps.filter((a) => a.group === 'main').map((a) => a.id),
    more: apps.filter((a) => a.group === 'more').map((a) => a.id),
  }), [apps]);

  const { groups, reorderGroup, resetLayout, isCustomized } = useDashboardLayout(user?.id, defaultGroups);
  const main = (groups.main || []).map((id) => appsById.get(id)).filter(Boolean);
  const more = (groups.more || []).map((id) => appsById.get(id)).filter(Boolean);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const hasOrdersProp = Array.isArray(ordersProp);
  const hasCustomersProp = Array.isArray(customersProp);
  const hasPurchasesProp = Array.isArray(purchasesProp);
  // When the parent promises shared data, only fetch a given list ourselves
  // once it's clear the parent isn't going to supply it (it already has, or
  // never will because this list isn't one it tracks). Until then, skip —
  // don't race the parent's own in-flight request with a duplicate one.
  const skipOrdersFetch = useSharedData && !hasOrdersProp;
  const skipCustomersFetch = useSharedData && !hasCustomersProp;
  const skipPurchasesFetch = useSharedData && !hasPurchasesProp;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next = { orders: 0, acks: 0, crm: 0 };
      try {
        if (canAccessModule('orders') && !skipOrdersFetch) {
          const list = hasOrdersProp ? ordersProp : asArray((await ordersAPI.getAll()).data);
          next.orders = list.filter(isOpenOrder).length;
        }
      } catch { /* keep 0 */ }
      try {
        if (canAccessModule('crm') && !skipCustomersFetch) {
          const list = hasCustomersProp ? customersProp : asArray((await customersAPI.getAll()).data);
          next.crm = countOpenCrmQueries(list);
        }
      } catch { /* keep 0 */ }
      try {
        if (canAccessModule('acknowledgments') && !(skipOrdersFetch || skipPurchasesFetch)) {
          const ordersPromise = hasOrdersProp ? Promise.resolve(ordersProp) : ordersAPI.getAll().then((r) => asArray(r.data));
          const purchasesPromise = hasPurchasesProp
            ? Promise.resolve(purchasesProp)
            : purchasesAPI.getAll().then((r) => asArray(r.data)).catch(() => []);
          const [orderList, productList, purchaseList] = await Promise.all([
            ordersPromise,
            productsAPI.getAll().then((r) => asArray(r.data)),
            purchasesPromise,
          ]);
          next.acks = buildPurchaseNeeds({ orders: orderList, products: productList, purchases: purchaseList }).length
            + buildLowQuantityAlerts({ products: productList }).length;
        }
      } catch { /* keep 0 */ }
      if (!cancelled) setCounts(next);
    };
    load();
    return () => { cancelled = true; };
  }, [
    canAccessModule, hasOrdersProp, ordersProp, hasCustomersProp, customersProp, hasPurchasesProp, purchasesProp,
    skipOrdersFetch, skipCustomersFetch, skipPurchasesFetch,
  ]);

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

  const handleDragEnd = (group) => (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderGroup(group, active.id, over.id);
  };

  const renderGrid = (list, group) => (
    <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(group)}>
      <SortableContext items={list.map((app) => app.id)} strategy={rectSortingStrategy}>
        <div className="erp-home-grid">
          {list.map((app) => (
            <SortableApp key={app.id} app={app} badge={badgeFor(app)} onOpen={openApp} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <div className="erp-home-page" data-testid="erp-home-launcher" aria-label="ERP apps">
      <div className="erp-home-glow" />

      <h1 className="erp-home-headline">Welcome, {name}</h1>
      <p className="erp-home-sub">Open an app, or scroll for the operations dashboard</p>

      <HomeSurvey user={user} autoStart />

      <div className="erp-home-panel" data-testid="erp-home-window">
        <div
          className="erp-home-panel-bar"
          style={{ background: `linear-gradient(90deg, ${accent} 0%, #0747a3 100%)` }}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-white/90">Apps</p>
          {isCustomized && (
            <button
              type="button"
              onClick={resetLayout}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/80 hover:text-white"
              data-testid="erp-home-reset-layout"
              title="Reset to the default app order"
            >
              <RotateCcw className="h-3 w-3" /> Reset layout
            </button>
          )}
        </div>

        <div className="erp-home-panel-body">
          {renderGrid(main, 'main')}
          {more.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mt-5 mb-3">More</p>
              {renderGrid(more, 'more')}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErpHomeLauncher;
