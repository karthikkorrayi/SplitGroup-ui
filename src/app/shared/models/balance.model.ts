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
  currency?: string;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: string;
}

export interface UserBalance {
  userId: number;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  balances: Balance[];
  currency: string;
  lastUpdated: Date;
  pendingSettlements: Settlement[];
  recentActivity: BalanceActivity[];
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
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  currency?: string;
  exchangeRate?: number;
  fees?: number;
}

export interface CreateSettlementRequest {
  fromUserId: number;
  toUserId: number;
  amount: number;
  description?: string;
  paymentMethodId?: string;
  notes?: string;
  scheduledDate?: Date;
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
  DISPUTED = 'DISPUTED'
}

export interface BalanceOptimization {
  userId: number;
  currentDebts: Balance[];
  optimizedSettlements: OptimizedSettlement[];
  savingsAmount: number;
  transactionReduction: number;
  explanation: string;
}

export interface OptimizedSettlement {
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DebtSimplification {
  settlements: OptimizedSettlement[];
  applyImmediately: boolean;
  notifyParticipants: boolean;
}

export interface BalanceSummary {
  userId: number;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  numberOfCreditors: number;
  numberOfDebtors: number;
  largestDebt: Balance;
  largestCredit: Balance;
  averageDebtAge: number;
  settlementVelocity: number;
  monthlyTrend: BalanceTrendPoint[];
}

export interface BalanceTrendPoint {
  month: string;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  settlementsCount: number;
}

export interface SettlementHistory {
  userId: number;
  settlements: Settlement[];
  totalSettled: number;
  averageSettlementTime: number;
  successRate: number;
  preferredPaymentMethods: PaymentMethodUsage[];
}

export interface PaymentMethodUsage {
  method: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DIGITAL_WALLET' | 'CASH' | 'CHECK';
  isDefault: boolean;
  isActive: boolean;
  fees: PaymentFee[];
  processingTime: string;
  limits: PaymentLimits;
}

export interface PaymentFee {
  type: 'FIXED' | 'PERCENTAGE';
  amount: number;
  description: string;
}

export interface PaymentLimits {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface BalanceActivity {
  id: number;
  type: 'TRANSACTION_ADDED' | 'SETTLEMENT_CREATED' | 'SETTLEMENT_COMPLETED' | 'BALANCE_UPDATED';
  description: string;
  amount: number;
  otherUserId: number;
  otherUserName: string;
  timestamp: Date;
  relatedId?: number;
}

export interface BalanceTrend {
  month: string;
  year: number;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  settlementsCount: number;
  newDebtsCount: number;
}