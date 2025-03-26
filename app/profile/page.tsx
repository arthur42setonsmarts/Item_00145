"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Camera, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Default profile image URL - updated to the new image
const DEFAULT_PROFILE_IMAGE =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-HmLYtZMknO8DOflSungM5nG2aMnMhu.png"
const DEFAULT_NAME = "Chester"

export default function ProfilePage() {
  const { toast } = useToast()
  const [name, setName] = useState(DEFAULT_NAME)
  const [editName, setEditName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(DEFAULT_PROFILE_IMAGE)

  // Load saved profile data on component mount
  useEffect(() => {
    const savedName = localStorage.getItem("lyrics-manager-profile-name")
    const savedImage = localStorage.getItem("lyrics-manager-profile-image")

    if (savedName) {
      setName(savedName)
    } else {
      // Set default name if not in localStorage
      localStorage.setItem("lyrics-manager-profile-name", DEFAULT_NAME)
    }

    if (savedImage) {
      setProfileImage(savedImage)
    } else {
      // Set default image if not in localStorage
      localStorage.setItem("lyrics-manager-profile-image", DEFAULT_PROFILE_IMAGE)
    }
  }, [])

  const openEditDialog = () => {
    setEditName(name)
    setIsDialogOpen(true)
  }

  const handleSaveName = () => {
    if (editName.trim()) {
      setName(editName)
      localStorage.setItem("lyrics-manager-profile-name", editName)
      setIsDialogOpen(false)

      toast({
        title: "Profile Updated",
        description: "Your name has been updated successfully.",
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string
      setProfileImage(imageDataUrl)
      localStorage.setItem("lyrics-manager-profile-image", imageDataUrl)

      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      })
    }
    reader.readAsDataURL(file)
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={name} />
                  ) : (
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute bottom-1 right-1">
                  <Label htmlFor="picture" className="cursor-pointer">
                    <div className="rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:bg-primary/90 border-2 border-background">
                      <Camera className="h-4 w-4" />
                    </div>
                  </Label>
                  <Input id="picture" type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <h2 className="text-xl font-semibold">{name}</h2>
                <Button variant="ghost" size="icon" onClick={openEditDialog} className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Your Name</DialogTitle>
            <DialogDescription>Enter your name as you'd like it to appear in the app.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveName}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

