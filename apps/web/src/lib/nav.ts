import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  Contact2,
  KanbanSquare,
  LayoutDashboard,
  Package,
  PhoneCall,
  Settings,
  Store,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Contatos', href: '/contacts', icon: Contact2 },
      { label: 'Leads', href: '/leads', icon: Target },
      { label: 'Clientes', href: '/customers', icon: Users },
      { label: 'Empresas', href: '/companies', icon: Building2 },
      { label: 'Revendedores', href: '/resellers', icon: Store },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { label: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
      { label: 'Follow-ups', href: '/follow-ups', icon: PhoneCall },
    ],
  },
  {
    title: 'Vendas',
    items: [{ label: 'Pedidos', href: '/orders', icon: ClipboardList }],
  },
  {
    title: 'Produtos',
    items: [
      { label: 'Produtos', href: '/products', icon: Package },
      { label: 'Estoque', href: '/inventory', icon: Boxes },
    ],
  },
  {
    items: [
      { label: 'Relatórios', href: '/reports', icon: BarChart3 },
      { label: 'Configurações', href: '/settings', icon: Settings },
    ],
  },
];
