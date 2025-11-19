import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { ConflictEvent, ConflictType } from '../types';

interface AnalyticsProps {
  events: ConflictEvent[];
}

const COLORS = {
    [ConflictType.BATTLE]: '#dc2626',
    [ConflictType.PROTEST]: '#3b82f6',
    [ConflictType.RIOT]: '#f97316',
    [ConflictType.EXPLOSION]: '#b91c1c',
    [ConflictType.VIOLENCE_AGAINST_CIVILIANS]: '#7f1d1d',
    [ConflictType.STRATEGIC_DEVELOPMENT]: '#10b981',
};

const Analytics: React.FC<AnalyticsProps> = ({ events }) => {
  
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    events.forEach(e => {
      stats[e.type] = (stats[e.type] || 0) + 1;
    });
    return Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
  }, [events]);

  const fatalityStats = useMemo(() => {
     const stats: Record<string, number> = {};
     events.forEach(e => {
         stats[e.type] = (stats[e.type] || 0) + e.fatalities;
     });
     return Object.keys(stats)
        .map(key => ({ name: key, value: stats[key] }))
        .filter(item => item.value > 0);
  }, [events]);

  const totalFatalities = useMemo(() => events.reduce((acc, curr) => acc + curr.fatalities, 0), [events]);
  const avgFatalities = useMemo(() => events.length ? (totalFatalities / events.length).toFixed(1) : 0, [events, totalFatalities]);

  if (events.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
            <p>No data to visualize</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Events</p>
            <p className="text-2xl font-bold text-white">{events.length}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Fatalities</p>
            <p className="text-2xl font-bold text-red-500">{totalFatalities}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Avg Lethality</p>
            <p className="text-2xl font-bold text-zinc-300">{avgFatalities}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Types */}
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 h-72">
          <h3 className="text-zinc-300 font-medium text-sm mb-4">Event Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {typeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as ConflictType] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fatalities by Type */}
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 h-72">
          <h3 className="text-zinc-300 font-medium text-sm mb-4">Fatalities by Category</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fatalityStats} layout="vertical" margin={{ left: 40, right: 20 }}>
              <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#52525b" 
                fontSize={10} 
                width={80}
                tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
              />
              <Tooltip 
                 cursor={{fill: '#27272a'}}
                 contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                 {fatalityStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as ConflictType] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
