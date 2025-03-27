"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { BookOpen, Home, Menu, Tag } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "My Music", icon: Home },
    { href: "/editor/new", label: "Editor", icon: BookOpen },
    { href: "/categories", label: "Categories", icon: Tag },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span className="font-bold">Lyrics Manager</span>
        </Link>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-4 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center space-x-2 ${
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

