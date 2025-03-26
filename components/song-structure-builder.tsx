"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { useSongStore } from "@/lib/stores/song-store"
import { ArrowUp, ArrowDown, Save, UndoIcon, Music, X, Info, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import mermaid from "mermaid"
import { ToastAction } from "@/components/ui/toast"

interface SongStructureBuilderProps {
  id: string
}

// Define a type for our section structure
type ArrangedSection = {
  id: string
  type: string
  content: string
  originalStart: number
  originalEnd: number
}

export function SongStructureBuilder({ id }: SongStructureBuilderProps) {
  const { songs, updateSong, saveSongArrangement } = useSongStore()
  const { toast } = useToast()
  const song = songs.find((s) => s.id === id)
  const diagramRef = useRef<HTMLDivElement>(null)

  // Current arrangement that the user is working with
  const [currentArrangement, setCurrentArrangement] = useState<ArrangedSection[]>([])

  // The last saved arrangement (what's in the database/store)
  const [lastSavedArrangement, setLastSavedArrangement] = useState<ArrangedSection[]>([])

  // The arrangement to restore when clicking undo (captured at save time)
  const [undoArrangement, setUndoArrangement] = useState<ArrangedSection[] | null>(null)

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // State for the section viewer modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<{
    type: string
    content: string
  } | null>(null)

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Initialize arrangements from song data
  useEffect(() => {
    if (!song) return

    let sectionsToUse: ArrangedSection[] = []

    // Check if song has arrangement and it's an array
    if (song.arrangement && Array.isArray(song.arrangement) && song.arrangement.length > 0) {
      // If the song has a saved arrangement, use that
      sectionsToUse = song.arrangement.map((section, index) => ({
        id: `section-${index}-${Date.now()}`,
        type: section.type || "unknown",
        content: song.lyrics.substring(
          typeof section.start === "number" ? section.start : 0,
          typeof section.end === "number" ? section.end : 0,
        ),
        originalStart: typeof section.start === "number" ? section.start : 0,
        originalEnd: typeof section.end === "number" ? section.end : 0,
      }))
    }
    // Check if song has sections and it's an array
    else if (song.sections && Array.isArray(song.sections) && song.sections.length > 0) {
      // Otherwise use the sections sorted by position
      sectionsToUse = song.sections.map((section, index) => ({
        id: `section-${index}-${Date.now()}`,
        type: section.type || "unknown",
        content: song.lyrics.substring(
          typeof section.start === "number" ? section.start : 0,
          typeof section.end === "number" ? section.end : 0,
        ),
        originalStart: typeof section.start === "number" ? section.start : 0,
        originalEnd: typeof section.end === "number" ? section.end : 0,
      }))

      // Sort by their position in the lyrics
      sectionsToUse.sort((a, b) => a.originalStart - b.originalStart)
    }

    // Create copies to ensure we're working with separate objects
    const arrangedSections = [...sectionsToUse]
    setCurrentArrangement(arrangedSections)
    setLastSavedArrangement(arrangedSections)

    // Initialize undoArrangement with the same data to ensure we always have something to restore
    // This ensures we always have a valid state to restore to
    setUndoArrangement(arrangedSections)

    setHasUnsavedChanges(false)
  }, [song])

  // Check for changes whenever currentArrangement changes
  useEffect(() => {
    // Ensure both arrays exist and have elements
    if (!Array.isArray(lastSavedArrangement) || !Array.isArray(currentArrangement)) {
      setHasUnsavedChanges(false)
      return
    }

    if (lastSavedArrangement.length > 0 && currentArrangement.length > 0) {
      // Only set hasUnsavedChanges to true if the arrangement has actually changed
      if (lastSavedArrangement.length !== currentArrangement.length) {
        setHasUnsavedChanges(true)
        return
      }

      // Compare each section's position and type
      const hasChanges = currentArrangement.some((section, index) => {
        const savedSection = lastSavedArrangement[index]
        return (
          section.type !== savedSection.type ||
          section.originalStart !== savedSection.originalStart ||
          section.originalEnd !== savedSection.originalEnd
        )
      })

      setHasUnsavedChanges(hasChanges)
    }
  }, [currentArrangement, lastSavedArrangement])

  // Initialize mermaid
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          htmlLabels: true,
          curve: "linear",
        },
      })
    } catch (error) {
      console.error("Error initializing mermaid:", error)
    }
  }, [])

  // Function to handle node clicks in the diagram
  const handleNodeClick = useCallback(
    (sectionIndex: number) => {
      if (!Array.isArray(currentArrangement)) return

      if (sectionIndex >= 0 && sectionIndex < currentArrangement.length) {
        const section = currentArrangement[sectionIndex]
        setSelectedSection({
          type: section.type,
          content: section.content,
        })
        setIsDialogOpen(true)
      }
    },
    [currentArrangement],
  )

  // Render diagram when currentArrangement changes
  useEffect(() => {
    if (!Array.isArray(currentArrangement) || currentArrangement.length === 0 || !diagramRef.current) return

    const renderDiagram = async () => {
      try {
        // Clear previous diagram
        diagramRef.current!.innerHTML = ""

        // Create diagram definition
        let diagram = "graph TD;\n"

        // Add nodes for each section - only show the type
        currentArrangement.forEach((section, index) => {
          diagram += `section${index}["${section.type.toUpperCase()}"]\n`
        })

        // Connect sections in sequence
        for (let i = 0; i < currentArrangement.length - 1; i++) {
          diagram += `section${i} --> section${i + 1}\n`
        }

        // Add styling
        currentArrangement.forEach((section, index) => {
          let style = ""
          switch (section.type) {
            case "verse":
              style = "fill:#d4f1f9,stroke:#05c,stroke-width:2px"
              break
            case "chorus":
              style = "fill:#ffd3d3,stroke:#c00,stroke-width:2px"
              break
            case "bridge":
              style = "fill:#e1d4f9,stroke:#609,stroke-width:2px"
              break
            case "intro":
              style = "fill:#d4f9d4,stroke:#090,stroke-width:2px"
              break
            case "outro":
              style = "fill:#f9f9d4,stroke:#990,stroke-width:2px"
              break
            default:
              style = "fill:#f9f9f9,stroke:#999,stroke-width:2px"
          }
          diagram += `style section${index} ${style}\n`
        })

        // Render the diagram
        const { svg } = await mermaid.render(`mermaid-diagram-${Date.now()}`, diagram)
        diagramRef.current!.innerHTML = svg

        // Add global styles for clickable nodes
        const styleElement = document.createElement("style")
        styleElement.textContent = `
          .song-diagram [id*="section"] { cursor: pointer !important; }
          .song-diagram [id*="section"] * { cursor: pointer !important; }
          .song-diagram .node { cursor: pointer !important; }
          .song-diagram .node rect, .song-diagram .node circle, .song-diagram .node ellipse, 
          .song-diagram .node polygon, .song-diagram .node path { cursor: pointer !important; }
          .song-diagram .node text { cursor: pointer !important; }
        `
        diagramRef.current!.appendChild(styleElement)

        // Add click handlers to the SVG elements after rendering
        setTimeout(() => {
          currentArrangement.forEach((_, index) => {
            // Find the g element that contains the node
            const nodeElement =
              diagramRef.current!.querySelector(`g[id="section${index}"]`) ||
              diagramRef.current!.querySelector(`g[id="mermaid-diagram-section${index}"]`) ||
              diagramRef.current!.querySelector(`[id*="section${index}"]`)

            if (nodeElement) {
              // Make the node clickable with !important to override any SVG styles
              nodeElement.setAttribute("style", "cursor: pointer !important")

              // Add click event listener
              nodeElement.addEventListener("click", (e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNodeClick(index)
              })

              // Also make all child elements clickable
              const childElements = nodeElement.querySelectorAll("*")
              childElements.forEach((el) => {
                el.setAttribute("style", "cursor: pointer !important")
                el.addEventListener("click", (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNodeClick(index)
                })
              })
            } else {
              console.warn(`Could not find node element for section${index}`)
            }
          })
        }, 100) // Small delay to ensure the SVG is fully rendered
      } catch (error) {
        console.error("Error rendering mermaid diagram:", error)
        diagramRef.current!.innerHTML = `<div class="p-4 text-red-500">Error rendering diagram: ${error}</div>`
      }
    }

    renderDiagram()
  }, [currentArrangement, handleNodeClick])

  // Alternative approach: Add click handler to the entire diagram
  useEffect(() => {
    if (!diagramRef.current) return

    const handleDiagramClick = (e: MouseEvent) => {
      // Find the closest g element that might be a node
      let target = e.target as Element
      let nodeId = null

      // Traverse up the DOM to find a g element with an id that contains "section"
      while (target && target !== diagramRef.current) {
        const id = target.id || ""
        if (id.includes("section")) {
          nodeId = id
          break
        }
        target = target.parentElement!
      }

      if (nodeId) {
        // Extract the section index from the id
        const match = nodeId.match(/section(\d+)/)
        if (match && match[1]) {
          const sectionIndex = Number.parseInt(match[1], 10)
          handleNodeClick(sectionIndex)
        }
      }
    }

    diagramRef.current.addEventListener("click", handleDiagramClick)

    return () => {
      if (diagramRef.current) {
        diagramRef.current.removeEventListener("click", handleDiagramClick)
      }
    }
  }, [currentArrangement, handleNodeClick])

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (!Array.isArray(currentArrangement)) return

    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Create a new array with the swapped items
      const newArrangement = [...currentArrangement]

      // Swap the items
      ;[newArrangement[draggedIndex], newArrangement[dragOverIndex]] = [
        newArrangement[dragOverIndex],
        newArrangement[draggedIndex],
      ]

      setCurrentArrangement(newArrangement)
      // Changes are automatically detected by the useEffect
    }

    // Reset drag state
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const moveSection = (index: number, direction: "up" | "down") => {
    if (!Array.isArray(currentArrangement)) return

    if ((direction === "up" && index === 0) || (direction === "down" && index === currentArrangement.length - 1)) {
      return
    }

    // Create a new array with the current arrangement
    const newArrangement = [...currentArrangement]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    // Swap the sections
    const temp = newArrangement[index]
    newArrangement[index] = newArrangement[targetIndex]
    newArrangement[targetIndex] = temp

    // Update the state with the new arrangement
    setCurrentArrangement(newArrangement)
  }

  const restoreToSaved = () => {
    if (!Array.isArray(lastSavedArrangement)) return

    // Restore to the last saved arrangement
    setCurrentArrangement([...lastSavedArrangement])

    // No unsaved changes after restoring
    setHasUnsavedChanges(false)

    toast({
      title: "Changes Discarded",
      description: "Your song structure has been restored to the last saved version.",
      variant: "default",
    })
  }

  // Completely rewritten saveArrangement function
  const saveArrangement = () => {
    if (!song || !Array.isArray(currentArrangement)) {
      return
    }

    // Always ensure we have a valid undo state before saving
    // Store the current lastSavedArrangement for undo
    if (Array.isArray(lastSavedArrangement)) {
      // Make a deep copy to ensure we don't have reference issues
      const undoState = lastSavedArrangement.map((section) => ({ ...section }))
      setUndoArrangement(undoState)
    }

    // Convert the current arrangement to the format expected by the store
    // Make sure to preserve the artists data
    const arrangementData = currentArrangement.map((section) => ({
      type: section.type,
      start: section.originalStart,
      end: section.originalEnd,
      artists: section.artists || [], // Preserve artists data
    }))

    try {
      // Update the song in the store
      const updatedSong = {
        ...song,
        arrangement: arrangementData,
        updatedAt: new Date().toISOString(),
      }

      // Create a new version
      const newVersion = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        lyrics: song.lyrics,
        sections: song.sections,
        arrangement: arrangementData,
      }

      // Add the new version to the song
      updatedSong.versions = [...(song.versions || []), newVersion]

      // Update the song in the store
      updateSong(updatedSong)

      // Update the lastSavedArrangement to match the current arrangement
      // Make a deep copy to ensure we don't have reference issues
      const newSavedState = currentArrangement.map((section) => ({ ...section }))
      setLastSavedArrangement(newSavedState)

      // No unsaved changes after saving
      setHasUnsavedChanges(false)

      // Show a toast with an undo button
      toast({
        title: "Arrangement Saved",
        description: "Your song structure has been saved.",
        action: (
          <ToastAction altText="Undo" onClick={undoSave}>
            Undo
          </ToastAction>
        ),
      })
    } catch (error) {
      console.error("Error saving arrangement:", error)

      toast({
        title: "Error Saving",
        description: "There was an error saving your arrangement.",
        variant: "destructive",
      })
    }
  }

  // Completely rewritten undoSave function
  const undoSave = () => {
    if (!song) {
      toast({
        title: "Error",
        description: "Song data is not available.",
        variant: "destructive",
      })
      return
    }

    if (!undoArrangement || !Array.isArray(undoArrangement) || undoArrangement.length === 0) {
      toast({
        title: "Cannot Undo",
        description: "No previous arrangement data is available to restore.",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert the undo arrangement to the format expected by the store
      const arrangementData = undoArrangement.map((section) => ({
        type: section.type,
        start: section.originalStart,
        end: section.originalEnd,
      }))

      // Update the song in the store
      const updatedSong = {
        ...song,
        arrangement: arrangementData,
        updatedAt: new Date().toISOString(),
      }

      // Update the song in the store
      updateSong(updatedSong)

      // Update both the current and last saved arrangement to the undo arrangement
      // Make deep copies to avoid reference issues
      const restoredArrangement = undoArrangement.map((section) => ({ ...section }))
      setCurrentArrangement(restoredArrangement)
      setLastSavedArrangement(restoredArrangement)

      // No unsaved changes after restoring
      setHasUnsavedChanges(false)

      toast({
        title: "Save Undone",
        description: "Your song structure has been restored to the previous saved version.",
      })
    } catch (error) {
      console.error("Error undoing save:", error)

      toast({
        title: "Error Undoing",
        description: "There was an error undoing your last save.",
        variant: "destructive",
      })
    }
  }

  if (!song) {
    return <div>Song not found</div>
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Music className="mr-2 h-5 w-5" />
                Song Structure Builder
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={restoreToSaved} disabled={!hasUnsavedChanges}>
                  <UndoIcon className="mr-2 h-4 w-4" />
                  Discard Changes
                </Button>
                <Button size="sm" onClick={saveArrangement} disabled={!hasUnsavedChanges}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Arrangement
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!Array.isArray(currentArrangement) || currentArrangement.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  No sections have been tagged yet. Go to the Editor tab and tag sections of your lyrics first.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  {currentArrangement.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-3 border rounded-md transition-colors ${
                        draggedIndex === index
                          ? "opacity-50 bg-accent"
                          : dragOverIndex === index
                            ? "border-primary border-2"
                            : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="mr-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedSection({
                            type: section.type,
                            content: section.content,
                          })
                          setIsDialogOpen(true)
                        }}
                      >
                        <div className="flex items-center">
                          <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary mr-2 whitespace-nowrap">
                            {section.type.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium">
                            {section.content.split("\n")[0]?.substring(0, 40) || ""}
                            {(section.content.split("\n")[0]?.length || 0) > 40 ? "..." : ""}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {section.content.split("\n").length > 1
                            ? `${section.content.split("\n").length} lines`
                            : "1 line"}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSection(index, "up")}
                          disabled={index === 0}
                          className="h-8 w-8"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSection(index, "down")}
                          disabled={index === currentArrangement.length - 1}
                          className="h-8 w-8"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Song Structure Visualization</h3>
                  <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 mb-4">
                    <Info className="h-5 w-5 flex-shrink-0" />
                    <p>Click on any section in the diagram to view its content.</p>
                  </div>
                  <div
                    ref={diagramRef}
                    className="w-full overflow-x-auto song-diagram"
                    style={
                      {
                        "--diagram-cursor": "pointer",
                      } as React.CSSProperties
                    }
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Viewer Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedSection?.type.toUpperCase()} Section</span>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogTitle>
            <DialogDescription>View the content of this section</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="rounded-md border bg-muted/50 p-4 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[50vh]">
              {selectedSection?.content || "No content available"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

