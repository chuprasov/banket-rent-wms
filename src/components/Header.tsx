import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { NavigationMenu } from "@/components/NavigationMenu"
import { AuthModal } from "@/components/AuthModal"
import { useAuth } from "@/context/AuthContext"
import logo from "@/assets/top-logo.png"

export function Header() {
    const { isLoggedIn, isLoading, user, logout } = useAuth()
    const navigate = useNavigate()
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const loginRequired = !isLoading && !isLoggedIn
    const authOpen = loginRequired || isAuthOpen

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
            <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-3">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent transition-colors cursor-pointer md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Открыть меню</span>
                        </SheetTrigger>

                        <SheetContent side="left" className="w-[150px] sm:w-[175px] md:hidden">
                            <SheetHeader className="px-3 pt-4">
                                <SheetTitle
                                  className="flex items-center gap-2 text-xl font-serif font-bold text-foreground">
                                    <img
                                      src={logo}
                                      alt="Banket Rent"
                                      width={437}
                                      height={97}
                                      className="h-auto w-24 sm:w-28"
                                    />
                                </SheetTitle>
                            </SheetHeader>

                            <NavigationMenu onNavigate={() => setIsSheetOpen(false)} />
                        </SheetContent>
                    </Sheet>

                    <Link
                      to="/"
                      className="flex min-w-0 items-center hover:opacity-90 transition-opacity"
                    >
                        <img
                            src={logo}
                            alt="Banket Rent"
                            width={437}
                            height={97}
                            className="h-auto w-40 sm:w-52"
                        />
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-2">
                            <span className="text-s font-medium hidden sm:inline-block max-w-[120px] truncate">
                                {user?.name || user?.email}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                title="Выйти"
                                className="size-13.5 text-foreground hover:bg-accent hover:text-destructive"
                            >
                                <LogOut className="size-7.5" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsAuthOpen(true)}
                            title="Войти"
                            className="size-13.5 text-foreground hover:bg-accent"
                        >
                            <User className="size-7.5" />
                        </Button>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={authOpen}
                isDismissible={!loginRequired}
                onClose={() => setIsAuthOpen(false)}
                onAuthenticated={() => navigate("/catalog", { replace: true })}
            />
        </header>
    )
}
