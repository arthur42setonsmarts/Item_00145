"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSongStore } from "@/lib/stores/song-store"
import { ArrowLeft, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function LyricsViewPage() {
  const params = useParams()
  const router = useRouter()
  const { songs } = useSongStore()
  const [song, setSong] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id && songs.length > 0) {
      const foundSong = songs.find((s) => s.id === params.id)
      setSong(foundSong || null)
      setLoading(false)
    } else if (songs.length > 0) {
      setLoading(false)
    }
  }, [params.id, songs])

  const handleBack = () => {
    router.back()
  }

  const handleEdit = () => {
    router.push(`/editor/${song.id}`)
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      </DashboardShell>
    )
  }

  if (!song) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Song Not Found</h1>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="mt-6">
          <p>The requested song could not be found.</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{song.title}</h1>
        <div className="flex gap-2">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {song.categories?.map((category: string) => (
          <Badge key={category} variant="outline">
            {category}
          </Badge>
        ))}
        {song.featuredArtists?.length > 0 && (
          <Badge variant="secondary">Featuring: {song.featuredArtists.join(", ")}</Badge>
        )}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="whitespace-pre-wrap font-mono text-lg">{song.lyrics}</div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

