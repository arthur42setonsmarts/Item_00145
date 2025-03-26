"use client"

import { useEffect } from "react"
import mermaid from "mermaid"

interface SongStructureDiagramProps {
  sections: {
    start: number
    end: number
    type: string
    artists?: string[]
  }[]
  lyrics: string
}

export function SongStructureDiagram({ sections, lyrics }: SongStructureDiagramProps) {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    })

    const sortedSections = [...sections].sort((a, b) => a.start - b.start)

    let diagram = "graph TD;\n"

    // Add nodes for each section
    sortedSections.forEach((section, index) => {
      const snippet = lyrics.substring(section.start, section.end).split("\n")[0]
      const displayText = snippet.length > 20 ? snippet.substring(0, 20) + "..." : snippet

      // Add performer names if present
      let performerText = ""
      if (section.artists && section.artists.length > 0) {
        performerText = ` (${section.artists.join(", ")})`
      }

      diagram += `section${index}["${section.type.toUpperCase()}${performerText}: ${displayText}"]\n`
    })

    // Connect sections in sequence
    for (let i = 0; i < sortedSections.length - 1; i++) {
      diagram += `section${i} --> section${i + 1}\n`
    }

    // Add styling
    sortedSections.forEach((section, index) => {
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

    const element = document.getElementById("song-structure-diagram")
    if (element) {
      element.innerHTML = diagram
      mermaid.contentLoaded()
    }
  }, [sections, lyrics])

  return null
}

