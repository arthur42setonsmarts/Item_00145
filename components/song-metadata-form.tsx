"use client"
import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, UserPlus, Save, Plus } from "lucide-react"
import { useSongStore } from "@/lib/stores/song-store"
import { useCategoryStore } from "@/lib/stores/category-store"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface SongMetadataFormProps {
  id: string
}

export function SongMetadataForm({ id }: SongMetadataFormProps) {
  const { songs, updateSong, addSong } = useSongStore()
  const { categories } = useCategoryStore()
  const router = useRouter()

  const isNewSong = id === "new"
  const currentSong = !isNewSong ? songs.find((song) => song.id === id) : null

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [songCategories, setSongCategories] = useState<string[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<string[]>([])
  const [newArtist, setNewArtist] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  // Store original state for comparison
  const originalStateRef = useRef<{
    title: string
    categories: string[]
    featuredArtists: string[]
  } | null>(null)

  // Store previous state for undo functionality
  const previousStateRef = useRef<{
    title: string
    categories: string[]
    featuredArtists: string[]
  } | null>(null)

  // Create a schema for form validation
  const formSchema = z.object({
    title: z
      .string()
      .min(1, {
        message: "Title is required",
      })
      .refine(
        (title) => {
          // Check if a song with the same title already exists
          const existingSong = songs.find(
            (s) => s.title.toLowerCase() === title.toLowerCase() && (isNewSong || s.id !== currentSong?.id),
          )
          return !existingSong
        },
        {
          message: "A song with this title already exists",
        },
      ),
  })

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: currentSong?.title || "Untitled Song",
    },
  })

  // Load initial data
  useEffect(() => {
    if (currentSong) {
      const initialTitle = currentSong.title || "Untitled Song"
      const initialCategories = [...(currentSong.categories || [])]
      const initialFeaturedArtists = [...(currentSong.featuredArtists || [])]

      // Set form values
      form.reset({
        title: initialTitle,
      })
      setSongCategories(initialCategories)
      setFeaturedArtists(initialFeaturedArtists)

      // Store original state for comparison
      originalStateRef.current = {
        title: initialTitle,
        categories: initialCategories,
        featuredArtists: initialFeaturedArtists,
      }
    } else if (isNewSong) {
      // Set default values for new song
      form.reset({
        title: "Untitled Song",
      })
      setSongCategories([])
      setFeaturedArtists([])
    }
  }, [currentSong, isNewSong, form])

  // Check for changes whenever form values or categories/artists change
  useEffect(() => {
    if (isNewSong) {
      // For new songs, always enable the button
      setHasChanges(true)
      return
    }

    if (!originalStateRef.current) return

    const currentTitle = form.getValues().title
    const original = originalStateRef.current

    // Compare current values with original values
    const titleChanged = currentTitle !== original.title
    const categoriesChanged =
      songCategories.length !== original.categories.length ||
      songCategories.some((cat) => !original.categories.includes(cat)) ||
      original.categories.some((cat) => !songCategories.includes(cat))
    const artistsChanged =
      featuredArtists.length !== original.featuredArtists.length ||
      featuredArtists.some((artist) => !original.featuredArtists.includes(artist)) ||
      original.featuredArtists.some((artist) => !featuredArtists.includes(artist))

    setHasChanges(titleChanged || categoriesChanged || artistsChanged)
  }, [form, songCategories, featuredArtists, isNewSong])

  // Also, let's add a watch to the form to ensure we detect changes to the title field:
  useEffect(() => {
    // Add a subscription to watch for form changes
    const subscription = form.watch(() => {
      // This will run whenever any form field changes
      if (!isNewSong && originalStateRef.current) {
        const currentTitle = form.getValues().title
        const original = originalStateRef.current

        const titleChanged = currentTitle !== original.title
        const categoriesChanged =
          songCategories.length !== original.categories.length ||
          songCategories.some((cat) => !original.categories.includes(cat)) ||
          original.categories.some((cat) => !songCategories.includes(cat))
        const artistsChanged =
          featuredArtists.length !== original.featuredArtists.length ||
          featuredArtists.some((artist) => !original.featuredArtists.includes(artist)) ||
          original.featuredArtists.some((artist) => !featuredArtists.includes(artist))

        setHasChanges(titleChanged || categoriesChanged || artistsChanged)
      }
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [form, songCategories, featuredArtists, isNewSong])

  const handleCategorySelect = (value: string) => {
    if (value && !songCategories.includes(value)) {
      setSongCategories((prev) => [...prev, value])
      setSelectedCategory("")
      form.setFocus("title") // Trigger validation
    }
  }

  const handleRemoveCategory = (category: string) => {
    setSongCategories((prev) => prev.filter((c) => c !== category))
    form.setFocus("title") // Trigger validation
  }

  const handleAddArtist = () => {
    if (newArtist.trim() && !featuredArtists.includes(newArtist.trim())) {
      setFeaturedArtists((prev) => [...prev, newArtist.trim()])
      setNewArtist("")
      form.setFocus("title") // Trigger validation
    }
  }

  const handleRemoveArtist = (artist: string) => {
    setFeaturedArtists((prev) => prev.filter((a) => a !== artist))
    form.setFocus("title") // Trigger validation
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

    // Update form state
    form.reset({
      title: prevState.title,
    })
    setSongCategories(prevState.categories)
    setFeaturedArtists(prevState.featuredArtists)

    toast.success("Changes Undone", {
      description: "Your song details have been restored to the previous state.",
    })
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSaving(true)

    try {
      if (isNewSong) {
        // Create a new song
        const newId = Date.now().toString()
        const newSong = {
          id: newId,
          title: values.title,
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

        addSong(newSong)

        toast.success("Song Created", {
          description: `"${values.title}" has been created successfully.`,
        })

        router.push(`/editor/${newId}`)
      } else if (currentSong) {
        // Update existing song
        // Store current state for undo functionality
        previousStateRef.current = {
          title: currentSong.title,
          categories: [...(currentSong.categories || [])],
          featuredArtists: [...(currentSong.featuredArtists || [])],
        }

        // Create updated song object
        const updatedSong = {
          ...currentSong,
          title: values.title,
          categories: songCategories,
          featuredArtists,
          updatedAt: new Date().toISOString(),
        }

        // Update in store
        updateSong(updatedSong)

        // Update original state reference to the new values
        originalStateRef.current = {
          title: values.title,
          categories: [...songCategories],
          featuredArtists: [...featuredArtists],
        }

        // Reset the hasChanges flag
        setHasChanges(false)

        toast.success("Changes Saved", {
          description: "All song details have been saved successfully.",
          action: {
            label: "Undo",
            onClick: undoChanges,
          },
        })
      }
    } catch (error) {
      console.error("Error saving song:", error)
      toast.error(isNewSong ? "Creation Failed" : "Save Failed", {
        description: `There was an error ${isNewSong ? "creating" : "saving"} your song.`,
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
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving || (!isNewSong && !hasChanges)} size="sm">
            {isSaving ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                <span className="hidden sm:inline-block">{isNewSong ? "Creating..." : "Saving..."}</span>
              </>
            ) : (
              <>
                {isNewSong ? (
                  <>
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline-block">Create Song</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline-block">Update Details</span>
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter song title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        type="button"
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
                        type="button"
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
                  type="button"
                >
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline-block">Add Artist</span>
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

