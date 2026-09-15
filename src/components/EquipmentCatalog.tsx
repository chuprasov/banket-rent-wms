import { useCallback, useEffect, useRef, useState } from "react"
import { Search, Loader2, ArrowUp, ArrowDown, ArrowUpDown, Trash2, Columns3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WarehouseStockCell } from "@/components/WarehouseStockCell"
import { CatalogRecordDialog } from "@/components/CatalogRecordDialog"
import { catalogRequest } from "@/lib/catalog-api"
import { useAuth } from "@/context/AuthContext"
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
    rent_price: string | null
    balance: number | null
    warehouses: { id: number; quantity: number }[]
    update_date: string
}

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

interface CatalogCategory {
    id: number
    name: string | null
    code: string | null
    is_hidden: boolean
}

const API_URL = import.meta.env.VITE_API_URL
const COLUMN_VISIBILITY_KEY = "equipment-table-hidden-columns"

const sortFields = [
    { key: "name", label: "Наименование", className: "sticky left-0 z-20 w-[200px] bg-muted shadow-[1px_0_0_var(--border)]" },
    { key: "id", label: "Артикул" },
    { key: "code", label: "Код" },
    { key: "category_id", label: "ID категории" },
    { key: "category_name", label: "Категория" },
    { key: "rent_price", label: "Цена аренды", className: "text-right" },
    { key: "balance", label: "Общее количество", className: "text-center" },
    { key: "update_date", label: "Обновлено", className: "w-[180px] whitespace-nowrap" },
] as const
type SortField = typeof sortFields[number]["key"]

