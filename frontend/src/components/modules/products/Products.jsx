import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { productsAPI, designersAPI } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { clearGasCache } from '@/services/gasClient';
import { compressImageFile, productImageSrc } from '@/utils/productImage';
import {
  Plus, Search, Edit, Trash2, Package, X, Save, Wrench, ImagePlus, Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

const PRODUCT_SORT_OPTS = [
  { value: 'name', label: 'Name' },
  { value: 'basePrice', label: 'Price' },
  { value: 'stock', label: 'Stock' },
  { value: 'category', label: 'Category' },
];

const PRODUCT_CATEGORIES = [
  'Business Cards', 'Flyers & Brochures', 'Posters', 'Banners', 'Stickers & Labels',
  'Books & Magazines', 'Packaging', 'Signage', 'Apparel Printing', 'Photo Prints', 'Services', 'Other',
];

const MATERIALS = [
  'Premium Card Stock', 'Matte Paper', 'Glossy Paper', 'Vinyl', 'Canvas',
  'PVC', 'Fabric', 'Metal', 'Acrylic', 'Corrugated',
];

const emptyProduct = {
  name: '',
  category: '',
  productType: 'Product',
  description: '',
  basePrice: 0,
  unit: 'per piece',
  material: '',
  size: '',
  minQuantity: 1,
  stock: 0,
  designer: '',
  image: '',
  active: true,
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [categoryFilter, setCategoryFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [stockDialog, setStockDialog] = useState({ open: false, product: null, value: '' });
  const [stockSaving, setStockSaving] = useState(false);

  const isService = String(formData.productType || '').toLowerCase() === 'service';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      clearGasCache();
      const response = await productsAPI.getAll();
      const list = (response.data || []).map((p) => ({
        ...p,
        basePrice: p.basePrice ?? p.rate ?? 0,
        image: productImageSrc(p),
        stock: Number(p.stock ?? 0) || 0,
      }));
      setProducts(list);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDesigners = useCallback(async () => {
    try {
      const response = await designersAPI.getAll();
      setDesigners(response.data || []);
    } catch {
      setDesigners([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchDesigners();
  }, [fetchProducts, fetchDesigners]);

  const filteredProducts = products.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    const productType = p.productType || 'Product';
    const matchType = typeFilter === 'all' || productType === typeFilter;
    return matchSearch && matchCategory && matchType;
  });

  const sorted = useMemo(() => sortBy(filteredProducts, sort, {
    name: (p) => p.name || '',
    basePrice: (p) => Number(p.basePrice ?? p.rate ?? 0) || 0,
    rate: (p) => Number(p.basePrice ?? p.rate ?? 0) || 0,
    stock: (p) => Number(p.stock ?? 0) || 0,
    category: (p) => p.category || '',
  }), [filteredProducts, sort]);

  const openCreateDialog = useCallback(() => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreateDialog();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openCreateDialog]);

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      ...emptyProduct,
      ...product,
      basePrice: product.basePrice ?? product.rate ?? 0,
      productType: product.productType || 'Product',
      designer: product.designer || '',
      stock: Number(product.stock ?? 0) || 0,
      image: productImageSrc(product),
    });
    setDialogOpen(true);
  };

  const onPickImage = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    setImageBusy(true);
    try {
      // 1:1 square, full picture (no crop), sharp enough for website cards.
      const dataUrl = await compressImageFile(file, {
        maxEdge: 1200,
        maxChars: 45000,
        quality: 0.9,
        square: true,
      });
      setFormData((prev) => ({ ...prev, image: dataUrl }));
      toast.success('Photo ready — 1:1, full picture');
    } catch (err) {
      toast.error(err.message || 'Photo failed');
    } finally {
      setImageBusy(false);
    }
  };

  const openStockEdit = (product) => {
    setStockDialog({
      open: true,
      product,
      value: String(Number(product.stock ?? 0) || 0),
    });
  };

  const saveStock = async () => {
    const product = stockDialog.product;
    if (!product?.id) return;
    const next = Math.max(0, Math.floor(Number(stockDialog.value)));
    if (Number.isNaN(next)) {
      toast.error('Enter a valid stock number');
      return;
    }
    setStockSaving(true);
    try {
      await productsAPI.update(product.id, {
        ...product,
        name: product.name,
        stock: next,
        basePrice: product.basePrice ?? product.rate ?? 0,
        rate: product.basePrice ?? product.rate ?? 0,
        productType: product.productType || 'Product',
        image: productImageSrc(product) || '',
        status: product.active === false ? 'Inactive' : (product.status || 'Active'),
        active: product.active !== false,
      });
      clearGasCache();
      toast.success(`Stock updated to ${next}`);
      setStockDialog({ open: false, product: null, value: '' });
      fetchProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Stock update failed');
    } finally {
      setStockSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const service = String(formData.productType || '').toLowerCase() === 'service';
      const payload = service
        ? {
            name: formData.name,
            productType: 'Service',
            category: formData.category || 'Services',
            description: formData.description || '',
            basePrice: Number(formData.basePrice) || 0,
            rate: Number(formData.basePrice) || 0,
            unit: 'service',
            material: '',
            size: '',
            designer: '',
            minQuantity: 1,
            stock: 0,
            image: formData.image || '',
            active: formData.active !== false,
            status: formData.active === false ? 'Inactive' : 'Active',
          }
        : {
            name: formData.name,
            category: formData.category || '',
            productType: formData.productType || 'Product',
            description: formData.description || '',
            basePrice: Number(formData.basePrice) || 0,
            rate: Number(formData.basePrice) || 0,
            unit: formData.unit || 'per piece',
            material: formData.material || '',
            size: formData.size || '',
            minQuantity: formData.minQuantity || 1,
            stock: Math.max(0, Math.floor(Number(formData.stock) || 0)),
            designer: formData.designer || '',
            image: formData.image || '',
            active: formData.active !== false,
            status: formData.active === false ? 'Inactive' : 'Active',
          };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
        toast.success(service ? 'Service updated' : 'Product updated');
      } else {
        await productsAPI.create(payload);
        toast.success(service ? 'Service created' : 'Product created');
      }
      clearGasCache();
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productsAPI.delete(product.id);
      toast.success('Deleted');
      fetchProducts();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-4" data-testid="products-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>Products</h1>
          <p className="text-sm text-gray-600">Catalog with photos · manual stock edit</p>
        </div>
        <Button onClick={openCreateDialog} style={{ backgroundColor: '#F26522' }} className="text-white h-9" data-testid="add-product-button">
          <Plus className="h-4 w-4 mr-1.5" />
          Add
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5" data-testid="product-type-filter">
            {[
              { value: 'all', label: 'All' },
              { value: 'Product', label: 'Products' },
              { value: 'Service', label: 'Services' },
            ].map((tab) => (
              <Button
                key={tab.value}
                type="button"
                size="sm"
                variant={typeFilter === tab.value ? 'default' : 'outline'}
                style={typeFilter === tab.value ? { backgroundColor: '#F26522' } : undefined}
                className={`h-7 text-xs ${typeFilter === tab.value ? 'text-white' : ''}`}
                onClick={() => setTypeFilter(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
                data-testid="product-search-input"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger className="h-9 text-sm" data-testid="category-filter">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 max-w-md">
            <SortBar value={sort} onChange={setSort} options={PRODUCT_SORT_OPTS} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Catalog ({sorted.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-10">
              <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 mb-3">No items yet.</p>
              <Button onClick={openCreateDialog} style={{ backgroundColor: '#F26522' }} className="text-white h-8 text-sm">
                <Plus className="h-3.5 w-3.5 mr-1" />Add first
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sorted.map((product) => {
                const service = String(product.productType || '').toLowerCase() === 'service';
                const img = productImageSrc(product);
                return (
                  <div
                    key={product.id}
                    className="rounded-xl border-2 border-gray-700 bg-white overflow-hidden hover:border-orange-500 hover:shadow-md transition-all"
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="aspect-square bg-white flex items-center justify-center overflow-hidden relative">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : service ? (
                        <Wrench className="h-8 w-8 text-gray-300" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300" />
                      )}
                      <Badge
                        variant="outline"
                        className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0 h-5 bg-white/90 border-gray-600 text-gray-700"
                      >
                        {service ? 'Service' : 'Product'}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <p className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]" style={{ color: '#2E2E2E' }}>
                        {product.name}
                      </p>
                      <p className="text-base font-bold" style={{ color: '#F26522' }}>
                        {formatCurrency(product.basePrice ?? product.rate ?? 0)}
                      </p>
                      {!service && (
                        <button
                          type="button"
                          onClick={() => openStockEdit(product)}
                          className="flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:text-orange-600"
                          title="Edit stock"
                        >
                          <Boxes className="h-3.5 w-3.5" />
                          Stock: <span className="font-bold">{Number(product.stock ?? 0) || 0}</span>
                          <span className="text-orange-600 underline ml-0.5">Edit</span>
                        </button>
                      )}
                      <div className="flex gap-1.5 pt-1">
                        <Button size="sm" variant="outline" className="h-8 flex-1 text-xs border-gray-600" onClick={() => openEditDialog(product)}>
                          <Edit className="h-3.5 w-3.5 mr-1" />Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(product)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={stockDialog.open} onOpenChange={(open) => setStockDialog((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit stock</DialogTitle>
            <DialogDescription>
              {stockDialog.product?.name || 'Product'} — set quantity manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Stock quantity</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={stockDialog.value}
                onChange={(e) => setStockDialog((s) => ({ ...s, value: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[-10, -1, +1, +10, +50].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    const cur = Math.max(0, Math.floor(Number(stockDialog.value) || 0));
                    setStockDialog((s) => ({ ...s, value: String(Math.max(0, cur + n)) }));
                  }}
                >
                  {n > 0 ? `+${n}` : n}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStockDialog({ open: false, product: null, value: '' })}>
              Cancel
            </Button>
            <Button
              type="button"
              className="text-white"
              style={{ backgroundColor: '#F26522' }}
              disabled={stockSaving}
              onClick={saveStock}
            >
              {stockSaving ? 'Saving…' : 'Save stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: '#2E2E2E' }}>
              {editingProduct ? (isService ? 'Edit Service' : 'Edit Product') : (isService ? 'Add Service' : 'Add Product')}
            </DialogTitle>
            <DialogDescription>
              {isService
                ? 'Service: description + charges. Optional photo for catalog.'
                : 'Product photo + stock for warehouse catalog (orders/invoices keep no photo).'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-24 h-24 rounded-lg border bg-white overflow-hidden flex items-center justify-center shrink-0">
                {formData.image ? (
                  <img src={formData.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-gray-300" />
                )}
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <Label>Catalog photo (1:1)</Label>
                <p className="text-[11px] text-gray-500">Full picture is kept. Saved as a sharp square.</p>
                <Input type="file" accept="image/*" onChange={onPickImage} disabled={imageBusy} className="text-xs" />
                {formData.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-600 px-0"
                    onClick={() => setFormData({ ...formData, image: '' })}
                  >
                    Remove photo
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={formData.productType || 'Product'}
                onValueChange={(v) => setFormData({
                  ...formData,
                  productType: v,
                  category: v === 'Service' ? (formData.category || 'Services') : formData.category,
                  unit: v === 'Service' ? 'service' : (formData.unit || 'per piece'),
                })}
              >
                <SelectTrigger data-testid="product-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">{isService ? 'Service name *' : 'Product name *'}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="product-name-input"
              />
            </div>

            {isService ? (
              <>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="What this service includes…"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                    data-testid="product-description-input"
                  />
                </div>
                <div>
                  <Label htmlFor="basePrice">Service Charges (Rs) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    required
                    data-testid="product-price-input"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category || undefined} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="product-category-select"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Designer</Label>
                  <Select value={formData.designer || undefined} onValueChange={(v) => setFormData({ ...formData, designer: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Designer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {designers.map((d) => (
                        <SelectItem key={d.id || d.name} value={d.name || d.id}>{d.name || d.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Material</Label>
                  <Select value={formData.material || undefined} onValueChange={(v) => setFormData({ ...formData, material: v })}>
                    <SelectTrigger><SelectValue placeholder="Material" /></SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((mat) => <SelectItem key={mat} value={mat}>{mat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Base price (Rs) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    required
                    data-testid="product-price-input"
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={formData.unit || 'per piece'} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per piece">Per Piece</SelectItem>
                      <SelectItem value="per sq ft">Per Sq Ft</SelectItem>
                      <SelectItem value="per sq meter">Per Sq Meter</SelectItem>
                      <SelectItem value="per 100">Per 100</SelectItem>
                      <SelectItem value="per 1000">Per 1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Size</Label>
                  <Input value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="e.g. A4" />
                </div>
                <div>
                  <Label>Stock (manual)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    data-testid="product-stock-input"
                  />
                </div>
                <div>
                  <Label>Min quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    data-testid="product-description-input"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-1" />Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#F26522' }} className="text-white" disabled={saving || imageBusy}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
