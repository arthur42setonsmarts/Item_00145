"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag, Plus, X, User, UserPlus, AlertCircle } from "lucide-react"
import { useSongStore } from "@/lib/stores/song-store"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Section {
  start: number
  end: number
  type: string
  artists?: string[]
}

interface SectionTaggerProps {
  lyrics: string
  sections: Section[]
  onSectionsChange: (sections: Section[]) => void
  selectionRange: { start: number; end: number } | null
  songId: string
}

export function SectionTagger({ lyrics, sections, onSectionsChange, selectionRange, songId }: SectionTaggerProps) {
  const [selectedType, setSelectedType] = useState("verse")
  const [canAddSection, setCanAddSection] = useState(false)
  const [hasOverlap, setHasOverlap] = useState(false)
  const [overlapMessage, setOverlapMessage] = useState("")
  const { songs } = useSongStore()
  const currentSong = songs.find((song) => song.id === songId)
  const featuredArtists = currentSong?.featuredArtists || []
  const [currentUser, setCurrentUser] = useState<string>("Chester")
  const [/*debugInfo*/ /*setDebugInfo*/ ,] = useState<string>("")

  // Load current user from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("lyrics-manager-profile-name")
      if (savedName) {
        setCurrentUser(savedName)
      }
    }
  }, [])

  // Get all available performers (current user + featured artists)
  const allPerformers = useMemo(() => {
    const performers = new Set<string>([currentUser])
    featuredArtists.forEach((artist) => performers.add(artist))
    return Array.from(performers)
  }, [currentUser, featuredArtists])

  // Sort sections by their start position
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.start - b.start)
  }, [sections])

  // Check if selection overlaps with any existing section
  const checkOverlap = (start: number, end: number) => {
    for (const section of sections) {
      // Check for any overlap between the ranges
      if (
        (start <= section.start && end > section.start) || // Selection starts before section and ends inside/after
        (start >= section.start && start < section.end) || // Selection starts inside section
        (start <= section.start && end >= section.end) // Selection completely contains section
      ) {
        const overlapType = section.type.charAt(0).toUpperCase() + section.type.slice(1)
        return {
          hasOverlap: true,
          message: `Selection overlaps with an existing ${overlapType} section. Please select a different range.`,
        }
      }
    }
    return { hasOverlap: false, message: "" }
  }

  // Update canAddSection whenever selectionRange changes
  useEffect(() => {
    if (selectionRange && selectionRange.start < selectionRange.end) {
      const { hasOverlap, message } = checkOverlap(selectionRange.start, selectionRange.end)
      setHasOverlap(hasOverlap)
      setOverlapMessage(message)
      setCanAddSection(!hasOverlap)

      //setDebugInfo(
      //  `Selection: ${selectionRange.start}-${selectionRange.end} (${selectionRange.end - selectionRange.start} chars)`,
      //)
    } else {
      setCanAddSection(false)
      setHasOverlap(false)
      setOverlapMessage("")
      //setDebugInfo("No selection")
    }
  }, [selectionRange, sections])

  // Clear text selection in the browser
  const clearSelection = () => {
    // Clear browser selection
    if (window.getSelection) {
      if (window.getSelection()?.empty) {
        // Chrome
        window.getSelection()?.empty()
      } else if (window.getSelection()?.removeAllRanges) {
        // Firefox
        window.getSelection()?.removeAllRanges()
      }
    }

    // Dispatch a custom event to notify other components
    const event = new CustomEvent("sectionAdded")
    document.dispatchEvent(event)
  }

  // Update the addSection function to properly clear the selection and reset state
  const addSection = () => {
    if (!selectionRange || selectionRange.start >= selectionRange.end || hasOverlap) {
      console.log("Invalid selection range or overlap:", selectionRange)
      return
    }

    const { start, end } = selectionRange
    const newSection = {
      start,
      end,
      type: selectedType,
      artists: [],
    }

    const updatedSections = [...sections, newSection]
    onSectionsChange(updatedSections)

    // Clear the text selection after adding the section
    clearSelection()

    // Reset the selection state in the component
    setHasOverlap(false)
    setOverlapMessage("")
    setCanAddSection(false)
    //setDebugInfo("No selection")
  }

  const removeSection = (index: number) => {
    const sectionToRemove = sortedSections[index]
    const newSections = sections.filter(
      (section) =>
        !(
          section.start === sectionToRemove.start &&
          section.end === sectionToRemove.end &&
          section.type === sectionToRemove.type
        ),
    )
    onSectionsChange(newSections)
  }

  const toggleArtistForSection = (sectionIndex: number, artist: string) => {
    const section = sortedSections[sectionIndex]
    const originalIndex = sections.findIndex(
      (s) => s.start === section.start && s.end === section.end && s.type === section.type,
    )

    if (originalIndex === -1) return

    const newSections = [...sections]
    const currentSection = { ...newSections[originalIndex] }

    if (!currentSection.artists) {
      currentSection.artists = []
    }

    if (currentSection.artists.includes(artist)) {
      currentSection.artists = currentSection.artists.filter((a) => a !== artist)
    } else {
      currentSection.artists = [...currentSection.artists, artist]
    }

    newSections[originalIndex] = currentSection
    onSectionsChange(newSections)
  }

  const getTextSnippet = (start: number, end: number) => {
    const snippet = lyrics.substring(start, end)
    return snippet.length > 30 ? snippet.substring(0, 30) + "..." : snippet
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Tag className="mr-2 h-5 w-5" />
          Section Tagger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Select text in the editor above, then choose a section type
              </p>
              <div className="flex space-x-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Section Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "verse", label: "Verse" },
                      { value: "chorus", label: "Chorus" },
                      { value: "bridge", label: "Bridge" },
                      { value: "intro", label: "Intro" },
                      { value: "outro", label: "Outro" },
                      { value: "pre-chorus", label: "Pre-Chorus" },
                      { value: "hook", label: "Hook" },
                      { value: "instrumental", label: "Instrumental" },
                    ].map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={addSection}
                  disabled={!selectionRange || selectionRange.start >= selectionRange.end || hasOverlap}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </div>
          </div>

          {/* Overlap warning message */}
          {hasOverlap && (
            <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">{overlapMessage}</AlertDescription>
            </Alert>
          )}

          {/* Debug info - visible in deployed environment */}
          {/*<div className="mt-2 text-xs text-muted-foreground">*/}
          {/*  {debugInfo}*/}
          {/*  <br />*/}
          {/*  Button state: {canAddSection ? "Enabled" : "Disabled"}*/}
          {/*  <br />*/}
          {/*  Has overlap: {hasOverlap ? "Yes" : "No"}*/}
          {/*</div>*/}

          <div>
            <h3 className="text-sm font-medium mb-2">Tagged Sections</h3>
            {sortedSections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sections tagged yet. Select text and add a section.</p>
            ) : (
              <div className="space-y-2">
                {sortedSections.map((section, index) => (
                  <div key={index} className="flex flex-col rounded-md border p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary mr-2 whitespace-nowrap">
                          {section.type.toUpperCase()}
                        </span>
                        <span className="text-sm truncate">{getTextSnippet(section.start, section.end)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(index)}
                        className="ml-2 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Artists section - only show for non-instrumental sections */}
                    {section.type !== "instrumental" && (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Performers:</span>

                          {/* Assign button */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 text-xs ml-1">
                                <UserPlus className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-3">
                              <h4 className="font-medium text-sm mb-2">Assign Performers</h4>
                              <div className="space-y-2">
                                {allPerformers.map((artist) => {
                                  const isChecked = section.artists?.includes(artist) || false
                                  const isCurrentUser = artist === currentUser
                                  return (
                                    <div key={artist} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`artist-${index}-${artist}`}
                                        checked={isChecked}
                                        onCheckedChange={() => toggleArtistForSection(index, artist)}
                                      />
                                      <Label htmlFor={`artist-${index}-${artist}`} className="text-sm cursor-pointer">
                                        {artist} {isCurrentUser && <span className="text-muted-foreground">(Me)</span>}
                                      </Label>
                                    </div>
                                  )
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        {section.artists && section.artists.length > 0 && (
                          <>
                            {section.artists.map((artist, i) => (
                              <Badge key={i} variant="outline" className="bg-secondary/10">
                                <User className="h-3 w-3 mr-1" />
                                {artist}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 ml-1 p-0"
                                  onClick={() => toggleArtistForSection(index, artist)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

