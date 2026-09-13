export async function catalogRequest(
    path: string,
    token: string | null,
    method: "POST" | "PATCH" | "DELETE",
    body?: Record<string, string | number | null>,
) {
    if (!token) throw new Error("Войдите в аккаунт повторно")
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/${path}`, {
        method,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    if (response.ok) return

    const result = await response.json().catch(() => null)
    if (response.status === 401) throw new Error("Сессия истекла. Войдите в аккаунт повторно")
    if (response.status === 403) throw new Error("Недостаточно прав для этого действия")
    if (response.status === 404) throw new Error("Запись не найдена. Обновите список")
    if (response.status === 409) throw new Error("Запись используется в других документах и не может быть удалена")
    const errors = result?.errors && typeof result.errors === "object"
        ? Object.values(result.errors).flat().filter((value): value is string => typeof value === "string")
        : []
    throw new Error(errors.length ? errors.join("\n") : result?.message || "Не удалось выполнить действие")
}
