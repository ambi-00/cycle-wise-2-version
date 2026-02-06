import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ThemeColor {
  id: string;
  name: string;
  primary: string;
  primaryHsl: string;
  description: string;
}

const themeColors: ThemeColor[] = [
  {
    id: "rose",
    name: "Rose (Default)",
    primary: "#E599A4",
    primaryHsl: "345 60% 65%",
    description: "Soft rose pink - feminine and empowering",
  },
  {
    id: "lavender",
    name: "Lavender",
    primary: "#B8A8D8",
    primaryHsl: "270 40% 75%",
    description: "Calming lavender purple - soothing and elegant",
  },
  {
    id: "mint",
    name: "Mint",
    primary: "#A8D8C3",
    primaryHsl: "160 45% 75%",
    description: "Fresh mint green - balanced and refreshing",
  },
  {
    id: "peach",
    name: "Peach",
    primary: "#F5C4A8",
    primaryHsl: "25 80% 80%",
    description: "Warm peach - optimistic and friendly",
  },
  {
    id: "sky",
    name: "Sky Blue",
    primary: "#A8C8E8",
    primaryHsl: "210 60% 78%",
    description: "Clear sky blue - focused and serene",
  },
  {
    id: "coral",
    name: "Coral",
    primary: "#FF9B8A",
    primaryHsl: "10 100% 77%",
    description: "Vibrant coral - energetic and bold",
  },
];

export default function ThemeCustomizer() {
  const [selectedTheme, setSelectedTheme] = useState<string>("rose");

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem("cw_theme_color");
    if (saved) {
      setSelectedTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = themeColors.find((t) => t.id === themeId);
    if (!theme) return;

    // Update CSS custom properties
    document.documentElement.style.setProperty("--primary", theme.primaryHsl);
    
    // Save to localStorage
    localStorage.setItem("cw_theme_color", themeId);
    setSelectedTheme(themeId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Theme Color</CardTitle>
        </div>
        <CardDescription>
          Choose your accent color to personalize the app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themeColors.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                className={`relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg shadow-sm ring-1 ring-black/5"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-semibold cursor-pointer">
                      {theme.name}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {theme.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Your theme preference is saved locally and will persist across sessions.
        </p>
      </CardContent>
    </Card>
  );
}
