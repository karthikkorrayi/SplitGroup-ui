import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, combineLatest } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  SpendingAnalytics,
  CategoryBreakdown,
  SpendingTrend,
  AnalyticsReport,
  ExportRequest,
  ExportResponse,
  AnalyticsPeriod,
  SpendingInsight,
  BudgetAnalysis,
  ComparisonAnalysis,
  PredictionData,
  AnalyticsFilter,
  DashboardMetrics,
  CustomReport
} from '../../shared/models/analytics.model';

/**
 * AnalyticsService - Comprehensive spending insights and reporting service
 * 
 * This service handles all analytics-related operations including:
 * - Spending pattern analysis
 * - Category-wise breakdowns
 * - Monthly/yearly reports
 * - Export functionality
 * - Data visualization support
 * - Predictive analytics
 * - Budget tracking and analysis
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly API_URL = `${environment.apiUrl}/analytics`;
  
  // Cache management
  private analyticsCache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private generatingReportSubject = new BehaviorSubject<boolean>(false);
  public generatingReport$ = this.generatingReportSubject.asObservable();
  
  // Current analytics data
  private currentAnalyticsSubject = new BehaviorSubject<SpendingAnalytics | null>(null);
  public currentAnalytics$ = this.currentAnalyticsSubject.asObservable();
  
  // Dashboard metrics
  private dashboardMetricsSubject = new BehaviorSubject<DashboardMetrics | null>(null);
  public dashboardMetrics$ = this.dashboardMetricsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get comprehensive spending analytics for a user
   */
  getSpendingAnalytics(
    userId: number, 
    period: AnalyticsPeriod, 
    forceRefresh = false
  ): Observable<SpendingAnalytics> {
    const cacheKey = `spending_${userId}_${period.start.getTime()}_${period.end.getTime()}`;
    
    // Check cache first
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cachedData = this.analyticsCache.get(cacheKey);
      this.currentAnalyticsSubject.next(cachedData);
      return of(cachedData);
    }

    const params = new HttpParams()
      .set('startDate', period.start.toISOString())
      .set('endDate', period.end.toISOString());

    this.setLoading(true);
    return this.http.get<SpendingAnalytics>(`${this.API_URL}/spending/${userId}`, { params })
      .pipe(
        tap(analytics => {
          // Update cache
          this.setCache(cacheKey, analytics);
          this.currentAnalyticsSubject.next(analytics);
          
          console.log('Spending analytics fetched:', analytics);
        }),
        catchError(error => this.handleError('Failed to fetch spending analytics', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Get category breakdown with detailed analysis
   */
  getCategoryBreakdown(
    userId: number, 
    period: AnalyticsPeriod,
    includeSubcategories = false
  ): Observable<CategoryBreakdown[]> {
    const cacheKey = `categories_${userId}_${period.start.getTime()}_${period.end.getTime()}_${includeSubcategories}`;
    
    if (this.isCacheValid(cacheKey)) {
      return of(this.analyticsCache.get(cacheKey));
    }

    const params = new HttpParams()
      .set('startDate', period.start.toISOString())
      .set('endDate', period.end.toISOString())
      .set('includeSubcategories', includeSubcategories.toString());

    return this.http.get<CategoryBreakdown[]>(`${this.API_URL}/categories/${userId}`, { params })
      .pipe(
        tap(breakdown => {
          this.setCache(cacheKey, breakdown);
          console.log('Category breakdown fetched:', breakdown);
        }),
        catchError(error => this.handleError('Failed to fetch category breakdown', error))
      );
  }

  /**
   * Get spending trends with predictive analysis
   */
  getSpendingTrends(
    userId: number, 
    period: AnalyticsPeriod,
    granularity: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Observable<SpendingTrend[]> {
    const cacheKey = `trends_${userId}_${period.start.getTime()}_${period.end.getTime()}_${granularity}`;
    
    if (this.isCacheValid(cacheKey)) {
      return of(this.analyticsCache.get(cacheKey));
    }

    const params = new HttpParams()
      .set('startDate', period.start.toISOString())
      .set('endDate', period.end.toISOString())
      .set('granularity', granularity);

    return this.http.get<SpendingTrend[]>(`${this.API_URL}/trends/${userId}`, { params })
      .pipe(
        tap(trends => {
          this.setCache(cacheKey, trends);
          console.log('Spending trends fetched:', trends);
        }),
        catchError(error => this.handleError('Failed to fetch spending trends', error))
      );
  }

  /**
   * Get spending insights and recommendations
   */
  getSpendingInsights(userId: number, period: AnalyticsPeriod): Observable<SpendingInsight[]> {
    const params = new HttpParams()
      .set('startDate', period.start.toISOString())
      .set('endDate', period.end.toISOString());

    return this.http.get<SpendingInsight[]>(`${this.API_URL}/insights/${userId}`, { params })
      .pipe(
        tap(insights => console.log('Spending insights fetched:', insights)),
        catchError(error => this.handleError('Failed to fetch spending insights', error))
      );
  }

  /**
   * Get budget analysis and tracking
   */
  getBudgetAnalysis(userId: number, period: AnalyticsPeriod): Observable<BudgetAnalysis> {
    const params = new HttpParams()
      .set('startDate', period.start.toISOString())
      .set('endDate', period.end.toISOString());

    return this.http.get<BudgetAnalysis>(`${this.API_URL}/budget/${userId}`, { params })
      .pipe(
        tap(analysis => console.log('Budget analysis fetched:', analysis)),
        catchError(error => this.handleError('Failed to fetch budget analysis', error))
      );
  }

  /**
   * Get comparison analysis (vs previous period, vs other users, etc.)
   */
  getComparisonAnalysis(
    userId: number, 
    currentPeriod: AnalyticsPeriod,
    comparisonType: 'previous_period' | 'same_period_last_year' | 'group_average'
  ): Observable<ComparisonAnalysis> {
    const params = new HttpParams()
      .set('startDate', currentPeriod.start.toISOString())
      .set('endDate', currentPeriod.end.toISOString())
      .set('comparisonType', comparisonType);

    return this.http.get<ComparisonAnalysis>(`${this.API_URL}/comparison/${userId}`, { params })
      .pipe(
        tap(comparison => console.log('Comparison analysis fetched:', comparison)),
        catchError(error => this.handleError('Failed to fetch comparison analysis', error))
      );
  }

  /**
   * Get predictive analytics and forecasting
   */
  getPredictionData(
    userId: number, 
    predictionType: 'spending_forecast' | 'budget_projection' | 'category_trends',
    months = 3
  ): Observable<PredictionData> {
    const params = new HttpParams()
      .set('type', predictionType)
      .set('months', months.toString());

    return this.http.get<PredictionData>(`${this.API_URL}/predictions/${userId}`, { params })
      .pipe(
        tap(predictions => console.log('Prediction data fetched:', predictions)),
        catchError(error => this.handleError('Failed to fetch prediction data', error))
      );
  }

  /**
   * Get dashboard metrics for overview
   */
  getDashboardMetrics(userId: number, period: AnalyticsPeriod): Observable<DashboardMetrics> {
    const cacheKey = `dashboard_${userId}_${period.start.getTime()}_${period.end.getTime()}`;
    
    if (this.isCacheValid(cacheKey)) {
      const cachedData = this.analyticsCache.get(cacheKey);
      this.dashboardMetricsSubject.next(cachedData);
      return of(cachedData);
    }

    const params = new HttpParams()
      .set('startDate', period.start.toISOString())
      .set('endDate', period.end.toISOString());

    return this.http.get<DashboardMetrics>(`${this.API_URL}/dashboard/${userId}`, { params })
      .pipe(
        tap(metrics => {
          this.setCache(cacheKey, metrics);
          this.dashboardMetricsSubject.next(metrics);
          console.log('Dashboard metrics fetched:', metrics);
        }),
        catchError(error => this.handleError('Failed to fetch dashboard metrics', error))
      );
  }

  /**
   * Generate comprehensive analytics report
   */
  generateReport(userId: number, reportConfig: CustomReport): Observable<AnalyticsReport> {
    this.setGeneratingReport(true);
    return this.http.post<AnalyticsReport>(`${this.API_URL}/reports/${userId}`, reportConfig)
      .pipe(
        tap(report => {
          console.log('Analytics report generated:', report);
        }),
        catchError(error => this.handleError('Failed to generate report', error)),
        tap(() => this.setGeneratingReport(false))
      );
  }

  /**
   * Export analytics data in various formats
   */
  exportAnalytics(userId: number, exportRequest: ExportRequest): Observable<ExportResponse> {
    this.setGeneratingReport(true);
    return this.http.post<ExportResponse>(`${this.API_URL}/export/${userId}`, exportRequest)
      .pipe(
        tap(response => {
          console.log('Analytics export completed:', response);
        }),
        catchError(error => this.handleError('Failed to export analytics', error)),
        tap(() => this.setGeneratingReport(false))
      );
  }

  /**
   * Get filtered analytics data
   */
  getFilteredAnalytics(
    userId: number, 
    filter: AnalyticsFilter
  ): Observable<SpendingAnalytics> {
    const params = this.buildFilterParams(filter);
    
    return this.http.get<SpendingAnalytics>(`${this.API_URL}/filtered/${userId}`, { params })
      .pipe(
        tap(analytics => console.log('Filtered analytics fetched:', analytics)),
        catchError(error => this.handleError('Failed to fetch filtered analytics', error))
      );
  }

  /**
   * Get analytics for multiple users (group analytics)
   */
  getGroupAnalytics(
    userIds: number[], 
    period: AnalyticsPeriod
  ): Observable<SpendingAnalytics[]> {
    const params = new HttpParams()
      .set('userIds', userIds.join(','))
      .set('startDate', period.start.toISOString())
      .set('endDate', period.end.toISOString());

    return this.http.get<SpendingAnalytics[]>(`${this.API_URL}/group`, { params })
      .pipe(
        tap(analytics => console.log('Group analytics fetched:', analytics)),
        catchError(error => this.handleError('Failed to fetch group analytics', error))
      );
  }

  /**
   * Get real-time analytics updates
   */
  getRealtimeMetrics(userId: number): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.API_URL}/realtime/${userId}`)
      .pipe(
        tap(metrics => {
          this.dashboardMetricsSubject.next(metrics);
          console.log('Realtime metrics fetched:', metrics);
        }),
        catchError(error => this.handleError('Failed to fetch realtime metrics', error))
      );
  }

  /**
   * Save custom analytics configuration
   */
  saveCustomAnalytics(userId: number, config: CustomReport): Observable<CustomReport> {
    return this.http.post<CustomReport>(`${this.API_URL}/custom/${userId}`, config)
      .pipe(
        tap(savedConfig => console.log('Custom analytics saved:', savedConfig)),
        catchError(error => this.handleError('Failed to save custom analytics', error))
      );
  }

  /**
   * Get saved custom analytics configurations
   */
  getCustomAnalytics(userId: number): Observable<CustomReport[]> {
    return this.http.get<CustomReport[]>(`${this.API_URL}/custom/${userId}`)
      .pipe(
        tap(configs => console.log('Custom analytics fetched:', configs)),
        catchError(error => this.handleError('Failed to fetch custom analytics', error))
      );
  }

  // Utility methods for common date periods

  /**
   * Get current month analytics
   */
  getCurrentMonthAnalytics(userId: number): Observable<SpendingAnalytics> {
    const now = new Date();
    const period: AnalyticsPeriod = {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
    
    return this.getSpendingAnalytics(userId, period);
  }

  /**
   * Get last 30 days analytics
   */
  getLast30DaysAnalytics(userId: number): Observable<SpendingAnalytics> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return this.getSpendingAnalytics(userId, { start, end });
  }

  /**
   * Get year-to-date analytics
   */
  getYearToDateAnalytics(userId: number): Observable<SpendingAnalytics> {
    const now = new Date();
    const period: AnalyticsPeriod = {
      start: new Date(now.getFullYear(), 0, 1),
      end: now
    };
    
    return this.getSpendingAnalytics(userId, period);
  }

  // Private helper methods

  private buildFilterParams(filter: AnalyticsFilter): HttpParams {
    let params = new HttpParams();
    
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
    if (filter.categories?.length) params = params.set('categories', filter.categories.join(','));
    if (filter.minAmount !== undefined) params = params.set('minAmount', filter.minAmount.toString());
    if (filter.maxAmount !== undefined) params = params.set('maxAmount', filter.maxAmount.toString());
    if (filter.groupIds?.length) params = params.set('groupIds', filter.groupIds.join(','));
    if (filter.includeSettlements !== undefined) params = params.set('includeSettlements', filter.includeSettlements.toString());
    
    return params;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: any): void {
    this.analyticsCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setGeneratingReport(generating: boolean): void {
    this.generatingReportSubject.next(generating);
  }

  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);
    
    let userMessage = message;
    if (error.status === 404) {
      userMessage = 'Analytics data not found';
    } else if (error.status === 403) {
      userMessage = 'Access denied';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }

    return throwError(() => new Error(userMessage));
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.analyticsCache.clear();
    this.cacheExpiry.clear();
    this.currentAnalyticsSubject.next(null);
    this.dashboardMetricsSubject.next(null);
    console.log('Analytics service cache cleared');
  }
}