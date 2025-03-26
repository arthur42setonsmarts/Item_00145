import { DashboardShell } from "@/components/dashboard-shell"
import { LyricsEditor } from "@/components/lyrics-editor"
import { SongMetadataForm } from "@/components/song-metadata-form"
import { VersionHistory } from "@/components/version-history"
import { SongStructureBuilder } from "@/components/song-structure-builder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditorPage({ params }: { params: { id: string } }) {
  const isNewSong = params.id === "new"

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNewSong ? "Create New Song" : "Edit Song"}</h1>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Song Details</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="versions" disabled={isNewSong}>
              Version History
            </TabsTrigger>
            <TabsTrigger value="structure" disabled={isNewSong}>
              Song Structure
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <SongMetadataForm id={params.id} />
          </TabsContent>
          <TabsContent value="editor" className="mt-4">
            <LyricsEditor id={params.id} />
          </TabsContent>
          <TabsContent value="versions" className="mt-4">
            <VersionHistory id={params.id} />
          </TabsContent>
          <TabsContent value="structure" className="mt-4">
            <SongStructureBuilder id={params.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

