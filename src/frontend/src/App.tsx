import { useState } from 'preact/hooks'
import { useAuth } from './hooks/useAuth'
import { Header } from './components/Header'
import { MasterKeyModal } from './components/MasterKeyModal'
import { PublicDashboard } from './pages/PublicDashboard'
import { AdminDashboard } from './pages/AdminDashboard'

export function App() {
  const { token, isAdmin, verifying, login, logout } = useAuth()
  const [wantAdmin, setWantAdmin] = useState(false)
  const [search, setSearch] = useState('')

  const showAdmin = isAdmin || wantAdmin

  return (
    <div className="min-h-screen">
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={() => {
          if (isAdmin) {
            setWantAdmin((v) => !v)
          } else {
            setWantAdmin(true)
          }
        }}
        onLogout={logout}
        search={search}
        onSearchChange={setSearch}
      />

      {verifying ? (
        <main className="mx-auto max-w-2xl p-4 text-center text-slate-500">
          Verificando sesión…
        </main>
      ) : showAdmin && isAdmin ? (
        <AdminDashboard token={token as string} search={search} />
      ) : (
        <PublicDashboard search={search} />
      )}

      {wantAdmin && !isAdmin && !verifying && (
        <MasterKeyModal
          onCancel={() => setWantAdmin(false)}
          onSubmit={async (masterKey) => {
            await login(masterKey)
            setWantAdmin(false)
          }}
        />
      )}
    </div>
  )
}