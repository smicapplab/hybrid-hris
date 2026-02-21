import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getBackgroundColor, getFallbackText } from "@/lib/utils";

export function AvatarSidebar() {
    const { user } = useAuth();

    if (!user) return null; // layout handles redirect

    const fallbackColor = getBackgroundColor(user?.email);
    return (
        <>
            <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback
                    style={{ backgroundColor: fallbackColor }}
                    className={`rounded-lg  text-white`}
                >
                    {getFallbackText(user.firstName || "", user.lastName || "")}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold!">{user?.firstName} {user?.lastName}</span>
                <span className="truncate text-xs">{user?.email} </span>
            </div>
        </>
    );
}