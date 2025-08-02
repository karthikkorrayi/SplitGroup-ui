export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  priority: NotificationPriority;
  channel: NotificationChannel;
  relatedId?: number;
  relatedType?: 'TRANSACTION' | 'SETTLEMENT' | 'GROUP' | 'USER';
  actionUrl?: string;
  imageUrl?: string;
}

export enum NotificationType {
  EXPENSE_ADDED = 'EXPENSE_ADDED',
  EXPENSE_UPDATED = 'EXPENSE_UPDATED',
  EXPENSE_DELETED = 'EXPENSE_DELETED',
  SETTLEMENT_CREATED = 'SETTLEMENT_CREATED',
  SETTLEMENT_COMPLETED = 'SETTLEMENT_COMPLETED',
  SETTLEMENT_REMINDER = 'SETTLEMENT_REMINDER',
  GROUP_INVITATION = 'GROUP_INVITATION',
  GROUP_MEMBER_JOINED = 'GROUP_MEMBER_JOINED',
  GROUP_MEMBER_LEFT = 'GROUP_MEMBER_LEFT',
  BALANCE_UPDATED = 'BALANCE_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
  MONTHLY_REPORT = 'MONTHLY_REPORT',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  ACCOUNT_SECURITY = 'ACCOUNT_SECURITY'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS'
}

export interface NotificationPreferences {
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  
  // Specific notification types
  expenseNotifications: boolean;
  settlementNotifications: boolean;
  groupNotifications: boolean;
  reminderNotifications: boolean;
  reportNotifications: boolean;
  securityNotifications: boolean;
  
  // Frequency settings
  weeklyDigest: boolean;
  monthlyReport: boolean;
  instantNotifications: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
  quietHoursTimezone: string;
  
  // Channel preferences per notification type
  channelPreferences: NotificationChannelPreference[];
  
  updatedAt: Date;
}

export interface NotificationChannelPreference {
  notificationType: NotificationType;
  channels: NotificationChannel[];
  isEnabled: boolean;
}

export interface NotificationFilter {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  relatedType?: string;
  relatedId?: number;
}

export interface NotificationSummary {
  userId: number;
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: NotificationTypeCount[];
  notificationsByPriority: NotificationPriorityCount[];
  averageReadTime: number;
  mostActiveDay: string;
  recentActivity: NotificationActivity[];
}

export interface NotificationTypeCount {
  type: NotificationType;
  count: number;
  unreadCount: number;
}

export interface NotificationPriorityCount {
  priority: NotificationPriority;
  count: number;
  unreadCount: number;
}

export interface NotificationActivity {
  date: string;
  count: number;
  unreadCount: number;
}

export interface PushSubscription {
  id?: number;
  userId: number;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  platform: string;
  browser: string;
  version: string;
  mobile: boolean;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  subject: string;
  bodyTemplate: string;
  variables: TemplateVariable[];
  channels: NotificationChannel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'CURRENCY' | 'URL';
  required: boolean;
  defaultValue?: string;
}

export interface NotificationBatch {
  name: string;
  description?: string;
  notifications: BatchNotification[];
  scheduledAt?: Date;
  channels: NotificationChannel[];
  targetUsers?: number[];
  targetGroups?: number[];
  filters?: NotificationBatchFilter;
}

export interface BatchNotification {
  templateId: string;
  variables: Record<string, any>;
  priority: NotificationPriority;
  expiresAt?: Date;
}

export interface NotificationBatchFilter {
  userIds?: number[];
  groupIds?: number[];
  hasUnreadNotifications?: boolean;
  lastLoginBefore?: Date;
  lastLoginAfter?: Date;
  totalExpensesGreaterThan?: number;
  totalExpensesLessThan?: number;
}

export interface NotificationSettings {
  maxNotificationsPerUser: number;
  maxNotificationsPerDay: number;
  defaultExpirationDays: number;
  enableBatching: boolean;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface NotificationDeliveryStatus {
  notificationId: number;
  channel: NotificationChannel;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  attempts: number;
  lastAttemptAt: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface NotificationAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  channelStats: ChannelStats[];
  typeStats: TypeStats[];
  userEngagement: UserEngagementStats[];
}

export interface ChannelStats {
  channel: NotificationChannel;
  sent: number;
  delivered: number;
  read: number;
  deliveryRate: number;
  readRate: number;
}

export interface TypeStats {
  type: NotificationType;
  sent: number;
  delivered: number;
  read: number;
  averageReadTime: number;
}

export interface UserEngagementStats {
  userId: number;
  userName: string;
  totalReceived: number;
  totalRead: number;
  readRate: number;
  averageReadTime: number;
  preferredChannel: NotificationChannel;
}