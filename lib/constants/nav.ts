import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Bell,
  Plug,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navigation: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Perícias', href: '/pericias', icon: FileText },
      { title: 'Contatos', href: '/contatos', icon: Users },
      { title: 'Visitas', href: '/visitas', icon: Calendar },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { title: 'Visão Geral', href: '/financeiro', icon: TrendingUp },
      { title: 'Recebimentos', href: '/recebimentos', icon: ArrowDownCircle },
      { title: 'Pagamentos', href: '/pagamentos-peritos', icon: ArrowUpCircle },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { title: 'Relatórios', href: '/relatorios', icon: BarChart3 },
      { title: 'Alertas', href: '/alertas-nomeacoes', icon: Bell, badge: 3 },
      { title: 'Integrações', href: '/integracoes', icon: Plug },
    ],
  },
]

export const bottomNavigation: NavItem[] = [
  { title: 'Configurações', href: '/configuracoes', icon: Settings },
]
