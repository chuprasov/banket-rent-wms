import type { ReactNode } from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface AuthUser {
    name?: string
    email?: string
    [key: string]: unknown
}

interface Note {
    title?: string
    createdAt: string
    [key: string]: unknown
}

interface AuthContextValue {
    token: string | null
    user: AuthUser | null
    isLoggedIn: boolean
    isLoading: boolean
    notes: Note[]
    isNotesLoading: boolean
    loadNotes: () => Promise<void>
    loginWithEmail: (email: string, password: string) => Promise<void>
    registerInit: (name: string, email: string, password: string) => Promise<void>
    registerConfirm: (email: string, code: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = "https://notepad-njs.fcqdaqp.online/api/v2"

const routes = {
    login: `${API_URL}/login`,
    registerInit: `${API_URL}/register-init`,
    registerConfirm: `${API_URL}/register-confirm`,
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [notes, setNotes] = useState<Note[]>([])
    const [isNotesLoading, setIsNotesLoading] = useState(false)

    const checkToken = () => {
        return localStorage.getItem("token")
    }

    useEffect(() => {
        const initAuth = () => {
            try {
                const savedToken = localStorage.getItem("token")
                const savedUser = localStorage.getItem("user")

                if (savedToken && savedUser) {
                    setToken(savedToken)
                    setUser(JSON.parse(savedUser))
                    setIsLoggedIn(true)
                }
            } catch (error) {
                console.error("[AUTH ERROR] Failed to parse auth data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [])

    const saveAuthData = (newToken: string, newUser: AuthUser) => {
        localStorage.setItem("token", newToken)
        localStorage.setItem("user", JSON.stringify(newUser))
        setToken(newToken)
        setUser(newUser)
        setIsLoggedIn(true)
    }

    const loadNotes = async () => {
        setIsNotesLoading(true)

        const userToken = token || checkToken()
        if (!userToken) {
            setIsNotesLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_URL}/notes`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) throw new Error(`Server Error: ${response.status}`)

            const apiNotes: Note[] = await response.json()

            const sortedNotes = (Array.isArray(apiNotes) ? apiNotes : [])
                .map((note) => ({
                    ...note,
                    createdAt: note.createdAt || new Date().toISOString(),
                }))
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )

            setNotes(sortedNotes)
        } catch (err) {
            console.warn("Server unavailable", err instanceof Error ? err.message : String(err))
        } finally {
            setIsNotesLoading(false)
        }
    }

    const loginWithEmail = async (email: string, password: string) => {
        try {
            const response = await fetch(routes.login, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            const text = await response.text()
            const data = text ? JSON.parse(text) : {}

            if (!response.ok) {
                throw new Error(data.message || "Email login failed")
            }

            saveAuthData(data.token, data.user)
        } catch (error) {
            console.error("[AUTH ERROR] Email login failed:", error)
            throw error
        }
    }

    const registerInit = async (name: string, email: string, password: string) => {
        try {
            const response = await fetch(routes.registerInit, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            })

            const text = await response.text()
            const data = text ? JSON.parse(text) : {}

            if (!response.ok) {
                throw new Error(data.message || "Registration init failed")
            }
        } catch (error) {
            console.error("[AUTH ERROR] Registration init failed:", error)
            throw error
        }
    }

    const registerConfirm = async (email: string, code: string) => {
        try {
            const response = await fetch(routes.registerConfirm, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            })

            const text = await response.text()
            const data = text ? JSON.parse(text) : {}

            if (!response.ok) {
                throw new Error(data.message || "OTP verification failed")
            }

            saveAuthData(data.token, data.user)
        } catch (error) {
            console.error("[AUTH ERROR] Registration confirm failed:", error)
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setUser(null)
        setIsLoggedIn(false)
        setNotes([])
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isLoggedIn,
                isLoading,
                notes,
                isNotesLoading,
                loadNotes,
                loginWithEmail,
                registerInit,
                registerConfirm,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}