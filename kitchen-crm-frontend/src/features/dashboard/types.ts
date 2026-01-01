/**
 * Dashboard TypeScript Types
 * Corresponding to backend DTOs
 */

// Dashboard Summary Types
export interface DashboardSummary {
  // Customer Metrics
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number;

  // Quotation Metrics
  totalQuotations: number;
  pendingQuotations: number;
  approvedQuotations: number;
  totalQuotationValue: string;
  averageQuotationValue: string;

  // Project Metrics
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalProjectValue: string;
  completedProjectValue: string;

  // Payment Metrics
  totalPaymentsReceived: string;
  paymentsThisMonth: string;
  pendingPayments: string;
  cashInHand: string;
  cashInAccount: string;

  // Design Phase Metrics
  designsInProgress: number;
  designsAwaitingApproval: number;
  approvedDesigns: number;

  // Production & Installation Metrics
  installationsInProgress: number;
  readyForInstallation: number;
  completedInstallations: number;
  overdueProjects: number;

  // Performance Metrics
  conversionRate: number;
  completionRate: number;
  averageProjectDuration: number;

  lastUpdated: string;
}

// Revenue Analytics Types
export interface MonthlyRevenue {
  month: string;
  revenue: string;
  target: string;
  projectsCompleted: number;
}

export interface CustomerRevenue {
  customerId: number;
  customerName: string;
  totalRevenue: string;
  projectsCount: number;
}

export interface RevenueAnalytics {
  monthlyRevenue: MonthlyRevenue[];
  paymentMethodBreakdown: Record<string, string>;
  revenueByProjectStatus: Record<string, string>;
  topCustomersByRevenue: CustomerRevenue[];
  currentMonthProjection: string;
  nextMonthProjection: string;
  totalOutstanding: string;
  averagePaymentTime: string;
  collectionEfficiency: number;
}

// Project Analytics Types
export interface ProjectTimeline {
  projectName: string;
  customerName: string;
  estimatedDays: number;
  actualDays: number;
  status: string;
  projectValue: string;
}

export interface TeamPerformance {
  teamMember: string;
  role: string;
  activeProjects: number;
  completedProjects: number;
  averageCompletionTime: number;
  efficiency: number;
}

export interface Bottleneck {
  stage: string;
  projectsStuck: number;
  averageStuckTime: number;
  recommendation: string;
}

export interface ProjectAnalytics {
  projectStatusDistribution: Record<string, number>;
  projectTimelines: ProjectTimeline[];
  installationStatusDistribution: Record<string, number>;
  teamPerformance: TeamPerformance[];
  projectSizeAnalysis: Record<string, any>;
  bottlenecks: Bottleneck[];
}

// Customer Analytics Types
export interface MonthlyCustomer {
  month: string;
  newCustomers: number;
  totalCustomers: number;
  acquisitionCost: string;
}

export interface CustomerSatisfaction {
  customerId: number;
  customerName: string;
  satisfactionScore: number;
  feedback: string;
  projectPhase: string;
}

export interface CustomerAnalytics {
  monthlyAcquisition: MonthlyCustomer[];
  customerSegmentation: Record<string, number>;
  customerLifecycle: Record<string, number>;
  customerSatisfaction: CustomerSatisfaction[];
  retentionMetrics: Record<string, any>;
  geographicDistribution: Record<string, number>;
}

// Performance Metrics Types
export interface SalesPerformance {
  monthlyTarget: string;
  monthlyAchieved: string;
  achievementPercentage: number;
  leadsGenerated: number;
  quotationsSent: number;
  projectsWon: number;
  conversionRate: number;
}

export interface OperationalEfficiency {
  averageProjectDuration: number;
  onTimeDeliveryRate: number;
  resourceUtilization: number;
  activeTeamMembers: number;
  productivityIndex: number;
}

export interface QualityMetrics {
  qualityPassRate: number;
  revisionCount: number;
  customerSatisfactionAvg: number;
  warrantyIssues: number;
  defectRate: number;
}

export interface FinancialHealth {
  grossRevenue: string;
  netProfit: string;
  profitMargin: number;
  operatingExpenses: string;
  returnOnInvestment: number;
  daysOfCashOnHand: number;
}

export interface PerformanceMetrics {
  kpiMetrics: Record<string, any>;
  salesPerformance: SalesPerformance;
  operationalEfficiency: OperationalEfficiency;
  qualityMetrics: QualityMetrics;
  financialHealth: FinancialHealth;
}

// API Response Types
export interface DashboardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Query Parameters
export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}

export interface CustomReportParams extends DateRangeParams {
  reportType: string;
  parameters?: Record<string, any>;
}

export interface ExportParams extends DateRangeParams {
  format?: 'csv' | 'pdf';
}
