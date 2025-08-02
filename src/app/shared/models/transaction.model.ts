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
  receiptUrl?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  category: string;
  splitType: SplitType;
  participants: TransactionParticipant[];
  notes?: string;
  tags?: string[];
  location?: string;
  receiptFile?: File;
}

export interface TransactionParticipant {
  userId: number;
  amount?: number;
  percentage?: number;
  userName?: string;
  userEmail?: string;
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
  receiptUrls?: string[];
  history?: TransactionHistoryEntry[];
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

export interface TransactionFilter {
  page?: number;
  size?: number;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: TransactionStatus;
  searchTerm?: string;
  sortBy?: 'date' | 'amount' | 'description';
  sortDirection?: 'ASC' | 'DESC';
  tags?: string[];
  participantId?: number;
}

export interface TransactionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  parentId?: string;
}

export interface SplitCalculation {
  totalAmount: number;
  splitType: SplitType;
  participants: TransactionParticipant[];
  isValid: boolean;
  errors: string[];
}

export interface PaginatedTransactions {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: CategorySummary[];
  monthlyTrend: MonthlySummary[];
  topCategories: CategorySummary[];
  recentTransactions: Transaction[];
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlySummary {
  month: string;
  amount: number;
  count: number;
}

export interface ExportRequest {
  userId: number;
  format: 'CSV' | 'PDF' | 'EXCEL';
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  includeSettlements?: boolean;
}

export interface ExportResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: Date;
}

export interface TransactionHistoryEntry {
  id: number;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'SETTLED';
  description: string;
  userId: number;
  userName: string;
  timestamp: Date;
  changes?: Record<string, any>;
}