"use client";

import { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Activity } from "lucide-react";

export function DashboardChart({ transactions }: { transactions: any[] }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    // Group by month
    const monthlyData: Record<string, { income: number, expense: number }> = {};
    
    // Pegar ultimos 6 meses
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[mStr] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      if (!t.date) return;
      const mStr = t.date.slice(0, 7);
      if (monthlyData[mStr]) {
        if (t.type === 'income') monthlyData[mStr].income += t.amount;
        if (t.type === 'expense') monthlyData[mStr].expense += t.amount;
      }
    });

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    const chartData = Object.keys(monthlyData).sort().map(key => {
      const [y, m] = key.split('-');
      const monthLabel = monthNames[parseInt(m) - 1];
      return {
        name: monthLabel,
        Ganhos: monthlyData[key].income,
        Gastos: monthlyData[key].expense
      };
    });

    setData(chartData);
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> Evolução Financeira</h3>
          <p className="text-neutral-400 text-sm">Ganhos vs Gastos (Últimos 6 meses)</p>
        </div>
      </div>

      <div className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGanhos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#e5e5e5' }}
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
            />
            <Area type="monotone" dataKey="Ganhos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGanhos)" />
            <Area type="monotone" dataKey="Gastos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
