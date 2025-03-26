"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

interface EnhancedLyricsEditorProps {
  value: string
  onChange: (value: string) => void
  onSelectionChange?: (selection: { start: number; end: number } | null) => void
  sections?: { start: number; end: number; type: string }[]
  sectionColors?: Record<string, string>
  placeholder?: string
  className?: string
  showHighlighting?: boolean
}

const defaultSectionColors: Record<string, string> = {
  verse: "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60",
  chorus: "bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60",
  bridge: "bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-800/60",
  intro: "bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-800/60",
  outro: "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-800/60",
  "pre-chorus": "bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/40 dark:hover:bg-pink-800/60",
  hook: "bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/40 dark:hover:bg-orange-800/60",
  instrumental: "bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/40 dark:hover:bg-teal-800/60",
}

export function EnhancedLyricsEditor({
  value,
  onChange,
  onSelectionChange,
  sections = [],
  sectionColors = defaultSectionColors,
  placeholder = "Write your lyrics here...",
  className,
  showHighlighting = true,
}: EnhancedLyricsEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Default color for section types not in the map
  const defaultSectionColor = "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/40 dark:hover:bg-gray-700/60"

  // Generate highlighted HTML
  const highlightedHtml = useMemo(() => {
    if (!value) return ""

    if (!sections.length) return value

    // Sort sections by start position to process them in order
    const sortedSections = [...sections].sort((a, b) => a.start - b.start)

    // Create an array of characters with their styling
    const characters: { char: string; className: string | null; sectionType: string | null }[] = value
      .split("")
      .map((char) => ({
        char,
        className: null,
        sectionType: null,
      }))

    // Apply section styling to characters
    sortedSections.forEach((section) => {
      const colorClass = sectionColors[section.type] || defaultSectionColor
      for (let i = section.start; i < section.end && i < characters.length; i++) {
        characters[i].className = colorClass
        characters[i].sectionType = section.type
      }
    })

    // Group consecutive characters with the same styling
    let html = ""
    let currentClass: string | null = null
    let currentSectionType: string | null = null
    let currentText = ""

    characters.forEach((charInfo) => {
      if (charInfo.className !== currentClass || charInfo.sectionType !== currentSectionType) {
        if (currentText) {
          if (currentClass) {
            html += `<span class="${currentClass}" data-section-type="${currentSectionType}">${currentText}</span>`
          } else {
            html += currentText
          }
        }
        currentClass = charInfo.className
        currentSectionType = charInfo.sectionType
        currentText = charInfo.char
      } else {
        currentText += charInfo.char
      }
    })

    // Add the last span
    if (currentText) {
      if (currentClass) {
        html += `<span class="${currentClass}" data-section-type="${currentSectionType}">${currentText}</span>`
      } else {
        html += currentText
      }
    }

    return html
  }, [value, sections, sectionColors, defaultSectionColor])

  // Handle input changes
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerText
      onChange(newValue)
    }
  }

  // Handle paste to strip formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  // Handle selection changes - simplified approach
  const handleSelectionChange = () => {
    if (!onSelectionChange || !editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      onSelectionChange(null)
      return
    }

    // Check if selection is within our editor
    const range = selection.getRangeAt(0)
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      onSelectionChange(null)
      return
    }

    // If there's no actual selection (just cursor position), return null
    if (range.collapsed) {
      onSelectionChange(null)
      return
    }

    try {
      // Get the selected text
      const selectedText = selection.toString()
      if (!selectedText || selectedText.length === 0) {
        onSelectionChange(null)
        return
      }

      // Get the full text content
      const fullText = editorRef.current.innerText

      // Create a range from the start of the editor to the start of the selection
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(editorRef.current)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const start = preSelectionRange.toString().length

      // The end is simply start + selection length
      const end = start + selectedText.length

      onSelectionChange({ start, end })
    } catch (error) {
      console.error("Error calculating selection:", error)
      onSelectionChange(null)
    }
  }

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== value) {
      if (showHighlighting) {
        editorRef.current.innerHTML = highlightedHtml || placeholder
      } else {
        editorRef.current.innerText = value || placeholder
      }
    }
  }, [value, showHighlighting, highlightedHtml, placeholder])

  // Set up selection change listener
  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [])

  return (
    <div
      className={cn(
        "relative min-h-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        isFocused && "ring-2 ring-ring ring-offset-2",
        !value && "text-muted-foreground",
        className,
      )}
    >
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyUp={handleSelectionChange}
        onMouseUp={handleSelectionChange}
        dangerouslySetInnerHTML={{ __html: showHighlighting ? highlightedHtml || placeholder : value || placeholder }}
        className="outline-none whitespace-pre-wrap font-mono min-h-[300px] w-full"
        spellCheck={false}
      />
    </div>
  )
}

