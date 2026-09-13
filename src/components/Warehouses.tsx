import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Warehouse {
    id: number | string
    name: string
    address: string | null
    phone: string | null
}

const API_URL = import.meta.env.VITE_API_URL

export function Warehouses() {
    const { token } = useAuth()
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reload, setReload] = useState(0)

    useEffect(() => {
        const controller = new AbortController()

        const loadWarehouses = async () => {
            setIsLoading(true)
            setError(null)
            setWarehouses([])

            try {
                if (!token) {
                    throw new Error("Для просмотра складов необходимо войти в аккаунт")
                }

                const response = await fetch(`${API_URL}/api/warehouses`, {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                })

                if (response.status === 401) {
                    throw new Error("Сессия истекла. Войдите в аккаунт повторно")
                }
                if (response.status === 403) {
                    throw new Error("Нет доступа к справочнику складов")
                }
                if (!response.ok) {
                    throw new Error("Не удалось загрузить склады")
                }

                const result = await response.json()
                const items = Array.isArray(result) ? result : result?.data
                if (!Array.isArray(items) || !items.every((item) =>
                    item && (typeof item.id === "number" || typeof item.id === "string") &&
                    typeof item.name === "string" &&
                    (item.address == null || typeof item.address === "string") &&
                    (item.phone == null || typeof item.phone === "string")
                )) {
                    throw new Error("Сервер вернул некорректный список складов")
                }

                if (!controller.signal.aborted) setWarehouses(items)
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : "Не удалось загрузить склады")
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }

        void loadWarehouses()
        return () => controller.abort()
    }, [token, reload])

    return (
        <div className="p-6 md:p-10 space-y-6 max-w-none mx-auto">
            <h1 className="text-3xl font-serif font-bold tracking-tight">Настройка складов</h1>

            <div className="border border-border rounded-lg overflow-hidden bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Название</TableHead>
                            <TableHead>Адрес</TableHead>
                            <TableHead>Телефон</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12">
                                    <div role="status" className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Загрузка складов...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    <p role="alert" className="text-destructive mb-3">{error}</p>
                                    <Button variant="outline" onClick={() => setReload((value) => value + 1)}>
                                        Повторить загрузку
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : warehouses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    Склады не найдены
                                </TableCell>
                            </TableRow>
                        ) : warehouses.map((warehouse) => (
                            <TableRow key={warehouse.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{warehouse.name}</TableCell>
                                <TableCell className="whitespace-normal">{warehouse.address || "—"}</TableCell>
                                <TableCell>{warehouse.phone || "—"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
