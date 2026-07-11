import { Plus, Edit2 } from "lucide-react";

export function ExpenseCategoryCard({ title, icon, total, items, accentColor, onAction, onEditItem, formatMoney }: any) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm flex flex-col h-full transition-all group`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${accentColor}`}>{icon}</div>
          <h3 className="font-semibold text-neutral-200">{title}</h3>
        </div>
        <button onClick={onAction} className="text-neutral-400 bg-white/5 p-1.5 rounded-lg flex items-center hover:bg-white/10 transition-colors cursor-pointer"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 flex flex-col gap-3 mb-6">
        {items.length === 0 ? <p className="text-neutral-600 text-sm italic py-2">Nenhum gasto neste mês.</p> : items.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center text-sm group/item">
            <span className="text-neutral-300 pr-2 line-clamp-2 leading-tight">{item.title}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-medium whitespace-nowrap ${item.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                {item.type === 'income' ? '+ ' : ''}{formatMoney(item.amount)}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditItem(item); }} 
                className="text-indigo-400/50 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors cursor-pointer"
                title="Editar gasto"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/10 mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <span className="block text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Total</span>
            <span className={`text-xl font-bold tracking-tight ${total === 'R$ 0,00' ? 'text-neutral-500' : 'text-white'}`}>{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
