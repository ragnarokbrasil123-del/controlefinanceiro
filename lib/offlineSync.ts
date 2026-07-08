import { supabase } from './supabase';

const OFFLINE_TX_KEY = 'nexa_offline_transactions';

export function saveOfflineTransaction(transaction: any) {
  const existing = localStorage.getItem(OFFLINE_TX_KEY);
  const queue = existing ? JSON.parse(existing) : [];
  queue.push(transaction);
  localStorage.setItem(OFFLINE_TX_KEY, JSON.stringify(queue));
}

export async function syncOfflineTransactions() {
  if (!navigator.onLine) return;

  const existing = localStorage.getItem(OFFLINE_TX_KEY);
  if (!existing) return;

  const queue = JSON.parse(existing);
  if (queue.length === 0) return;

  try {
    const { error } = await supabase.from('transactions').insert(queue);
    
    if (!error) {
      // Sucesso total, limpa a fila
      localStorage.removeItem(OFFLINE_TX_KEY);
      console.log('Sincronização offline concluída com sucesso:', queue.length, 'itens');
      return true;
    } else {
      console.error('Erro ao sincronizar dados offline no Supabase', error);
      return false;
    }
  } catch (err) {
    console.error('Falha na sincronização offline', err);
    return false;
  }
}
