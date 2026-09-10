import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { Header } from "@/components/Header"
import { EquipmentCatalog } from "@/components/EquipmentCatalog"

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
          <main className="container mx-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<EquipmentCatalog />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}