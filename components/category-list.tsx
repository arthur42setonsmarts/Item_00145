"use client"

import { useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Plus, Trash } from "lucide-react"
import { useCategoryStore } from "@/lib/stores/category-store"
import { useSongStore } from "@/lib/stores/song-store"
import { toast } from "sonner"

// Form schema for adding a new category
const addCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Category name is required" })
    .refine((name) => name.trim().length > 0, {
      message: "Category name cannot be empty",
    }),
})

// Form schema for editing a category
const editCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Category name is required" })
    .refine((name) => name.trim().length > 0, {
      message: "Category name cannot be empty",
    }),
})

export function CategoryList() {
  const { categories, addCategory, updateCategory, removeCategory } = useCategoryStore()
  const { songs } = useSongStore()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)

  // Use refs to store previous state for undo operations
  const previousCategoryRef = useRef<{ id: string; name: string; createdAt: string } | null>(null)
  const undoActionRef = useRef<"edit" | "delete" | null>(null)

  // Initialize forms
  const addForm = useForm<z.infer<typeof addCategorySchema>>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: {
      name: "",
    },
  })

  const editForm = useForm<z.infer<typeof editCategorySchema>>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: "",
    },
  })

  const handleAddCategory = (values: z.infer<typeof addCategorySchema>) => {
    // Check if category with same name already exists
    const categoryExists = categories.some((cat) => cat.name.toLowerCase() === values.name.trim().toLowerCase())

    if (categoryExists) {
      addForm.setError("name", {
        type: "manual",
        message: "A category with this name already exists",
      })
      return
    }

    const newCategory = {
      id: Date.now().toString(),
      name: values.name.trim(),
      createdAt: new Date().toISOString(),
    }

    addCategory(newCategory)
    addForm.reset()
    setIsAddDialogOpen(false)

    toast.success("Category Added", {
      description: `"${values.name.trim()}" has been added to your categories.`,
    })
  }

  const handleEditCategory = (values: z.infer<typeof editCategorySchema>) => {
    if (!editCategoryId) return

    // Check if another category with same name already exists
    const categoryExists = categories.some(
      (cat) => cat.id !== editCategoryId && cat.name.toLowerCase() === values.name.trim().toLowerCase(),
    )

    if (categoryExists) {
      editForm.setError("name", {
        type: "manual",
        message: "A category with this name already exists",
      })
      return
    }

    // Store the previous state for undo functionality
    const categoryToEdit = categories.find((cat) => cat.id === editCategoryId)
    if (categoryToEdit) {
      previousCategoryRef.current = { ...categoryToEdit }
      undoActionRef.current = "edit"
    }

    // Update the category
    updateCategory(editCategoryId, {
      name: values.name.trim(),
    })

    // Show toast with undo option
    toast.success("Category Updated", {
      description: `Category has been renamed to "${values.name.trim()}".`,
      action: {
        label: "Undo",
        onClick: handleUndo,
      },
    })

    setEditCategoryId(null)
    editForm.reset()
    setIsEditDialogOpen(false)
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
      toast.success("Category Deleted", {
        description: `"${categoryToDelete.name}" has been deleted.`,
        action: {
          label: "Undo",
          onClick: handleUndo,
        },
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
      toast.success("Deletion Undone", {
        description: `"${prevCategory.name}" has been restored.`,
      })
    } else if (action === "edit") {
      // Restore the previous name
      updateCategory(prevCategory.id, {
        name: prevCategory.name,
      })
      toast.success("Change Undone", {
        description: `Category name has been restored to "${prevCategory.name}".`,
      })
    }

    // Clear the refs
    previousCategoryRef.current = null
    undoActionRef.current = null
  }

  const openEditDialog = (id: string, name: string) => {
    setEditCategoryId(id)
    editForm.reset({ name })
    setIsEditDialogOpen(true)
  }

  const getSongCountForCategory = (categoryName: string) => {
    return songs.filter((song) => song.categories && song.categories.includes(categoryName)).length
  }

  return (
    <div className="space-y-4">
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) addForm.reset()
        }}
      >
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
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddCategory)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit">Add Category</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            editForm.reset()
            setEditCategoryId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category name</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditCategory)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
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

