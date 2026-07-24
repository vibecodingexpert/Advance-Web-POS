import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FiSearch, FiX, FiTrash2, FiPrinter, FiSave, FiClock, FiDollarSign,
  FiCreditCard, FiUser, FiChevronDown, FiCopy, FiFileText, FiPlus,
  FiArrowLeft, FiCheck, FiAlertCircle, FiInfo, FiList, FiMonitor
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatCurrency } from '../../utils/format';

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'easypaisa', 'jazzcash', 'credit'];
const SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const SHORTCUTS = [
  { key: 'F2', label: 'Price History' },
  { key: 'F3', label: 'Customer History' },
  { key: 'F5', label: 'Hold Invoice' },
  { key: 'F6', label: 'Resume Invoice' },
  { key: 'F8', label: 'Payment Focus' },
  { key: 'F9', label: 'Complete Sale' },
  { key: 'F10', label: 'Print Invoice' },
  { key: 'Ctrl+K', label: 'Command Palette' },
  { key: 'Ctrl+P', label: 'Product Search' },
  { key: 'Ctrl+C', label: 'Customer Search' },
  { key: 'Esc', label: 'Close Popup' },
];

const SaleInvoice = () => {
  const [invoice, setInvoice] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    branch: 'Main',
    shift: 'Morning',
  });
  const [invoiceNo, setInvoiceNo] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [cashier, setCashier] = useState((JSON.parse(localStorage.getItem('user') || '{}')?.name) || '');

  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [prevBalance, setPrevBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [customerType, setCustomerType] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [priceHistoryData, setPriceHistoryData] = useState([]);
  const [priceHistoryPos, setPriceHistoryPos] = useState({ x: 0, y: 0 });

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState([]);

  const [rows, setRows] = useState([]);
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [focusedField, setFocusedField] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  const [discount, setDiscount] = useState(0);
  const [charges, setCharges] = useState(0);
  const [received, setReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [heldInvoices, setHeldInvoices] = useState([]);
  const [showHeldModal, setShowHeldModal] = useState(false);

  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const cmdRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const barcodeRef = useRef(null);
  const productSearchRef = useRef(null);
  const tableRef = useRef(null);

  const isWalkIn = customer && customer.id === 'walk-in';

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [rows, customer, discount, charges, received, paymentMethod, activeRowIndex, showCmdPalette, showCustomerPopup, showProductSearch, showHeldModal, showCustomerHistory, showPriceHistory, showSuccess]);

  useEffect(() => { if (barcodeRef.current) barcodeRef.current.focus(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes, catRes, heldRes, invRes] = await Promise.all([
        api.get('/api/products?limit=500'),
        api.get('/api/customers?limit=200'),
        api.get('/api/categories'),
        api.get('/api/sales/held'),
        api.get('/api/settings/invoice'),
      ]);
      setProducts(prodRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setCategories(catRes.data.data || []);
      setHeldInvoices(heldRes.data.data || []);
      if (invRes.data.data?.nextNumber) setInvoiceNo(invRes.data.data.nextNumber);
      else setInvoiceNo(`INV-${Date.now().toString(36).toUpperCase()}`);
    } catch (e) {
      setInvoiceNo(`INV-${Date.now().toString(36).toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const createRowId = () => Date.now() + Math.random();

  const addProductRow = (product, qty = 1) => {
    if (!product || product.stockQuantity <= 0) { toast.warn('Product out of stock'); return; }
    setRows(prev => {
      const existing = prev.find(r => r.productId === product.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty > product.stockQuantity) { toast.warn('Insufficient stock'); return prev; }
        return prev.map(r => r.productId === product.id ? { ...r, qty: newQty, total: newQty * r.price } : r);
      }
      const newRow = {
        id: createRowId(),
        productId: product.id,
        barcode: product.barcode || '',
        name: product.name,
        unit: product.unit?.shortName || 'pcs',
        stock: product.stockQuantity,
        qty,
        price: 0,
        discount: 0,
        discType: 'amount',
        total: 0,
      };
      return [...prev, newRow];
    });
  };

  const updateRow = (rowId, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const updated = { ...r, [field]: value };
      if (field === 'qty') {
        const q = parseFloat(value) || 0;
        updated.qty = q;
        updated.total = q * r.price - (r.discType === 'amount' ? r.discount : (q * r.price * r.discount / 100));
      } else if (field === 'price') {
        const p = parseFloat(value) || 0;
        updated.price = p;
        updated.total = r.qty * p - (r.discType === 'amount' ? r.discount : (r.qty * p * r.discount / 100));
      } else if (field === 'discount') {
        const d = parseFloat(value) || 0;
        updated.discount = d;
        updated.total = r.qty * r.price - (r.discType === 'amount' ? d : (r.qty * r.price * d / 100));
      } else if (field === 'discType') {
        updated.discType = value;
        updated.total = r.qty * r.price - (value === 'amount' ? r.discount : (r.qty * r.price * r.discount / 100));
      }
      return updated;
    }));
  };

  const removeRow = (rowId) => { setRows(prev => prev.filter(r => r.id !== rowId)); };
  const duplicateRow = (rowId) => {
    setRows(prev => {
      const idx = prev.findIndex(r => r.id === rowId);
      if (idx === -1) return prev;
      const dup = { ...prev[idx], id: createRowId() };
      const result = [...prev];
      result.splice(idx + 1, 0, dup);
      return result;
    });
  };

  const subtotal = useMemo(() => rows.reduce((s, r) => s + r.qty * r.price, 0), [rows]);
  const lineDiscounts = useMemo(() => rows.reduce((s, r) => s + ((r.discType === 'amount' ? r.discount : (r.qty * r.price * r.discount / 100)) || 0), 0), [rows]);
  const netTotal = subtotal - lineDiscounts;
  const invoiceDiscount = parseFloat(discount) || 0;
  const afterDiscount = netTotal - invoiceDiscount;
  const otherCharges = parseFloat(charges) || 0;
  const balDue = parseFloat(prevBalance) || 0;
  const grandTotal = Math.max(0, afterDiscount + otherCharges + balDue);
  const receivedAmt = parseFloat(received) || 0;
  const balance = receivedAmt - grandTotal;

  const resetInvoice = () => {
    setRows([]);
    setCustomer(null);
    setCustomerPhone('');
    setPrevBalance(0);
    setCreditLimit(0);
    setCustomerType('');
    setCustomerAddress('');
    setCustomerNotes('');
    setDiscount(0);
    setCharges(0);
    setReceived(0);
    setPaymentMethod('cash');
    setPaymentNotes('');
    setInvoiceNo(`INV-${Date.now().toString(36).toUpperCase()}`);
    setInvoice({ ...invoice, date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5) });
    setShowSuccess(false);
    setLastSale(null);
    setActiveRowIndex(-1);
    if (barcodeRef.current) barcodeRef.current.focus();
  };

  const selectCustomer = (c) => {
    setCustomer(c);
    setShowCustomerPopup(false);
    if (c && c.id !== 'walk-in') {
      setCustomerPhone(c.phone || '');
      setPrevBalance(parseFloat(c.dueAmount) || 0);
      setCreditLimit(parseFloat(c.creditLimit) || 0);
      setCustomerType(c.type || 'Regular');
      setCustomerAddress(c.address || '');
    } else {
      setCustomerPhone('');
      setPrevBalance(0);
      setCreditLimit(0);
      setCustomerType('');
      setCustomerAddress('');
    }
  };

  const handleBarcode = async (e) => {
    if (e.key !== 'Enter') return;
    const code = barcodeInput.trim();
    if (!code) return;
    setBarcodeInput('');
    try {
      const { data } = await api.get(`/api/products/barcode/${code}`);
      if (data.data) addProductRow(data.data);
      else toast.warn('Product not found');
    } catch {
      const found = products.find(p => p.barcode === code);
      if (found) addProductRow(found);
      else toast.warn('Product not found');
    }
  };

  const handleProductSearchSelect = (product) => {
    addProductRow(product);
    setShowProductSearch(false);
    setProductSearch('');
    if (barcodeRef.current) barcodeRef.current.focus();
  };

  useEffect(() => {
    if (!productSearch.trim()) { setProductSearchResults([]); return; }
    const q = productSearch.toLowerCase();
    const results = products.filter(p => p.name?.toLowerCase().includes(q) || p.barcode?.includes(q));
    setProductSearchResults(results.slice(0, 20));
  }, [productSearch, products]);

  const handleComplete = async () => {
    if (rows.length === 0) { toast.warn('Add at least one product'); return; }
    if (!customer && !isWalkIn) { toast.warn('Select or create a customer'); return; }
    if (paymentMethod !== 'credit' && receivedAmt < grandTotal) { toast.warn('Received amount is less than grand total'); return; }
    const invalidRows = rows.filter(r => r.qty <= 0 || r.price <= 0);
    if (invalidRows.length > 0) { toast.warn('Some rows have invalid quantity or price'); return; }
    if (creditLimit > 0 && grandTotal > creditLimit) { toast.warn('Sale exceeds credit limit'); return; }

    setProcessing(true);
    try {
      const { data } = await api.post('/api/sales', {
        items: rows.map(r => ({ productId: r.productId, quantity: r.qty, price: r.price, discount: r.discount, total: r.total })),
        customerId: customer && customer.id !== 'walk-in' ? customer.id : null,
        discount: invoiceDiscount,
        subtotal,
        total: grandTotal,
        paidAmount: paymentMethod === 'credit' ? 0 : receivedAmt,
        paymentType: paymentMethod,
        notes: paymentNotes || customerNotes,
      });
      setLastSale(data.data);
      setShowSuccess(true);
      toast.success('Sale completed');
      const heldRes = await api.get('/api/sales/held');
      setHeldInvoices(heldRes.data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = async () => {
    if (rows.length === 0) { toast.warn('Cart is empty'); return; }
    setProcessing(true);
    try {
      await api.post('/api/sales/hold', {
        items: JSON.stringify(rows.map(r => ({ productId: r.productId, name: r.name, price: r.price, quantity: r.qty, discount: r.discount }))),
        customerName: customer?.name || 'Walk-in',
        customerPhone: customerPhone,
        subtotal,
        discount: invoiceDiscount + lineDiscounts,
        total: grandTotal,
        notes: customerNotes,
      });
      toast.success('Invoice held');
      resetInvoice();
      const heldRes = await api.get('/api/sales/held');
      setHeldInvoices(heldRes.data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to hold');
    } finally {
      setProcessing(false);
    }
  };

  const loadHeldInvoice = async (held) => {
    try {
      const { data } = await api.get(`/api/sales/held/${held.id}`);
      const inv = data.data;
      const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
      setRows(items.map(item => ({
        id: createRowId(),
        productId: item.productId,
        name: item.name,
        barcode: '',
        unit: 'pcs',
        stock: 999,
        qty: item.quantity,
        price: item.price || 0,
        discount: item.discount || 0,
        discType: 'amount',
        total: (item.price || 0) * (item.quantity || 0) - (item.discount || 0),
      })));
      setInvoiceNo(inv.invoiceNumber || held.invoiceNumber);
      setDiscount(inv.discount || 0);
      setShowHeldModal(false);
      toast.success('Held invoice loaded');
    } catch (e) {
      toast.error('Failed to load held invoice');
    }
  };

  const deleteHeld = async (id) => {
    try {
      await api.delete(`/api/sales/held/${id}`);
      const heldRes = await api.get('/api/sales/held');
      setHeldInvoices(heldRes.data.data || []);
      toast.success('Held invoice deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const fetchPriceHistory = async (productId) => {
    try {
      const { data } = await api.get(`/api/sales/price-history?productId=${productId}`);
      setPriceHistoryData(data.data || []);
    } catch { setPriceHistoryData([]); }
  };

  const fetchCustomerHistory = async () => {
    if (!customer || customer.id === 'walk-in') return;
    try {
      const { data } = await api.get(`/api/sales?customerId=${customer.id}&limit=50`);
      setCustomerHistory(data.data || []);
      setShowCustomerHistory(true);
    } catch { toast.error('Failed to load history'); }
  };

  const handlePrint = () => { window.print(); };

  const handleGlobalKeydown = useCallback((e) => {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setShowCmdPalette(true); setCmdSearch(''); return; }
    if (e.key === 'Escape') {
      if (showCmdPalette) { setShowCmdPalette(false); return; }
      if (showCustomerPopup) { setShowCustomerPopup(false); return; }
      if (showProductSearch) { setShowProductSearch(false); return; }
      if (showHeldModal) { setShowHeldModal(false); return; }
      if (showCustomerHistory) { setShowCustomerHistory(false); return; }
      if (showPriceHistory) { setShowPriceHistory(false); return; }
      if (showSuccess) { setShowSuccess(false); resetInvoice(); return; }
      return;
    }

    if (showCmdPalette || showCustomerPopup || showHeldModal || showCustomerHistory || showPriceHistory || showSuccess) return;

    if (e.ctrlKey && e.key === 'p') { e.preventDefault(); setShowProductSearch(true); setProductSearch(''); setTimeout(() => productSearchRef.current?.focus(), 50); return; }
    if (e.ctrlKey && e.key === 'c') { e.preventDefault(); setShowCustomerPopup(true); setCustomerSearch(''); return; }

    if (isInput && e.key !== 'F2' && e.key !== 'F3' && !e.key.startsWith('F')) return;

    switch (e.key) {
      case 'F2':
        e.preventDefault();
        if (activeRowIndex >= 0 && activeRowIndex < rows.length) {
          const rect = tableRef.current?.querySelector(`[data-row="${activeRowIndex}"]`)?.getBoundingClientRect();
          setPriceHistoryPos({ x: rect?.right || 0, y: rect?.top || 0 });
          fetchPriceHistory(rows[activeRowIndex].productId);
          setShowPriceHistory(true);
        }
        break;
      case 'F3': e.preventDefault(); fetchCustomerHistory(); break;
      case 'F5': e.preventDefault(); handleHold(); break;
      case 'F6': e.preventDefault(); setShowHeldModal(true); break;
      case 'F8': e.preventDefault(); document.getElementById('received-amount')?.focus(); break;
      case 'F9': e.preventDefault(); handleComplete(); break;
      case 'F10': e.preventDefault(); handlePrint(); break;
    }
  }, [rows, customer, activeRowIndex, discount, charges, received, paymentMethod, showCmdPalette, showCustomerPopup, showHeldModal, showCustomerHistory, showPriceHistory, showSuccess]);

  const handleTableKeyDown = (e, rowIndex, field) => {
    const totalRows = rows.length;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); setActiveRowIndex(Math.max(0, rowIndex - 1)); break;
      case 'ArrowDown': e.preventDefault(); setActiveRowIndex(Math.min(totalRows - 1, rowIndex + 1)); break;
      case 'Enter': {
        e.preventDefault();
        const fields = ['qty', 'price', 'discount'];
        const idx = fields.indexOf(field);
        if (idx < fields.length - 1) { setEditingCell({ row: rowIndex, field: fields[idx + 1] }); }
        else if (rowIndex < totalRows - 1) { setActiveRowIndex(rowIndex + 1); setEditingCell({ row: rowIndex + 1, field: 'qty' }); }
        else { setEditingCell(null); document.getElementById('invoice-discount')?.focus(); }
        break;
      }
      case 'Delete': if (e.shiftKey) { e.preventDefault(); removeRow(rows[rowIndex]?.id); } break;
    }
  };

  const cmdActions = [
    { key: 'new', label: 'New Invoice', icon: FiFileText, action: resetInvoice },
    { key: 'hold', label: 'Hold Invoice', icon: FiSave, action: handleHold },
    { key: 'resume', label: 'Resume Invoice', icon: FiClock, action: () => setShowHeldModal(true) },
    { key: 'complete', label: 'Complete Sale', icon: FiCheck, action: handleComplete },
    { key: 'print', label: 'Print Invoice', icon: FiPrinter, action: handlePrint },
    { key: 'customer', label: 'Customer Search', icon: FiUser, action: () => setShowCustomerPopup(true) },
    { key: 'product', label: 'Product Search', icon: FiSearch, action: () => { setShowProductSearch(true); setTimeout(() => productSearchRef.current?.focus(), 50); } },
    { key: 'history', label: 'Customer History', icon: FiList, action: fetchCustomerHistory },
    { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: FiMonitor, action: () => setShowShortcuts(true) },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col print:h-auto select-none">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { font-size: 10pt; }
          .print-header { text-align: center; margin-bottom: 10px; }
          .print-header h1 { font-size: 16pt; margin: 0; }
          .print-table { width: 100%; border-collapse: collapse; }
          .print-table th, .print-table td { border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 9pt; }
          .print-footer { text-align: center; margin-top: 10px; font-size: 9pt; }
        }
        .print-only { display: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
        .pos-input { height: 32px; padding: 0 8px; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 4px; outline: none; background: #fff; color: #1e293b; width: 100%; }
        .pos-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.15); }
        .dark .pos-input { background: #1e293b; border-color: #334155; color: #e2e8f0; }
        .dark .pos-input:focus { border-color: #818cf8; }
        .pos-input-sm { height: 28px; font-size: 12px; padding: 0 6px; }
        .pos-cell-input { height: 28px; font-size: 12px; padding: 0 6px; border: 1px solid transparent; border-radius: 2px; outline: none; background: transparent; color: inherit; width: 100%; text-align: right; }
        .pos-cell-input:focus { border-color: #6366f1; background: #fff; }
        .dark .pos-cell-input:focus { background: #1e293b; }
        .pos-btn { height: 32px; padding: 0 14px; font-size: 12px; font-weight: 600; border-radius: 4px; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
        .pos-btn-primary { background: #6366f1; color: #fff; }
        .pos-btn-primary:hover { background: #4f46e5; }
        .pos-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .pos-btn-success { background: #10b981; color: #fff; }
        .pos-btn-success:hover { background: #059669; }
        .pos-btn-warning { background: #f59e0b; color: #fff; }
        .pos-btn-warning:hover { background: #d97706; }
        .pos-btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
        .pos-btn-ghost:hover { background: #f1f5f9; }
        .dark .pos-btn-ghost { color: #94a3b8; border-color: #334155; }
        .dark .pos-btn-ghost:hover { background: #1e293b; }
        .row-active { background: #eef2ff !important; }
        .dark .row-active { background: #1e1b4b !important; }
        .cell-editing { border-color: #6366f1 !important; background: #fff !important; }
        .dark .cell-editing { background: #1e293b !important; }
      `}</style>

      {/* ===== Header Bar ===== */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 no-print flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">SALE INVOICE</span>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">#</span>
            <span className="font-semibold text-gray-800 dark:text-white">{invoiceNo}</span>
          </div>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <input type="date" value={invoice.date} onChange={e => setInvoice({ ...invoice, date: e.target.value })}
            className="pos-input pos-input-sm w-32" />
          <input type="time" value={invoice.time} onChange={e => setInvoice({ ...invoice, time: e.target.value })}
            className="pos-input pos-input-sm w-24" />
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <select value={invoice.shift} onChange={e => setInvoice({ ...invoice, shift: e.target.value })}
            className="pos-input pos-input-sm w-24">
            {SHIFTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input value={cashier} onChange={e => setCashier(e.target.value)} placeholder="Cashier"
            className="pos-input pos-input-sm w-28" />
          <input value={salesPerson} onChange={e => setSalesPerson(e.target.value)} placeholder="Sales Person"
            className="pos-input pos-input-sm w-28" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowShortcuts(true)} className="pos-btn pos-btn-ghost" title="Shortcuts (Ctrl+K)">
            <FiMonitor size={14} /> Shortcuts
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ===== Left Panel: Customer + Table ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Customer Bar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5 no-print flex items-center gap-3 text-sm">
            <div className="relative w-64">
              <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 cursor-pointer"
                onClick={() => { setShowCustomerPopup(true); setCustomerSearch(''); }}>
                <FiUser size={14} className="ml-2 text-gray-400" />
                <span className="px-2 py-1.5 text-sm min-w-[180px] text-gray-700 dark:text-gray-200">
                  {customer && customer.id !== 'walk-in' ? customer.name : customer?.id === 'walk-in' ? 'Walk-In Customer' : 'Select Customer...'}
                </span>
                <FiChevronDown size={14} className="mr-2 text-gray-400" />
              </div>
            </div>
            {customer && customer.id !== 'walk-in' && (
              <>
                <span className="text-xs text-gray-500">Bal: <span className={`font-medium ${prevBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(prevBalance)}</span></span>
                {creditLimit > 0 && <span className="text-xs text-gray-500">Limit: <span className="font-medium">{formatCurrency(creditLimit)}</span></span>}
                <span className="text-xs text-gray-500">Type: <span className="font-medium">{customerType}</span></span>
              </>
            )}
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone"
              className="pos-input pos-input-sm w-36" />
            <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Address (optional)"
              className="pos-input pos-input-sm flex-1" />
            <button onClick={() => selectCustomer({ id: 'walk-in', name: 'Walk-In Customer' })}
              className={`pos-btn pos-input-sm text-xs ${isWalkIn ? 'pos-btn-primary' : 'pos-btn-ghost'}`}>Walk-In</button>
          </div>

          {/* Product Entry Bar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5 no-print flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input ref={barcodeRef} type="text" value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcode}
                placeholder="Scan Barcode (F2 Price, F3 History)"
                className="pos-input pos-input-sm pl-7" />
              <FiSearch size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button onClick={() => { setShowProductSearch(true); setProductSearch(''); setTimeout(() => productSearchRef.current?.focus(), 50); }}
              className="pos-btn pos-btn-ghost text-xs">
              <FiPlus size={13} /> Search Product (Ctrl+P)
            </button>
          </div>

          {/* Product Table */}
          <div className="flex-1 overflow-auto scrollbar-thin bg-white dark:bg-gray-800" ref={tableRef}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <th className="py-2 px-2 text-center w-10">#</th>
                  <th className="py-2 px-2 text-left w-24">Barcode</th>
                  <th className="py-2 px-2 text-left">Product Name</th>
                  <th className="py-2 px-2 text-center w-12">Unit</th>
                  <th className="py-2 px-2 text-right w-16">Stock</th>
                  <th className="py-2 px-2 text-right w-20">Qty</th>
                  <th className="py-2 px-2 text-right w-24">Selling Price</th>
                  <th className="py-2 px-2 text-right w-28">Discount</th>
                  <th className="py-2 px-2 text-right w-24">Total</th>
                  <th className="py-2 px-2 text-center w-10">Act</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400 text-sm">Scan barcode or search product to start</td></tr>
                )}
                {rows.map((row, idx) => {
                  const isActive = idx === activeRowIndex;
                  const lowStock = row.stock > 0 && row.stock <= 5;
                  return (
                    <tr key={row.id} data-row={idx}
                      className={`border-b border-gray-100 dark:border-gray-700/50 text-sm ${isActive ? 'row-active' : ''} ${lowStock ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                      onClick={() => setActiveRowIndex(idx)}>
                      <td className="py-1 px-2 text-center text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-1 px-2 text-gray-500 text-xs">{row.barcode || '-'}</td>
                      <td className="py-1 px-2 font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {row.name}
                        {lowStock && <span className="ml-2 text-red-500 text-xs">(Low Stock: {row.stock})</span>}
                      </td>
                      <td className="py-1 px-2 text-center text-gray-500 text-xs">{row.unit}</td>
                      <td className="py-1 px-2 text-right text-gray-600 dark:text-gray-400 text-xs">{row.stock}</td>
                      <td className="py-1 px-2">
                        <input type="number" min="1" max={row.stock}
                          value={row.qty || ''}
                          onFocus={() => { setActiveRowIndex(idx); setEditingCell({ row: idx, field: 'qty' }); }}
                          onKeyDown={e => handleTableKeyDown(e, idx, 'qty')}
                          onChange={e => updateRow(row.id, 'qty', e.target.value)}
                          className={`pos-cell-input text-right ${editingCell?.row === idx && editingCell?.field === 'qty' ? 'cell-editing' : ''}`} />
                      </td>
                      <td className="py-1 px-2">
                        <input type="number" step="0.01" min="0"
                          value={row.price || ''} placeholder="0"
                          onFocus={() => { setActiveRowIndex(idx); setEditingCell({ row: idx, field: 'price' }); }}
                          onKeyDown={e => handleTableKeyDown(e, idx, 'price')}
                          onChange={e => updateRow(row.id, 'price', e.target.value)}
                          className={`pos-cell-input text-right font-medium ${editingCell?.row === idx && editingCell?.field === 'price' ? 'cell-editing' : ''}`} />
                      </td>
                      <td className="py-1 px-2">
                        <div className="flex items-center gap-1">
                          <input type="number" step="0.01" min="0"
                            value={row.discount || ''} placeholder="0"
                            onFocus={() => { setActiveRowIndex(idx); setEditingCell({ row: idx, field: 'discount' }); }}
                            onKeyDown={e => handleTableKeyDown(e, idx, 'discount')}
                            onChange={e => updateRow(row.id, 'discount', e.target.value)}
                            className={`pos-cell-input text-right w-16 ${editingCell?.row === idx && editingCell?.field === 'discount' ? 'cell-editing' : ''}`} />
                          <select value={row.discType} onChange={e => updateRow(row.id, 'discType', e.target.value)}
                            className="text-[10px] border border-gray-200 dark:border-gray-600 rounded bg-transparent text-gray-500 w-10">
                            <option value="amount">Rs</option>
                            <option value="percent">%</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-1 px-2 text-right font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        {formatCurrency(row.total)}
                      </td>
                      <td className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => duplicateRow(row.id)} className="p-0.5 text-gray-400 hover:text-indigo-600" title="Duplicate"><FiCopy size={12} /></button>
                          <button onClick={() => removeRow(row.id)} className="p-0.5 text-gray-400 hover:text-red-600" title="Remove"><FiX size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1 no-print">
            <input value={customerNotes} onChange={e => setCustomerNotes(e.target.value)}
              placeholder="Invoice notes..."
              className="pos-input pos-input-sm w-full" />
          </div>
        </div>

        {/* ===== Right Panel: Totals + Payment ===== */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col no-print">
          <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-1.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice Summary</h3>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Line Discounts</span>
              <span className="text-red-600 font-medium">-{formatCurrency(lineDiscounts)}</span>
            </div>
            {invoiceDiscount > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500">Invoice Discount</span>
                <input type="number" id="invoice-discount" value={discount || ''} onChange={e => setDiscount(e.target.value)}
                  className="pos-cell-input text-right w-24 font-medium text-red-600" placeholder="0" />
              </div>
            )}
            {invoiceDiscount <= 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500">Invoice Discount</span>
                <input type="number" value={discount || ''} onChange={e => setDiscount(e.target.value)}
                  className="pos-cell-input text-right w-24 font-medium text-red-600" placeholder="0" />
              </div>
            )}
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Other Charges</span>
              <input type="number" value={charges || ''} onChange={e => setCharges(e.target.value)}
                className="pos-cell-input text-right w-24 font-medium" placeholder="0" />
            </div>
            {balDue > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500 text-red-600">Previous Balance</span>
                <span className="text-red-600 font-medium">{formatCurrency(balDue)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            <div className="flex justify-between text-base font-bold py-1">
              <span className="text-gray-800 dark:text-white">Grand Total</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`text-xs px-2.5 py-1 rounded font-medium capitalize ${paymentMethod === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {m === 'bank_transfer' ? 'Bank' : m}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Received</span>
                <input id="received-amount" type="number" step="0.01" value={received || ''}
                  onChange={e => setReceived(e.target.value)}
                  className="pos-input pos-input-sm w-32 text-right font-semibold text-lg" placeholder="0" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance</span>
                <span className={`font-bold text-base ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balance >= 0 ? formatCurrency(balance) : `(${formatCurrency(Math.abs(balance))})`}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Change Return</span>
                <span className={balance > 0 ? 'text-green-600 font-medium' : ''}>{balance > 0 ? formatCurrency(balance) : '0.00'}</span>
              </div>
            </div>
            <input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Payment notes..."
              className="pos-input pos-input-sm w-full mt-2" />
          </div>

          {/* Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <button onClick={handleComplete} disabled={processing || rows.length === 0}
              className="pos-btn pos-btn-success w-full justify-center text-sm py-2.5 h-auto">
              {processing ? 'Processing...' : <><FiCheck size={16} /> Complete Sale (F9)</>}
            </button>
            <div className="flex gap-2">
              <button onClick={resetInvoice} className="pos-btn pos-btn-ghost flex-1 justify-center text-xs">
                <FiFileText size={13} /> New
              </button>
              <button onClick={handleHold} disabled={rows.length === 0} className="pos-btn pos-btn-warning flex-1 justify-center text-xs">
                <FiSave size={13} /> Hold (F5)
              </button>
              <button onClick={() => setShowHeldModal(true)} className="pos-btn pos-btn-ghost flex-1 justify-center text-xs">
                <FiClock size={13} /> Held (F6)
              </button>
              <button onClick={handlePrint} disabled={!lastSale && rows.length === 0} className="pos-btn pos-btn-ghost flex-1 justify-center text-xs">
                <FiPrinter size={13} /> Print (F10)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Print Template ===== */}
      <div className="print-only">
        <div className="print-header">
          <h1>{cashier || 'Store'}</h1>
          <p>Invoice #{lastSale?.invoiceNumber || invoiceNo}</p>
          <p>Date: {invoice.date} | Time: {invoice.time}</p>
          {customer && customer.id !== 'walk-in' && <p>Customer: {customer.name} | {customerPhone}</p>}
        </div>
        <table className="print-table">
          <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Disc</th><th>Total</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}><td>{i + 1}</td><td>{r.name}</td><td>{r.qty}</td><td>{r.price}</td><td>{r.discount}</td><td>{r.total}</td></tr>)}</tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <p>Subtotal: {formatCurrency(subtotal)}</p>
          <p>Discount: {formatCurrency(invoiceDiscount + lineDiscounts)}</p>
          {balDue > 0 && <p>Previous Balance: {formatCurrency(balDue)}</p>}
          <p style={{ fontSize: '14pt', fontWeight: 'bold' }}>Grand Total: {formatCurrency(grandTotal)}</p>
          <p>Paid: {formatCurrency(receivedAmt)}</p>
          <p>Balance: {formatCurrency(balance)}</p>
        </div>
        <div className="print-footer">Thank you for your business!</div>
      </div>

      {/* ===== Customer Search Popup ===== */}
      {showCustomerPopup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30" onClick={() => setShowCustomerPopup(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[420px] max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <FiSearch size={15} className="text-gray-400" />
              <input autoFocus type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search customer by name or phone..."
                className="pos-input !border-0 !shadow-none !p-0 !h-7 text-sm"
                onKeyDown={e => { if (e.key === 'Escape') setShowCustomerPopup(false); if (e.key === 'Enter') { const first = customers.filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch))[0]; if (first) selectCustomer(first); } }} />
            </div>
            <div className="flex-1 overflow-auto">
              {customers.filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)).map(c => (
                <div key={c.id} className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700/50"
                  onClick={() => selectCustomer(c)}>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone || ''} | {c.city || ''} | Bal: {formatCurrency(c.dueAmount || 0)}</p>
                </div>
              ))}
              {customers.filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)).length === 0 && (
                <p className="text-center py-6 text-gray-400 text-sm">No customers found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Product Search Popup ===== */}
      {showProductSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30" onClick={() => setShowProductSearch(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[500px] max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <FiSearch size={15} className="text-gray-400" />
              <input ref={productSearchRef} type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="Search product by name or barcode..."
                className="pos-input !border-0 !shadow-none !p-0 !h-7 text-sm"
                onKeyDown={e => { if (e.key === 'Escape') setShowProductSearch(false); }}} />
            </div>
            <div className="flex-1 overflow-auto">
              {productSearchResults.map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700/50"
                  onClick={() => handleProductSearchSelect(p)}>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.barcode || 'N/A'} | Stock: {p.stockQuantity} | {p.Category?.name || ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{formatCurrency(p.salePrice || 0)}</span>
                </div>
              ))}
              {productSearchResults.length === 0 && productSearch && (
                <p className="text-center py-6 text-gray-400 text-sm">No products found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Held Invoices Modal ===== */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowHeldModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[500px] max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white">Held Invoices</h3>
              <button onClick={() => setShowHeldModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {heldInvoices.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">No held invoices</p>
              ) : (
                <div className="space-y-2">
                  {heldInvoices.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">#{h.invoiceNumber || h.id}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(h.total || 0)} | {h.items ? (typeof h.items === 'string' ? JSON.parse(h.items).length : h.items.length) : 0} items</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadHeldInvoice(h)} className="pos-btn pos-btn-primary text-xs py-1 h-auto">Load</button>
                        <button onClick={() => deleteHeld(h.id)} className="pos-btn pos-btn-ghost text-xs py-1 h-auto text-red-500"><FiTrash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Customer History Modal ===== */}
      {showCustomerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowCustomerHistory(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[600px] max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white">Customer History - {customer?.name}</h3>
              <button onClick={() => setShowCustomerHistory(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18} /></button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {customerHistory.length === 0 ? (<p className="text-center py-6 text-gray-400 text-sm">No purchase history</p>) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-1 px-2">Invoice</th><th className="text-left py-1 px-2">Date</th><th className="text-right py-1 px-2">Total</th><th className="text-center py-1 px-2">Status</th>
                  </tr></thead>
                  <tbody>{customerHistory.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-1.5 px-2 font-medium">#{s.invoiceNumber}</td>
                      <td className="py-1.5 px-2 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="py-1.5 px-2 text-right">{formatCurrency(s.total)}</td>
                      <td className="py-1.5 px-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Price History Tooltip ===== */}
      {showPriceHistory && (
        <div className="fixed inset-0 z-50 bg-black/10" onClick={() => setShowPriceHistory(false)}>
          <div className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 w-64"
            style={{ left: Math.min(priceHistoryPos.x, window.innerWidth - 280), top: Math.min(priceHistoryPos.y, window.innerHeight - 200) }}
            onClick={e => e.stopPropagation()}>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Price History</h4>
            {priceHistoryData.length === 0 ? (<p className="text-xs text-gray-400">No price history</p>) : (
              <div className="space-y-1 max-h-32 overflow-auto">
                {priceHistoryData.slice(0, 10).map((h, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500">{new Date(h.createdAt).toLocaleDateString()}</span>
                    <span className="font-medium">{formatCurrency(h.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Success Modal ===== */}
      {showSuccess && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowSuccess(false); resetInvoice(); }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-96 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Sale Completed!</h3>
            <p className="text-gray-500 text-sm mb-1">Invoice #{lastSale.invoiceNumber || lastSale.id}</p>
            <p className="text-3xl font-bold text-indigo-600 mb-6">{formatCurrency(lastSale.total || grandTotal)}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handlePrint} className="pos-btn pos-btn-primary"><FiPrinter size={15} /> Print</button>
              <button onClick={() => { setShowSuccess(false); resetInvoice(); }} className="pos-btn pos-btn-ghost">New Invoice</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Command Palette ===== */}
      {showCmdPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30" onClick={() => setShowCmdPalette(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[400px] max-h-[50vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <input ref={cmdRef} type="text" value={cmdSearch} onChange={e => setCmdSearch(e.target.value)}
                placeholder="Type a command..."
                className="pos-input !border-0 !shadow-none !p-0 !h-7 text-sm"
                onKeyDown={e => { if (e.key === 'Escape') setShowCmdPalette(false); }} />
            </div>
            <div className="flex-1 overflow-auto p-1">
              {cmdActions.filter(a => !cmdSearch || a.label.toLowerCase().includes(cmdSearch.toLowerCase())).map(a => (
                <div key={a.key} className="flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer rounded"
                  onClick={() => { setShowCmdPalette(false); a.action(); }}>
                  <a.icon size={15} className="text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== Shortcuts Help ===== */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-80 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-gray-600"><FiX size={16} /></button>
            </div>
            <div className="space-y-1.5">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{s.label}</span>
                  <kbd className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;