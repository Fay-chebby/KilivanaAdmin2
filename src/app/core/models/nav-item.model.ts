export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
