import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Header } from "@/components/Header"
import { EquipmentCatalog } from "@/components/EquipmentCatalog"
import { Warehouses } from "@/components/Warehouses"

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <main className="container w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route element={<RequireAuth />}>
                <Route path="/catalog" element={<EquipmentCatalog />} />
                <Route path="/settings/warehouses" element={<Warehouses />} />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
