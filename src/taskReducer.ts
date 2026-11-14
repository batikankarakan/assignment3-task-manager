// Batıkan Karakan, 1700002010
import type { Filter } from './filter'

export type Status = 'todo' | 'in-progress' | 'done'
export type Task = { id: string; title: string; status: Status }

// past holds earlier task lists, newest last. Only task changes are recorded;
// the filter is not part of the history, so changing it is not undoable.
export type State = { tasks: Task[]; filter: Filter; past: Task[][] }

export type Action =
  | { type: 'add'; id: string; title: string }
  | { type: 'advance'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'setFilter'; filter: Filter }
  | { type: 'clearDone' }
  | { type: 'undo' }

export const initialState: State = { tasks: [], filter: 'all', past: [] }

const NEXT: Record<Status, Status> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
}

// Called only when every case above is handled, so `action` has type never here.
// If a new action type is added and not handled, this line stops compiling.
function assertNever(action: never): never {
  throw new Error(`Unknown action: ${JSON.stringify(action)}`)
}

// Every action that changes tasks goes through here: the old list is pushed to past.
// If nothing changed (same array), the state is returned as is, so a no-op is not undoable.
function withTasks(state: State, tasks: Task[]): State {
  if (tasks === state.tasks) return state
  return { ...state, tasks, past: [...state.past, state.tasks] }
}

export function taskReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return withTasks(state, [
        ...state.tasks,
        { id: action.id, title: action.title, status: 'todo' },
      ])
    case 'advance': {
      if (!state.tasks.some((t) => t.id === action.id)) return state
      return withTasks(
        state,
        state.tasks.map((t) => (t.id === action.id ? { ...t, status: NEXT[t.status] } : t)),
      )
    }
    case 'remove': {
      const tasks = state.tasks.filter((t) => t.id !== action.id)
      return withTasks(state, tasks.length === state.tasks.length ? state.tasks : tasks)
    }
    case 'clearDone': {
      const tasks = state.tasks.filter((t) => t.status !== 'done')
      return withTasks(state, tasks.length === state.tasks.length ? state.tasks : tasks)
    }
    case 'setFilter':
      return { ...state, filter: action.filter }
    case 'undo': {
      if (state.past.length === 0) return state
      return {
        ...state,
        tasks: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
      }
    }
    default:
      return assertNever(action)
  }
}
