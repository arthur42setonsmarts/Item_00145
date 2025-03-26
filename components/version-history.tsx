"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { History, Eye } from "lucide-react"
import { useSongStore } from "@/lib/stores/song-store"
import { formatDistanceToNow } from "@/lib/utils"

interface VersionHistoryProps {
  id: string
}

export function VersionHistory({ id }: VersionHistoryProps) {
  const { songs } = useSongStore()
  const song = songs.find((s) => s.id === id)
  const versions = song?.versions || []

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const selectedVersionData = versions.find((v) => v.id === selectedVersion)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (!song) {
    return <div>Song not found</div>
  }

  const handleViewVersion = (versionId: string) => {
    setSelectedVersion(versionId)
    setIsDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No versions available
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((version, index) => (
                  <TableRow key={version.id}>
                    <TableCell>{index === versions.length - 1 ? "Current" : `Version ${index + 1}`}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(version.timestamp))}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewVersion(version.id)}>
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline-block sm:ml-2">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Version from {selectedVersionData ? new Date(selectedVersionData.timestamp).toLocaleString() : ""}
            </DialogTitle>
            <DialogDescription>
              {versions.findIndex((v) => v.id === selectedVersion) === versions.length - 1
                ? "Current version"
                : `Version ${versions.findIndex((v) => v.id === selectedVersion) + 1} of ${versions.length}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="rounded-md border bg-muted/50 p-4 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[50vh]">
              {selectedVersionData?.lyrics || "No content available"}
            </div>

            {selectedVersionData?.sections && selectedVersionData.sections.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Sections in this version:</h4>
                <div className="space-y-2">
                  {selectedVersionData.sections.map((section, index) => {
                    const snippet = selectedVersionData.lyrics.substring(section.start, section.end)
                    const displaySnippet = snippet.length > 30 ? snippet.substring(0, 30) + "..." : snippet

                    return (
                      <div key={index} className="flex items-center rounded-md border p-2 text-sm">
                        <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary mr-2">
                          {section.type}
                        </span>
                        <span>{displaySnippet}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

