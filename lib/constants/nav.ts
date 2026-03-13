import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  ArrowDownCircle,
  BarChart3,
  Bell,
  Plug,
  Settings,
  Inbox,
  Navigation,
  Radar,
  ScrollText,
  Handshake,
  type LucideIcon,
} from "lucide-react"

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
    title: "Principal",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Péricias", href: "/pericias", icon: FileText },
      { title: "Documentos", href: "/documentos", icon: ScrollText },
      { title: "Demandas", href: "/demandas", icon: Inbox },
      { title: "Contatos", href: "/contatos", icon: Users },
      { title: "Parceiros", href: "/parceiros", icon: Handshake },
      { title: "Visitas", href: "/visitas", icon: Calendar },
      { title: "Rotas", href: "/rotas", icon: Navigation },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { title: "Visão Geral", href: "/financeiro", icon: TrendingUp },
      { title: "Recebimentos", href: "/recebimentos", icon: ArrowDownCircle },
    ],
  },
  {
    title: "Gestão",
    items: [
      { title: "Relatórios", href: "/relatorios", icon: BarChart3 },
      { title: "Alertas", href: "/alertas-nomeacoes", icon: Bell, badge: 3 },
      { title: "Radar de Nomeações", href: "/nomeacoes", icon: Radar },
      { title: "Integrações", href: "/integracoes", icon: Plug },
    ],
  },
]

export const bottomNavigation: NavItem[] = [
  { title: "Configurações", href: "/configuracoes", icon: Settings },
]
