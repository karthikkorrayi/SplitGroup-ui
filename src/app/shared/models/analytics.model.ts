export interface SpendingAnalytics {
  userId: number;
  period: AnalyticsPeriod;
  totalSpent: number;
  totalTransactions: number;
  averageTransactionAmount: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlySpending[];
  topExpenses: TopExpense[];
  spendingVelocity: number;
  budgetUtilization?: number;
  savingsRate?: number;
  comparisonToPrevious: PeriodComparison;
  insights: SpendingInsight[];
  currency: string;
  generatedAt: Date;
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label?: string;
}

export interface CategoryBreakdown {
  category: string;
  categoryId: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageAmount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
  subcategories?: SubcategoryBreakdown[];
  color?: string;
  icon?: string;
}

export interface SubcategoryBreakdown {
  subcategory: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlySpending {
  month: string;
  year: number;
  amount: number;
  transactionCount: number;
  averageAmount: number;
  budgetAmount?: number;
  budgetUtilization?: number;
}

export interface TopExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: Date;
  participants?: string[];
  isRecurring?: boolean;
}

export interface PeriodComparison {
  previousPeriod: AnalyticsPeriod;
  spendingChange: number;
  spendingChangePercentage: number;
  transactionChange: number;
  averageAmountChange: number;
  categoryChanges: CategoryChange[];
}

export interface CategoryChange {
  category: string;
  currentAmount: number;
  previousAmount: number;
  change: number;
  changePercentage: number;
}

export interface SpendingInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
  actionable: boolean;
  suggestedAction?: string;
  relatedCategory?: string;
  relatedAmount?: number;
  confidence: number;
  createdAt: Date;
}

export enum InsightType {
  OVERSPENDING = 'OVERSPENDING',
  UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY',
  BUDGET_ALERT = 'BUDGET_ALERT',
  SAVINGS_OPPORTUNITY = 'SAVINGS_OPPORTUNITY',
  SPENDING_PATTERN = 'SPENDING_PATTERN',
  CATEGORY_TREND = 'CATEGORY_TREND',
  RECURRING_EXPENSE = 'RECURRING_EXPENSE',
  SEASONAL_PATTERN = 'SEASONAL_PATTERN'
}

export interface SpendingTrend {
  date: Date;
  amount: number;
  transactionCount: number;
  averageAmount: number;
  cumulativeAmount: number;
  prediction?: number;
  confidence?: number;
}

export interface BudgetAnalysis {
  userId: number;
  period: AnalyticsPeriod;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  categoryBudgets: CategoryBudget[];
  projectedSpending: number;
  projectedOverrun: number;
  recommendations: BudgetRecommendation[];
  alerts: BudgetAlert[];
}

export interface CategoryBudget {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  projectedSpending: number;
  daysRemaining: number;
  dailyBudgetRemaining: number;
}

export interface BudgetRecommendation {
  id: string;
  type: 'INCREASE_BUDGET' | 'REDUCE_SPENDING' | 'REALLOCATE_BUDGET' | 'SET_ALERT';
  category?: string;
  title: string;
  description: string;
  suggestedAmount?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  potentialSavings?: number;
}

export interface BudgetAlert {
  id: string;
  type: 'APPROACHING_LIMIT' | 'OVER_BUDGET' | 'UNUSUAL_SPENDING';
  category: string;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  currentAmount: number;
  budgetAmount: number;
  threshold: number;
  createdAt: Date;
}

export interface ComparisonAnalysis {
  userId: number;
  currentPeriod: AnalyticsPeriod;
  comparisonPeriod: AnalyticsPeriod;
  comparisonType: string;
  totalSpendingComparison: AmountComparison;
  categoryComparisons: CategoryComparison[];
  trendAnalysis: TrendAnalysis;
  insights: ComparisonInsight[];
}

