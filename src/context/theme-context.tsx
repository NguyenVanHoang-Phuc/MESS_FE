"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"
export type AccentColor = "blue" | "emerald" | "violet" | "amber" | "rose"

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  effectiveTheme: "light" | "dark"
  accentColor: AccentColor
  setAccentColor: (accent: AccentColor) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ACCENT_COLORS: { id: AccentColor; name: string; hex: string; bgClass: string; textClass: string; ringClass: string }[] = [
  { id: "blue", name: "Ocean Blue", hex: "#0068FF", bgClass: "bg-blue-500", textClass: "text-blue-500", ringClass: "ring-blue-500" },
  { id: "emerald", name: "Emerald Mint", hex: "#10b981", bgClass: "bg-emerald-500", textClass: "text-emerald-500", ringClass: "ring-emerald-500" },
  { id: "violet", name: "Royal Violet", hex: "#8b5cf6", bgClass: "bg-violet-500", textClass: "text-violet-500", ringClass: "ring-violet-500" },
  { id: "amber", name: "Sunset Amber", hex: "#f59e0b", bgClass: "bg-amber-500", textClass: "text-amber-500", ringClass: "ring-amber-500" },
  { id: "rose", name: "Rose Bloom", hex: "#f43f5e", bgClass: "bg-rose-500", textClass: "text-rose-500", ringClass: "ring-rose-500" },
]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system")
  const [accentColor, setAccentColorState] = useState<AccentColor>("blue")
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage on client mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("app-theme") as ThemeMode | null
      const savedAccent = localStorage.getItem("app-accent") as AccentColor | null

      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setThemeState(savedTheme)
      }
      if (savedAccent && ["blue", "emerald", "violet", "amber", "rose"].includes(savedAccent)) {
        setAccentColorState(savedAccent)
      }
    } catch {}
    setMounted(true)
  }, [])

  // Calculate effective theme and apply class to documentElement
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return

    const root = document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const computeTheme = (): "light" | "dark" => {
      if (theme === "dark") return "dark"
      if (theme === "light") return "light"
      return mediaQuery.matches ? "dark" : "light"
    }

    const appliedTheme = computeTheme()
    setEffectiveTheme(appliedTheme)

    if (appliedTheme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.remove("dark")
      root.classList.add("light")
    }

    root.setAttribute("data-accent", accentColor)

    // Listener for system preference changes
    const handleChange = () => {
      if (theme === "system") {
        const newTheme = mediaQuery.matches ? "dark" : "light"
        setEffectiveTheme(newTheme)
        if (newTheme === "dark") {
          root.classList.add("dark")
          root.classList.remove("light")
        } else {
          root.classList.remove("dark")
          root.classList.add("light")
        }
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, accentColor, mounted])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem("app-theme", newTheme)
    } catch {}
  }

  const setAccentColor = (newAccent: AccentColor) => {
    setAccentColorState(newAccent)
    try {
      localStorage.setItem("app-accent", newAccent)
    } catch {}
  }

  const toggleTheme = () => {
    if (effectiveTheme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        effectiveTheme,
        accentColor,
        setAccentColor,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
