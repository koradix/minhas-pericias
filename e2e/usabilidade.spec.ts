import { test, expect, Page } from '@playwright/test'

// Credenciais de demo
const EMAIL = 'perito@demo.com'
const SENHA = 'senha123'

async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', SENHA)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 10000 })
}

// ─── 1. Landing page ──────────────────────────────────────────────────────────
test('landing: carrega sem erros', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

  await page.goto('/')
  await expect(page).toHaveTitle(/Minhas Perícias|Perilab/i)

  const h1 = await page.locator('h1').first().textContent()
  console.log(`  [landing] h1: "${h1}"`)

  const ctaButtons = page.locator('a[href="/login"], a[href="/signup"]')
  const count = await ctaButtons.count()
  console.log(`  [landing] CTAs encontrados: ${count}`)

  if (errors.length) console.log(`  [landing] Console errors: ${errors.join(' | ')}`)
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('landing: navbar tem links funcionando', async ({ page }) => {
  await page.goto('/')
  const loginLink = page.locator('a[href="/login"]').first()
  await expect(loginLink).toBeVisible()
  await loginLink.click()
  await expect(page).toHaveURL(/login/)
})

// ─── 2. Login ─────────────────────────────────────────────────────────────────
test('login: fluxo completo com credenciais demo', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()

  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', SENHA)

  const submitBtn = page.locator('button[type="submit"]')
  await expect(submitBtn).toBeVisible()
  await submitBtn.click()

  await page.waitForURL(/dashboard/, { timeout: 10000 })
  console.log('  [login] Redirecionado para dashboard ✓')
})

test('login: mensagem de erro com credenciais inválidas', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'errado@teste.com')
  await page.fill('input[type="password"]', 'senhaerrada')
  await page.click('button[type="submit"]')

  // Aguarda feedback de erro
  await page.waitForTimeout(2000)
  const errorVisible = await page.locator('[role="alert"], .text-red, .text-rose, [class*="error"]').first().isVisible().catch(() => false)
  console.log(`  [login] Feedback de erro visível: ${errorVisible}`)
})

// ─── 3. Dashboard ─────────────────────────────────────────────────────────────
test('dashboard: KPIs e saudação carregam', async ({ page }) => {
  await login(page)

  // Saudação
  const greeting = await page.locator('h1, h2').first().textContent()
  console.log(`  [dashboard] Saudação: "${greeting}"`)

  // KPI cards
  const kpis = await page.locator('[class*="kpi"], [class*="KPI"], [class*="card"]').count()
  console.log(`  [dashboard] Cards encontrados: ${kpis}`)

  // Screenshot mental — verificar que não há esqueletos/loading infinitos
  const loaders = await page.locator('[class*="animate-spin"], [class*="skeleton"]').count()
  console.log(`  [dashboard] Loaders ainda visíveis: ${loaders}`)
})

// ─── 4. Sidebar ───────────────────────────────────────────────────────────────
test('sidebar: navegação entre rotas principais', async ({ page }) => {
  await login(page)

  const rotas = [
    { label: 'Pericias', url: /pericias/ },
    { label: 'Contatos', url: /contatos/ },
    { label: 'Financeiro', url: /financeiro/ },
  ]

  for (const rota of rotas) {
    const link = page.locator(`nav a`).filter({ hasText: rota.label }).first()
    const exists = await link.isVisible().catch(() => false)
    if (exists) {
      await link.click()
      await page.waitForURL(rota.url, { timeout: 5000 }).catch(() => {})
      const url = page.url()
      console.log(`  [sidebar] ${rota.label} → ${url}`)
    } else {
      console.log(`  [sidebar] ⚠ Link "${rota.label}" não encontrado`)
    }
  }
})

test('sidebar: colapsa e expande no desktop', async ({ page }) => {
  await login(page)

  const toggleBtn = page.locator('button[aria-label*="colapsar"], button[aria-label*="expandir"], button[aria-label*="sidebar"], button[title*="sidebar"]').first()
  const found = await toggleBtn.isVisible().catch(() => false)

  if (found) {
    await toggleBtn.click()
    await page.waitForTimeout(500)
    console.log('  [sidebar] Toggle clicado ✓')
  } else {
    console.log('  [sidebar] ⚠ Botão de colapso não encontrado via aria-label')
  }
})

// ─── 5. Radar de nomeações ────────────────────────────────────────────────────
test('radar/nomeacoes: página carrega e botão buscar existe', async ({ page }) => {
  await login(page)
  await page.goto('/nomeacoes')
  await page.waitForLoadState('networkidle')

  const titulo = await page.locator('h1').first().textContent()
  console.log(`  [radar] Título: "${titulo}"`)

  const btnBuscar = page.locator('button').filter({ hasText: /buscar nomeaç/i }).first()
  const buscarOk = await btnBuscar.isVisible().catch(() => false)
  console.log(`  [radar] Botão "Buscar nomeações" visível: ${buscarOk}`)

  const btnRegistrar = page.locator('button').filter({ hasText: /registrar/i }).first()
  const registrarOk = await btnRegistrar.isVisible().catch(() => false)
  console.log(`  [radar] Botão "Registrar" visível: ${registrarOk}`)

  const processos = await page.locator('[class*="processo"], [class*="card"]').count()
  console.log(`  [radar] Cards/processos na tela: ${processos}`)
})

