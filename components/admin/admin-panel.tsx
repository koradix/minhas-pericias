'use client'

import { useState, useTransition } from 'react'
import {
  Users,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { changeUserPassword, executeTursoSql } from '@/lib/actions/admin'

interface UserRow {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminPanel({ users }: { users: UserRow[] }) {
  // ── Password change ────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwResult, setPwResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPendingPw, startPwTransition] = useTransition()

  function handleSelectUser(u: UserRow) {
    setSelectedUser(u)
    setNewPassword('')
    setPwResult(null)
    setShowPw(false)
  }

  function handleChangePassword() {
    if (!selectedUser || !newPassword) return
    setPwResult(null)
    startPwTransition(async () => {
      const res = await changeUserPassword(selectedUser.id, newPassword)
      if (res.ok) {
        setPwResult({ ok: true, msg: `Senha de ${selectedUser.email} alterada!` })
        setNewPassword('')
        setSelectedUser(null)
      } else {
        setPwResult({ ok: false, msg: res.error ?? 'Erro desconhecido' })
      }
    })
  }

  // ── SQL runner ─────────────────────────────────────────────────────────────
  const [sql, setSql] = useState('')
  const [sqlResult, setSqlResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPendingSql, startSqlTransition] = useTransition()

  function handleRunSql() {
    if (!sql.trim()) return
    setSqlResult(null)
    startSqlTransition(async () => {
      const res = await executeTursoSql(sql)
      setSqlResult({ ok: res.ok, msg: res.message })
    })
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <Badge variant={u.role === 'perito' ? 'info' : 'secondary'} className="flex-shrink-0">
                {u.role}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 gap-1.5"
                onClick={() => handleSelectUser(u)}
              >
                <KeyRound className="h-3 w-3" />
                Alterar senha
              </Button>
            </div>
          ))}

          {/* Password change form */}
          {selectedUser && (
            <div className="rounded-xl border border-lime-200 bg-lime-50 p-4 space-y-3 mt-2">
              <p className="text-sm font-semibold text-slate-800">
                Alterar senha de{' '}
                <span className="text-lime-700">{selectedUser.email}</span>
              </p>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  placeholder="Nova senha (mínimo 6 caracteres)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setSelectedUser(null)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold"
                  onClick={handleChangePassword}
                  disabled={!newPassword || newPassword.length < 6 || isPendingPw}
                >
                  {isPendingPw ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Salvar senha'
                  )}
                </Button>
              </div>
            </div>
          )}

          {pwResult && (
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                pwResult.ok
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {pwResult.ok ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {pwResult.msg}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SQL Runner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            SQL Runner
            <span className="ml-1 text-xs font-normal text-slate-400">Turso / SQLite</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            Execute SQL direto no banco de produção. Statements ignoram erros de coluna/tabela
            já existente.
          </p>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={`ALTER TABLE "Checkpoint" ADD COLUMN "pericoId" TEXT;\nCREATE TABLE IF NOT EXISTS "VaraContato" (...);\nUPDATE "User" SET "passwordHash" = '...' WHERE "email" = '...';`}
            rows={10}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setSql(''); setSqlResult(null) }}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold"
              onClick={handleRunSql}
              disabled={!sql.trim() || isPendingSql}
            >
              {isPendingSql ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Executar SQL'
              )}
            </Button>
          </div>

          {sqlResult && (
            <div
              className={`flex items-start gap-2 rounded-lg px-4 py-3 ${
                sqlResult.ok
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {sqlResult.ok ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              )}
              <pre className="text-xs whitespace-pre-wrap break-words">{sqlResult.msg}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
