export interface Transaction {
  id: number;
  paidBy: number;
  paidByName: string;
  owedBy: number;
  owedByName: string;
  amount: number;
  description: string;
  category: string;
  totalAmount: number;
  status: 'ACTIVE' | 'SETTLED';
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  createdAt?: Date;
}

export interface CreateTransactionRequest {
  amount: number;
  description: string;
  category: string;
  owedBy: number;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
}