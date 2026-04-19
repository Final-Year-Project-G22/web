import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="h-20 border-b bg-background flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>

      <div className="flex items-center gap-6">
        {/* <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="pl-9 pr-12 bg-accent/50 border-none focus-visible:ring-1"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div> */}

        <div className="relative">
          <button
            type="button"
            className="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
          </button>
        </div>

        <Avatar className="w-8 h-8 border ring-2 ring-background cursor-pointer">
          <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
          <AvatarFallback className="bg-amber-100 text-amber-700">D</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
