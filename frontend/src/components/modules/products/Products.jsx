import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, Search, Edit, Trash2, Package, Layers, Ruler, DollarSign, X, Save } from 'lucide-react';
import { toast } from 'sonner';

const PRODUCT_CATEGORIES = [
  'Business Cards',
  'Flyers & Brochures',
  'Posters',
  'Banners',
  'Stickers & Labels',
  'Books & Magazines',
  'Packaging',
  'Signage',
  'Apparel Printing',
  'Photo Prints',
  'Other'
];

const MATERIALS = [
  'Premium Card Stock',
  'Matte Paper',
  'Glossy Paper',
  'Vinyl',
  'Canvas',
  'PVC',
  'Fabric',
  'Metal',
  'Acrylic',
  'Corrugated'
];

const CATEGORY_COLORS = {
  'Business Cards': { bg: '#FFF3ED', text: '#F26522' },
  'Flyers & Brochures': { bg: '#EFF6FF', text: '#3B82F6' },
  'Posters': { bg: '#F0FDF4', text: '#10B981' },
  'Banners': { bg: '#FEF3F2', text: '#EF4444' },
  'Stickers & Labels': { bg: '#FEF9C3', text: '#CA8A04' },
  'Books & Magazines': { bg: '#F3E8FF', text: '#9333EA' },
  'Packaging': { bg: '#FCE7F3', text: '#DB2777' },
  'Signage': { bg: '#ECFEFF', text: '#0891B2' },
  'Apparel Printing': { bg: '#E0E7FF', text: '#4F46E5' },
  'Photo Prints': { bg: '#FED7AA', text: '#EA580C' },
  'Other': { bg: '#F3F4F6', text: '#6B7280' }
};

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
  active: true
};

const Products = () => {
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll();
      const list = (response.data || []).map((p) => ({
        ...p,
        basePrice: p.basePrice ?? p.rate ?? 0,
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
    } catch (error) {
      console.error('Error fetching designers:', error);
      setDesigners([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchDesigners();
  }, [fetchProducts, fetchDesigners]);

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    const productType = p.productType || 'Product';
    const matchType = typeFilter === 'all' || productType === typeFilter;
    return matchSearch && matchCategory && matchType;
  });

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      ...emptyProduct,
      ...product,
      basePrice: product.basePrice ?? product.rate ?? 0,
      productType: product.productType || 'Product',
      designer: product.designer || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice),
        rate: Number(formData.basePrice),
        productType: formData.productType,
        designer: formData.designer,
      };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(payload);
        toast.success('Product created successfully');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(editingProduct ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Delete "${product.name}"?`)) {
      try {
        await productsAPI.delete(product.id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const categoryStats = PRODUCT_CATEGORIES.map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-6" data-testid="products-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog and pricing</p>
        </div>
        <Button
          onClick={openCreateDialog}
          style={{ backgroundColor: '#F26522' }}
          className="text-white"
          data-testid="add-product-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F26522' }}>
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Products</p>
              <p className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Categories</p>
              <p className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{categoryStats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
              <Ruler className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Active</p>
              <p className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{products.filter(p => p.active).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Avg Price</p>
              <p className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>
                {products.length > 0
                  ? formatCurrency(products.reduce((s, p) => s + (p.basePrice ?? p.rate ?? 0), 0) / products.length)
                  : formatCurrency(0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 mb-3" data-testid="product-type-filter">
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
                className={typeFilter === tab.value ? 'text-white' : ''}
                onClick={() => setTypeFilter(tab.value)}
                data-testid={`type-filter-${tab.value}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="product-search-input"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v === 'all' ? undefined : v)}
            >
              <SelectTrigger data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF3ED' }}>
                <Package className="h-8 w-8" style={{ color: '#F26522' }} />
              </div>
              <p className="text-gray-500 mb-4">
                {products.length === 0
                  ? 'No products yet. Add your first product to build your catalog.'
                  : 'No products match your search criteria.'}
              </p>
              {products.length === 0 && (
                <Button onClick={openCreateDialog} style={{ backgroundColor: '#F26522' }} className="text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const colors = CATEGORY_COLORS[product.category] || CATEGORY_COLORS['Other'];
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-orange-300 transition-all duration-200"
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
                        <Package className="h-6 w-6" style={{ color: colors.text }} />
                      </div>
                      {product.active ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-base mb-1 truncate" style={{ color: '#2E2E2E' }}>
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.category && (
                        <Badge className="text-xs" style={{ backgroundColor: colors.bg, color: colors.text }}>
                          {product.category}
                        </Badge>
                      )}
                      <Badge className="text-xs bg-gray-100 text-gray-700">
                        {product.productType || 'Product'}
                      </Badge>
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                    )}

                    <div className="space-y-1.5 pb-3 border-b border-gray-100 mb-3">
                      {product.material && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Material:</span>
                          <span className="font-medium" style={{ color: '#2E2E2E' }}>{product.material}</span>
                        </div>
                      )}
                      {product.size && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Size:</span>
                          <span className="font-medium" style={{ color: '#2E2E2E' }}>{product.size}</span>
                        </div>
                      )}
                      {product.designer && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Designer:</span>
                          <span className="font-medium" style={{ color: '#2E2E2E' }}>{product.designer}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Min Qty:</span>
                        <span className="font-medium" style={{ color: '#2E2E2E' }}>{product.minQuantity}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Base Price</p>
                        <p className="text-xl font-bold" style={{ color: '#F26522' }}>
                          {formatCurrency(product.basePrice ?? product.rate ?? 0)}
                        </p>
                        <p className="text-xs text-gray-500">{product.unit || 'per piece'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(product)}
                        data-testid={`edit-product-${product.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(product)}
                        data-testid={`delete-product-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product details below' : 'Fill in the details to add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="product-name-input"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || undefined}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger data-testid="product-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select
                  value={formData.productType || 'Product'}
                  onValueChange={(v) => setFormData({ ...formData, productType: v })}
                >
                  <SelectTrigger data-testid="product-type-select">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="designer">Designer</Label>
                <Select
                  value={formData.designer || undefined}
                  onValueChange={(v) => setFormData({ ...formData, designer: v === 'none' ? '' : v })}
                >
                  <SelectTrigger data-testid="product-designer-select">
                    <SelectValue placeholder="Select designer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {designers.map((d) => (
                      <SelectItem key={d.id || d.name} value={d.name || d.id}>
                        {d.name || d.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material">Material</Label>
                <Select
                  value={formData.material || undefined}
                  onValueChange={(v) => setFormData({ ...formData, material: v })}
                >
                  <SelectTrigger data-testid="product-material-select">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map(mat => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="basePrice">Base Price (Rs) *</Label>
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
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit || 'per piece'}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger data-testid="product-unit-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per piece">Per Piece</SelectItem>
                    <SelectItem value="per sq ft">Per Sq Ft</SelectItem>
                    <SelectItem value="per sq meter">Per Sq Meter</SelectItem>
                    <SelectItem value="per 100">Per 100 Units</SelectItem>
                    <SelectItem value="per 1000">Per 1000 Units</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Size / Dimensions</Label>
                <Input
                  id="size"
                  placeholder="e.g., 3.5 x 2 inches, A4"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  data-testid="product-size-input"
                />
              </div>

              <div>
                <Label htmlFor="minQuantity">Min Order Quantity</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min="1"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
                  data-testid="product-minqty-input"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="product-description-input"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-product-button">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: '#F26522' }}
                className="text-white"
                disabled={saving}
                data-testid="save-product-button"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
