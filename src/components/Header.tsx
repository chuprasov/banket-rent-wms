import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, User, LogOut, UtensilsCrossed } from "lucide-react"
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
    const { isLoggedIn, user, logout } = useAuth()
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isAuthOpen, setIsAuthOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
            <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-3">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent transition-colors cursor-pointer">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Открыть меню</span>
                        </SheetTrigger>

                        <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2 text-xl font-serif font-bold text-foreground">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                                    </div>
                                    <span>Banket Rent</span>
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
                {/*<div className="flex flex-1 max-w-xl items-center mx-4">
                    <div className="flex w-full items-center">
                        <Input
                            type="search"
                            placeholder="Поиск оборудования..."
                            className="rounded-r-none border-2 border-r-0 border-primary/40 bg-background"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-l-none border-2 border-primary bg-primary hover:bg-primary/90 text-primary-foreground px-4 shrink-0"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>*/}
                <div className="flex items-center gap-2">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium hidden sm:inline-block max-w-[120px] truncate">
                                {user?.name || user?.email}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                title="Выйти"
                                className="text-foreground hover:bg-accent hover:text-destructive"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsAuthOpen(true)}
                            title="Войти"
                            className="text-foreground hover:bg-accent"
                        >
                            <User className="h-5 w-5" />
                        </Button>
                    )}

                    {/*<Button variant="ghost" size="icon" className="relative text-foreground hover:bg-accent">
                        <ShoppingBag className="h-5 w-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {cartCount}
                            </span>
                        )}
                    </Button>*/}
                </div>
            </div>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </header>
    )
}
