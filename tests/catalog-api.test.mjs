import { readFile } from "node:fs/promises"
import { stripTypeScriptTypes } from "node:module"
import assert from "node:assert/strict"
import { test } from "node:test"

const source = await readFile(new URL("../src/lib/catalog-api.ts", import.meta.url), "utf8")
const script = stripTypeScriptTypes(source.replace("import.meta.env.VITE_API_URL", '"https://api.example.test"'))
const { catalogRequest } = await import(`data:text/javascript;base64,${Buffer.from(script).toString("base64")}`)

test("CRUD requests and API failures", async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch")
    for (const [method, path, body, status] of [
        ["POST", "warehouses", { name: "Склад", address: "Москва" }, 201],
        ["PATCH", "catalog-equipment/3", { name: "Стул", code: "001", rent_price: "0", balance: 0 }, 200],
        ["DELETE", "warehouses/1", undefined, 204],
    ]) {
        fetchMock.mock.mockImplementation(async (url, options) => {
            assert.equal(url, `https://api.example.test/api/${path}`)
            assert.equal(options.method, method)
            assert.equal(options.headers.Authorization, "Bearer test-token")
            assert.equal(options.headers.Accept, "application/json")
            assert.equal(options.body, body ? JSON.stringify(body) : undefined)
            assert.equal(options.headers["Content-Type"], body ? "application/json" : undefined)
            return new Response(null, { status })
        })
        await catalogRequest(path, "test-token", method, body)
    }

    const callsBefore = fetchMock.mock.callCount()
    await assert.rejects(catalogRequest("warehouses", null, "POST", {}), /Войдите/)
    assert.equal(fetchMock.mock.callCount(), callsBefore)

    for (const [status, response, message] of [
        [401, {}, /Сессия истекла/],
        [403, {}, /Недостаточно прав/],
        [404, {}, /Запись не найдена/],
        [409, {}, /используется в других документах/],
        [422, { errors: { name: ["Название обязательно"], code: ["Код уже занят"] } }, /Название обязательно\nКод уже занят/],
        [500, "not JSON", /Не удалось выполнить действие/],
    ]) {
        fetchMock.mock.mockImplementation(async () => new Response(
            typeof response === "string" ? response : JSON.stringify(response), { status },
        ))
        await assert.rejects(catalogRequest("warehouses/1", "test-token", "DELETE"), message)
    }
})
