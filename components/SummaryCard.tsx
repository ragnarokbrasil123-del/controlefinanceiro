import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";

export function SummaryCard({ title, amount, isPositive, icon, delay, onAdd }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay }} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 shadow-inner">{icon}</div>
        <div className="flex items-center gap-2 relative z-10">
          {onAdd && (
            <button onClick={onAdd} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer" title={`Adicionar ${title}`}>
              <Plus className="w-4 h-4" />
            </button>
          )}
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full ${isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </div>
        </div>
      </div>
      <p className="text-neutral-400 text-sm font-medium mb-1 tracking-wide">{title}</p>
      <h3 className={`text-4xl font-extrabold tracking-tight ${amount === 'R$ 0,00' ? 'text-neutral-500' : 'text-white'}`}>{amount}</h3>
    </motion.div>
  );
}
