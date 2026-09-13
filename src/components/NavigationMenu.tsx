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
        <nav className="flex flex-col gap-2 mt-6 w-full">
            <Link
                to="/catalog"
                onClick={onNavigate}
                className="flex w-full items-center justify-between py-2 px-3 rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
                Каталог оборудования
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen} className="w-full">
                <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 rounded-md text-sm font-medium hover:bg-accent transition-colors text-left cursor-pointer">
                    <span>Настройки</span>
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isSettingsOpen ? "rotate-180" : ""
                            }`}
                    />
                </CollapsibleTrigger>

                <CollapsibleContent className="pl-4 space-y-1 mt-1 w-full">
                    <Link
                        to="/settings/warehouses"
                        onClick={onNavigate}
                        className="flex w-full items-center py-2 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                        Настройка складов
                    </Link>
                </CollapsibleContent>
            </Collapsible>
        </nav>
    )
}
