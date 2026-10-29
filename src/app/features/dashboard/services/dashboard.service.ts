import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { API_BASE } from '../../../core/config/api.config';
import { ApiResponse, SpringPage } from '../../../core/models/api-response.model';

import { AuditLogResponse, DashboardStatsResponse } from '../models/Dashboard api.model';

import {
  ActivityItem,
  AlertItem,
  CropSlice,
  DashboardData,
  DashboardStats,
  OrderTrendPoint,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  /**
   * Headers shared by dashboard API requests.
   *
   * The auth interceptor should add the JWT token if configured.
   * The Ngrok header suppresses its browser warning page.
   */
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  });

  getDashboard(): Observable<DashboardData> {
    return forkJoin({
      stats: this.http
        .get<
          ApiResponse<DashboardStatsResponse>
        >(`${API_BASE}/admin/dashboard/stats`, { headers: this.headers })
        .pipe(map((res) => res.data)),

      activity: this.getActivity(),
    }).pipe(
      map(({ stats, activity }) => ({
        stats: this.toStats(stats),
        orderTrend: this.toOrderTrend(stats),
        cropMix: this.toCropMix(stats),
        activity,
        alerts: this.toAlerts(stats),
      })),
    );
  }

  /**
   * Uses audit logs for recent activity.
   * If the audit-log request fails, the dashboard still loads.
   */
  private getActivity(): Observable<ActivityItem[]> {
    return this.http
      .get<ApiResponse<SpringPage<AuditLogResponse>>>(`${API_BASE}/admin/audit-logs`, {
        headers: this.headers,
        params: {
          page: 0,
          size: 5,
          sort: 'createdAt,desc',
        },
      })
      .pipe(
        map((res) => (res.data?.content ?? []).map((log) => this.toActivity(log))),
        catchError(() => of([])),
      );
  }

  /**
   * Converts backend dashboard statistics into frontend card data.
   */
  private toStats(s: DashboardStatsResponse): DashboardStats {
    const month = new Date(s.updatedAt).toLocaleString('en-US', {
      month: 'short',
    });

    return {
      totalFarmers: {
        label: 'Total Farmers',
        value: s.totalFarmers,
        changePct: 0,
        format: 'number',
      },

      totalBuyers: {
        label: 'Total Buyers',
        value: s.totalBuyers,
        changePct: 0,
        format: 'number',
      },

      activeOrders: {
        label: 'Active Orders',
        value: s.activeOrders,
        changePct: 0,
        format: 'number',
      },

      monthlyRevenue: {
        label: `${month} Revenue`,
        value: s.monthlyRevenue,
        changePct: 0,
        format: 'currency',
        deltaText: `${s.monthlyOrders} orders this month`,
      },

      pendingVerifications: s.pendingVerifications,
      openDisputes: s.openDisputes,
      avgOrderValue: s.averageOrderValue,
      updatedAt: s.updatedAt,
    };
  }

  /**
   * Converts the backend order trend into the format required by the chart.
   */
  private toOrderTrend(s: DashboardStatsResponse): OrderTrendPoint[] {
    return (s.orderTrend ?? []).map((p) => {
      const date = new Date(p.date);

      return {
        month: date.toLocaleDateString('en-US', {
          month: 'short',
        }),

        label: date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        }),

        orders: p.orders,
        revenue: p.revenue,
      };
    });
  }

  /**
   * Converts category order counts into percentages for the donut chart.
   */
  private toCropMix(s: DashboardStatsResponse): CropSlice[] {
    const categories = s.topCategories ?? [];

    const total = categories.reduce((sum, category) => sum + category.orders, 0);

    return categories.map((category) => ({
      category: category.category,
      percent: total ? Math.round((category.orders / total) * 1000) / 10 : 0,
    }));
  }

  /**
   * Creates alerts using counts already provided by the backend.
   */
  private toAlerts(s: DashboardStatsResponse): AlertItem[] {
    const alerts: AlertItem[] = [];

    if (s.openDisputes > 0) {
      alerts.push({
        id: 'disputes',
        severity: 'high',
        title: `${s.openDisputes} Open Dispute${s.openDisputes > 1 ? 's' : ''}`,
        detail: 'Open or in progress — review and resolve',
        link: '/disputes',
      });
    }

    if (s.pendingVerifications > 0) {
      alerts.push({
        id: 'verifications',
        severity: 'medium',
        title: `${s.pendingVerifications} Pending Verification${
          s.pendingVerifications > 1 ? 's' : ''
        }`,
        detail: 'Accounts waiting for approval — review needed',
        link: '/kyc',
      });
    }

    return alerts;
  }

  /**
   * Converts an audit log entry into a dashboard activity item.
   */
  private toActivity(log: AuditLogResponse): ActivityItem {
    const entity = (log.entityType ?? '').toLowerCase();

    const type: ActivityItem['type'] = entity.includes('order')
      ? 'order'
      : entity.includes('dispute')
        ? 'dispute'
        : entity.includes('kyc') || entity.includes('verification')
          ? 'kyc'
          : 'other';

    const action = (log.action ?? 'UNKNOWN_ACTION').replace(/_/g, ' ').toLowerCase();

    const target = log.entityType
      ? ` — ${log.entityType}${log.entityId != null ? ` #${log.entityId}` : ''}`
      : '';

    return {
      id: String(log.id),
      type,
      text: `${action.charAt(0).toUpperCase()}${action.slice(1)}${target}`,
      createdAt: log.createdAt,
    };
  }
}