export interface AmountComparison {
  current: number;
  comparison: number;
  difference: number;
  percentageChange: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface CategoryComparison {
  category: string;
  current: AmountComparison;
  rank: {
    current: number;
    previous: number;
    change: number;
  };
}

export interface TrendAnalysis {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
  strength: number;
  seasonality: boolean;
  cyclicalPattern: boolean;
  volatility: number;
}

export interface ComparisonInsight {
  type: 'IMPROVEMENT' | 'CONCERN' | 'OPPORTUNITY';
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  amount?: number;
}

export interface PredictionData {
  userId: number;
  predictionType: string;
  period: AnalyticsPeriod;
  predictions: Prediction[];
  confidence: number;
  methodology: string;
  factors: PredictionFactor[];
  accuracy?: number;
  generatedAt: Date;
}

export interface Prediction {
  date: Date;
  predictedAmount: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  category?: string;
  factors?: string[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  description: string;
  category?: string;
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  groupIds?: number[];
  includeSettlements?: boolean;
  tags?: string[];
  searchTerm?: string;
}

export interface DashboardMetrics {
  userId: number;
  period: AnalyticsPeriod;
  totalSpent: number;
  totalEarned?: number;
  netSpending: number;
  transactionCount: number;
  averageTransaction: number;
  topCategory: string;
  topCategoryAmount: number;
  budgetUtilization?: number;
  savingsRate?: number;
  spendingVelocity: number;
  quickStats: QuickStat[];
  recentTrends: TrendPoint[];
  alerts: DashboardAlert[];
  lastUpdated: Date;
}

export interface QuickStat {
  label: string;
  value: number;
  change?: number;
  changePercentage?: number;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  format: 'CURRENCY' | 'NUMBER' | 'PERCENTAGE';
  color?: string;
  icon?: string;
}

export interface TrendPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface DashboardAlert {
  id: string;
  type: 'BUDGET' | 'UNUSUAL' | 'GOAL' | 'REMINDER';
  severity: 'INFO' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  actionUrl?: string;
  dismissible: boolean;
  createdAt: Date;
}

export interface AnalyticsReport {
  id: string;
  userId: number;
  title: string;
  description?: string;
  period: AnalyticsPeriod;
  sections: ReportSection[];
  summary: ReportSummary;
  generatedAt: Date;
  generatedBy: number;
  format: 'PDF' | 'HTML' | 'JSON';
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'CHART' | 'TABLE' | 'TEXT' | 'METRICS';
  data: any;
  visualization?: VisualizationConfig;
  order: number;
}

export interface VisualizationConfig {
  chartType: 'LINE' | 'BAR' | 'PIE' | 'DOUGHNUT' | 'AREA' | 'SCATTER';
  colors?: string[];
  showLegend: boolean;
  showGrid: boolean;
  responsive: boolean;
  animations: boolean;
}

export interface ReportSummary {
  totalSpent: number;
  totalTransactions: number;
  topCategory: string;
  biggestExpense: number;
  averageDaily: number;
  keyInsights: string[];
  recommendations: string[];
}

export interface CustomReport {
  id?: string;
  name: string;
  description?: string;
  userId: number;
  sections: CustomReportSection[];
  filters: AnalyticsFilter;
  schedule?: ReportSchedule;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomReportSection {
  type: 'SPENDING_OVERVIEW' | 'CATEGORY_BREAKDOWN' | 'TRENDS' | 'BUDGET_ANALYSIS' | 'COMPARISONS';
  title: string;
  configuration: any;
  visualization: VisualizationConfig;
  order: number;
}

export interface ReportSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: string[];
  isActive: boolean;
}

export interface ExportRequest {
  format: 'CSV' | 'PDF' | 'EXCEL' | 'JSON';
  sections: string[];
  period: AnalyticsPeriod;
  filters?: AnalyticsFilter;
  includeCharts: boolean;
  includeRawData: boolean;
  customization?: ExportCustomization;
}

export interface ExportCustomization {
  title?: string;
  logo?: string;
  colors?: string[];
  template?: string;
  watermark?: string;
}

export interface ExportResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  format: string;
  expiresAt: Date;
  generatedAt: Date;
}