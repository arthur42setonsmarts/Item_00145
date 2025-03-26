import { DashboardShell } from "@/components/dashboard-shell"
import { SongList } from "@/components/song-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
// Make sure we're using the correct icon here too
import { PlusCircle } from "lucide-react"

export default function Home() {
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

