export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  clientName?: string;
  value: number;
  date: string; // ISO string
  category: string;
  description: string;
}

export const INCOME_CATEGORIES = [
  'Vendas',
  'Serviços prestados',
  'Salário',
  'Rendimentos',
  'Outros',
];

export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Fornecedores',
  'Impostos',
  'Contas (Água, Luz, etc)',
  'Outros',
];