export function EquipmentCatalog() {
    const { token } = useAuth()
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([])
    const [categories, setCategories] = useState<CatalogCategory[]>([])
    const [pagination, setPagination] = useState<PaginationMeta | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [search, setSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editor, setEditor] = useState<{ mode: "create" | "edit" | "delete"; item?: Equipment } | null>(null)
    const [sort, setSort] = useState<{ field: SortField; direction: "asc" | "desc" }>({ field: "id", direction: "desc" })
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(COLUMN_VISIBILITY_KEY) ?? "[]")
            return Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : []
        } catch {
            return []
        }
    })
    const requestVersion = useRef(0)

    useEffect(() => {
        localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(hiddenColumns))
    }, [hiddenColumns])

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchQuery.trim()), 500)
        return () => window.clearTimeout(timer)
    }, [searchQuery])

    const loadEquipment = useCallback(async function loadPage(page = 1) {
        const version = ++requestVersion.current
        try {
            setIsLoading(true)
            setError(null)

            if (!token) {
                throw new Error("Для просмотра оборудования необходимо войти в аккаунт")
            }

            const query = new URLSearchParams({
                page: String(page),
                per_page: "50",
                sort_by: sort.field,
                sort_direction: sort.direction,
            })
            if (search) query.set("search", search)

            const response = await fetch(
              `${API_URL}/api/catalog-equipment?${query.toString()}`,
              {
                  headers: {
                      Accept: "application/json",
                      Authorization: `Bearer ${token}`,
                  },
              }
            )

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Сессия истекла. Войдите в аккаунт повторно")
                }
                if (response.status === 403) {
                    throw new Error("Нет доступа к каталогу оборудования")
                }
                throw new Error("Не удалось загрузить оборудование")
            }

            const warehouseResponse = await fetch(`${API_URL}/api/warehouses`, {
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            })
            if (!warehouseResponse.ok) throw new Error("Не удалось загрузить склады. Обновите список.")
            const categoryResponse = await fetch(`${API_URL}/api/catalog-categories`, {
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            })
            if (!categoryResponse.ok) throw new Error("Не удалось загрузить категории. Обновите список.")
            const warehouseResult = await warehouseResponse.json()
            const categoryResult = await categoryResponse.json()
            const result = await response.json()
            if (version !== requestVersion.current) return

            if (page > 1 && result.data.length === 0) {
                await loadPage(Math.max(1, Math.min(page - 1, result.meta.last_page)))
                return
            }

            setWarehouses(warehouseResult.data)
            setCategories(categoryResult.data)
            setEquipment(result.data)
            setPagination(result.meta)
        } catch (err) {
            if (version !== requestVersion.current) return
            console.error(err)

            setError(
              err instanceof Error
                ? err.message
                : "Произошла ошибка при загрузке данных"
            )
        } finally {
            if (version === requestVersion.current) setIsLoading(false)
        }
    }, [token, sort, search])

    useEffect(() => {
        void loadEquipment()
        return () => { requestVersion.current++ }
    }, [loadEquipment])

    const toggleSort = (field: SortField) => {
        setSort((current) => ({
            field,
            direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
        }))
    }

    const isColumnVisible = (key: string) => !hiddenColumns.includes(key)
    const toggleColumn = (key: string) => {
        setHiddenColumns((current) => current.includes(key)
            ? current.filter((column) => column !== key)
            : [...current, key])
    }
    const visibleColumnCount = 1
        + sortFields.filter((field) => field.key !== "name" && field.key !== "category_id" && isColumnVisible(field.key)).length
        + warehouses.filter((warehouse) => isColumnVisible(`warehouse:${warehouse.id}`)).length
        + (isColumnVisible("actions") ? 1 : 0)

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
      <div className="w-full min-w-0 space-y-6 px-3 py-6 sm:px-6 md:px-10 md:py-10">
          <div>
              {/*<h1 className="text-3xl font-serif font-bold tracking-tight">
                  Каталог оборудования
              </h1>*/}

              <p className="text-muted-foreground mt-1">
                  Каталог оборудования
              </p>
          </div>

          <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                type="search"
                placeholder="Поиск оборудования"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={255}
                className="pl-9 bg-background border-border"
              />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
              <Button onClick={() => setEditor({ mode: "create" })}>Добавить</Button>
              <details className="relative">
                  <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted [&::-webkit-details-marker]:hidden">
                      <Columns3 className="size-4" aria-hidden="true" />
                      Столбцы
                  </summary>
                  <div className="absolute right-0 z-40 mt-2 max-h-[min(28rem,70vh)] min-w-56 overflow-y-auto rounded-lg border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg">
                      <p className="px-2 pb-2 font-medium">Видимые столбцы</p>
                      {sortFields.filter((field) => field.key !== "name" && field.key !== "category_id").map((field) => (
                          <label key={field.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                              <input type="checkbox" checked={isColumnVisible(field.key)} onChange={() => toggleColumn(field.key)} />
                              {field.label}
                          </label>
                      ))}
                      {warehouses.map((warehouse) => (
                          <label key={warehouse.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                              <input type="checkbox" checked={isColumnVisible(`warehouse:${warehouse.id}`)} onChange={() => toggleColumn(`warehouse:${warehouse.id}`)} />
                              Склад: {warehouse.name}
                          </label>
                      ))}
                      <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                          <input type="checkbox" checked={isColumnVisible("actions")} onChange={() => toggleColumn("actions")} />
                          Удаление
                      </label>
                      <Button type="button" variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setHiddenColumns([])}>
                          Показать все
                      </Button>
                  </div>
              </details>
          </div>
          {/*<div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                  Сортировать по
                  <select
                      className="rounded-md border border-border bg-background px-3 py-2"
                      value={sort.field}
                      onChange={(event) => setSort({ field: event.target.value as SortField, direction: "asc" })}
                  >
                      {sortFields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                  </select>
              </label>
              <Button variant="outline" onClick={() => toggleSort(sort.field)}>
                  {sort.direction === "asc" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
                  {sort.direction === "asc" ? "По возрастанию" : "По убыванию"}
              </Button>
          </div>*/}
          {editor && (
              <CatalogRecordDialog
                  title={editor.mode === "delete" ? "Удаление оборудования" : editor.mode === "edit" ? "Редактирование оборудования" : "Новое оборудование"}
                  deleteName={editor.mode === "delete" ? editor.item!.name : undefined}
                  fields={[
                      ...(editor.mode === "edit" ? [{ name: "id", label: "Артикул", readOnly: true }] : []),
                      { name: "name", label: "Название", required: true, maxLength: 255 },
                      { name: "code", label: "Код", required: true, maxLength: 80 },
                      {
                          name: "category_id",
                          label: "Категория",
                          type: "select",
                          options: [
                              { value: "", label: "Без категории" },
                              ...categories.map((category) => ({
                                  value: String(category.id),
                                  label: `${category.name || category.code || `Категория ${category.id}`}${category.is_hidden ? " (скрыта)" : ""}`,
                              })),
                          ],
                      },
                      { name: "rent_price", label: "Цена аренды, руб.", type: "number", min: 0, step: "0.01" },
                  ]}
                  initialValues={{ id: editor.item ? String(editor.item.id).padStart(6, "0") : "", name: editor.item?.name ?? "", code: editor.item?.code ?? "", category_id: editor.item?.category_id?.toString() ?? "", rent_price: editor.item?.rent_price ?? "" }}
                  onClose={() => setEditor(null)}
                  onSubmit={async (values) => {
                      const path = editor.mode === "create" ? "catalog-equipment" : `catalog-equipment/${editor.item!.id}`
                      await catalogRequest(path, token, editor.mode === "create" ? "POST" : editor.mode === "edit" ? "PATCH" : "DELETE",
                          editor.mode === "delete" ? undefined : {
                              name: values.name,
                              code: values.code,
                              category_id: values.category_id ? Number(values.category_id) : null,
                              rent_price: values.rent_price || null,
                          })
                      if (editor.mode === "create") setSearchQuery("")
                      await loadEquipment(editor.mode === "create" ? 1 : pagination?.current_page ?? 1)
                  }}
              />
          )}

          {/*<p className="text-sm text-muted-foreground">
              Остаток сохраняется автоматически при выходе из ячейки или по Enter.
              {warehouses.length === 0 && !isLoading && !error && " Сначала добавьте склад в настройках."}
          </p>*/}
          <div className="w-full min-w-0 border border-border rounded-lg overflow-hidden bg-card">
              <Table className="min-w-max">
                  <TableHeader className="bg-muted/50">
                      <TableRow>
                          {sortFields.filter((field) => field.key !== "category_id" && (field.key === "name" || isColumnVisible(field.key))).map((field) => (
                              <TableHead
                                  key={field.key}
                                  className={"className" in field ? field.className : undefined}
                                  aria-sort={sort.field === field.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                              >
                                  <button
                                      type="button"
                                      className="inline-flex items-center gap-2 cursor-pointer rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                                      onClick={() => toggleSort(field.key)}
                                      aria-label={`${field.label}: сортировать по ${sort.field === field.key && sort.direction === "asc" ? "убыванию" : "возрастанию"}`}
                                  >
                                      {field.label}
                                      {sort.field !== field.key ? <ArrowUpDown className="h-4 w-4" aria-hidden="true" /> : sort.direction === "asc" ? <ArrowUp className="h-4 w-4" aria-hidden="true" /> : <ArrowDown className="h-4 w-4" aria-hidden="true" />}
                                  </button>
                              </TableHead>
                          ))}
                          {warehouses.filter((warehouse) => isColumnVisible(`warehouse:${warehouse.id}`)).map((warehouse) => (
                              <TableHead key={warehouse.id} className="w-[88px] px-1 text-center">
                                  <div className="w-20 whitespace-normal break-words py-1" title={warehouse.name}>{warehouse.name}</div>
                              </TableHead>
                          ))}
                          {isColumnVisible("actions") && <TableHead className="w-10 px-1"><span className="sr-only">Действия</span></TableHead>}
                      </TableRow>
                  </TableHeader>

                  <TableBody>
                      {isLoading ? (
                        <TableRow>
                            <TableCell
                              colSpan={visibleColumnCount}
                              className="text-center py-12"
                            >
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Загрузка данных...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                            <TableCell
                              colSpan={visibleColumnCount}
                              className="text-center py-8 text-destructive"
                            >
                                {error}
                            </TableCell>
                        </TableRow>
                      ) : equipment.length > 0 ? (
                        equipment.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-muted/30"
                          >
                              <TableCell className="sticky left-0 z-10 bg-card shadow-[1px_0_0_var(--border)]">
                                  <button
                                      type="button"
                                      className="block w-[200px] sm:w-[320px] whitespace-normal break-words text-left font-medium text-foreground cursor-pointer hover:text-primary hover:underline rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                                      onClick={() => setEditor({ mode: "edit", item })}
                                      title="Редактировать оборудование"
                                  >
                                      {item.name}
                                  </button>
                              </TableCell>
                              {isColumnVisible("id") && <TableCell className="font-mono tabular-nums">
                                  {String(item.id).padStart(6, "0")}
                              </TableCell>}

                              {isColumnVisible("code") && <TableCell>
                                  <div className="text-xs text-muted-foreground font-mono">
                                      {item.code}
                                  </div>
                              </TableCell>}

                              {isColumnVisible("category_name") && <TableCell className="text-muted-foreground">
                                  {item.category_name ?? "—"}
                              </TableCell>}

                              {isColumnVisible("rent_price") && <TableCell className="text-right font-semibold whitespace-nowrap">
                                  {item.rent_price == null ? "—" : Number(
                                    item.rent_price
                                  ).toLocaleString("ru-RU")}{" "}
                                  руб.
                              </TableCell>}


                              {isColumnVisible("balance") && <TableCell className="text-center">{item.balance ?? "—"}</TableCell>}
                              {isColumnVisible("update_date") && <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {item.update_date
                                    ? new Date(
                                      item.update_date
                                    ).toLocaleString("ru-RU")
                                    : "—"}
                              </TableCell>}
                              {warehouses.filter((warehouse) => isColumnVisible(`warehouse:${warehouse.id}`)).map((warehouse) => (
                                  <TableCell key={warehouse.id} className="w-[88px] px-1 align-top">
                                      <WarehouseStockCell
                                          key={`${item.id}-${warehouse.id}-${item.warehouses.find((stock) => stock.id === warehouse.id)?.quantity ?? 0}`}
                                          equipmentId={item.id}
                                          equipmentName={item.name}
                                          warehouse={warehouse}
                                          quantity={item.warehouses.find((stock) => stock.id === warehouse.id)?.quantity ?? 0}
                                          token={token}
                                      />
                                  </TableCell>
                              ))}
                              {isColumnVisible("actions") && <TableCell className="w-10 px-1">
                                  <div className="flex justify-center">
                                      <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          className="text-destructive hover:text-destructive"
                                          title="Удалить оборудование"
                                          aria-label={`Удалить ${item.name}`}
                                          onClick={() => setEditor({ mode: "delete", item })}
                                      >
                                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                                      </Button>
                                  </div>
                              </TableCell>}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell
                              colSpan={visibleColumnCount}
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
                      disabled={isLoading || pagination.current_page === 1}
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
                            disabled={isLoading}
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
                        isLoading || pagination.current_page ===
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
