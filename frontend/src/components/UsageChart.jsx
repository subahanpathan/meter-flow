import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          <p className="text-xl font-black text-white">
            {payload[0].value.toLocaleString()} 
            <span className="text-[10px] font-bold text-gray-500 ml-2">REQ</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const UsageChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </div>
        <p className="text-white font-bold opacity-40">No Traffic Data</p>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Monitoring standby...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 600 }}
            dy={15}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 600 }}
            dx={-15}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorUsage)"
            animationDuration={2000}
            dot={{ r: 0 }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, shadow: '0 0 10px rgba(59,130,246,0.5)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UsageChart;
