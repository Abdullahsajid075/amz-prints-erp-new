import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { productsAPI, purchasesAPI, ordersAPI } from '@/services/api';
import { Warehouse, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

const UPCOMING_STATUSES = new Set(['Ordered', 'Partial Paid']);
const OPEN_ORDER_STATUSES = new Set([
  'pending', 'confirmed', 'in production', 'in-progress', 'processing', 'open', 'draft',
]);

const stockBadge = (stock, upcoming, lowAt) => {
  const s = Number(stock) || 0;
  const up = Number(upcoming) || 0;
  // Out of stock with inbound PO → Upcoming; otherwise Low / In Stock
  if (s <= 0 && up > 0) return { label: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
  if (s <= lowAt) return { label: 'Low', className: 'bg-red-100 text-red-800' };
  return { label: 'In Stock', className: 'bg-green-100 text-green-800' };
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, purchRes, ordRes] = await Promise.all([
        productsAPI.getAll(),
        purchasesAPI.getAll(),
        ordersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setProducts(prodRes.data || []);
      setPurchases(purchRes.data || []);
      setOrders(ordRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upcomingByProduct = useMemo(() => {
    const map = {};
    purchases.forEach((po) => {
      if (!UPCOMING_STATUSES.has(po.status)) return;
      (po.items || []).forEach((item) => {
        const key = item.productId || item.name;
        if (!key) return;
        map[key] = (map[key] || 0) + (Number(item.quantity) || 0);
      });
    });
    return map;
  }, [purchases]);

  const reservedByProduct = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      const st = String(order.status || '').toLowerCase();
      if (!OPEN_ORDER_STATUSES.has(st)) return;
      (order.items || order.lineItems || []).forEach((item) => {
        const key = item.productId || item.id;
        if (!key) return;
        map[key] = (map[key] || 0) + (Number(item.quantity) || 0);
      });
    });
    return map;
  }, [orders]);

  const rows = useMemo(() => {
    return products
      .map((p) => {
        const stock = Number(p.stock) || 0;
        const lowAt = Number(p.lowStockAlert ?? p.reorderLevel ?? 5) || 5;
        const upcoming = upcomingByProduct[p.id] || upcomingByProduct[p.name] || 0;
        const reserved = reservedByProduct[p.id] || 0;
        const badge = stockBadge(stock, upcoming, lowAt);
        return { ...p, stock, reserved, upcoming, lowAt, badge };
      })
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      });
  }, [products, upcomingByProduct, reservedByProduct, search]);

  const stats = {
    total: rows.length,
    inStock: rows.filter((r) => r.badge.label === 'In Stock').length,
    low: rows.filter((r) => r.badge.label === 'Low').length,
    upcoming: rows.filter((r) => r.upcoming > 0).length,
  };

  return (
    <div className="space-y-6" data-testid="inventory-page">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Inventory</h1>
        <p className="text-gray-600 mt-1">Stock levels, reserved qty & upcoming purchases</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Products</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">In Stock</p><p className="text-2xl font-bold text-green-600">{stats.inStock}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Low</p><p className="text-2xl font-bold text-red-600">{stats.low}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">With Upcoming</p><p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="inventory-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Stock Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No products found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="inventory-table">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Product</th>
                    <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Stock</th>
                    <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Reserved</th>
                    <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Upcoming</th>
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-orange-50 transition-colors" data-testid={`inventory-row-${p.id}`}>
                      <td className="py-3 px-3">
                        <p className="font-semibold" style={{ color: '#2E2E2E' }}>{p.name}</p>
                        <p className="text-xs text-gray-500">{[p.sku, p.category].filter(Boolean).join(' · ')}</p>
                      </td>
                      <td className="py-3 px-3 text-right font-bold">{p.stock}</td>
                      <td className="py-3 px-3 text-right text-gray-600">{p.reserved}</td>
                      <td className="py-3 px-3 text-right text-blue-700">{p.upcoming || 0}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge className={p.badge.className}>{p.badge.label}</Badge>
                          {p.upcoming > 0 && p.badge.label !== 'Upcoming' && (
                            <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
