"use client"

import { useSongStore } from "@/lib/stores/song-store"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

export function SongList() {
  const { songs, removeSong } = useSongStore()
  const router = useRouter()
  const [songToDelete, setSongToDelete] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    removeSong(id)
    setSongToDelete(null)
  }

  if (songs.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No songs created</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You haven&apos;t created any songs yet. Add one below.
          </p>
          <Link href="/editor/new">
            <Button>Create Song</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <Card key={song.id}>
          <CardHeader className="pb-2">
            <CardTitle className="truncate">{song.title}</CardTitle>
            <CardDescription>
              {song.featuredArtists?.length ? `Featuring: ${song.featuredArtists.join(", ")}` : "Solo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {song.categories?.map((category) => (
                <Badge key={category} variant="outline">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-start">
            <div className="flex gap-2">
              <Link href={`/lyrics/${song.id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </Link>
              <Link href={`/editor/${song.id}`}>
                <Button size="sm" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <AlertDialog open={songToDelete === song.id} onOpenChange={(open) => !open && setSongToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setSongToDelete(song.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your song and all of its data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(song.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

