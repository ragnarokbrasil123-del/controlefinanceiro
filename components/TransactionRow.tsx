import { TrendingUp, TrendingDown, CheckCircle2, Clock, FileText, Edit2, Trash2 } from "lucide-react";

export function TransactionRow({ title, category, date, amount, type, isPaid, onTogglePaid, onDelete, onEdit, receiptUrl }: any) {
  const isIncome = type === 'income';
  return (
    <div className={`flex flex-wrap items-center justify-between p-3.5 rounded-2xl border transition-colors gap-y-3 gap-x-2 overflow-hidden ${isPaid === false ? 'bg-amber-500/5 border-amber-500/10' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
      
      {/* Esquerda: Icone e Textos */}
      <div className="flex items-center gap-3 flex-[1_1_180px] min-w-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${isIncome ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-rose-400/10 border-rose-400/20 text-rose-400'}`}>
          {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
        
        <div className="flex flex-col min-w-0 py-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`font-semibold text-sm line-clamp-2 leading-snug ${isPaid === false ? 'text-amber-100' : 'text-white'}`}>
              {title || "Sem título"}
            </h4>
            {isPaid === false && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 mt-0.5">Pendente</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 uppercase tracking-wide font-medium mt-1">
            <span className="line-clamp-1">{category || "Sem Categoria"}</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full shrink-0"></span>
            <span className="shrink-0">{date || "Sem data"}</span>
          </div>
        </div>
      </div>

      {/* Direita: Valor e Botões */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 flex-[1_1_150px]">
        <div className={`font-bold text-sm tracking-tight whitespace-nowrap mr-auto sm:mr-1 ${isIncome ? 'text-emerald-400' : (isPaid === false ? 'text-amber-400' : 'text-white')}`}>
          {amount}
        </div>
        {isPaid !== undefined && (
          <button onClick={onTogglePaid} className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${isPaid ? 'text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10'}`}>
            {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </button>
        )}
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="p-2 text-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer shrink-0"><FileText className="w-4 h-4" /></a>
        )}
        <button onClick={onEdit} className="p-2 text-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer shrink-0"><Edit2 className="w-4 h-4" /></button>
        <button onClick={onDelete} className="p-2 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0"><Trash2 className="w-4 h-4" /></button>
      </div>
      
    </div>
  );
}
