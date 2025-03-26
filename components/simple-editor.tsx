"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  onSelectionChange?: (selection: { start: number; end: number } | null) => void
  sections?: { start: number; end: number; type: string; artists?: string[] }[]
  sectionColors?: Record<string, string>
  placeholder?: string
  className?: string
}

// Light mode colors
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

export function SimpleEditor({
  value,
  onChange,
  onSelectionChange,
  sections = [],
  sectionColors = defaultSectionColors,
  placeholder = "Write your lyrics here...",
  className,
}: SimpleEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Add a function to clear selection when needed
  const clearSelection = () => {
    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(0, 0)
      textareaRef.current.blur()
    }

    if (window.getSelection) {
      if (window.getSelection()?.empty) {
        window.getSelection()?.empty()
      } else if (window.getSelection()?.removeAllRanges) {
        window.getSelection()?.removeAllRanges()
      }
    }

    // Also notify parent component
    if (onSelectionChange) {
      onSelectionChange(null)
    }
  }

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

  // Handle selection changes
  const handleSelectionChange = () => {
    if (!onSelectionChange || !textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Report the selection range
    if (start !== end) {
      console.log("Textarea selection:", { start, end })
      onSelectionChange({ start, end })
    } else {
      onSelectionChange(null)
    }
  }

  // Set up selection change listener
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Add multiple event listeners to ensure we catch all selection changes
    const events = ["select", "click", "keyup", "mouseup", "touchend"]

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
  }, [onSelectionChange])

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  // Generate highlighted HTML
  const getHighlightedHtml = () => {
    if (!sections || sections.length === 0) return escapeHtml(value)

    // Sort sections by start position
    const sortedSections = [...sections].sort((a, b) => a.start - b.start)

    let html = ""
    let lastIndex = 0

    // Get the appropriate color set based on theme
    const colors = isDarkMode ? darkModeSectionColors : defaultSectionColors

    // Process each section
    sortedSections.forEach((section) => {
      // Add text before this section
      if (section.start > lastIndex) {
        html += escapeHtml(value.substring(lastIndex, section.start))
      }

      // Add the highlighted section
      const sectionText = value.substring(section.start, section.end)
      const colorKey = section.type as keyof typeof colors
      const bgColor = colors[colorKey] || (isDarkMode ? "#2d2d2d" : "#f0f0f0")

      // We'll no longer add performer names directly in the highlighted HTML
      html += `<span style="background-color: ${bgColor};">${escapeHtml(sectionText)}</span>`

      lastIndex = section.end
    })

    // Add any remaining text
    if (lastIndex < value.length) {
      html += escapeHtml(value.substring(lastIndex))
    }

    return html
  }

  // Helper function to escape HTML
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>")
  }

  // Sync scroll position between textarea and highlight div
  useEffect(() => {
    const textarea = textareaRef.current
    const highlight = highlightRef.current

    if (!textarea || !highlight) return

    const syncScroll = () => {
      highlight.scrollTop = textarea.scrollTop
      highlight.scrollLeft = textarea.scrollLeft
    }

    textarea.addEventListener("scroll", syncScroll)
    return () => textarea.removeEventListener("scroll", syncScroll)
  }, [])

  // Add this to the component's exports
  useEffect(() => {
    // Expose the clearSelection method to the parent via ref
    if (typeof window !== "undefined") {
      // This will help ensure selection is cleared when sections change
      const handleSectionChange = () => {
        clearSelection()
      }

      document.addEventListener("sectionAdded", handleSectionChange)
      return () => {
        document.removeEventListener("sectionAdded", handleSectionChange)
      }
    }
  }, [])

  return (
    <div className="relative border border-input rounded-md">
      {/* Highlighted background (read-only) */}
      <pre
        ref={highlightRef}
        className="absolute inset-0 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap bg-background"
        style={{ margin: 0 }}
        dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
      />

      {/* Actual editable textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "w-full min-h-[300px] p-4 font-mono text-sm resize-none relative",
          isFocused && "ring-2 ring-ring ring-offset-2",
          className,
        )}
        style={{
          background: "transparent",
          color: "transparent",
          caretColor: isDarkMode ? "white" : "black",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  )
}

