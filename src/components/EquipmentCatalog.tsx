import { useEffect, useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Equipment {
    id: number
    name: string
    code: string
    category_id: number | null
    category_name: string | null
    rent_price: string
    balance: number | null
    update_date: string
}

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

const API_URL = import.meta.env.VITE_API_URL

export function EquipmentCatalog() {
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [pagination, setPagination] = useState<PaginationMeta | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadEquipment()
    }, [])

    const loadEquipment = async (page = 1) => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(
              `${API_URL}/api/catalog-equipment?page=${page}&per_page=50`/*, {
                  method: "GET",
                  headers: {
                      Authorization: `Bearer ${userToken}`,
                      "Content-Type": "application/json",
                  },
              }*/
            )

            if (!response.ok) {
                throw new Error("Не удалось загрузить оборудование")
            }

            const result = await response.json()

            setEquipment(result.data)
            setPagination(result.meta)
        } catch (err) {
            console.error(err)

            setError(
              err instanceof Error
                ? err.message
                : "Произошла ошибка при загрузке данных"
            )
        } finally {
            setIsLoading(false)
        }
    }

    const filteredEquipment = equipment.filter((item) => {
        const query = searchQuery.toLowerCase().trim()

        if (!query) {
            return true
        }

        return (
          item.name?.toLowerCase().includes(query) ||
          item.code?.toLowerCase().includes(query)
        )
    })

    const getPageNumbers = (
      currentPage: number,
      lastPage: number
    ): (number | "...")[] => {
        const pages: (number | "...")[] = []

        if (lastPage <= 7) {
            for (let i = 1; i <= lastPage; i++) {
                pages.push(i)
            }

            return pages
        }

        pages.push(1)

        if (currentPage > 4) {
            pages.push("...")
        }

        const start = Math.max(2, currentPage - 2)
        const end = Math.min(lastPage - 1, currentPage + 2)

        for (let i = start; i <= end; i++) {
            pages.push(i)
        }

        if (currentPage < lastPage - 3) {
            pages.push("...")
        }

        pages.push(lastPage)

        return pages
    }

    return (
      <div className="p-6 md:p-10 space-y-6 max-w-none mx-auto">
          <div>
              {/*<h1 className="text-3xl font-serif font-bold tracking-tight">
                  Каталог оборудования
              </h1>*/}

              <p className="text-muted-foreground mt-1">
                  Список оборудования
              </p>
          </div>

          <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                type="search"
                placeholder="Поиск оборудования"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border"
              />
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card">
              <Table>
                  <TableHeader className="bg-muted/50">
                      <TableRow>
                          <TableHead className="w-[350px]">
                              Наименование
                          </TableHead>

                          <TableHead>
                              Код
                          </TableHead>

                          <TableHead>
                              Категория
                          </TableHead>

                          <TableHead className="text-right">
                              Цена аренды
                          </TableHead>

                          <TableHead className="text-center">
                              Остаток
                          </TableHead>

                          <TableHead className="w-[180px] whitespace-nowrap">
                              Обновлено
                          </TableHead>
                      </TableRow>
                  </TableHeader>

                  <TableBody>
                      {isLoading ? (
                        <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-12"
                            >
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>
                                            Загрузка данных...
                                        </span>
                                </div>
                            </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-destructive"
                            >
                                {error}
                            </TableCell>
                        </TableRow>
                      ) : filteredEquipment.length > 0 ? (
                        filteredEquipment.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-muted/30"
                          >
                              <TableCell>
                                  <div className="font-medium text-foreground">
                                      {item.name}
                                  </div>
                              </TableCell>

                              <TableCell>
                                  <div className="text-xs text-muted-foreground font-mono">
                                      {item.code}
                                  </div>
                              </TableCell>

                              <TableCell className="text-muted-foreground">
                                  {item.category_name ?? "—"}
                              </TableCell>

                              <TableCell className="text-right font-semibold whitespace-nowrap">
                                  {Number(
                                    item.rent_price
                                  ).toLocaleString("ru-RU")}{" "}
                                  руб.
                              </TableCell>

                              <TableCell className="text-center">
                                  {item.balance ?? "—"}
                              </TableCell>

                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {item.update_date
                                    ? new Date(
                                      item.update_date
                                    ).toLocaleString("ru-RU")
                                    : "—"}
                              </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                                Ничего не найдено
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>

          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Всего записей: {pagination.total}
                </div>

                <div className="flex items-center gap-1">
                    {/* Назад */}
                    <button
                      disabled={pagination.current_page === 1}
                      onClick={() =>
                        loadEquipment(pagination.current_page - 1)
                      }
                      className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                        ‹
                    </button>

                    {/* Номера страниц */}
                    {getPageNumbers(
                      pagination.current_page,
                      pagination.last_page
                    ).map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 py-2 text-muted-foreground"
                          >
                        ...
                    </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => loadEquipment(page)}
                            className={`min-w-[40px] px-3 py-2 border rounded-md ${
                              page === pagination.current_page
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                              {page}
                          </button>
                        )
                    )}

                    {/* Вперёд */}
                    <button
                      disabled={
                        pagination.current_page ===
                        pagination.last_page
                      }
                      onClick={() =>
                        loadEquipment(pagination.current_page + 1)
                      }
                      className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                        ›
                    </button>
                </div>
            </div>
          )}
      </div>
    )
}