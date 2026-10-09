import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manufacturing' | 'sales' | 'procurement' | 'inventory' | 'boms' | 'ledger'>('dashboard');
  const [analytics, setAnalytics] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal forms
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState({ sku: '', name: '', item_type: 'RAW', unit_of_measure: 'PCS', on_hand: '0' });

  const [showSOModal, setShowSOModal] = useState(false);
  const [newSO, setNewSO] = useState({ order_number: '', customer: '', item_id: '', quantity: '5', unit_price: '150.00' });

  const getAuthToken = async () => {
    const res = await axios.post('/api/auth/token/', {
      email: 'admin@manuflow.local',
      password: 'AdminPass123!',
    });
    return res.data.access;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, woRes, soRes, poRes, invRes, bomRes, partRes, ledgerRes] = await Promise.all([
        axios.get('/api/analytics/dashboard/', { headers }),
        axios.get('/api/work-orders/', { headers }),
        axios.get('/api/sales-orders/', { headers }),
        axios.get('/api/purchase-orders/', { headers }),
        axios.get('/api/inventory/', { headers }),
        axios.get('/api/boms/', { headers }),
        axios.get('/api/partners/', { headers }),
        axios.get('/api/stock-ledger/', { headers }),
      ]);

      setAnalytics(statsRes.data);
      setWorkOrders(woRes.data);
      setSalesOrders(soRes.data);
      setPurchaseOrders(poRes.data);
      setInventory(invRes.data);
      setBoms(bomRes.data);
      setPartners(partRes.data);
      setLedger(ledgerRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAuthToken();
      await axios.post('/api/inventory/', newItem, { headers: { Authorization: `Bearer ${token}` } });
      setShowItemModal(false);
      setNewItem({ sku: '', name: '', item_type: 'RAW', unit_of_measure: 'PCS', on_hand: '0' });
      loadData();
    } catch (err: any) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleCreateSO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAuthToken();
      await axios.post('/api/sales-orders/', {
        order_number: newSO.order_number,
        customer: parseInt(newSO.customer),
        lines: [
          {
            item_id: parseInt(newSO.item_id),
            quantity: parseFloat(newSO.quantity),
            unit_price: parseFloat(newSO.unit_price)
          }
        ]
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowSOModal(false);
      setActiveTab('sales');
      loadData();
    } catch (err: any) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleWOAction = async (id: number, endpoint: 'allocate' | 'complete') => {
    try {
      const token = await getAuthToken();
      await axios.post(`/api/work-orders/${id}/${endpoint}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (err: any) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleConfirmSalesOrder = async (id: number) => {
    try {
      const token = await getAuthToken();
      await axios.post(`/api/sales-orders/${id}/confirm-and-plan/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setActiveTab('manufacturing');
      loadData();
    } catch (err: any) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDispatchOrder = async (id: number) => {
    try {
      const token = await getAuthToken();
      await axios.post(`/api/sales-orders/${id}/dispatch-and-invoice/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (err: any) {
      alert(JSON.stringify(err.response?.data?.error || err.message));
    }
  };

  const handleRecordPayment = async (id: number) => {
    try {
      const token = await getAuthToken();
      await axios.post(`/api/sales-orders/${id}/record-payment/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (err: any) {
      alert(JSON.stringify(err.response?.data?.error || err.message));
    }
  };

  const handleReceivePO = async (id: number) => {
    try {
      const token = await getAuthToken();
      await axios.post(`/api/purchase-orders/${id}/receive-goods/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (err: any) {
      alert(JSON.stringify(err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>⚙️ ManuFlow ERP Enterprise</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Multi-Tenant Manufacturing Execution & Supply Chain Intelligence
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowSOModal(true)}
            style={{ padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600 }}
          >
            + New Sales Order
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            style={{ padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 600 }}
          >
            + New Item
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: '#f1f5f9', border: '1px solid #cbd5e1', fontWeight: 600 }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh All'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'manufacturing', label: `🏭 Production (${workOrders.length})` },
          { key: 'sales', label: `🛒 Sales & Invoices (${salesOrders.length})` },
          { key: 'procurement', label: `🚚 Procurement (${purchaseOrders.length})` },
          { key: 'inventory', label: `📦 Inventory (${inventory.length})` },
          { key: 'boms', label: `🧱 BOMs (${boms.length})` },
          { key: 'ledger', label: `📝 Stock Ledger (${ledger.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '10px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #2563eb' : 'none',
              color: activeTab === tab.key ? '#2563eb' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>}

      {/* MODAL: ADD ITEM */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '420px' }}>
            <h3 style={{ margin: '0 0 16px' }}>Add Catalog Item</h3>
            <form onSubmit={handleCreateItem}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>SKU</label>
                <input required placeholder="RAW-ALU-003" value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Name</label>
                <input required placeholder="Aluminum Extrusion" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Type</label>
                  <select value={newItem.item_type} onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                    <option value="RAW">RAW</option>
                    <option value="WIP">WIP</option>
                    <option value="FINISHED">FINISHED</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Unit</label>
                  <input value={newItem.unit_of_measure} onChange={(e) => setNewItem({ ...newItem, unit_of_measure: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowItemModal(false)} style={{ padding: '8px 14px' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SALES ORDER */}
      {showSOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '450px' }}>
            <h3 style={{ margin: '0 0 16px' }}>Create New Sales Order</h3>
            <form onSubmit={handleCreateSO}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Order Number</label>
                <input required placeholder="SO-2026-102" value={newSO.order_number} onChange={(e) => setNewSO({ ...newSO, order_number: e.target.value })} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Customer</label>
                <select required value={newSO.customer} onChange={(e) => setNewSO({ ...newSO, customer: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                  <option value="">Select customer...</option>
                  {partners.filter(p => p.partner_type === 'CUSTOMER').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Finished Item</label>
                <select required value={newSO.item_id} onChange={(e) => setNewSO({ ...newSO, item_id: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                  <option value="">Select product...</option>
                  {inventory.filter(i => i.item_type === 'FINISHED').map(i => (
                    <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Quantity</label>
                  <input type="number" required value={newSO.quantity} onChange={(e) => setNewSO({ ...newSO, quantity: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Unit Price ($)</label>
                  <input type="number" step="any" required value={newSO.unit_price} onChange={(e) => setNewSO({ ...newSO, unit_price: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowSOModal(false)} style={{ padding: '8px 14px' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TOTAL BILLED REVENUE</span>
            <h2 style={{ margin: '8px 0 0', color: '#059669', fontSize: '28px' }}>
              ${analytics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>WORK ORDERS COMPLETED</span>
            <h2 style={{ margin: '8px 0 0', color: '#2563eb', fontSize: '28px' }}>
              {analytics.completed_work_orders} / {analytics.total_work_orders}
            </h2>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>PO PROCUREMENTS</span>
            <h2 style={{ margin: '8px 0 0', color: '#d97706', fontSize: '28px' }}>
              {analytics.total_pos}
            </h2>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>CATALOG ITEMS</span>
            <h2 style={{ margin: '8px 0 0', color: '#7c3aed', fontSize: '28px' }}>
              {analytics.total_raw_items + analytics.total_fg_items}
            </h2>
          </div>
        </div>
      )}

      {/* PRODUCTION TAB */}
      {activeTab === 'manufacturing' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px' }}>WO #</th>
                <th style={{ padding: '12px' }}>Quantity</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Raw Material Allocations</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{wo.wo_number}</td>
                  <td style={{ padding: '12px' }}>{parseFloat(wo.quantity)} Units</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: wo.status === 'COMPLETED' ? '#dcfce7' : wo.status === 'ALLOCATED' ? '#dbeafe' : '#fef3c7', color: wo.status === 'COMPLETED' ? '#15803d' : wo.status === 'ALLOCATED' ? '#1d4ed8' : '#b45309' }}>
                      {wo.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>
                    {wo.allocations?.map((a: any) => `${a.item_sku}: ${parseFloat(a.quantity)} [${a.status}]`).join(' | ') || 'None'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {wo.status === 'DRAFT' && (
                      <button onClick={() => handleWOAction(wo.id, 'allocate')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Reserve Stock</button>
                    )}
                    {wo.status === 'ALLOCATED' && (
                      <button onClick={() => handleWOAction(wo.id, 'complete')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Mark Produced</button>
                    )}
                    {wo.status === 'COMPLETED' && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Produced</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SALES & INVOICES TAB */}
      {activeTab === 'sales' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px' }}>SO #</th>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Order Details</th>
                <th style={{ padding: '12px' }}>Invoice & Payment</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((so) => (
                <tr key={so.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{so.order_number}</td>
                  <td style={{ padding: '12px' }}>{so.customer_name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: so.status === 'DISPATCHED' ? '#dcfce7' : so.status === 'IN_PRODUCTION' ? '#dbeafe' : '#fef3c7', color: so.status === 'DISPATCHED' ? '#15803d' : so.status === 'IN_PRODUCTION' ? '#1d4ed8' : '#b45309' }}>
                      {so.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>
                    {so.lines?.map((l: any) => `${l.item_sku} (${parseFloat(l.quantity)} pcs @ $${l.unit_price})`).join(', ')}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>
                    {so.invoice ? (
                      <div>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>{so.invoice.invoice_number} (${parseFloat(so.invoice.total_amount).toFixed(2)})</span>
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold', background: so.invoice.payment_status === 'PAID' ? '#dcfce7' : '#fee2e2', color: so.invoice.payment_status === 'PAID' ? '#166534' : '#991b1b' }}>
                            {so.invoice.payment_status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not Billed</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {so.status === 'DRAFT' && (
                      <button onClick={() => handleConfirmSalesOrder(so.id)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Confirm & Plan WO</button>
                    )}
                    {so.status === 'IN_PRODUCTION' && (
                      <button onClick={() => handleDispatchOrder(so.id)} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Dispatch & Invoice 🚚</button>
                    )}
                    {so.status === 'DISPATCHED' && so.invoice?.payment_status === 'PENDING' && (
                      <button onClick={() => handleRecordPayment(so.id)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Collect Payment 💵</button>
                    )}
                    {so.status === 'DISPATCHED' && so.invoice?.payment_status === 'PAID' && (
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Paid In Full</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PROCUREMENT TAB */}
      {activeTab === 'procurement' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px' }}>PO #</th>
                <th style={{ padding: '12px' }}>Supplier</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Ordered Raw Materials</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Goods Receipt (GRN)</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{po.po_number}</td>
                  <td style={{ padding: '12px' }}>{po.supplier_name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: po.status === 'RECEIVED' ? '#dcfce7' : '#dbeafe', color: po.status === 'RECEIVED' ? '#15803d' : '#1d4ed8' }}>
                      {po.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>
                    {po.lines?.map((l: any) => `${l.item_sku} (+${parseFloat(l.quantity)} @ $${l.unit_cost})`).join(', ')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {po.status !== 'RECEIVED' ? (
                      <button onClick={() => handleReceivePO(po.id)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                        Receive Goods (GRN) 📥
                      </button>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ Received In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px' }}>SKU</th>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>On Hand</th>
                <th style={{ padding: '12px' }}>Allocated</th>
                <th style={{ padding: '12px' }}>Available Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.sku}</td>
                  <td style={{ padding: '12px' }}>{item.name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', background: item.item_type === 'RAW' ? '#e2e8f0' : '#dcfce7', fontWeight: 600 }}>
                      {item.item_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{parseFloat(item.on_hand)} {item.unit_of_measure}</td>
                  <td style={{ padding: '12px', color: '#ea580c' }}>{parseFloat(item.allocated)}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: parseFloat(item.available_stock) > 0 ? '#16a34a' : '#64748b' }}>
                    {parseFloat(item.available_stock)} {item.unit_of_measure}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BOMS TAB */}
      {activeTab === 'boms' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {boms.map((bom) => (
            <div key={bom.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>{bom.code} - {bom.finished_item_name} ({bom.finished_item_sku})</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Version {bom.version} | Base Yield: {parseFloat(bom.yield_quantity)} unit(s)</span>
                </div>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  Active Formula
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '8px' }}>Raw Material SKU</th>
                    <th style={{ padding: '8px' }}>Component Name</th>
                    <th style={{ padding: '8px' }}>Qty Required per Yield</th>
                    <th style={{ padding: '8px' }}>Scrap Allowance</th>
                  </tr>
                </thead>
                <tbody>
                  {bom.components?.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{c.component_sku}</td>
                      <td style={{ padding: '8px' }}>{c.component_name}</td>
                      <td style={{ padding: '8px' }}>{parseFloat(c.quantity_required)}</td>
                      <td style={{ padding: '8px', color: '#d97706' }}>{parseFloat(c.scrap_rate_pct)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* STOCK LEDGER TAB */}
      {activeTab === 'ledger' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px' }}>Movement ID</th>
                <th style={{ padding: '12px' }}>Item SKU</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>Quantity Delta</th>
                <th style={{ padding: '12px' }}>Reference Document</th>
                <th style={{ padding: '12px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#64748b' }}>#{entry.id}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{entry.item_sku}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#334155' }}>
                      {entry.movement_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: parseFloat(entry.quantity) >= 0 ? '#16a34a' : '#dc2626' }}>
                    {parseFloat(entry.quantity) > 0 ? `+${parseFloat(entry.quantity)}` : parseFloat(entry.quantity)}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{entry.reference_id || 'N/A'}</td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;
