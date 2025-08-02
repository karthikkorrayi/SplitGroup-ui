export interface Balance {
  balanceId: string;
  user1: number;
  user1Name: string;
  user2: number;
  user2Name: string;
  amount: number;
  description: string;
  isSettled: boolean;
  lastUpdated?: Date;
}

export interface UserBalance {
  userId: number;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  balances: Balance[];
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

export interface CreateSettlementRequest {
  fromUserId: number;
  toUserId: number;
  amount: number;
  description?: string;
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}