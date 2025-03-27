"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, BookOpen, Tag } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function MainNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6" />
          <span className="font-bold text-lg">Lyrics Manager</span>
        </Link>

        <nav className="ml-auto flex items-center space-x-1">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "default" : "ghost"}
              className="h-9 w-9 p-0 md:h-10 md:w-fit md:px-4 md:py-2"
            >
              <Home className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-flex">My Music</span>
            </Button>
          </Link>
          <Link href="/editor/new">
            <Button
              variant={pathname.startsWith("/editor") ? "default" : "ghost"}
              className="h-9 w-9 p-0 md:h-10 md:w-fit md:px-4 md:py-2"
            >
              <BookOpen className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-flex">Editor</span>
            </Button>
          </Link>
          <Link href="/categories">
            <Button
              variant={pathname.startsWith("/categories") ? "default" : "ghost"}
              className="h-9 w-9 p-0 md:h-10 md:w-fit md:px-4 md:py-2"
            >
              <Tag className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-flex">Categories</span>
            </Button>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

