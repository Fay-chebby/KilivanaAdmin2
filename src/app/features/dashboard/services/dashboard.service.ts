import { Injectable } from '@angular/core';
import { Observable, delay, forkJoin, of } from 'rxjs';
import {
  ActivityItem,
  AlertItem,
  CropSlice,
  DashboardData,
  DashboardStats,
  OrderTrendPoint,
} from '../models/dashboard.model';

/**
 * MOCK DATA for now. When your API is ready, inject HttpClient and replace each
 * method body with e.g. `return this.http.get<DashboardStats>('/api/dashboard/stats');`
 * Nothing else in the feature needs to change.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  getDashboard(): Observable<DashboardData> {
    return forkJoin({
      stats: this.getStats(),
      orderTrend: this.getOrderTrend(),
      cropMix: this.getCropMix(),
      activity: this.getActivity(),
      alerts: this.getAlerts(),
    });
  }

  getStats(): Observable<DashboardStats> {
    return of<DashboardStats>({
      totalFarmers: { label: 'Total Farmers', value: 8452, changePct: 12.4, format: 'number' },
      totalBuyers: { label: 'Total Buyers', value: 3891, changePct: 8.7, format: 'number' },
      activeOrders: {
        label: 'Active Orders',
        value: 142,
        changePct: 0,
        format: 'number',
        deltaText: '23 new today vs last month',
      },
      monthlyRevenue: { label: 'Sep Revenue', value: 284600, changePct: 21.3, format: 'currency' },
      pendingVerifications: 23,
      openDisputes: 8,
      avgOrderValue: 2004,
      updatedAt: new Date().toISOString(),
    }).pipe(delay(400));
  }

  getOrderTrend(): Observable<OrderTrendPoint[]> {
    const orders = [45, 62, 72, 88, 100, 126, 148];
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    return of(
      months.map((month, i) => ({ month, orders: orders[i], revenue: orders[i] * 2004 })),
    ).pipe(delay(400));
  }

  getCropMix(): Observable<CropSlice[]> {
    return of<CropSlice[]>([
      { category: 'Cocoa', percent: 31 },
      { category: 'Grains', percent: 22 },
      { category: 'Root Crops', percent: 18 },
      { category: 'Vegetables', percent: 14 },
      { category: 'Tree Fruits', percent: 10 },
      { category: 'Other', percent: 5 },
    ]).pipe(delay(400));
  }

  getActivity(): Observable<ActivityItem[]> {
    const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
    return of<ActivityItem[]>([
      {
        id: '1',
        type: 'order',
        text: 'New order ORD-2851 placed by AgriMart Ltd',
        createdAt: minsAgo(2),
        link: '/orders',
      },
      {
        id: '2',
        type: 'kyc',
        text: 'Adjoa Boateng submitted KYC documents for review',
        createdAt: minsAgo(18),
        link: '/kyc',
      },
      {
        id: '3',
        type: 'dispute',
        text: 'Dispute DSP-041 opened on order ORD-2849',
        createdAt: minsAgo(34),
        link: '/disputes',
      },
    ]).pipe(delay(400));
  }

  getAlerts(): Observable<AlertItem[]> {
    return of<AlertItem[]>([
      {
        id: '1',
        severity: 'high',
        title: 'Escalated Dispute',
        detail: 'DSP-039 overdue SLA — 19 Sep deadline',
        link: '/disputes',
      },
      {
        id: '2',
        severity: 'medium',
        title: '23 Pending KYCs',
        detail: '4 flagged as high priority — review needed',
        link: '/kyc',
      },
    ]).pipe(delay(400));
  }
}
