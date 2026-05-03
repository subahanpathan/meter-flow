import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Key, 
  Copy, 
  CheckCircle2, 
  RotateCw, 
  Trash2, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  Lock,
  Activity,
  Globe,
  MoreVertical,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api.service';
import FloatingCard from '../components/ui/FloatingCard';
import NeonButton from '../components/ui/NeonButton';

const ApiDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [newKeyData, setNewKeyData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('keys');
  const [version, setVersion] = useState('v1');

  const { data, isLoading } = useQuery({
    queryKey: ['api-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/apis/${id}`);
      return data.data;
    }
  });

  const generateKeyMutation = useMutation({
    mutationFn: (label) => api.post(`/apis/${id}/keys`, { label }),
    onSuccess: (res) => {
      setNewKeyData(res.data.data);
      queryClient.invalidateQueries(['api-detail', id]);
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (keyId) => api.patch(`/apis/${id}/keys/${keyId}/revoke`),
    onSuccess: () => queryClient.invalidateQueries(['api-detail', id])
  });

  const rotateKeyMutation = useMutation({
    mutationFn: (keyId) => api.patch(`/apis/${id}/keys/${keyId}/rotate`),
    onSuccess: (res) => {
      setNewKeyData(res.data.data);
      queryClient.invalidateQueries(['api-detail', id]);
    }
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
      {/* Header & Back Action */}
      <div className="flex flex-col gap-6">
        <Link to="/apis" className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 w-fit">
          <ArrowLeft size={16} />
          <span>Back to APIs</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white/[0.02] border border-white/[0.08] p-6 rounded-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white tracking-tight">{data?.api?.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${data?.api?.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                {data?.api?.isActive ? 'Active' : 'Inactive'}
              </span>
              
              <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5 ml-2">
                {['v1', 'v2'].map(v => (
                  <button 
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${version === v ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Globe size={16} />
                <span className="font-mono">{data?.api?.baseUrl}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={16} />
                <span>Created {new Date(data?.api?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/[0.04] transition-colors">
              Settings
            </button>
            <NeonButton 
              onClick={() => generateKeyMutation.mutate('Production Key')}
              variant="primary"
            >
              <Plus size={16} />
              <span>Create Key</span>
            </NeonButton>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/[0.08]">
        {['keys', 'endpoints', 'analytics'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'keys' && (
            <FloatingCard className="p-0 overflow-hidden">
              <div className="p-5 border-b border-white/[0.08] flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h2 className="text-lg font-semibold text-white">API Keys</h2>
                  <p className="text-sm text-slate-400 mt-1">Manage authentication keys for this API.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08]">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Name & Key</th>
                      <th className="px-6 py-3 text-left font-medium">Status</th>
                      <th className="px-6 py-3 text-left font-medium">Usage</th>
                      <th className="px-6 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08]">
                    {data?.keys?.map((key) => (
                      <tr key={key._id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-white">{key.label}</p>
                            <code className="text-xs text-slate-400 font-mono flex items-center gap-2">
                              {key.keyPrefix}••••••••••••
                              <button onClick={() => handleCopy(`${key.keyPrefix}••••••••••••`)} className="hover:text-white transition-colors">
                                <Copy size={12} />
                              </button>
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${key.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${key.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                            {key.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300">{key.totalRequests.toLocaleString()}</span>
                            <span className="text-xs text-slate-500">reqs</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {key.status === 'active' && (
                              <>
                                <button 
                                  onClick={() => rotateKeyMutation.mutate(key._id)}
                                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                  title="Rotate Key"
                                >
                                  <RotateCw size={16} />
                                </button>
                                <button 
                                  onClick={() => revokeKeyMutation.mutate(key._id)}
                                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Revoke Key"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!data?.keys || data.keys.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                          <Lock size={24} className="mx-auto mb-3 opacity-50" />
                          <p>No API keys generated yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </FloatingCard>
          )}

          {activeTab === 'endpoints' && (
            <FloatingCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">Configured Endpoints</h2>
                <button className="text-sm text-blue-400 hover:text-blue-300">Add Endpoint</button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold px-2 py-1 bg-blue-500/20 text-blue-400 rounded">GET</span>
                    <span className="text-sm font-mono text-slate-300">/users</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">Rate Limit: 100/min</span>
                    <button className="text-slate-400 hover:text-white"><MoreVertical size={16} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">POST</span>
                    <span className="text-sm font-mono text-slate-300">/payments</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">Rate Limit: 50/min</span>
                    <button className="text-slate-400 hover:text-white"><MoreVertical size={16} /></button>
                  </div>
                </div>
              </div>
            </FloatingCard>
          )}
          
          {activeTab === 'analytics' && (
            <FloatingCard className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Analytics Overview</h2>
              <p className="text-sm text-slate-400">Detailed analytics features will be available here.</p>
            </FloatingCard>
          )}

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <FloatingCard className="p-6 border-white/[0.08]">
            <h2 className="text-base font-semibold text-white mb-4">API Configuration</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Environment</span>
                <span className="text-white font-medium">Production</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Rate Limiting</span>
                <span className="text-white font-medium">Enabled</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Log Retention</span>
                <span className="text-white font-medium">30 Days</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Timeout</span>
                <span className="text-white font-medium">10,000ms</span>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
              Edit Configuration
            </button>
          </FloatingCard>

          <FloatingCard className="border-red-500/20 bg-red-500/[0.02] p-6">
            <h3 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-4">
              Permanently delete this API and all associated data. This action cannot be undone.
            </p>
            <button className="w-full py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors">
              Delete API
            </button>
          </FloatingCard>
        </div>
      </div>

      {/* One-Time Key Display Modal */}
      <AnimatePresence>
        {newKeyData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg p-8 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">API Key Created</h2>
                  <p className="text-xs text-slate-400">Please copy this key now. You won't be able to see it again.</p>
                </div>
              </div>

              <div className="relative group mb-6">
                <div className="bg-black border border-white/10 rounded-lg p-4 pr-12 font-mono text-sm text-blue-400 break-all">
                  {newKeyData.rawKey}
                </div>
                <button 
                  onClick={() => handleCopy(newKeyData.rawKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-2"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setNewKeyData(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  I've stored it safely
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApiDetail;
