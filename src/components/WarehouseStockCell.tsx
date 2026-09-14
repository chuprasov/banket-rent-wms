import { useId, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { catalogRequest } from "@/lib/catalog-api"

interface Props {
    equipmentId: number
    equipmentName: string
    warehouse: { id: number; name: string }
    quantity: number
    token: string | null
}

export function WarehouseStockCell({ equipmentId, equipmentName, warehouse, quantity, token }: Props) {
    const [value, setValue] = useState(String(quantity))
    const [saved, setSaved] = useState(quantity)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const submitting = useRef(false)
    const errorId = useId()
    const changed = value !== String(saved)

    async function save() {
        if (submitting.current || !changed) return
        const quantity = Number(value)
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(quantity) || quantity > 2147483647) {
            setError("Введите целое число от 0 до 2147483647")
            return
        }
        submitting.current = true
        setBusy(true)
        setError(null)
        setSuccess(false)
        try {
            await catalogRequest(`catalog-equipment/${equipmentId}/warehouses/${warehouse.id}`, token, "PATCH", { quantity })
            setSaved(quantity)
            setValue(String(quantity))
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось сохранить остаток")
        } finally {
            submitting.current = false
            setBusy(false)
        }
    }

    return (
        <div className="w-20 space-y-1">
            <div className="relative">
                <Input
                    type="number"
                    min={0}
                    max={2147483647}
                    step={1}
                    required
                    value={value}
                    readOnly={busy}
                    aria-label={`Остаток: ${equipmentName}, ${warehouse.name}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                    className="h-8 w-full px-1 text-right"
                    onChange={(event) => { setValue(event.target.value); setError(null); setSuccess(false) }}
                    onBlur={() => { void save() }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") { event.preventDefault(); void save() }
                        if (event.key === "Escape" && !busy) { setValue(String(saved)); setError(null); setSuccess(false) }
                    }}
                />
                {busy && <Loader2 className="absolute left-1 top-2 h-4 w-4 animate-spin bg-card" aria-label="Сохранение" />}
            </div>
            {error && <p id={errorId} role="alert" className="whitespace-normal break-words text-xs text-destructive">{error}</p>}
            {success && <p role="status" className="text-xs text-muted-foreground">Сохранено</p>}
        </div>
    )
}
