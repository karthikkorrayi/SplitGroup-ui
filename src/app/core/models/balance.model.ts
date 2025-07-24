export interface Balance {
  balanceId: string;
  user1: number;
  user1Name?: string;
  user2: number;
  user2Name?: string;
  amount: number;
  description: string;
  isSettled: boolean;
  transactionCount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface SettlementRequest {
  payerId: number;
  payeeId: number;
  amount: number;
  description?: string;
  method: SettlementMethod;
  notes?: string;
  referenceId?: string;
}

export enum SettlementMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VENMO = 'VENMO',
  PAYPAL = 'PAYPAL',
  UPI = 'UPI',
  OTHER = 'OTHER'
}

export interface UserBalanceSummary {
  userId: number;
  userName: string;
  totalOwed: number;
  totalOwedTo: number;
  netBalance: number;
  activeBalanceCount: number;
  totalPaid: number;
  totalReceived: number;
}