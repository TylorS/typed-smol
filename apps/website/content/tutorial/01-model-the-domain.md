---
slug: "model-the-domain"
title: "Model the domain"
summary: "Define valid Todo values and keep list transformations pure."
order: 1
architecture: ["domain"]
---

The domain names data and rules without knowing how the browser renders or stores them.
Effect Schema gives the boundary one runtime codec and one inferred TypeScript type. Pure list
functions make the rule independently testable and keep mutation policy out of event handlers.

## src/domain.ts

```ts file="src/domain.ts"
import * as Schema from "effect/Schema"

export const TodoId = Schema.String.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

export const Todo = Schema.Struct({
  id: TodoId,
  text: Schema.String,
  completed: Schema.Boolean,
  timestamp: Schema.DateTimeUtcFromString,
})
export type Todo = typeof Todo.Type
export const TodoList = Schema.Array(Todo)
export type TodoList = typeof TodoList.Type

export const FilterState = Schema.Literals(["all", "active", "completed"])
export type FilterState = typeof FilterState.Type

export const updateTodo = (id: TodoId, f: (todo: Todo) => Todo) =>
  (list: TodoList): TodoList =>
    list.map((todo) => todo.id === id ? f(todo) : todo)

export const editText = (id: TodoId, text: string) =>
  updateTodo(id, (todo) => ({ ...todo, text }))

export const updateText = (text: string) => (todo: Todo): Todo => ({ ...todo, text })

export const toggleCompleted = (id: TodoId) => (list: TodoList): TodoList =>
  updateTodo(id, (todo) => ({ ...todo, completed: !todo.completed }))(list)

export const deleteTodo = (id: TodoId) => (list: TodoList): TodoList =>
  list.filter((todo) => todo.id !== id)

export const clearCompleted = (list: TodoList): TodoList =>
  list.filter((todo) => !todo.completed)

export const activeCount = (list: TodoList): number =>
  list.filter((todo) => !todo.completed).length

export const someAreCompleted = (list: TodoList): boolean =>
  list.some((todo) => todo.completed)

export const allAreCompleted = (list: TodoList): boolean =>
  list.length > 0 && list.every((todo) => todo.completed)

export const toggleAllCompleted = (list: TodoList): TodoList => {
  const completed = list.some((todo) => !todo.completed)
  return list.map((todo) => ({ ...todo, completed }))
}

export const filterTodoList = ({ list, state }: { list: TodoList; state: FilterState }) =>
  state === "active"
    ? list.filter((todo) => !todo.completed)
    : state === "completed"
      ? list.filter((todo) => todo.completed)
      : list
```
