"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionTagger } from "@/components/section-tagger"
import { SimpleEditor } from "@/components/simple-editor"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { useSongStore } from "@/lib/stores/song-store"
import { useRouter } from "next/navigation"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"

interface LyricsEditorProps {
  id: string
}

// Light mode colors
const lightModeSectionColors: Record<string, string> = {
  verse: "#d4f1f9",
  chorus: "#ffd3d3",
  bridge: "#e1d4f9",
  intro: "#d4f9d4",
  outro: "#f9f9d4",
  "pre-chorus": "#f9d4f9",
  hook: "#f9d4d4",
  instrumental: "#d4f9f9",
}

// Dark mode colors with better visibility
const darkModeSectionColors: Record<string, string> = {
  verse: "#0c3b4a",
  chorus: "#4a0c0c",
  bridge: "#2c0c4a",
  intro: "#0c4a0c",
  outro: "#4a4a0c",
  "pre-chorus": "#4a0c4a",
  hook: "#4a1c0c",
  instrumental: "#0c4a4a",
}

// Form schema
const formSchema = z.object({
  lyrics: z.string(),
})

export function LyricsEditor({ id }: LyricsEditorProps) {
  const router = useRouter()
  const { songs, addSong, updateSong } = useSongStore()

  const isNewSong = id === "new"
  const currentSong = !isNewSong ? songs.find((song) => song.id === id) : null

  const [sections, setSections] = useState<{ start: number; end: number; type: string; artists?: string[] }[]>([])
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const [showHighlighted, setShowHighlighted] = useState(true)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lyrics: currentSong?.lyrics || "",
    },
  })

  // Check for dark mode
  useEffect(() => {
    // Initial check
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark")
      setIsDarkMode(isDark)
    }

    checkDarkMode()

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkDarkMode()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => {
      observer.disconnect()
    }
  }, [])

  // Load initial data only once when component mounts or when currentSong changes
  useEffect(() => {
    if (currentSong) {
      form.reset({
        lyrics: currentSong.lyrics || "",
      })
      setSections(currentSong.sections || [])
    }
  }, [currentSong, form])

  // Handle lyrics change
  const handleLyricsChange = (newLyrics: string) => {
    form.setValue("lyrics", newLyrics)
  }

  // Handle selection change
  const handleSelectionChange = (selection: { start: number; end: number } | null) => {
    setSelectionRange(selection)
    setDebugInfo(selection ? `Selection: ${selection.start}-${selection.end}` : "No selection")
  }

  // Handle sections change
  const handleSectionsChange = (newSections: { start: number; end: number; type: string; artists?: string[] }[]) => {
    setSections(newSections)

    // Clear selection after adding a section
    setSelectionRange(null)

    // Also clear the browser's selection
    if (window.getSelection) {
      if (window.getSelection()?.empty) {
        // Chrome
        window.getSelection()?.empty()
      } else if (window.getSelection()?.removeAllRanges) {
        // Firefox
        window.getSelection()?.removeAllRanges()
      }
    }
  }

  // Save changes
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSaving(true)

    try {
      if (isNewSong) {
        // Check if a song with the same title already exists
        const songTitle = "Untitled Song" // Default title for new songs
        const songWithSameTitle = songs.find((s) => s.title.toLowerCase() === songTitle.toLowerCase())

        if (songWithSameTitle) {
          form.setError("lyrics", {
            type: "manual",
            message: "A song with this title already exists. Please change the title after creation.",
          })
          setIsSaving(false)
          return // Prevent song creation
        }

        const newId = Date.now().toString()
        const newSong = {
          id: newId,
          title: songTitle,
          lyrics: values.lyrics,
          sections,
          versions: [
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              lyrics: values.lyrics,
              sections,
            },
          ],
          categories: [],
          featuredArtists: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        addSong(newSong)

        toast.success("Song created", {
          description: "Your new song has been created successfully.",
        })

        router.push(`/editor/${newId}`)
      } else if (currentSong) {
        // Create a new version
        const newVersion = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          lyrics: values.lyrics,
          sections,
        }

        const updatedSong = {
          ...currentSong,
          lyrics: values.lyrics,
          sections,
          versions: [...(currentSong.versions || []), newVersion],
          updatedAt: new Date().toISOString(),
        }

        updateSong(updatedSong)

        toast.success("Song updated", {
          description: "Your song has been updated and a new version has been saved.",
        })

        setLastSavedAt(new Date())
      }
    } catch (error) {
      console.error("Error saving song:", error)
      toast.error("Save Failed", {
        description: "There was an error saving your song.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Get the appropriate color set based on theme
  const sectionColors = isDarkMode ? darkModeSectionColors : lightModeSectionColors

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lyrics</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowHighlighted(!showHighlighted)}>
            {showHighlighted ? "Hide Highlights" : "Show Highlights"}
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="p-4">
              <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SimpleEditor
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value)
                          handleLyricsChange(value)
                        }}
                        onSelectionChange={handleSelectionChange}
                        sections={showHighlighted ? sections : []}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Debug info - visible in deployed environment */}
              <div className="mt-2 text-xs text-muted-foreground">
                {debugInfo}
                {lastSavedAt && <span className="ml-4">Last saved: {lastSavedAt.toLocaleTimeString()}</span>}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(sectionColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 text-sm">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      <SectionTagger
        lyrics={form.watch("lyrics")}
        sections={sections}
        onSectionsChange={handleSectionsChange}
        selectionRange={selectionRange}
        songId={id}
      />
    </div>
  )
}

