"use client"

import { useState, useRef, useEffect } from "react"
import Editor from "react-simple-code-editor"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
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
  verse: "#d4f1f9",
  chorus: "#ffd3d3",
  bridge: "#e1d4f9",
  intro: "#d4f9d4",
  outro: "#f9f9d4",
  "pre-chorus": "#f9d4f9",
  hook: "#f9d4d4",
  instrumental: "#d4f9f9",
}

// Dark mode colors
const darkSectionColors: Record<string, string> = {
  verse: "#0c3b4a",
  chorus: "#4a0c0c",
  bridge: "#2c0c4a",
  intro: "#0c4a0c",
  outro: "#4a4a0c",
  "pre-chorus": "#4a0c4a",
  hook: "#4a1c0c",
  instrumental: "#0c4a4a",
}

export function CodeEditor({
  value,
  onChange,
  onSelectionChange,
  sections = [],
  sectionColors = defaultSectionColors,
  placeholder = "Write your lyrics here...",
  className,
  showHighlighting = true,
}: CodeEditorProps) {
  const editorRef = useRef<Editor>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)

  // Check for dark mode
  useEffect(() => {
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDark = document.documentElement.classList.contains("dark")
          setIsDarkMode(isDark)
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => {
      observer.disconnect()
    }
  }, [])

  // Direct DOM selection check - runs on a timer
  useEffect(() => {
    if (!onSelectionChange) return

    // Function to check selection
    const checkSelection = () => {
      if (!editorRef.current || !editorRef.current._input) return

      const textarea = editorRef.current._input
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      // Only report when there's an actual selection
      if (start !== end) {
        console.log("Selection detected:", { start, end })
        setHasSelection(true)
        onSelectionChange({ start, end })
      } else if (hasSelection) {
        // Only reset if we previously had a selection
        console.log("Selection cleared")
        setHasSelection(false)
        onSelectionChange(null)
      }
    }

    // Check selection immediately
    checkSelection()

    // Set up interval to check selection regularly
    const intervalId = setInterval(checkSelection, 500)

    return () => {
      clearInterval(intervalId)
    }
  }, [onSelectionChange, hasSelection])

  // Handle selection changes via events
  const handleSelectionChange = () => {
    if (!onSelectionChange || !editorRef.current) return

    // Get the textarea element inside the editor
    const textarea = editorRef.current._input
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Report the selection range
    if (start !== end) {
      console.log("Event-based selection:", { start, end })
      setHasSelection(true)
      onSelectionChange({ start, end })
    } else if (hasSelection) {
      console.log("Event-based selection cleared")
      setHasSelection(false)
      onSelectionChange(null)
    }
  }

  // Set up selection change listener
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !editor._input) return

    const textarea = editor._input

    // Add multiple event listeners to ensure we catch all selection changes
    const events = ["select", "click", "keyup", "mouseup", "touchend", "focus", "blur"]

    events.forEach((event) => {
      textarea.addEventListener(event, handleSelectionChange)
    })

    // Also listen for the global selectionchange event
    document.addEventListener("selectionchange", handleSelectionChange)

    return () => {
      if (textarea) {
        events.forEach((event) => {
          textarea.removeEventListener(event, handleSelectionChange)
        })
      }
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [hasSelection])

  // Custom highlighting function
  const highlightText = (code: string) => {
    if (!showHighlighting || !sections.length) return code

    // Sort sections by start position
    const sortedSections = [...sections].sort((a, b) => a.start - b.start)

    // Create an array to hold the highlighted parts
    const parts: string[] = []
    let lastIndex = 0

    sortedSections.forEach((section) => {
      // Add text before this section
      if (section.start > lastIndex) {
        parts.push(code.substring(lastIndex, section.start))
      }

      // Add the highlighted section
      const sectionText = code.substring(section.start, section.end)
      const colorKey = section.type as keyof typeof sectionColors
      const bgColor = isDarkMode ? darkSectionColors[colorKey] || "#2d2d2d" : sectionColors[colorKey] || "#f0f0f0"

      parts.push(`<span style="background-color: ${bgColor};">${sectionText}</span>`)

      lastIndex = section.end
    })

    // Add any remaining text
    if (lastIndex < code.length) {
      parts.push(code.substring(lastIndex))
    }

    return parts.join("")
  }

  return (
    <div
      className={cn(
        "relative min-h-[300px] rounded-md border border-input bg-background ring-offset-background",
        isFocused && "ring-2 ring-ring ring-offset-2",
        className,
      )}
    >
      <Editor
        ref={editorRef}
        value={value}
        onValueChange={onChange}
        highlight={highlightText}
        padding={16}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyUp={handleSelectionChange}
        onMouseUp={handleSelectionChange}
        placeholder={placeholder}
        style={{
          fontFamily: "monospace",
          fontSize: "14px",
          minHeight: "300px",
          width: "100%",
        }}
        textareaClassName="outline-none"
        preClassName="language-lyrics"
      />
    </div>
  )
}

