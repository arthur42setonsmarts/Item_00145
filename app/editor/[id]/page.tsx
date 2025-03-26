import { DashboardShell } from "@/components/dashboard-shell"
import { LyricsEditor } from "@/components/lyrics-editor"
import { SongMetadataForm } from "@/components/song-metadata-form"
import { VersionHistory } from "@/components/version-history"
import { SongStructureBuilder } from "@/components/song-structure-builder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Edit, History, Music } from "lucide-react"

export default function EditorPage({ params }: { params: { id: string } }) {
  const isNewSong = params.id === "new"

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isNewSong ? "Create New Song" : "Edit Song"}</h1>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-center overflow-x-auto">
            <TabsTrigger value="details" className="flex items-center">
              <FileText className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline-block">Details</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center">
              <Edit className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline-block">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="versions" disabled={isNewSong} className="flex items-center">
              <History className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline-block">History</span>
            </TabsTrigger>
            <TabsTrigger value="structure" disabled={isNewSong} className="flex items-center">
              <Music className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline-block">Structure</span>
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

