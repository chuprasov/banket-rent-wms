import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Header } from "@/components/Header"
import { EquipmentCatalog } from "@/components/EquipmentCatalog"
import { Warehouses } from "@/components/Warehouses"
import { NavigationMenu } from "@/components/NavigationMenu"

function RequireAuth() {
  const { isLoggedIn, isLoading } = useAuth()

  if (isLoading) {
    return <p role="status" className="p-8 text-muted-foreground">Проверка авторизации...</p>
  }

  return isLoggedIn ? <Outlet /> : <Navigate to="/" replace />
}

function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Главная страница</h1>
      <p className="text-muted-foreground mt-2">Добро пожаловать в Banket Rent</p>
    </div>
  )
}

function AppContent() {
  const { isLoggedIn, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex min-w-0 items-start">
        {!isLoading && isLoggedIn && (
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[175px] shrink-0 overflow-y-auto border-r border-border/40 bg-background px-2 py-4 md:block">
            <NavigationMenu />
          </aside>
        )}
        <main className="min-w-0 flex-1">
          <Routes>
            <Route path="/" element={isLoggedIn ? <Navigate to="/catalog" replace /> : <HomePage />} />
            <Route element={<RequireAuth />}>
              <Route path="/catalog" element={<EquipmentCatalog />} />
              <Route path="/settings/warehouses" element={<Warehouses />} />
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
