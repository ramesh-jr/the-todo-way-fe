import { useEffect, useMemo } from "react"
import { CheckCircle, Circle, Clock, Flag, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSectionStore } from "@/stores/sectionStore"
import { getFilteredTodos, useTodoStore } from "@/stores/todoStore"
import { useUIStore } from "@/stores/uiStore"

const priorityConfig: Record<string, { label: string; class: string }> = {
  p1: { label: "Critical", class: "text-red-500" },
  p2: { label: "High", class: "text-orange-500" },
  p3: { label: "Medium", class: "text-blue-500" },
  p4: { label: "Low", class: "text-slate-400" },
}

function App() {
  // Stores
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const toggleComplete = useTodoStore((s) => s.toggleComplete)
  const createTodo = useTodoStore((s) => s.createTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const todos = useTodoStore((s) => s.todos)
  const filters = useTodoStore((s) => s.filters)
  const sortBy = useTodoStore((s) => s.sortBy)
  const sortOrder = useTodoStore((s) => s.sortOrder)

  const todoCount = todos.size
  const filteredTodos = useMemo(
    () => getFilteredTodos({ todos, filters, sortBy, sortOrder }),
    [todos, filters, sortBy, sortOrder],
  )

  const fetchSections = useSectionStore((s) => s.fetchSections)
  const fetchLabels = useSectionStore((s) => s.fetchLabels)
  const sections = useSectionStore((s) => s.sections)
  const labels = useSectionStore((s) => s.labels)

  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  // Seed stores on mount
  useEffect(() => {
    fetchTodos()
    fetchSections()
    fetchLabels()
  }, [fetchTodos, fetchSections, fetchLabels])

  function cycleTheme() {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(next)
  }

  function handleAddSampleTodo() {
    createTodo({
      title: `New todo at ${new Date().toLocaleTimeString()}`,
      priority: "p3",
      labels: labels.length > 0 ? [labels[0]] : [],
    })
  }

  const themeIcon = theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">The Todo Way</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAddSampleTodo}>
              <Plus className="h-4 w-4" />
              Add Todo
            </Button>
            <Button variant="outline" size="sm" onClick={cycleTheme}>
              {themeIcon} {theme}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl p-6">
        {/* Store stats */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Store Status</h2>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <span className="text-xs text-muted-foreground">Total Todos</span>
              <p className="text-lg font-bold text-primary">{todoCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <span className="text-xs text-muted-foreground">Visible</span>
              <p className="text-lg font-bold text-primary">{filteredTodos.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <span className="text-xs text-muted-foreground">Sections</span>
              <p className="text-lg font-bold text-primary">{sections.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <span className="text-xs text-muted-foreground">Labels</span>
              <p className="text-lg font-bold text-primary">{labels.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <span className="text-xs text-muted-foreground">Theme</span>
              <p className="text-lg font-bold text-primary">{theme}</p>
            </div>
          </div>
        </section>

        {/* Design system colors */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Design System</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 rounded-lg bg-primary" />
              <span className="text-xs text-muted-foreground">Primary</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 rounded-lg bg-accent" />
              <span className="text-xs text-muted-foreground">Accent</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 rounded-lg bg-destructive" />
              <span className="text-xs text-muted-foreground">Destructive</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 rounded-lg bg-card border border-border" />
              <span className="text-xs text-muted-foreground">Card</span>
            </div>
          </div>
        </section>

        {/* Labels */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Labels</h2>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <span
                key={label.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${label.color}1A`,
                  color: label.color,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </section>

        {/* Todos */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Todos ({filteredTodos.length})
          </h2>
          <div className="flex flex-col gap-2">
            {filteredTodos.map((todo) => {
              const priority = priorityConfig[todo.priority]
              return (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => toggleComplete(todo.id)}
                    className="mt-0.5 shrink-0"
                  >
                    {todo.is_completed ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        todo.is_completed
                          ? "text-muted-foreground line-through"
                          : ""
                      }`}
                    >
                      {todo.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {priority && (
                        <span
                          className={`flex items-center gap-1 text-xs ${priority.class}`}
                        >
                          <Flag className="h-3 w-3" />
                          {priority.label}
                        </span>
                      )}
                      {todo.duration_minutes && (
                        <span className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {todo.duration_minutes >= 60
                            ? `${Math.floor(todo.duration_minutes / 60)}h${
                                todo.duration_minutes % 60
                                  ? ` ${todo.duration_minutes % 60}m`
                                  : ""
                              }`
                            : `${todo.duration_minutes}m`}
                        </span>
                      )}
                      {todo.labels.map((label) => (
                        <span
                          key={label.id}
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${label.color}1A`,
                            color: label.color,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
