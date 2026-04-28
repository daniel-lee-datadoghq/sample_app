export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  accountNumber: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: number;
  accountId: number;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}
