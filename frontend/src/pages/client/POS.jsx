import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiSearch, FiX, FiMinus, FiPlus, FiTrash2, FiPrinter, FiSave,
  FiUser, FiUsers, FiCreditCard, FiDollarSign, FiClock, FiChevronDown
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatCurrency } from '../../utils/format';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [heldInvoices, setHeldInvoices] = useState([]);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, catRes, custRes, heldRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/categories'),
        api.get('/api/customers'),
        api.get('/api/sales/held'),
      ]);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setHeldInvoices(heldRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load POS data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    const key = e.key;
    if (e.ctrlKey && key === 's') { e.preventDefault(); handleSave(); return; }
    switch (key) {
      case 'F1': e.preventDefault(); resetCart(); break;
      case 'F2': e.preventDefault(); toast.info('Price history - Coming soon'); break;
      case 'F3': e.preventDefault(); setShowCustomerModal(true); break;
      case 'F4': e.preventDefault(); handleHoldInvoice(); break;
      case 'F5': e.preventDefault(); setShowHeldModal(true); break;
      case 'F6': e.preventDefault(); setPaymentMethod('cash'); break;
      case 'F7': e.preventDefault(); setPaymentMethod('credit'); break;
      case 'F8': e.preventDefault(); setPaymentMethod('card'); break;
      case 'F9': e.preventDefault(); handlePrint(); break;
    }
  }, [cart, paymentMethod, paidAmount, discount, tax, selectedCustomer]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          salePrice: product.salePrice || 0,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  };

  const updateCartItem = (id, field, value) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const itemDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalDiscount = discount + itemDiscount;
  const taxAmount = ((subtotal - totalDiscount) * tax) / 100;
  const grandTotal = subtotal - totalDiscount + taxAmount;
  const due = grandTotal - paidAmount;

  const resetCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod('cash');
    setPaidAmount(0);
    setDiscount(0);
    setTax(0);
    setShowSuccess(false);
    setLastSale(null);
  };

  const handleHoldInvoice = async () => {
    if (cart.length === 0) { toast.warn('Cart is empty'); return; }
    try {
      await api.post('/api/sales/held', {
        items: JSON.stringify(cart.map(({ id, name, salePrice, quantity, discount }) => ({ productId: id, name, price: salePrice, quantity, discount }))),
        customerName: selectedCustomer?.name || 'Walk-in',
        customerPhone: selectedCustomer?.phone || '',
        subtotal,
        discount: totalDiscount,
        tax,
        total: grandTotal,
        notes: ''
      });
      toast.success('Invoice held successfully');
      resetCart();
      const heldRes = await api.get('/api/sales/held');
      setHeldInvoices(heldRes.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to hold invoice');
    }
  };

  const handleSave = async () => {
    if (cart.length === 0) { toast.warn('Cart is empty'); return; }
    if (paidAmount < grandTotal && paymentMethod !== 'credit') { toast.warn('Paid amount is less than total'); return; }
    setProcessing(true);
    try {
      const { data } = await api.post('/api/sales', {
        items: cart.map(({ id, name, salePrice, quantity, discount }) => ({ productId: id, name, price: salePrice, quantity, discount })),
        customerId: selectedCustomer?.id || null,
        discount: totalDiscount,
        tax,
        subtotal,
        total: grandTotal,
        paidAmount: paidAmount || grandTotal,
        paymentType: paymentMethod,
      });
      setLastSale(data.data);
      setShowSuccess(true);
      toast.success('Sale completed successfully');
      resetCart();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleLoadHeld = (sale) => {
    setCart(sale.items || []);
    setSelectedCustomer(sale.customer || null);
    setDiscount(sale.discount || 0);
    setTax(sale.tax || 0);
    setPaymentMethod(sale.paymentMethod || 'cash');
    setPaidAmount(sale.paid || 0);
    setShowHeldModal(false);
    toast.info('Held invoice loaded');
  };

  const handlePrint = () => {
    if (!lastSale) { toast.warn('No sale to print'); return; }
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 no-print">
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F1</kbd> New Sale</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F2</kbd> Price History</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F3</kbd> Customer</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F4</kbd> Hold</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F5</kbd> Open Held</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F6</kbd> Cash</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F7</kbd> Credit</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F8</kbd> Card</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">F9</kbd> Print</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+S</kbd> Save</span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 mt-2 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name or barcode..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="btn-secondary flex items-center gap-2 whitespace-nowrap"
            >
              <FiUser size={16} />
              {selectedCustomer ? selectedCustomer.name : 'Customer'}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stockQuantity <= 0}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-left hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-20 object-contain mb-2 rounded"
                  />
                )}
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">{formatCurrency(product.salePrice || 0)}</p>
                <p className="text-xs text-gray-400">
                  Stock: {product.stockQuantity ?? 0}
                  {product.barcode && ` | ${product.barcode}`}
                </p>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="col-span-full text-center text-gray-400 py-8">No products found</p>
            )}
          </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white">Invoice</h3>
            <span className="text-sm text-gray-500">{cart.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                      <button
                        onClick={() =>
                          updateCartItem(item.id, 'quantity', Math.max(1, item.quantity - 1))
                        }
                        className="px-1.5 py-0.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <FiMinus size={12} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-10 text-center text-xs bg-transparent border-x border-gray-300 dark:border-gray-600 py-0.5 outline-none text-gray-800 dark:text-white"
                      />
                      <button
                        onClick={() => updateCartItem(item.id, 'quantity', item.quantity + 1)}
                        className="px-1.5 py-0.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(item.salePrice || 0)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {formatCurrency((item.salePrice || 0) * item.quantity)}
                  </p>
                  <input
                    type="number"
                    placeholder="Disc"
                    value={item.discount || ''}
                    onChange={(e) =>
                      updateCartItem(item.id, 'discount', parseFloat(e.target.value) || 0)
                    }
                    className="w-16 text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-600 dark:text-gray-400 mt-1"
                  />
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-center text-gray-400 py-8">Cart is empty</p>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Discount</span>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 text-right text-sm input-field py-1"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax (%)</span>
              <input
                type="number"
                value={tax || ''}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-24 text-right text-sm input-field py-1"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <div className="flex gap-2">
              {['cash', 'credit', 'card'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                    paymentMethod === method
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {method === 'cash' ? <FiDollarSign size={14} /> : method === 'credit' ? <FiClock size={14} /> : <FiCreditCard size={14} />}
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>

            {paymentMethod !== 'credit' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
                <input
                  type="number"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right input-field py-1"
                  placeholder="0.00"
                />
              </div>
            )}

            {paymentMethod !== 'credit' && paidAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">Change</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(Math.max(0, paidAmount - grandTotal))}
                </span>
              </div>
            )}

            {paymentMethod === 'credit' && (
              <div className="flex justify-between text-sm text-red-600 font-medium">
                <span>Due</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={handleHoldInvoice} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <FiSave size={16} /> Hold
              </button>
              <button onClick={() => setShowHeldModal(true)} className="btn-secondary flex items-center justify-center gap-2">
                <FiClock size={16} />
              </button>
              <button
                onClick={handleSave}
                disabled={processing || cart.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <FiSave size={16} /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Select Customer
              </h3>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowCustomerModal(false);
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Walk-in Customer
              </button>
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              className="input-field mb-3"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {customers
                .filter(
                  (c) =>
                    !customerSearch ||
                    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.phone?.includes(customerSearch)
                )
                .map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-500">{customer.phone} | {customer.email}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {showHeldModal && (
        <div className="modal-overlay" onClick={() => setShowHeldModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Held Invoices
            </h3>
            {heldInvoices.length > 0 ? (
              <div className="space-y-2">
                {heldInvoices.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        #{sale.invoiceNumber || sale.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(sale.total || 0)} | {sale.items?.length || 0} items
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadHeld(sale)}
                      className="btn-primary text-sm py-1 px-3"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No held invoices</p>
            )}
          </div>
        </div>
      )}

      {showSuccess && lastSale && (
        <div className="modal-overlay">
          <div className="modal-content text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSave className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Sale Completed!
            </h3>
            <p className="text-gray-500 mb-2">Invoice #{lastSale.invoiceNumber || lastSale.id}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              {formatCurrency(lastSale.total || 0)}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                <FiPrinter size={16} /> Print
              </button>
              <button
                onClick={() => setShowSuccess(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
