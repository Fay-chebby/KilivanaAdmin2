/** Shapes returned by the backend for the dashboard (GET /admin/dashboard/stats, /admin/audit-logs). */

export interface DashboardStatsResponse {
  totalFarmers: number;
  totalBuyers: number;
  activeOrders: number;
  monthlyRevenue: number;
  pendingVerifications: number;
  openDisputes: number;
  averageOrderValue: number;
  monthlyOrders: number;
  updatedAt: string;
  orderTrend: { date: string; orders: number; revenue: number }[]; // last 14 days, oldest first
  topCategories: { category: string; orders: number }[];
}

export interface AuditLogResponse {
  id: number;
  actorId?: number;
  action: string; // e.g. SUPPLIER_SUSPENDED
  entityType?: string; // e.g. Supplier
  entityId?: number;
  metadata?: string;
  createdAt: string;
}
