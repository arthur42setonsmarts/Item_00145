import { DashboardShell } from "@/components/dashboard-shell"
import { CategoryList } from "@/components/category-list"

export default function CategoriesPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
      </div>
      <div className="mt-6">
        <CategoryList />
      </div>
    </DashboardShell>
  )
}

