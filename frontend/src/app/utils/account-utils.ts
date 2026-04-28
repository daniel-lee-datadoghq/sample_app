import { Account } from '../models/account.model';

export function getAccountIcon(type: Account['type']): string {
  switch (type) {
    case 'checking': return 'account_balance';
    case 'savings': return 'savings';
    case 'credit': return 'credit_card';
    default: return 'account_balance_wallet';
  }
}
