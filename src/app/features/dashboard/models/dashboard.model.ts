export interface StatCardData {
  label: string;
  value: number;
  changePct: number;
  format: 'number' | 'currency';
  /** Optional custom delta text, e.g. "23 new today". Overrides the % text. */
  deltaText?: string;
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
  month: string;
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
  type: 'order' | 'kyc' | 'dispute';
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
