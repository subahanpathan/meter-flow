import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Globe, ExternalLink, Trash2, X, Search } from 'lucide-react';
import api from '../services/api.service';
import FloatingCard from '../components/ui/FloatingCard';
import NeonButton from '../components/ui/NeonButton';

const APIs = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApi, setNewApi] = useState({ name: '', baseUrl: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: apis, isLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: async () => {
      const { data } = await api.get('/apis');
      return data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/apis', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apis']);
      setIsModalOpen(false);
      setNewApi({ name: '', baseUrl: '', description: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/apis/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['apis'])
  });

  const filteredApis = apis?.filter(api => 
    api.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    api.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-white">APIs & Services</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your registered APIs and track their usage.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-64"
            />
          </div>
          <NeonButton onClick={() => setIsModalOpen(true)} variant="primary" className="flex items-center gap-2">
            <Plus size={16} />
            <span>Create API</span>
          </NeonButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApis?.map((item) => (
          <FloatingCard key={item._id} className="flex flex-col h-full group p-0 overflow-hidden border-white/[0.08]">
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Globe size={20} />
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{item.name}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                {item.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <ExternalLink size={14} className="text-slate-400 shrink-0" />
                <span className="truncate font-mono">{item.baseUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-px border-t border-white/[0.08] bg-white/[0.02]">
              <Link 
                to={`/apis/${item._id}`}
                className="flex-1 text-center py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Manage API
              </Link>
              <div className="w-px h-full bg-white/[0.08]"></div>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this API?')) {
                    deleteMutation.mutate(item._id);
                  }
                }}
                className="px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete API"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </FloatingCard>
        ))}

        {(!filteredApis || filteredApis.length === 0) && (
          <div className="md:col-span-2 lg:col-span-3 py-20 flex flex-col items-center justify-center text-center border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700 text-slate-400">
              <Globe size={32} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No APIs Found</h2>
            <p className="text-slate-400 text-sm max-w-sm mb-6">You haven't registered any APIs yet, or none match your search criteria.</p>
            <NeonButton onClick={() => setIsModalOpen(true)} variant="primary">Create Your First API</NeonButton>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Register New API</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newApi); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">API Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" 
                    placeholder="e.g. Payment Gateway"
                    value={newApi.name}
                    onChange={(e) => setNewApi({...newApi, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Base URL</label>
                  <input 
                    type="url" 
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono" 
                    placeholder="https://api.example.com"
                    value={newApi.baseUrl}
                    onChange={(e) => setNewApi({...newApi, baseUrl: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none" 
                    placeholder="Describe what this API does..."
                    value={newApi.description}
                    onChange={(e) => setNewApi({...newApi, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <NeonButton 
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create API'}
                  </NeonButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIs;
