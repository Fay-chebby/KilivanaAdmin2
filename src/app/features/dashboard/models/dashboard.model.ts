/** UI-facing models. dashboard.service maps the API responses into these. */

export interface StatCardData {
  label: string;
  value: number;
  format: 'number' | 'currency';
  /** Optional line under the value, e.g. "68 orders this month". */
  deltaText?: string;
  /** Optional % change; the current API doesn't send it, so the line is simply hidden. */
  changePct?: number;
}

export interface DashboardStats {
  totalFarmers: StatCardData;
  totalBuyers: StatCardData;
  activeOrders: StatCardData;
  monthlyRevenue: StatCardData;
  pendingVerifications: number;
  openDisputes: number;
  avgOrderValue: number;
  updatedAt: string;
}

export interface OrderTrendPoint {
  label: string; // "28 Oct"
  orders: number;
  revenue: number;
}

export interface CropSlice {
  category: string;
  percent: number;
}

export interface ActivityItem {
  id: string;
  text: string;
  createdAt: string;
  type: 'order' | 'kyc' | 'dispute' | 'other';
  link?: string;
}

export interface AlertItem {
  id: string;
  title: string;
  detail: string;
  severity: 'high' | 'medium';
  link?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  orderTrend: OrderTrendPoint[];
  cropMix: CropSlice[];
  activity: ActivityItem[];
  alerts: AlertItem[];
}
