import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  ArrowDownCircle,
  Settings,
  Inbox,
  Navigation,
  Radar,
  Handshake,
  Send,
  Search,
  ScrollText,
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

// ─── Perito ───────────────────────────────────────────────────────────────────

export const navigation: NavSection[] = [
  {
    title: "Principal",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Péricias", href: "/pericias", icon: FileText },
      { title: "Demandas", href: "/demandas", icon: Inbox },
      { title: "Visitas e Rotas", href: "/rotas", icon: Navigation },
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
    title: "Inteligência",
    items: [
      { title: "Radar", href: "/nomeacoes", icon: Radar },
      { title: "Modelos", href: "/documentos/modelos", icon: ScrollText },
    ],
  },
]

export const bottomNavigation: NavItem[] = [
  { title: "Configurações", href: "/configuracoes", icon: Settings },
]

// ─── Parceiro ─────────────────────────────────────────────────────────────────

export const navigationParceiro: NavSection[] = [
  {
    title: "Principal",
    items: [
      { title: "Dashboard", href: "/parceiro/dashboard", icon: LayoutDashboard },
      { title: "Minhas Demandas", href: "/parceiro/demandas", icon: Inbox },
      { title: "Buscar Peritos", href: "/parceiro/peritos", icon: Search },
      { title: "Propostas", href: "/parceiro/propostas", icon: Send },
    ],
  },
]

export const bottomNavigationParceiro: NavItem[] = [
  { title: "Configurações", href: "/configuracoes", icon: Settings },
]
