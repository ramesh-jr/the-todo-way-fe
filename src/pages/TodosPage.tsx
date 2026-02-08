import { ListTodo } from "lucide-react"

export default function TodosPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
      <ListTodo className="h-12 w-12 text-primary" />
      <h1 className="text-2xl font-bold">Todos</h1>
      <p className="text-muted-foreground">
        Sections and subsections coming in FE-9.
      </p>
    </div>
  )
}
