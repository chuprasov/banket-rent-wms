import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, ChevronDown } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function NavigationMenu({ onNavigate }: { onNavigate?: () => void }) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const { isLoggedIn, isLoading } = useAuth()

    if (isLoading || !isLoggedIn) return null

    return (
        <nav className="flex w-full flex-col gap-2 px-1 md:mt-0">
            <Link
                to="/catalog"
                onClick={onNavigate}
                className="flex w-full items-center justify-between gap-1 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
                Каталог оборудования
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen} className="w-full">
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-1 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent transition-colors text-left cursor-pointer">
                    <span>Настройки</span>
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isSettingsOpen ? "rotate-180" : ""
                            }`}
                    />
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-1 w-full space-y-1 pl-2">
                    <Link
                        to="/settings/warehouses"
                        onClick={onNavigate}
                        className="flex w-full items-center rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                        Настройка складов
                    </Link>
                </CollapsibleContent>
            </Collapsible>
        </nav>
    )
}
