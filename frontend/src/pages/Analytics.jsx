import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Filter,
  Download,
  AlertTriangle,
  Zap,
  Clock,
  Activity,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api.service';
import FloatingCard from '../components/ui/FloatingCard';
import NeonButton from '../components/ui/NeonButton';
import { exportToCSV } from '../utils/export';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const { data } = await api.get('/usage/stats');
      return data.data;
    }
  });

  const { data: logs } = useQuery({
    queryKey: ['usage-logs'],
    queryFn: async () => {
      const { data } = await api.get('/usage/logs');
      return data.data;
    }
  });

  // Calculate endpoint distribution for pie chart
  const endpointStats = logs?.reduce((acc, log) => {
    acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
    return acc;
  }, {});

  const pieData = endpointStats ? Object.entries(endpointStats).map(([name, value]) => ({ name, value })).slice(0, 5) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Detailed performance metrics and API usage trends.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg text-sm text-white transition-colors">
            <Filter size={16} className="text-slate-400" />
            <span>Filter</span>
          </button>
          <NeonButton onClick={() => exportToCSV(logs, 'meterflow-analytics-report.csv')} variant="primary">
            <Download size={16} />
            <span>Export Report</span>
          </NeonButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Traffic Chart */}
        <FloatingCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-white">API Traffic</h2>
              <p className="text-sm text-slate-400 mt-1">Total requests over the last 30 days.</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
              <TrendingUp size={16} />
              +15.4% vs last month
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-10}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '13px', color: '#f8fafc' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FloatingCard>

        {/* Endpoint Distribution */}
        <FloatingCard className="flex flex-col p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Top Endpoints</h2>
          <p className="text-sm text-slate-400 mb-8">Request distribution by path.</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-white">{stats?.totalRequests?.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total Requests</p>
              </div>
            </div>

            <div className="w-full mt-6 space-y-3">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-slate-300 truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="font-medium text-white">{Math.round((item.value / stats.totalRequests) * 100)}%</span>
                </div>
              ))}
              {pieData.length === 0 && (
                <p className="text-center text-sm text-slate-500">No data available.</p>
              )}
            </div>
          </div>
        </FloatingCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FloatingCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Error Rates</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Client Errors (4xx)</p>
                  <p className="text-xs text-slate-400 mt-0.5">Authentication & Validation</p>
                </div>
              </div>
              <p className="text-xl font-bold text-amber-500">84%</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Server Errors (5xx)</p>
                  <p className="text-xs text-slate-400 mt-0.5">Timeouts & Exceptions</p>
                </div>
              </div>
              <p className="text-xl font-bold text-red-500">16%</p>
            </div>

            <div className="pt-6 mt-2 border-t border-white/[0.08]">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-300">Overall Success Rate</p>
                <p className="text-sm font-medium text-emerald-400">{(100 - (stats?.errorRate || 0)).toFixed(2)}%</p>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${100 - (stats?.errorRate || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Latency Metrics</h2>
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl flex flex-col items-center justify-center text-center">
                <Zap size={20} className="text-blue-500 mb-2" />
                <p className="text-xs text-slate-400 mb-1">Average Latency</p>
                <p className="text-2xl font-bold text-white">12<span className="text-sm ml-1 text-slate-500">ms</span></p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl flex flex-col items-center justify-center text-center">
                <Clock size={20} className="text-amber-500 mb-2" />
                <p className="text-xs text-slate-400 mb-1">p99 Latency</p>
                <p className="text-2xl font-bold text-white">2.4<span className="text-sm ml-1 text-slate-500">s</span></p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-300 mb-2">Latency Distribution</p>
              {[
                { label: 'Fast (< 50ms)', value: 72, color: 'bg-emerald-500' },
                { label: 'Normal (50ms - 200ms)', value: 18, color: 'bg-blue-500' },
                { label: 'Slow (> 500ms)', value: 3, color: 'bg-red-500' }
              ].map((bucket, i) => (
                <div key={bucket.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{bucket.label}</span>
                    <span className="text-white font-medium">{bucket.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${bucket.color}`}
                      style={{ width: `${bucket.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default Analytics;
