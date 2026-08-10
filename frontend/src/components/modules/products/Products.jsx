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
import { Switch } from '@/components/ui/switch';
import { productsAPI, designersAPI } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { clearGasCache } from '@/services/gasClient';
import { compressImageFile, productImageSrc } from '@/utils/productImage';
import {
  Plus, Search, Edit, Trash2, Package, X, Save, Wrench, ImagePlus, Boxes, Globe,
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

const emptyVariation = () => ({
  id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  price: '',
  sku: '',
});

const emptyProduct = {
  name: '',
  category: '',
  productType: 'Product',
  description: '',
  fullDescription: '',
  basePrice: 0,
  salePrice: '',
  unit: 'per piece',
  material: '',
  size: '',
  minQuantity: 1,
  stock: 0,
  designer: '',
  image: '',
  active: true,
  showOnWebsite: true,
  showOnTop: false,
  variations: [],
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
    const variations = Array.isArray(product.variations)
      ? product.variations.map((v, i) => ({
          id: v.id || `var_${i + 1}`,
          name: v.name || '',
          price: v.price != null && v.price !== '' ? String(v.price) : '',
          sku: v.sku || '',
        }))
      : [];
    setFormData({
      ...emptyProduct,
      ...product,
      basePrice: product.basePrice ?? product.rate ?? 0,
      salePrice: product.salePrice > 0 ? product.salePrice : '',
      productType: product.productType || 'Product',
      description: product.description || '',
      fullDescription: product.fullDescription || '',
      designer: product.designer || '',
      stock: Number(product.stock ?? 0) || 0,
      image: productImageSrc(product),
      showOnWebsite: product.showOnWebsite !== false,
      showOnTop: !!product.showOnTop,
      variations,
    });
    setDialogOpen(true);
  };

  const onPickImage = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    setImageBusy(true);
    try {
      const dataUrl = await compressImageFile(file, { maxEdge: 240, maxChars: 40000, quality: 0.58 });
      setFormData((prev) => ({ ...prev, image: dataUrl }));
      toast.success('Photo ready');
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
      const variations = (formData.variations || [])
        .map((v, i) => ({
          id: v.id || `var_${i + 1}`,
          name: String(v.name || '').trim(),
          price: v.price === '' || v.price == null ? null : Number(v.price),
          sku: String(v.sku || '').trim(),
        }))
        .filter((v) => v.name);
      const salePrice = Number(formData.salePrice) > 0 ? Number(formData.salePrice) : 0;
      const payload = service
        ? {
            name: formData.name,
            productType: 'Service',
            category: formData.category || 'Services',
            description: formData.description || '',
            fullDescription: formData.fullDescription || '',
            basePrice: Number(formData.basePrice) || 0,
            rate: Number(formData.basePrice) || 0,
            salePrice,
            unit: 'service',
            material: '',
            size: '',
            designer: '',
            minQuantity: 1,
            stock: 0,
            image: formData.image || '',
            active: formData.active !== false,
            status: formData.active === false ? 'Inactive' : 'Active',
            showOnWebsite: formData.showOnWebsite !== false,
            showOnTop: !!formData.showOnTop,
            variations,
          }
        : {
            name: formData.name,
            category: formData.category || '',
            productType: formData.productType || 'Product',
            description: formData.description || '',
            fullDescription: formData.fullDescription || '',
            basePrice: Number(formData.basePrice) || 0,
            rate: Number(formData.basePrice) || 0,
            salePrice,
            unit: formData.unit || 'per piece',
            material: formData.material || '',
            size: formData.size || '',
            minQuantity: formData.minQuantity || 1,
            stock: Math.max(0, Math.floor(Number(formData.stock) || 0)),
            designer: formData.designer || '',
            image: formData.image || '',
            active: formData.active !== false,
            status: formData.active === false ? 'Inactive' : 'Active',
            showOnWebsite: formData.showOnWebsite !== false,
            showOnTop: !!formData.showOnTop,
            variations,
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
                    <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                      {product.showOnWebsite !== false ? (
                        <Badge className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 h-5 bg-emerald-600 text-white border-0">
                          <Globe className="h-3 w-3 mr-0.5" />Web
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 h-5 bg-white/90 text-gray-500">
                          Hidden
                        </Badge>
                      )}
                      {product.showOnTop ? (
                        <Badge className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0 h-5 bg-orange-600 text-white border-0">
                          Top
                        </Badge>
                      ) : null}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <p className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]" style={{ color: '#2E2E2E' }}>
                        {product.name}
                      </p>
                      {Number(product.salePrice) > 0 ? (
                        <p className="text-base font-bold" style={{ color: '#F26522' }}>
                          <span className="text-gray-400 text-xs font-medium line-through mr-1.5">
                            {formatCurrency(product.basePrice ?? product.rate ?? 0)}
                          </span>
                          {formatCurrency(product.salePrice)}
                        </p>
                      ) : (
                        <p className="text-base font-bold" style={{ color: '#F26522' }}>
                          {formatCurrency(product.basePrice ?? product.rate ?? 0)}
                        </p>
                      )}
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
              <div className="w-20 h-20 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                {formData.image ? (
                  <img src={formData.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-gray-300" />
                )}
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <Label>Catalog photo</Label>
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

            <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-100 bg-[#FFF9F5] px-3 py-2.5">
              <div>
                <Label htmlFor="show-on-website" className="text-sm font-semibold">Show on website</Label>
                <p className="text-[11px] text-gray-500 mt-0.5">Off = hidden from storefront catalog &amp; checkout</p>
              </div>
              <Switch
                id="show-on-website"
                checked={formData.showOnWebsite !== false}
                onCheckedChange={(v) => setFormData({ ...formData, showOnWebsite: !!v })}
                data-testid="product-show-website-switch"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-100 bg-[#FFF9F5] px-3 py-2.5">
              <div>
                <Label htmlFor="show-on-top" className="text-sm font-semibold">Show on top of website products</Label>
                <p className="text-[11px] text-gray-500 mt-0.5">Pinned to the top of the Products page listing</p>
              </div>
              <Switch
                id="show-on-top"
                checked={!!formData.showOnTop}
                onCheckedChange={(v) => setFormData({ ...formData, showOnTop: !!v })}
                data-testid="product-show-top-switch"
              />
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
                  <Label htmlFor="description">Short description *</Label>
                  <Textarea
                    id="description"
                    placeholder="What this service includes…"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                    data-testid="product-description-input"
                  />
                </div>
                <div>
                  <Label htmlFor="fullDescription">Full description</Label>
                  <Textarea
                    id="fullDescription"
                    placeholder="Detailed service info shown on the website product page…"
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    rows={5}
                    data-testid="product-full-description-input"
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
                <div>
                  <Label htmlFor="salePrice">Sale price (Rs)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional — leave blank for no sale"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    data-testid="product-sale-price-input"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Website shows old price struck through + this sale price.</p>
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
                  <Label>Base / regular price (Rs) *</Label>
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
                  <Label>Sale price (Rs)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    data-testid="product-sale-price-input"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Shown as current price; regular price gets strikethrough.</p>
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
                  <Label>Short description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Shown on product cards / lists"
                    data-testid="product-description-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Full description</Label>
                  <Textarea
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    rows={5}
                    placeholder="Full details for the website product page"
                    data-testid="product-full-description-input"
                  />
                </div>
              </div>
            )}

            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label className="text-sm font-semibold">Variations</Label>
                  <p className="text-[11px] text-gray-500">e.g. A4 Matte, A3 Gloss — optional price override</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    variations: [...(prev.variations || []), emptyVariation()],
                  }))}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />Add
                </Button>
              </div>
              {(formData.variations || []).length === 0 ? (
                <p className="text-xs text-gray-500">No variations — base price is used.</p>
              ) : (
                <div className="space-y-2">
                  {(formData.variations || []).map((v, idx) => (
                    <div key={v.id || idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-[11px]">Name</Label>
                        <Input
                          value={v.name}
                          placeholder="A4 / Matte"
                          onChange={(e) => setFormData((prev) => {
                            const variations = [...(prev.variations || [])];
                            variations[idx] = { ...variations[idx], name: e.target.value };
                            return { ...prev, variations };
                          })}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-[11px]">Price (optional)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.price}
                          placeholder="Base"
                          onChange={(e) => setFormData((prev) => {
                            const variations = [...(prev.variations || [])];
                            variations[idx] = { ...variations[idx], price: e.target.value };
                            return { ...prev, variations };
                          })}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-[11px]">SKU</Label>
                        <Input
                          value={v.sku}
                          placeholder="Optional"
                          onChange={(e) => setFormData((prev) => {
                            const variations = [...(prev.variations || [])];
                            variations[idx] = { ...variations[idx], sku: e.target.value };
                            return { ...prev, variations };
                          })}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => setFormData((prev) => ({
                            ...prev,
                            variations: (prev.variations || []).filter((_, i) => i !== idx),
                          }))}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
