import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ordersAPI, customersAPI, designersAPI, tokensAPI } from '@/services/api';
import { ORDER_STATUS } from '@/utils/constants';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const OrderForm = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!orderId;
  const prefillTokenNo = searchParams.get('tokenNo') || '';

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerId: '',
    assignedDesigner: undefined,
    deliveryDate: '',
    remarks: '',
    advancePayment: 0,
    status: ORDER_STATUS.RECEIVED,
    tokenNo: '',
    products: [
      { _key: 'p_init', name: '', quantity: 1, rate: 0, size: '', material: '', notes: '' }
    ]
  });

  const [customers, setCustomers] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  const fetchDesigners = useCallback(async () => {
    try {
      const response = await designersAPI.getAll();
      setDesigners(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching designers:', error);
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await ordersAPI.getById(orderId);
      const o = response.data || {};
      const dateOnly = (d) => {
        if (!d) return '';
        const s = String(d);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        try {
          return new Date(d).toISOString().slice(0, 10);
        } catch {
          return '';
        }
      };
      const products = Array.isArray(o.products) && o.products.length
        ? o.products.map((p, i) => ({
            _key: p._key || p.id || `p_${i}`,
            name: p.name || '',
            quantity: Number(p.quantity) || 1,
            rate: Number(p.rate) || 0,
            size: p.size || '',
            material: p.material || '',
            notes: p.notes || '',
          }))
        : [{ _key: 'p_init', name: '', quantity: 1, rate: 0, size: '', material: '', notes: '' }];
      setFormData({
        customerName: o.customerName || '',
        customerEmail: o.customerEmail || '',
        customerPhone: o.customerPhone || '',
        customerAddress: o.customerAddress || '',
        customerId: o.customerId || '',
        assignedDesigner: o.assignedDesigner || undefined,
        deliveryDate: dateOnly(o.deliveryDate),
        remarks: o.remarks || '',
        advancePayment: Number(o.advancePayment) || 0,
        status: o.status || ORDER_STATUS.RECEIVED,
        tokenNo: o.tokenNo || '',
        products,
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
    }
  }, [orderId]);

  useEffect(() => {
    fetchCustomers();
    fetchDesigners();
    if (isEdit) {
      fetchOrder();
    }
  }, [isEdit, fetchCustomers, fetchDesigners, fetchOrder]);

  useEffect(() => {
    if (isEdit || prefilled) return;
    const customerName = searchParams.get('customerName');
    const customerPhone = searchParams.get('customerPhone');
    const customerId = searchParams.get('customerId');
    const service = searchParams.get('service');
    const tokenNo = searchParams.get('tokenNo');
    if (!customerName && !customerPhone && !service && !tokenNo) return;

    setFormData((prev) => ({
      ...prev,
      customerName: customerName || prev.customerName,
      customerPhone: customerPhone || prev.customerPhone,
      customerId: customerId || prev.customerId,
      tokenNo: tokenNo || prev.tokenNo,
      products: service
        ? [{ _key: 'p_token', name: service, quantity: 1, rate: 0, size: '', material: '', notes: '' }]
        : prev.products,
    }));
    setPrefilled(true);
  }, [isEdit, prefilled, searchParams]);

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;
    setFormData({ ...formData, products: updatedProducts });
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { _key: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: '', quantity: 1, rate: 0, size: '', material: '', notes: '' }]
    });
  };

  const removeProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: updatedProducts });
  };

  const calculateTotal = () => {
    return formData.products.reduce((total, product) => {
      return total + (product.quantity * product.rate);
    }, 0);
  };

  const calculateBalance = () => {
    return calculateTotal() - formData.advancePayment;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        totalAmount: calculateTotal(),
        balanceAmount: calculateBalance()
      };

      if (isEdit) {
        await ordersAPI.update(orderId, orderData);
        toast.success('Order updated successfully');
      } else {
        const created = await ordersAPI.create(orderData);
        if (prefillTokenNo || formData.tokenNo) {
          try {
            await tokensAPI.linkOrder(prefillTokenNo || formData.tokenNo, {
              orderId: created.data?.orderId || created.data?.id || '',
            });
          } catch (linkError) {
            console.warn('Token link failed', linkError);
          }
        }
        toast.success('Order created successfully');
      }
      navigate('/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(isEdit ? 'Failed to update order' : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="order-form">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/orders')} data-testid="back-button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>
            {isEdit ? 'Edit Order' : 'Create New Order'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  data-testid="customer-name-input"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                  data-testid="customer-phone-input"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  data-testid="customer-email-input"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  data-testid="customer-address-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="assignedDesigner">Assigned Designer</Label>
                <Select value={formData.assignedDesigner} onValueChange={(value) => setFormData({ ...formData, assignedDesigner: value })}>
                  <SelectTrigger data-testid="designer-select">
                    <SelectValue placeholder="Select Designer" />
                  </SelectTrigger>
                  <SelectContent>
                    {designers.map((designer) => (
                      <SelectItem key={designer.id} value={designer.id}>
                        {designer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deliveryDate">Expected Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  required
                  data-testid="delivery-date-input"
                />
              </div>
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ORDER_STATUS).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                data-testid="remarks-input"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Button type="button" onClick={addProduct} variant="outline" data-testid="add-product-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.products.map((product, index) => (
              <div key={product._key || product.id || `p-${index}`} className="p-4 border rounded-lg space-y-3" data-testid={`product-${index}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Product {index + 1}</h4>
                  {formData.products.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(index)}
                      data-testid={`remove-product-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      required
                      data-testid={`product-name-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                      data-testid={`product-quantity-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Rate *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.rate}
                      onChange={(e) => handleProductChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      required
                      data-testid={`product-rate-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Size</Label>
                    <Input
                      value={product.size}
                      onChange={(e) => handleProductChange(index, 'size', e.target.value)}
                      data-testid={`product-size-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Material</Label>
                    <Input
                      value={product.material}
                      onChange={(e) => handleProductChange(index, 'material', e.target.value)}
                      data-testid={`product-material-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Subtotal</Label>
                    <Input
                      value={`Rs. ${(product.quantity * product.rate).toFixed(2)}`}
                      disabled
                      data-testid={`product-subtotal-${index}`}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={product.notes}
                    onChange={(e) => handleProductChange(index, 'notes', e.target.value)}
                    rows={2}
                    data-testid={`product-notes-${index}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="advancePayment">Advance Payment</Label>
                <Input
                  id="advancePayment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.advancePayment}
                  onChange={(e) => setFormData({ ...formData, advancePayment: parseFloat(e.target.value) || 0 })}
                  data-testid="advance-payment-input"
                />
              </div>
              <div>
                <Label>Total Amount</Label>
                <Input
                  value={`Rs. ${calculateTotal().toFixed(2)}`}
                  disabled
                  data-testid="total-amount-display"
                />
              </div>
              <div>
                <Label>Balance Amount</Label>
                <Input
                  value={`Rs. ${calculateBalance().toFixed(2)}`}
                  disabled
                  data-testid="balance-amount-display"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            style={{ backgroundColor: '#F26522' }}
            className="text-white"
            disabled={loading}
            data-testid="submit-order-button"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Order' : 'Create Order')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/orders')} data-testid="cancel-button">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;