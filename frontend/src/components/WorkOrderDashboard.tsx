import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { WorkOrder } from '../types';
import { 
  CheckCircle2, 
  Layers, 
  Boxes, 
  RefreshCw, 
  ArrowRightCircle, 
  CheckCheck,
  AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export const WorkOrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get<WorkOrder[]>('/work-orders/');
      setOrders(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (id: number, endpoint: 'allocate' | 'complete') => {
    setActionLoading(id);
    setError(null);
    try {
      await api.post(`/work-orders/${id}/${endpoint}/`);
      await fetchOrders();
    } catch (err: any) {
      const resData = err.response?.data;
      if (resData?.shortages) {
        const details = resData.shortages
          .map((s: any) => `${s.item}: need ${s.required}, have ${s.available}`)
          .join(' | ');
        setError(`Insufficient inventory shortage: ${details}`);
      } else {
        setError(resData?.error || JSON.stringify(resData) || err.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Aggregated status counts for KPIs & Chart
  const counts = {
    DRAFT: orders.filter((o) => o.status === 'DRAFT').length,
    ALLOCATED: orders.filter((o) => o.status === 'ALLOCATED').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
  };

  const chartData = [
    { name: 'Draft', count: counts.DRAFT, color: '#f59e0b' },
    { name: 'Allocated', count: counts.ALLOCATED, color: '#3b82f6' },
    { name: 'Completed', count: counts.COMPLETED, color: '#10b981' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ManuFlow ERP: Production Floor</h1>
          <p className="text-sm text-slate-500">Live Work Order execution & raw inventory reservation</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Planned / Draft</p>
            <p className="text-3xl font-extrabold text-amber-500 mt-1">{counts.DRAFT}</p>
          </div>
          <Layers className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Allocated (Ready)</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{counts.ALLOCATED}</p>
          </div>
          <Boxes className="w-8 h-8 text-blue-400 opacity-80" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Completed Output</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{counts.COMPLETED}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* Work Orders Table & Recharts Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table View (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Active Work Orders</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              {orders.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">WO Number</th>
                  <th className="py-3 px-4">Yield Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reserved Raw Goods</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No work orders found. Seed backend data or create one.
                    </td>
                  </tr>
                ) : (
                  orders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{wo.wo_number}</td>
                      <td className="py-3 px-4 text-slate-600">{Number(wo.quantity).toFixed(0)} Units</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            wo.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : wo.status === 'ALLOCATED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {wo.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {wo.allocations.length > 0 ? (
                          <div className="space-y-0.5">
                            {wo.allocations.map((a) => (
                              <div key={a.id} className="font-mono text-slate-700">
                                {a.item_sku}: {Number(a.quantity).toFixed(1)} [{a.status}]
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Not reserved</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {wo.status === 'DRAFT' && (
                          <button
                            disabled={actionLoading === wo.id}
                            onClick={() => handleAction(wo.id, 'allocate')}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" /> Reserve
                          </button>
                        )}
                        {wo.status === 'ALLOCATED' && (
                          <button
                            disabled={actionLoading === wo.id}
                            onClick={() => handleAction(wo.id, 'complete')}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Produce
                          </button>
                        )}
                        {wo.status === 'COMPLETED' && (
                          <span className="text-xs text-slate-400 font-medium">Finished</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Distribution Recharts Card (1 Col) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <h2 className="font-semibold text-slate-800 mb-4">Pipeline Distribution</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Real-time status breakdown across active manufacturing queues
          </p>
        </div>
      </div>
    </div>
  );
};
