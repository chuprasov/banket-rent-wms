import { useRef, useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

export interface CatalogField {
    name: string
    label: string
    required?: boolean
    type?: "text" | "tel" | "number" | "select"
    maxLength?: number
    min?: number
    max?: number
    step?: string
    readOnly?: boolean
    options?: { value: string; label: string }[]
}

interface Props {
    title: string
    fields?: CatalogField[]
    initialValues?: Record<string, string>
    deleteName?: string
    onSubmit: (values: Record<string, string>) => Promise<void>
    onClose: () => void
}

export function CatalogRecordDialog({ title, fields = [], initialValues = {}, deleteName, onSubmit, onClose }: Props) {
    const [values, setValues] = useState(initialValues)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const submitting = useRef(false)
    const deleting = deleteName !== undefined

    async function submit(event: FormEvent) {
        event.preventDefault()
        if (submitting.current) return
        const trimmed = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]))
        if (!deleting && fields.some((field) => field.required && !trimmed[field.name])) {
            setError("Заполните обязательные поля")
            return
        }
        submitting.current = true
        setBusy(true)
        setError(null)
        try {
            await onSubmit(trimmed)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось сохранить изменения")
        } finally {
            submitting.current = false
            setBusy(false)
        }
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !submitting.current) onClose() }}>
            <DialogContent showCloseButton={!busy} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {deleting ? `Удалить «${deleteName}»? Это действие нельзя отменить.` : "Заполните данные и нажмите «Сохранить». Обязательные поля отмечены *."}
                </DialogDescription>
                <form onSubmit={submit} className="space-y-4">
                    {!deleting && fields.map((field) => (
                        <label key={field.name} className="block space-y-2">
                            <span>{field.label}{field.required ? " *" : ""}</span>
                            {field.type === "select" ? (
                                <select
                                    required={field.required}
                                    value={values[field.name] ?? ""}
                                    disabled={busy || field.readOnly}
                                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                                >
                                    {field.options?.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    type={field.type || "text"}
                                    required={field.required}
                                    maxLength={field.maxLength}
                                    min={field.min}
                                    max={field.max}
                                    step={field.step}
                                    readOnly={field.readOnly}
                                    value={values[field.name] ?? ""}
                                    disabled={busy}
                                    className={field.readOnly ? "bg-muted font-mono" : undefined}
                                    onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                                />
                            )}
                        </label>
                    ))}
                    {error && <p role="alert" className="text-destructive whitespace-pre-line">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Отмена</Button>
                        <Button type="submit" variant={deleting ? "destructive" : "default"} disabled={busy}>
                            {busy ? "Подождите..." : deleting ? "Удалить" : "Сохранить"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
