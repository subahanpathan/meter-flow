import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Database,
  Key,
  DollarSign,
  AlertCircle,
  Plus,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api.service';
import UsageChart from '../components/UsageChart';
import FloatingCard from '../components/ui/FloatingCard';
import NeonButton from '../components/ui/NeonButton';
import { exportToCSV } from '../utils/export';

const StatCard = ({ title, value, change, trend, icon: Icon }) => (
  <FloatingCard className="p-5">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-blue-500/10 rounded-lg">
        <Icon size={20} className="text-blue-500" />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 text-sm">
      <span className={`flex items-center gap-1 font-medium ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {change}
      </span>
      <span className="text-slate-500">vs last month</span>
    </div>
  </FloatingCard>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30D');
  
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const revenue = ((stats?.monthRequests || 0) * 0.001).toFixed(2);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor your API performance and billing metrics.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportToCSV(logs, 'meterflow-dashboard-logs.csv')}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg text-sm text-white transition-colors"
          >
            <Download size={16} className="text-slate-400" />
            <span>Export CSV</span>
          </button>
          <NeonButton onClick={() => navigate('/apis')} variant="primary">
            <Plus size={16} />
            <span>Create API</span>
          </NeonButton>
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-lg w-fit">
        {['24H', '7D', '30D', 'All Time'].map(range => (
          <button 
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              dateRange === range 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Core Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Monthly API Usage" 
          value={stats?.totalRequests?.toLocaleString() || '0'} 
          change="12.5%" 
          trend="up"
          icon={Database} 
        />
        <StatCard 
          title="Active Consumers" 
          value="124" 
          change="4.2%" 
          trend="up"
          icon={Users} 
        />
        <StatCard 
          title="Revenue (MRR)" 
          value={`$${revenue}`} 
          change="8.1%" 
          trend="up"
          icon={DollarSign} 
        />
        <StatCard 
          title="Average Error Rate" 
          value={`${stats?.errorRate?.toFixed(2) || '0.00'}%`} 
          change="0.5%" 
          trend="down"
          icon={AlertCircle} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FloatingCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">API Traffic</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar size={16} />
              <span>{dateRange}</span>
            </div>
          </div>
          <div className="h-[300px]">
            <UsageChart data={stats?.dailyStats} />
          </div>
        </FloatingCard>

        <div className="space-y-6">
          <FloatingCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Alerts</h2>
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Rate Limit Reached</p>
                  <p className="text-xs text-red-400/80 mt-1">Consumer "MobileApp-Prod" exceeded 10k req/hr.</p>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
                <Activity size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">High Latency Detected</p>
                  <p className="text-xs text-amber-400/80 mt-1">Endpoint /api/v1/payments is averaging 800ms.</p>
                </div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Requests</h2>
              <button className="text-xs text-blue-500 hover:text-blue-400 font-medium">View logs</button>
            </div>
            <div className="space-y-3">
              {logs?.slice(0, 4).map((log) => (
                <div key={log._id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 
                      log.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {log.method}
                    </span>
                    <p className="text-sm font-medium text-slate-300 truncate max-w-[150px]">{log.endpoint}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${log.statusCode < 400 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {log.statusCode}
                    </p>
                    <p className="text-[10px] text-slate-500">{log.latencyMs}ms</p>
                  </div>
                </div>
              ))}
              {(!logs || logs.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
              )}
            </div>
          </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