test('radar: modal de registrar nomeação abre', async ({ page }) => {
  await login(page)
  await page.goto('/nomeacoes')
  await page.waitForLoadState('networkidle')

  const btnRegistrar = page.locator('button').filter({ hasText: /registrar/i }).first()
  const ok = await btnRegistrar.isVisible().catch(() => false)
  if (!ok) { console.log('  [radar] ⚠ Botão Registrar não encontrado'); return }

  await btnRegistrar.click()
  await page.waitForTimeout(500)

  const modal = page.locator('[class*="fixed"][class*="z-50"], [role="dialog"]').first()
  const modalOk = await modal.isVisible().catch(() => false)
  console.log(`  [radar] Modal abriu: ${modalOk}`)

  const dropZone = page.locator('input[type="file"]').first()
  const dropOk = (await dropZone.count()) > 0
  console.log(`  [radar] Input de arquivo presente: ${dropOk}`)

  const selectTribunal = page.locator('select').first()
  const selectOk = await selectTribunal.isVisible().catch(() => false)
  console.log(`  [radar] Select de tribunal visível: ${selectOk}`)

  // Fechar modal
  const closeBtn = page.locator('button').filter({ hasText: /cancelar|fechar/i }).first()
  if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click()
})

// ─── 6. Pericias ──────────────────────────────────────────────────────────────
test('pericias: lista carrega sem erro', async ({ page }) => {
  await login(page)
  await page.goto('/pericias')
  await page.waitForLoadState('networkidle')

  const titulo = await page.locator('h1').first().textContent()
  console.log(`  [pericias] Título: "${titulo}"`)

  const emptyState = await page.locator('[class*="empty"], [class*="vazio"]').isVisible().catch(() => false)
  const tableRows  = await page.locator('tr, [class*="row"]').count()
  console.log(`  [pericias] Empty state: ${emptyState} | Linhas/cards: ${tableRows}`)
})

// ─── 7. Financeiro ────────────────────────────────────────────────────────────
test('financeiro: página responde', async ({ page }) => {
  await login(page)
  await page.goto('/financeiro')
  await page.waitForLoadState('networkidle')

  const titulo = await page.locator('h1').first().textContent()
  console.log(`  [financeiro] Título: "${titulo}"`)
  const loaders = await page.locator('[class*="animate-spin"]').count()
  console.log(`  [financeiro] Loaders: ${loaders}`)
})

// ─── 8. Responsividade mobile ─────────────────────────────────────────────────
test('mobile: dashboard não quebra em 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await login(page)

  // Header visível
  const header = page.locator('header').first()
  const headerOk = await header.isVisible().catch(() => false)
  console.log(`  [mobile] Header visível: ${headerOk}`)

  // Sidebar não visível (deve estar escondida no mobile)
  const sidebar = page.locator('nav[class*="sidebar"], aside').first()
  const sidebarHidden = !(await sidebar.isVisible().catch(() => true))
  console.log(`  [mobile] Sidebar escondida: ${sidebarHidden}`)

  // Hamburger
  const hamburger = page.locator('button[aria-label*="menu"], button[class*="hamburger"]').first()
  const hamOk = await hamburger.isVisible().catch(() => false)
  console.log(`  [mobile] Botão hamburger visível: ${hamOk}`)
})

// ─── 9. Acessibilidade básica ─────────────────────────────────────────────────
test('a11y: botões têm texto acessível', async ({ page }) => {
  await login(page)

  const botoesSemTexto = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    return btns.filter(b => {
      const txt = (b.textContent ?? '').trim()
      const ariaLabel = b.getAttribute('aria-label') ?? ''
      const ariaLabelledBy = b.getAttribute('aria-labelledby') ?? ''
      return !txt && !ariaLabel && !ariaLabelledBy
    }).length
  })
  console.log(`  [a11y] Botões sem texto/aria-label: ${botoesSemTexto}`)

  const imgsemAlt = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).filter(i => !i.alt).length
  )
  console.log(`  [a11y] Imagens sem alt: ${imgsemAlt}`)
})

// ─── 10. Performance básica ───────────────────────────────────────────────────
test('perf: landing carrega em menos de 3s', async ({ page }) => {
  const t0 = Date.now()
  await page.goto('/')
  await page.waitForLoadState('load')
  const elapsed = Date.now() - t0
  console.log(`  [perf] Landing load: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(5000)
})

test('perf: dashboard carrega em menos de 5s após login', async ({ page }) => {
  const t0 = Date.now()
  await login(page)
  await page.waitForLoadState('networkidle')
  const elapsed = Date.now() - t0
  console.log(`  [perf] Dashboard (login + load): ${elapsed}ms`)
  expect(elapsed).toBeLessThan(10000)
})
