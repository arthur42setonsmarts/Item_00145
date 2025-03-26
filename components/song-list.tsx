"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Edit, MoreHorizontal, Search, Trash } from "lucide-react"
import { useSongStore } from "@/lib/stores/song-store"
import { formatDistanceToNow } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

export function SongList() {
  const { songs, removeSong, addSong } = useSongStore()
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Add a ref to store the deleted song for undo functionality
  const deletedSongRef = useRef<any>(null)

  const filteredSongs = songs.filter((song) => song.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleRowClick = (songId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown or its children
    if ((e.target as Element).closest(".dropdown-action")) {
      return
    }
    router.push(`/editor/${songId}`)
  }

  // Update the handleDeleteSong function to include undo functionality
  const handleDeleteSong = (id: string) => {
    // Find the song before removing it
    const songToDelete = songs.find((song) => song.id === id)

    if (songToDelete) {
      // Store the song for potential undo
      deletedSongRef.current = { ...songToDelete }

      // Remove the song
      removeSong(id)

      // Show toast with undo option
      toast({
        title: "Song Deleted",
        description: `"${songToDelete.title}" has been deleted.`,
        action: (
          <ToastAction altText="Undo" onClick={handleUndoDelete}>
            Undo
          </ToastAction>
        ),
      })
    }
  }

  // Add the handleUndoDelete function
  const handleUndoDelete = () => {
    if (deletedSongRef.current) {
      // Restore the deleted song
      addSong(deletedSongRef.current)

      toast({
        title: "Deletion Undone",
        description: `"${deletedSongRef.current.title}" has been restored.`,
      })

      // Clear the ref
      deletedSongRef.current = null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search songs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium">No songs found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {songs.length === 0 ? "Get started by creating your first song" : "Try adjusting your search term"}
            </p>
            {/* Removed the redundant "Create a song" button */}
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSongs.map((song) => (
                <TableRow
                  key={song.id}
                  onClick={(e) => handleRowClick(song.id, e)}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <TableCell className="font-medium">{song.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {song.categories && song.categories.length > 0 ? (
                        song.categories.map((category, i) => (
                          <Badge key={i} variant="outline">
                            {category}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">No categories</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(song.updatedAt))}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="dropdown-action">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="dropdown-action">
                        <Link href={`/editor/${song.id}`}>
                          <DropdownMenuItem className="dropdown-action">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive dropdown-action"
                          onClick={() => handleDeleteSong(song.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

