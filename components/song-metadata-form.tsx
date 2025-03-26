"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, UserPlus, Save, Plus } from "lucide-react"
import { useSongStore } from "@/lib/stores/song-store"
import { useCategoryStore } from "@/lib/stores/category-store"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useRouter } from "next/navigation"

interface SongMetadataFormProps {
  id: string
}

export function SongMetadataForm({ id }: SongMetadataFormProps) {
  const { songs, updateSong, addSong } = useSongStore()
  const { categories } = useCategoryStore()
  const { toast } = useToast()
  const router = useRouter()

  const isNewSong = id === "new"
  const currentSong = !isNewSong ? songs.find((song) => song.id === id) : null

  // Form state
  const [title, setTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [songCategories, setSongCategories] = useState<string[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<string[]>([])
  const [newArtist, setNewArtist] = useState("")

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [formTouched, setFormTouched] = useState(false)

  // Store previous state for undo functionality
  const previousStateRef = useRef<{
    title: string
    categories: string[]
    featuredArtists: string[]
  } | null>(null)

  // Load initial data
  useEffect(() => {
    if (currentSong) {
      setTitle(currentSong.title || "Untitled Song")
      setSongCategories([...(currentSong.categories || [])])
      setFeaturedArtists([...(currentSong.featuredArtists || [])])
      setFormTouched(false) // Reset form touched state when loading new data
    } else if (isNewSong) {
      // Set default values for new song
      setTitle("Untitled Song")
      setSongCategories([])
      setFeaturedArtists([])
      setFormTouched(false)
    }
  }, [currentSong, isNewSong])

  // Mark form as touched whenever any field changes
  const markAsTouched = () => {
    if (!formTouched) {
      setFormTouched(true)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    markAsTouched()
  }

  const handleCategorySelect = (value: string) => {
    if (value && !songCategories.includes(value)) {
      setSongCategories((prev) => [...prev, value])
      setSelectedCategory("")
      markAsTouched()
    }
  }

  const handleRemoveCategory = (category: string) => {
    setSongCategories((prev) => prev.filter((c) => c !== category))
    markAsTouched()
  }

  const handleAddArtist = () => {
    if (newArtist.trim() && !featuredArtists.includes(newArtist.trim())) {
      setFeaturedArtists((prev) => [...prev, newArtist.trim()])
      setNewArtist("")
      markAsTouched()
    }
  }

  const handleRemoveArtist = (artist: string) => {
    setFeaturedArtists((prev) => prev.filter((a) => a !== artist))
    markAsTouched()
  }

  const undoChanges = () => {
    if (!previousStateRef.current || !currentSong) return

    // Restore previous state
    const prevState = previousStateRef.current

    // Update the song with the previous state
    const restoredSong = {
      ...currentSong,
      title: prevState.title,
      categories: prevState.categories,
      featuredArtists: prevState.featuredArtists,
      updatedAt: new Date().toISOString(),
    }

    // Update in store
    updateSong(restoredSong)

    // Update local state
    setTitle(prevState.title)
    setSongCategories(prevState.categories)
    setFeaturedArtists(prevState.featuredArtists)
    setFormTouched(false)

    toast({
      title: "Changes Undone",
      description: "Your song details have been restored to the previous state.",
    })
  }

  const createNewSong = () => {
    setIsSaving(true)

    try {
      // Create a new song ID
      const newId = Date.now().toString()

      // Create the new song object
      const newSong = {
        id: newId,
        title: title || "Untitled Song",
        lyrics: "",
        sections: [],
        categories: songCategories,
        featuredArtists,
        versions: [
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            lyrics: "",
            sections: [],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Add to store
      addSong(newSong)

      toast({
        title: "Song Created",
        description: `"${title || "Untitled Song"}" has been created successfully.`,
      })

      // Navigate to the new song's editor page
      router.push(`/editor/${newId}`)
    } catch (error) {
      console.error("Error creating song:", error)
      toast({
        title: "Creation Failed",
        description: "There was an error creating your song.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveAllChanges = () => {
    if (isNewSong) {
      createNewSong()
      return
    }

    if (!currentSong) return
    setIsSaving(true)

    try {
      // Store current state for undo functionality
      previousStateRef.current = {
        title: currentSong.title,
        categories: [...(currentSong.categories || [])],
        featuredArtists: [...(currentSong.featuredArtists || [])],
      }

      // Create updated song object
      const updatedSong = {
        ...currentSong,
        title,
        categories: songCategories,
        featuredArtists,
        updatedAt: new Date().toISOString(),
      }

      // Update in store
      updateSong(updatedSong)

      setFormTouched(false) // Reset touched state after saving

      toast({
        title: "Changes Saved",
        description: "All song details have been saved successfully.",
        action: (
          <ToastAction altText="Undo" onClick={undoChanges}>
            Undo
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Save Failed",
        description: "There was an error saving your changes.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isNewSong ? "Create New Song" : "Song Details"}</CardTitle>
          </div>
          <Button onClick={saveAllChanges} disabled={isSaving || (!isNewSong && !formTouched)} size="sm">
            {isSaving ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                {isNewSong ? "Creating..." : "Saving..."}
              </>
            ) : (
              <>
                {isNewSong ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Song
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Details
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input id="title" value={title} onChange={handleTitleChange} placeholder="Enter song title" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Categories</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {songCategories.length > 0 ? (
                songCategories.map((category, i) => (
                  <Badge key={i} variant="secondary" className="mr-1 mb-1">
                    {category}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 p-0"
                      onClick={() => handleRemoveCategory(category)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No categories selected</span>
              )}
            </div>
            <Select value={selectedCategory} onValueChange={handleCategorySelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Featured Performers Section */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Featured Performers</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {featuredArtists.length > 0 ? (
                featuredArtists.map((artist, i) => (
                  <Badge key={i} variant="outline" className="mr-1 mb-1 bg-primary/10">
                    {artist}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 p-0"
                      onClick={() => handleRemoveArtist(artist)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No featured performers</span>
              )}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                placeholder="Artist name"
                className="flex-1"
              />
              <Button
                onClick={handleAddArtist}
                disabled={!newArtist.trim() || featuredArtists.includes(newArtist.trim())}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Artist
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

