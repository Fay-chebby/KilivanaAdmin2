import { NavSection } from '../models/nav-item.model';

/** Sidebar menu. Routes must match the paths registered in app.routes.ts. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: 'grid', route: '/dashboard' }],
  },
  {
    label: 'People',
    items: [
      { label: 'Farmers', icon: 'user', route: '/farmers' },
      { label: 'Buyers', icon: 'cart', route: '/buyers' },
      { label: 'Suppliers', icon: 'box', route: '/suppliers' },
      { label: 'Inspectors', icon: 'shield-check', route: '/inspectors' },
      { label: 'Delivery Agents', icon: 'send', route: '/drivers' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Farms & Crops', icon: 'leaf', route: '/farms-crops' },
      { label: 'Product Catalog', icon: 'cart', route: '/products' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', icon: 'cart', route: '/orders' },
      { label: 'Payments & Finance', icon: 'card', route: '/payments' },
      { label: 'KYC & Verification', icon: 'shield-check', route: '/kyc' },
      { label: 'Logistics', icon: 'compass', route: '/logistics' },
      { label: 'Disputes & Support', icon: 'flag', route: '/disputes' },
    ],
  },
  {
    label: 'Insights',
    items: [{ label: 'Reports & Analytics', icon: 'chart', route: '/reports' }],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Roles & Staff', icon: 'lock', route: '/users' },
      { label: 'Notifications & Settings', icon: 'bell', route: '/settings' },
    ],
  },
];
