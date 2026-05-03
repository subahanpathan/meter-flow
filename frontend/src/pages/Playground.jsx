import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Send, 
  Terminal, 
  Clock, 
  ShieldCheck, 
  RotateCw,
  Layers,
  Zap,
  Globe,
  Code
} from 'lucide-react';
import api from '../services/api.service';
import FloatingCard from '../components/ui/FloatingCard';
import NeonButton from '../components/ui/NeonButton';

const Playground = () => {
  const [selectedApiId, setSelectedApiId] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('{\n  "key": "value"\n}');
  const [rawKey, setRawKey] = useState(''); 
  
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: async () => {
      const { data } = await api.get('/apis');
      return data.data;
    }
  });

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      const res = await api.post('/gateway', {
        apiId: selectedApiId,
        endpoint,
        method,
        data: method !== 'GET' ? JSON.parse(requestBody) : {}
      }, {
        headers: {
          'x-api-key': rawKey
        }
      });

      setResponse({
        status: res.status,
        data: res.data,
        latency: Date.now() - startTime
      });
    } catch (err) {
      setResponse({
        status: err.response?.status || 500,
        data: err.response?.data || { error: 'Request failed' },
        latency: Date.now() - startTime
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">API Tester</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">Execute requests against your registered APIs to verify routing, metering, and responses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
        {/* Left: Configuration Panel */}
        <FloatingCard className="flex flex-col gap-6 p-6">
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  Target API
                </label>
                <select 
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={selectedApiId}
                  onChange={(e) => setSelectedApiId(e.target.value)}
                >
                  <option value="">Select API...</option>
                  {apis?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Layers size={14} className="text-slate-400" />
                  HTTP Method
                </label>
                <select 
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-medium"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Zap size={14} className="text-slate-400" />
                Endpoint Path
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">/</div>
                <input 
                  type="text"
                  className="w-full pl-7 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-blue-400 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="v1/users"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-400" />
                API Key (x-api-key)
              </label>
              <input 
                type="password"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-emerald-400 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="mf_live_..."
                value={rawKey}
                onChange={(e) => setRawKey(e.target.value)}
              />
            </div>

            {method !== 'GET' && (
              <div className="space-y-1.5 flex flex-col h-48">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Code size={14} className="text-slate-400" />
                  Request Body (JSON)
                </label>
                <textarea 
                  className="w-full flex-1 px-3 py-3 bg-slate-900 border border-slate-700/50 rounded-lg text-sm text-slate-300 font-mono resize-none focus:outline-none focus:border-blue-500 transition-colors"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          <NeonButton 
            onClick={handleTest}
            disabled={loading || !selectedApiId || !rawKey}
            variant="primary"
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <RotateCw className="animate-spin" size={16} />
                <span>Sending Request...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Send size={16} />
                <span>Send Request</span>
              </div>
            )}
          </NeonButton>
        </FloatingCard>

        {/* Right: Response Panel */}
        <FloatingCard className="flex flex-col p-0 overflow-hidden border-white/[0.08]">
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-white">Response</h2>
            </div>
            
            {response && (
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Status:</span>
                  <span className={response.status < 400 ? 'text-emerald-400' : 'text-red-400'}>
                    {response.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-slate-300">{response.latency}ms</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 bg-[#0f172a] p-4 overflow-auto font-mono text-sm">
            {response ? (
              <pre className="text-blue-300/90 leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                <Terminal size={32} className="opacity-20" />
                <p>Awaiting request execution...</p>
              </div>
            )}
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Playground;

