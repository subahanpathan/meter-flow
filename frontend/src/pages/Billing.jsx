import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  FileText
} from 'lucide-react';
import api from '../services/api.service';
import FloatingCard from '../components/ui/FloatingCard';
import NeonButton from '../components/ui/NeonButton';

const Billing = () => {
  const queryClient = useQueryClient();

  const { data: currentBill, isLoading: isBillLoading } = useQuery({
    queryKey: ['current-bill'],
    queryFn: async () => {
      const { data } = await api.get('/billing/current');
      return data.data;
    }
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['billing-history'],
    queryFn: async () => {
      const { data } = await api.get('/billing');
      return data.data;
    }
  });

  const payMutation = useMutation({
    mutationFn: (billingId) => api.post('/billing/pay', { billingId }),
    onSuccess: (res) => {
      const { orderId, amount, currency, keyId } = res.data.data;

      const loadRazorpay = () => new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay script'));
        document.body.appendChild(script);
      });

      (async () => {
        try {
          await loadRazorpay();

          const options = {
            key: keyId,
            amount,
            currency,
            name: 'MeterFlow',
            description: 'Monthly API Usage Bill',
            order_id: orderId,
            handler: async (response) => {
              try {
                await api.post('/billing/verify', response);
                queryClient.invalidateQueries(['billing-history']);
                queryClient.invalidateQueries(['current-bill']);
              } catch (err) {
                console.error(err);
                alert('Payment verification failed!');
              }
            },
            theme: { color: '#3b82f6' }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (loadErr) {
          console.error('Razorpay load failed', loadErr);
          alert('Unable to initiate payment at this time');
        }
      })();
    }
  });

  if (isBillLoading || isHistoryLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your invoices, payment methods, and plan limits.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg text-sm text-white transition-colors">
            <Download size={16} className="text-slate-400" />
            <span>Download All</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Bill */}
          <FloatingCard className="p-0 overflow-hidden border-white/[0.08]">
            <div className="bg-white/[0.02] p-8 relative">
              <div className="flex items-center justify-between mb-8">
                 <div className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-xs font-semibold">
                  Current Billing Cycle
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar size={14} />
                  {new Date(currentBill?.periodStart).toLocaleDateString()} — {new Date(currentBill?.periodEnd).toLocaleDateString()}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">Unbilled Usage</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white tracking-tight">₹{currentBill?.amount?.toLocaleString()}</span>
                    <span className="text-slate-400 font-medium text-sm">INR</span>
                  </div>
                </div>

                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Total API Calls</p>
                    <p className="text-xl font-semibold text-white">{currentBill?.totalRequests?.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-10 bg-white/10"></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Free Tier Allowance</p>
                    <p className="text-xl font-semibold text-emerald-400">{currentBill?.freeRequests?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {currentBill?.amount > 0 && (
                <NeonButton 
                  onClick={() => payMutation.mutate(currentBill._id)}
                  variant="primary"
                  className="mt-8"
                >
                  Pay Invoice Now
                </NeonButton>
              )}
            </div>

            <div className="p-6 bg-white/[0.01] border-t border-white/[0.08]">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-400">Monthly Usage Limit</span>
                <span className="font-medium text-white">65% <span className="text-slate-500">of limit reached</span></span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: '65%' }}
                />
              </div>
            </div>
          </FloatingCard>

          {/* History Table */}
          <FloatingCard className="p-0 overflow-hidden border-white/[0.08]">
            <div className="p-6 border-b border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white">Billing History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Invoice Date</th>
                    <th className="px-6 py-3 text-left font-medium">Usage Count</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                    <th className="px-6 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08]">
                  {history?.map((item) => (
                    <tr key={item._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{new Date(item.periodStart).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">INV-{item._id.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {item.totalRequests.toLocaleString()} reqs
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 size={12} /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-white">
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-slate-400 hover:text-white p-1 rounded transition-colors" title="Download PDF">
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!history || history.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        No billing history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </FloatingCard>
        </div>

        <div className="space-y-6">
          {/* Professional Credit Card Mockup */}
          <FloatingCard className="p-6 border-white/[0.08]">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Payment Method</h3>
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 border border-white/5 rounded-full opacity-20"></div>
              
              <div className="flex justify-between items-center mb-6">
                <CreditCard size={24} className="text-slate-300" />
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                </div>
              </div>

              <div>
                <p className="text-lg font-mono text-white tracking-widest mb-1">•••• •••• •••• 8842</p>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Cardholder</p>
                    <p className="text-sm font-medium text-slate-200">ACME CORP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Expires</p>
                    <p className="text-sm font-medium text-slate-200">08/29</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
              Update Payment Method
            </button>
          </FloatingCard>

          <FloatingCard className="p-6 border-white/[0.08]">
            <h3 className="text-base font-semibold text-white mb-6">Subscription Plans</h3>
            <div className="space-y-4">
              {[
                { label: 'Developer', detail: '1k free requests/month', icon: Shield, color: 'text-slate-400' },
                { label: 'Pro', detail: '₹0.50 per 100 requests', icon: Zap, color: 'text-blue-500' },
                { label: 'Enterprise', detail: 'Custom volume pricing', icon: Activity, color: 'text-purple-500' }
              ].map((tier, i) => (
                <div key={tier.label} className="flex items-center gap-4 group cursor-pointer p-3 hover:bg-white/[0.02] rounded-lg transition-colors border border-transparent hover:border-white/5">
                  <div className={`p-2 rounded-lg bg-white/[0.02] border border-white/5 ${tier.color}`}>
                    <tier.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{tier.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{tier.detail}</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-2 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
              Upgrade Plan
            </button>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default Billing;
