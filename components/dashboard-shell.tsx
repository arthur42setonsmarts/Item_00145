"use client"

import type React from "react"

import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { useMobile } from "@/hooks/use-mobile"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const isMobile = useMobile()

  return (
    <div className="flex min-h-screen flex-col">
      {isMobile ? <MobileNav /> : <MainNav />}
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">{children}</div>
      </main>
      <footer className="border-t py-4">
        <div className="px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lyrics Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

