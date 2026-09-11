import type { ReactNode } from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface AuthUser {
    login?: string
    name?: string
    email?: string
    [key: string]: unknown
}

interface AuthContextValue {
    token: string | null
    user: AuthUser | null
    isLoggedIn: boolean
    isLoading: boolean
    loginWithLogin: (login: string, password: string) => Promise<void>
    loginWithEmail: (email: string, password: string) => Promise<void>
    registerInit: (name: string, email: string, password: string) => Promise<void>
    registerConfirm: (email: string, code: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = import.meta.env.VITE_API_URL

const routes = {
    login: `${API_URL}/api/auth/login`,
    registerInit: `${API_URL}/register-init`,
    registerConfirm: `${API_URL}/register-confirm`,
    logout: `${API_URL}/api/auth/logout`,
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedToken = localStorage.getItem("token")
                const savedUser = localStorage.getItem("user")

                if (!savedToken) {
                    return
                }

                setToken(savedToken)
                if (savedUser) setUser(JSON.parse(savedUser))

                await checkAuth()
            } catch (error) {
                console.error("[AUTH ERROR] Failed to initialize auth:", error)

                localStorage.removeItem("token")
                localStorage.removeItem("user")

                setToken(null)
                setUser(null)
                setIsLoggedIn(false)
            } finally {
                setIsLoading(false)
            }
        }

        void initAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem("token")

        if (!token) {
            return
        }

        try {
            const response = await fetch(
              `${API_URL}/api/auth/me`,
              {
                  headers: {
                      Accept: "application/json",
                      Authorization: `Bearer ${token}`,
                  },
              }
            )

            if (!response.ok) {
                throw new Error("Unauthorized")
            }

            const user = await response.json()

            saveAuthData(token, user)
        } catch (error) {
            console.error("Auth check failed:", error)
            deleteAuthData()
        }
    }

    const saveAuthData = (newToken: string, newUser: AuthUser) => {
        localStorage.setItem("token", newToken)
        localStorage.setItem("user", JSON.stringify(newUser))
        setToken(newToken)
        setUser(newUser)
        setIsLoggedIn(true)
    }

    const deleteAuthData = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setUser(null)
        setIsLoggedIn(false)
    }

    const loginWithLogin = async (login: string, password: string) => {
        try {
            const response = await fetch(routes.login, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, password }),
            })

            const text = await response.text()
            const data = text ? JSON.parse(text) : {}

            if (!response.ok) {
                throw new Error(data.message || "Login failed")
            }

            saveAuthData(data.access_token, data.user)
        } catch (error) {
            console.error("[AUTH ERROR] Login failed:", error)
            throw error
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

    const logout = async () => {
        try {
            const response = await fetch(routes.logout, {
                method: "POST",
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            })

            const text = await response.text()
            const data = text ? JSON.parse(text) : {}

            if (!response.ok) {
                throw new Error(data.message || "Logout failed")
            }

            deleteAuthData()
        } catch (error) {
            console.error("[AUTH ERROR] Logout failed:", error)
            throw error
        }
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isLoggedIn,
                isLoading,
                loginWithLogin,
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
