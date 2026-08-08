import React, { useState, useEffect, useCallback } from 'react';
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
import { compressImageFile } from '@/utils/productImage';
import { Plus, Search, Edit, Trash2, Package, X, Save, ImagePlus, Wrench } from 'lucide-react';
import { toast } from 'sonner';

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
  const [categoryFilter, setCategoryFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  const isService = String(formData.productType || '').toLowerCase() === 'service';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll();
      const list = (response.data || []).map((p) => ({
        ...p,
        basePrice: p.basePrice ?? p.rate ?? 0,
        image: p.image || p.photo || '',
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
      image: product.image || product.photo || '',
    });
    setDialogOpen(true);
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageBusy(true);
    try {
      const dataUrl = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, image: dataUrl }));
      toast.success('Photo added (catalog only — not on invoice/slip)');
    } catch (err) {
      toast.error(err.message || 'Image failed');
    } finally {
      setImageBusy(false);
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
            image: formData.image || '',
            active: formData.active !== false,
            status: formData.active === false ? 'Inactive' : 'Active',
          }
        : {
            ...formData,
            basePrice: Number(formData.basePrice),
            rate: Number(formData.basePrice),
            productType: formData.productType || 'Product',
            image: formData.image || '',
          };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
        toast.success(service ? 'Service updated' : 'Product updated');
      } else {
        await productsAPI.create(payload);
        toast.success(service ? 'Service created' : 'Product created');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch {
      toast.error('Save failed');
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
          <p className="text-sm text-gray-600">Catalog · photos stay on product cards only</p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Catalog ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 mb-3">No items yet.</p>
              <Button onClick={openCreateDialog} style={{ backgroundColor: '#F26522' }} className="text-white h-8 text-sm">
                <Plus className="h-3.5 w-3.5 mr-1" />Add first
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {filteredProducts.map((product) => {
                const service = String(product.productType || '').toLowerCase() === 'service';
                const img = product.image || product.photo || '';
                return (
                  <div
                    key={product.id}
                    className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-orange-300 hover:shadow-sm transition-all"
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="aspect-square bg-gray-50 relative flex items-center justify-center overflow-hidden">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : service ? (
                        <Wrench className="h-6 w-6 text-gray-300" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-300" />
                      )}
                      <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 h-4 bg-white/90 text-gray-700 border">
                        {service ? 'Svc' : 'Prod'}
                      </Badge>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <p className="text-[11px] font-semibold leading-tight line-clamp-2 min-h-[2rem]" style={{ color: '#2E2E2E' }}>
                        {product.name}
                      </p>
                      <p className="text-xs font-bold" style={{ color: '#F26522' }}>
                        {formatCurrency(product.basePrice ?? product.rate ?? 0)}
                      </p>
                      <div className="flex gap-0.5 pt-0.5">
                        <Button size="sm" variant="outline" className="h-6 flex-1 text-[10px] px-1" onClick={() => openEditDialog(product)}>
                          <Edit className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDelete(product)}>
                          <Trash2 className="h-2.5 w-2.5 text-red-600" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: '#2E2E2E' }}>
              {editingProduct ? (isService ? 'Edit Service' : 'Edit Product') : (isService ? 'Add Service' : 'Add Product')}
            </DialogTitle>
            <DialogDescription>
              {isService
                ? 'Service: only description + service charges. Photo optional (catalog only).'
                : 'Photo is for catalog cards only — never printed on order slip / invoice.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 mt-2">
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

            <div>
              <Label>Photo (catalog only)</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-16 h-16 rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                  {formData.image ? (
                    <img src={formData.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div className="space-y-1">
                  <Input type="file" accept="image/*" onChange={onPickImage} disabled={imageBusy} className="text-xs" />
                  {formData.image && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => setFormData({ ...formData, image: '' })}>
                      Remove photo
                    </Button>
                  )}
                </div>
              </div>
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
