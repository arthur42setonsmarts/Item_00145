"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionTagger } from "@/components/section-tagger"
import { SimpleEditor } from "@/components/simple-editor"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSongStore } from "@/lib/stores/song-store"
import { useRouter } from "next/navigation"

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

export function LyricsEditor({ id }: LyricsEditorProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { songs, addSong, updateSong } = useSongStore()

  const isNewSong = id === "new"
  const currentSong = !isNewSong ? songs.find((song) => song.id === id) : null

  const [lyrics, setLyrics] = useState("")
  const [sections, setSections] = useState<{ start: number; end: number; type: string; artists?: string[] }[]>([])
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const [showHighlighted, setShowHighlighted] = useState(true)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [isDarkMode, setIsDarkMode] = useState(false)

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
      setLyrics(currentSong.lyrics || "")
      setSections(currentSong.sections || [])
    }
  }, [currentSong])

  // Handle lyrics change
  const handleLyricsChange = (newLyrics: string) => {
    setLyrics(newLyrics)
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
  const handleSave = () => {
    if (isNewSong) {
      const newId = Date.now().toString()
      const newSong = {
        id: newId,
        title: "Untitled Song",
        lyrics,
        sections,
        versions: [
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            lyrics,
            sections,
          },
        ],
        categories: [],
        featuredArtists: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addSong(newSong)

      toast({
        title: "Song created",
        description: "Your new song has been created successfully.",
      })

      router.push(`/editor/${newId}`)
    } else if (currentSong) {
      // Create a new version
      const newVersion = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        lyrics,
        sections,
      }

      const updatedSong = {
        ...currentSong,
        lyrics,
        sections,
        versions: [...(currentSong.versions || []), newVersion],
        updatedAt: new Date().toISOString(),
      }

      updateSong(updatedSong)

      toast({
        title: "Song updated",
        description: "Your song has been updated and a new version has been saved.",
      })

      setLastSavedAt(new Date())
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
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <SimpleEditor
            value={lyrics}
            onChange={handleLyricsChange}
            onSelectionChange={handleSelectionChange}
            sections={showHighlighted ? sections : []}
            className="font-mono"
          />

          {/* Debug info - visible in deployed environment */}
          <div className="mt-2 text-xs text-muted-foreground">
            {debugInfo}
            {lastSavedAt && <span className="ml-4">Last saved: {lastSavedAt.toLocaleTimeString()}</span>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(sectionColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1 text-sm">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      <SectionTagger
        lyrics={lyrics}
        sections={sections}
        onSectionsChange={handleSectionsChange}
        selectionRange={selectionRange}
        songId={id}
      />
    </div>
  )
}

