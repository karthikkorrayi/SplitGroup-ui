export interface Group {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  totalExpenses: number;
  currency: string;
  isActive: boolean;
  settings: GroupSettings;
  userRole?: GroupRole;
  avatar?: string;
  category?: string;
  tags?: string[];
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  currency?: string;
  category?: string;
  isPrivate?: boolean;
  settings?: Partial<GroupSettings>;
  initialMembers?: number[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  currency?: string;
  category?: string;
  isActive?: boolean;
  avatar?: string;
  tags?: string[];
}

export interface GroupMember {
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: GroupRole;
  joinedAt: Date;
  isActive: boolean;
  permissions: GroupPermission[];
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  lastActivity?: Date;
}

export enum GroupRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum GroupPermission {
  VIEW_GROUP = 'VIEW_GROUP',
  EDIT_GROUP = 'EDIT_GROUP',
  DELETE_GROUP = 'DELETE_GROUP',
  ADD_MEMBERS = 'ADD_MEMBERS',
  REMOVE_MEMBERS = 'REMOVE_MEMBERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  CREATE_TRANSACTIONS = 'CREATE_TRANSACTIONS',
  EDIT_TRANSACTIONS = 'EDIT_TRANSACTIONS',
  DELETE_TRANSACTIONS = 'DELETE_TRANSACTIONS',
  VIEW_BALANCES = 'VIEW_BALANCES',
  CREATE_SETTLEMENTS = 'CREATE_SETTLEMENTS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  EXPORT_DATA = 'EXPORT_DATA'
}

export interface GroupInvitation {
  id: number;
  groupId: number;
  groupName: string;
  invitedBy: number;
  invitedByName: string;
  invitedEmail: string;
  role: GroupRole;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  message?: string;
  token: string;
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface InvitationRequest {
  email: string;
  role: GroupRole;
  message?: string;
  expiresInDays?: number;
}

export interface GroupTransaction {
  id: number;
  groupId: number;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: number;
  paidByName: string;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  participants: GroupTransactionParticipant[];
  createdAt: Date;
  updatedAt: Date;
  status: 'ACTIVE' | 'SETTLED' | 'CANCELLED';
  receiptUrl?: string;
  notes?: string;
  tags?: string[];
  location?: string;
}

export interface GroupTransactionParticipant {
  userId: number;
  userName: string;
  amount: number;
  percentage?: number;
  isSettled: boolean;
}

export interface GroupBalance {
  userId: number;
  userName: string;
  userAvatar?: string;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  balancesWith: UserBalance[];
}

export interface UserBalance {
  withUserId: number;
  withUserName: string;
  amount: number;
  isOwed: boolean;
  lastTransactionDate: Date;
}

export interface GroupSettings {
  currency: string;
  defaultSplitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  allowMemberInvites: boolean;
  requireApprovalForExpenses: boolean;
  autoSettleSmallAmounts: boolean;
  smallAmountThreshold: number;
  notificationSettings: GroupNotificationSettings;
  privacy: GroupPrivacySettings;
  integrations: GroupIntegrationSettings;
}

export interface GroupNotificationSettings {
  newExpenseNotifications: boolean;
  settlementNotifications: boolean;
  memberJoinNotifications: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface GroupPrivacySettings {
  isPrivate: boolean;
  allowSearchByName: boolean;
  showMemberList: boolean;
  allowMemberInvites: boolean;
  requireApprovalToJoin: boolean;
}

export interface GroupIntegrationSettings {
  enableReceiptScanning: boolean;
  enableLocationTracking: boolean;
  enableRecurringExpenses: boolean;
  enableBudgetTracking: boolean;
  connectedApps: ConnectedApp[];
}

export interface ConnectedApp {
  id: string;
  name: string;
  type: 'BANK' | 'PAYMENT' | 'RECEIPT' | 'CALENDAR';
  isActive: boolean;
  connectedAt: Date;
  lastSyncAt?: Date;
}

export interface GroupActivity {
  id: number;
  groupId: number;
  type: GroupActivityType;
  description: string;
  userId: number;
  userName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  relatedId?: number;
  relatedType?: 'TRANSACTION' | 'SETTLEMENT' | 'MEMBER' | 'SETTING';
}

export enum GroupActivityType {
  GROUP_CREATED = 'GROUP_CREATED',
  GROUP_UPDATED = 'GROUP_UPDATED',
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  EXPENSE_ADDED = 'EXPENSE_ADDED',
  EXPENSE_UPDATED = 'EXPENSE_UPDATED',
  EXPENSE_DELETED = 'EXPENSE_DELETED',
  SETTLEMENT_CREATED = 'SETTLEMENT_CREATED',
  SETTLEMENT_COMPLETED = 'SETTLEMENT_COMPLETED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  INVITATION_SENT = 'INVITATION_SENT',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED'
}

export interface GroupSummary {
  groupId: number;
  totalExpenses: number;
  totalTransactions: number;
  averageExpenseAmount: number;
  mostActiveMonth: string;
  topSpender: GroupMember;
  topCategory: CategorySummary;
  memberSummaries: MemberSummary[];
  monthlyTrend: MonthlySummary[];
  categoryBreakdown: CategorySummary[];
  settlementStats: SettlementStats;
}

export interface MemberSummary {
  userId: number;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  transactionCount: number;
  averageExpense: number;
  joinDate: Date;
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  averageAmount: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  amount: number;
  transactionCount: number;
  memberCount: number;
}

export interface SettlementStats {
  totalSettlements: number;
  totalSettledAmount: number;
  averageSettlementTime: number;
  pendingSettlements: number;
  pendingAmount: number;
  settlementRate: number;
}

export interface BulkTransactionRequest {
  transactions: CreateBulkTransaction[];
  notifyMembers: boolean;
  applyToAll: boolean;
}

export interface CreateBulkTransaction {
  description: string;
  amount: number;
  category: string;
  paidBy: number;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
  participants: number[];
  date?: Date;
  notes?: string;
}

export interface GroupExportRequest {
  groupId: number;
  format: 'CSV' | 'PDF' | 'EXCEL';
  startDate?: Date;
  endDate?: Date;
  includeSettlements: boolean;
  includeMembers: boolean;
  includeBalances: boolean;
}

export interface GroupReport {
  groupId: number;
  reportType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  period: {
    start: Date;
    end: Date;
  };
  summary: GroupSummary;
  detailedTransactions: GroupTransaction[];
  balanceSnapshot: GroupBalance[];
  generatedAt: Date;
  generatedBy: number;
}