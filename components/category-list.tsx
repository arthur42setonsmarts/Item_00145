"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Plus, Trash } from "lucide-react"
import { useCategoryStore } from "@/lib/stores/category-store"
import { useSongStore } from "@/lib/stores/song-store"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

export function CategoryList() {
  const { categories, addCategory, updateCategory, removeCategory } = useCategoryStore()
  const { songs } = useSongStore()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")

  // Use refs to store previous state for undo operations
  const previousCategoryRef = useRef<{ id: string; name: string; createdAt: string } | null>(null)
  const undoActionRef = useRef<"edit" | "delete" | null>(null)

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString(),
      }

      addCategory(newCategory)
      setNewCategoryName("")
      setIsAddDialogOpen(false)

      toast({
        title: "Category Added",
        description: `"${newCategoryName.trim()}" has been added to your categories.`,
      })
    }
  }

  const handleEditCategory = () => {
    if (editCategoryId && editCategoryName.trim()) {
      // Store the previous state for undo functionality
      const categoryToEdit = categories.find((cat) => cat.id === editCategoryId)
      if (categoryToEdit) {
        previousCategoryRef.current = { ...categoryToEdit }
        undoActionRef.current = "edit"
      }

      // Update the category
      updateCategory(editCategoryId, {
        name: editCategoryName.trim(),
      })

      // Show toast with undo option
      toast({
        title: "Category Updated",
        description: `Category has been renamed to "${editCategoryName.trim()}".`,
        action: (
          <ToastAction altText="Undo" onClick={handleUndo}>
            Undo
          </ToastAction>
        ),
      })

      setEditCategoryId(null)
      setEditCategoryName("")
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteCategory = (id: string) => {
    // Store the category before removing it for potential undo
    const categoryToDelete = categories.find((cat) => cat.id === id)
    if (categoryToDelete) {
      previousCategoryRef.current = { ...categoryToDelete }
      undoActionRef.current = "delete"

      // Remove the category
      removeCategory(id)

      // Show toast with undo option
      toast({
        title: "Category Deleted",
        description: `"${categoryToDelete.name}" has been deleted.`,
        action: (
          <ToastAction altText="Undo" onClick={handleUndo}>
            Undo
          </ToastAction>
        ),
      })
    }
  }

  const handleUndo = () => {
    if (!previousCategoryRef.current) return

    const prevCategory = previousCategoryRef.current
    const action = undoActionRef.current

    if (action === "delete") {
      // Restore the deleted category
      addCategory(prevCategory)
      toast({
        title: "Deletion Undone",
        description: `"${prevCategory.name}" has been restored.`,
      })
    } else if (action === "edit") {
      // Restore the previous name
      updateCategory(prevCategory.id, {
        name: prevCategory.name,
      })
      toast({
        title: "Change Undone",
        description: `Category name has been restored to "${prevCategory.name}".`,
      })
    }

    // Clear the refs
    previousCategoryRef.current = null
    undoActionRef.current = null
  }

  const openEditDialog = (id: string, name: string) => {
    setEditCategoryId(id)
    setEditCategoryName(name)
    setIsEditDialogOpen(true)
  }

  const getSongCountForCategory = (categoryName: string) => {
    return songs.filter((song) => song.categories && song.categories.includes(categoryName)).length
  }

  return (
    <div className="space-y-4">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new category to organize your songs</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category name</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="edit-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-md border border-dashed p-8">
            <div className="text-center">
              <h3 className="text-lg font-medium">No categories yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Create categories to organize your songs</p>
              {/* Removed the redundant "Add Category" button */}
            </div>
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{category.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(category.id, category.name)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{getSongCountForCategory(category.name)} songs</CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

