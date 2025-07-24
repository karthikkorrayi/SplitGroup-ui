export interface Transaction {
  id: number;
  paidBy: number;
  paidByName?: string;
  owedBy: number;
  owedByName?: string;
  amount: number;
  description: string;
  category?: string;
  totalAmount?: number;
  transactionDate: string;
  status: TransactionStatus;
  splitType: SplitType;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export enum TransactionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  SETTLED = 'SETTLED'
}

export enum SplitType {
  EQUAL = 'EQUAL',
  EXACT = 'EXACT',
  PERCENTAGE = 'PERCENTAGE'
}

export interface TransactionRequest {
  paidBy: number;
  participants: ParticipantShare[];
  totalAmount: number;
  description: string;
  category?: string;
  splitType: SplitType;
  notes?: string;
}

export interface ParticipantShare {
  userId: number;
  amount?: number;
  percentage?: number;
}