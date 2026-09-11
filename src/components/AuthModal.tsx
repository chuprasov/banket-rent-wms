import type { FormEvent } from "react"
import { useState, useEffect } from "react"
import { /*Mail,*/ Lock, User as UserIcon, KeyRound, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { loginWithLogin, /*loginWithEmail,*/ registerInit, registerConfirm } = useAuth()

    const [mode, setMode] = useState<"login" | "register" | "otp">("login")
    const [name, setName] = useState("")
    const [login, setLogin] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [otpCode, setOtpCode] = useState("")

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            setMode("login")
            setName("")
            setLogin("fingli")
            setEmail("")
            setPassword("")
            setOtpCode("")
            setError(null)
            setLoading(false)
        }
    }, [isOpen])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (mode === "otp") {
                await registerConfirm(email, otpCode)
                onClose()
            } else if (mode === "register") {
                await registerInit(name, email, password)
                setMode("otp")
            } else {
                await loginWithLogin(login, password)
                //await loginWithEmail(email, password)
                onClose()
            }
        } catch (err) {
            setError((err instanceof Error ? err.message : "") || "Произошла ошибка")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">
                        {mode === "otp"
                            ? "Подтверждение почты"
                            : mode === "register"
                                ? "Создание аккаунта"
                                : "Вход в аккаунт"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground">
                        {mode === "otp"
                            ? `Мы отправили 6-значный код на ${email}`
                            : mode === "register"
                                ? "Введите ваши данные для регистрации"
                                : "Введите логин и пароль для входа"}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {mode === "otp" && (
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="6-значный код"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                maxLength={6}
                                required
                                className="pl-9 text-center font-mono tracking-widest text-lg"
                            />
                        </div>
                    )}

                    {mode === "register" && (
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Имя и фамилия"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="pl-9"
                            />
                        </div>
                    )}

                    {mode !== "otp" && (
                        <>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder="Логин"
                                  value={login}
                                  onChange={(e) => setLogin(e.target.value)}
                                  required
                                  className="pl-9"
                                />
                                {/*<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Email адрес"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-9"
                                />*/}
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="Пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-9"
                                />
                            </div>
                        </>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "otp"
                            ? "Подтвердить код"
                            : mode === "register"
                                ? "Отправить код"
                                : "Войти"}
                    </Button>
                </form>

                <div className="text-center text-xs text-muted-foreground">
                    {mode === "otp" ? (
                        <button
                            type="button"
                            onClick={() => setMode("register")}
                            className="text-primary hover:underline font-medium cursor-pointer"
                        >
                            ← Назад к регистрации
                        </button>
                    ) : (
                        <div>
                            {mode === "register" ? "Уже есть аккаунт?" : "Еще нет аккаунта?"}{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null)
                                    setMode(mode === "register" ? "login" : "register")
                                }}
                                className="text-primary hover:underline font-medium cursor-pointer ml-1"
                            >
                                {mode === "register" ? "Войти" : "Зарегистрироваться"}
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
