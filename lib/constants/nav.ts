export interface NavItem {
  title: string
  href: string
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
      { title: "Dashboard",       href: "/dashboard" },
      { title: "Nomeações",       href: "/nomeacoes" },
      { title: "Pericias",        href: "/pericias" },
      { title: "Agenda",           href: "/agenda" },
      { title: "Rotas e Vistorias", href: "/rotas/pericias" },
      { title: "Prospecção",      href: "/prospeccao" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { title: "Visão Geral",  href: "/financeiro" },
      { title: "Recebimentos", href: "/recebimentos" },
    ],
  },
]

export const bottomNavigation: NavItem[] = [
  { title: "Configurações", href: "/configuracoes" },
]

// ─── Parceiro ─────────────────────────────────────────────────────────────────

export const navigationParceiro: NavSection[] = [
  {
    title: "Principal",
    items: [
      { title: "Dashboard",       href: "/parceiro/dashboard" },
      { title: "Minhas Demandas", href: "/parceiro/demandas" },
      { title: "Buscar Peritos",  href: "/parceiro/peritos" },
      { title: "Propostas",       href: "/parceiro/propostas" },
    ],
  },
]

export const bottomNavigationParceiro: NavItem[] = [
  { title: "Configurações", href: "/configuracoes" },
]
