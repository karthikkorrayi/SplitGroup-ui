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
  status: TransactionStatus;
  splitType: SplitType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  category: string;
  splitType: SplitType;
  participants: TransactionParticipant[];
}

export interface TransactionParticipant {
  userId: number;
  amount?: number;
  percentage?: number;
}

export enum TransactionStatus {
  ACTIVE = 'ACTIVE',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED'
}

export enum SplitType {
  EQUAL = 'EQUAL',
  EXACT = 'EXACT',
  PERCENTAGE = 'PERCENTAGE'
}

export interface TransactionDetail extends Transaction {
  participants: TransactionParticipant[];
  settlements?: Settlement[];
}

export interface Settlement {
  id: number;
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
  description: string;
  status: SettlementStatus;
  createdAt: Date;
  settledAt?: Date;
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}