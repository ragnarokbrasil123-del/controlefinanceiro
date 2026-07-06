"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export function DashboardCategoryChart({ currentMonthTransactions }: { currentMonthTransactions: any[] }) {
  if (!currentMonthTransactions || currentMonthTransactions.length === 0) return null;

  const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
  if (expenses.length === 0) return null;

  const categoryDataRaw = expenses.reduce((acc: any, curr: any) => {
    if (!acc[curr.category]) acc[curr.category] = 0;
    acc[curr.category] += curr.amount;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryDataRaw).map(key => ({
    name: key,
    value: categoryDataRaw[key]
  })).sort((a, b) => b.value - a.value);

  const formatMoney = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl z-50">
          <p className="text-white font-bold mb-1">{payload[0].name}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white font-bold">{formatMoney(Number(payload[0].value))}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-400" /> Despesas do Mês
          </h3>
          <p className="text-neutral-400 text-sm">Distribuição por categoria</p>
        </div>
      </div>

      <div className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
              paddingAngle={5} dataKey="value" stroke="none"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Total</span>
          <span className="text-xl font-extrabold text-white">
            {formatMoney(Number(categoryData.reduce((a, b) => a + b.value, 0)))}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
        {categoryData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <div className="w-3 h-3 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
              <span className="text-xs font-medium text-neutral-300 truncate" title={item.name}>{item.name}</span>
            </div>
            <span className="text-xs font-bold text-white shrink-0 ml-2">{formatMoney(Number(item.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
