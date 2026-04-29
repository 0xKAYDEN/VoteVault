import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

export function ThemeToggle() {
  const { theme, setTheme, availableThemes } = useTheme();

  const handleThemeChange = (key: string) => {
    setTheme(key as any);
    const themeName = availableThemes[key as keyof typeof availableThemes]?.name || key;
    toast.success(`Theme changed to ${themeName}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Toggle theme">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong border-white/10">
        {Object.entries(availableThemes).map(([key, themeData]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleThemeChange(key)}
            className={theme === key ? "bg-primary/15 text-primary-glow" : ""}
          >
            <div
              className="mr-2 h-4 w-4 rounded-full border border-white/20"
              style={{ backgroundColor: themeData.colors.primary }}
            />
            <span>{themeData.name}</span>
            {theme === key && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
