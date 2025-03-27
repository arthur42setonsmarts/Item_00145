"use client"

import { useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { SongList } from "@/components/song-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { useSongStore } from "@/lib/stores/song-store"
import { useCategoryStore } from "@/lib/stores/category-store"

export default function Home() {
  const { initializeSampleData } = useSongStore()
  const { initializeSampleCategories } = useCategoryStore()

  // Initialize sample data when the app loads
  useEffect(() => {
    initializeSampleCategories()
    initializeSampleData()
  }, [initializeSampleCategories, initializeSampleData])

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Songs</h1>
        <Link href="/editor/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Song
          </Button>
        </Link>
      </div>
      <div className="mt-6">
        <SongList />
      </div>
    </DashboardShell>
  )
}

