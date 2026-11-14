import { describe, it, expect } from 'vitest'
import { taskReducer, initialState, type State, type Task } from './taskReducer'

// Freeze the state, its arrays and every task, so a mutation inside the reducer throws.
function deepFreeze(state: State): State {
  state.tasks.forEach((t) => Object.freeze(t))
  state.past.forEach((list) => {
    list.forEach((t) => Object.freeze(t))
    Object.freeze(list)
  })
  Object.freeze(state.tasks)
  Object.freeze(state.past)
  return Object.freeze(state)
}

const a: Task = { id: 'a', title: 'Write code', status: 'todo' }
const b: Task = { id: 'b', title: 'Test code', status: 'in-progress' }
const c: Task = { id: 'c', title: 'Ship it', status: 'done' }

function stateWith(tasks: Task[]): State {
  return deepFreeze({ tasks, filter: 'all', past: [] })
}

describe('initialState', () => {
  it('has no tasks, filter all and no history', () => {
    expect(initialState).toEqual({ tasks: [], filter: 'all', past: [] })
  })
})

describe('add', () => {
  it('appends a task with status todo', () => {
    const next = taskReducer(stateWith([a]), { type: 'add', id: 'n', title: 'New' })
    expect(next.tasks).toEqual([a, { id: 'n', title: 'New', status: 'todo' }])
  })

  it('works on an empty list', () => {
    const next = taskReducer(deepFreeze({ ...initialState }), { type: 'add', id: 'n', title: 'New' })
    expect(next.tasks).toHaveLength(1)
  })
})

describe('advance', () => {
  it('moves todo -> in-progress -> done -> todo', () => {
    let s = stateWith([a])
    s = taskReducer(s, { type: 'advance', id: 'a' })
    expect(s.tasks[0].status).toBe('in-progress')
    s = taskReducer(s, { type: 'advance', id: 'a' })
    expect(s.tasks[0].status).toBe('done')
    s = taskReducer(s, { type: 'advance', id: 'a' })
    expect(s.tasks[0].status).toBe('todo')
  })

  it('changes only the matching task and keeps the others as the same objects', () => {
    const next = taskReducer(stateWith([a, b]), { type: 'advance', id: 'a' })
    expect(next.tasks[0]).not.toBe(a)
    expect(next.tasks[1]).toBe(b)
  })

  it('returns the same state for an unknown id', () => {
    const s = stateWith([a])
    expect(taskReducer(s, { type: 'advance', id: 'nope' })).toBe(s)
  })
})

describe('remove', () => {
  it('deletes that task', () => {
    const next = taskReducer(stateWith([a, b, c]), { type: 'remove', id: 'b' })
    expect(next.tasks).toEqual([a, c])
  })

  it('returns the same state for an unknown id', () => {
    const s = stateWith([a])
    expect(taskReducer(s, { type: 'remove', id: 'nope' })).toBe(s)
  })
})

describe('setFilter', () => {
  it('stores the filter and keeps the same tasks', () => {
    const s = stateWith([a, b])
    const next = taskReducer(s, { type: 'setFilter', filter: 'done' })
    expect(next.filter).toBe('done')
    expect(next.tasks).toBe(s.tasks)
  })
})

describe('clearDone', () => {
  it('removes every done task and keeps the filter', () => {
    const s = deepFreeze({ tasks: [a, c, b, { ...c, id: 'c2' }], filter: 'done', past: [] })
    const next = taskReducer(s, { type: 'clearDone' })
    expect(next.tasks).toEqual([a, b])
    expect(next.filter).toBe('done')
  })

  it('returns the same state when nothing is done', () => {
    const s = stateWith([a, b])
    expect(taskReducer(s, { type: 'clearDone' })).toBe(s)
  })

  it('works on an empty list', () => {
    const s = deepFreeze({ ...initialState })
    expect(taskReducer(s, { type: 'clearDone' })).toBe(s)
  })
})

describe('purity', () => {
  it('never changes the old state', () => {
    const s = stateWith([a, b, c])
    const copy = structuredClone(s)
    let next = taskReducer(s, { type: 'add', id: 'n', title: 'New' })
    next = taskReducer(next, { type: 'advance', id: 'a' })
    next = taskReducer(next, { type: 'remove', id: 'b' })
    next = taskReducer(next, { type: 'clearDone' })
    next = taskReducer(next, { type: 'setFilter', filter: 'todo' })
    next = taskReducer(next, { type: 'undo' })
    expect(s).toEqual(copy)
    expect(next).not.toBe(s)
  })

  it('returns a new state object and a new tasks array when tasks change', () => {
    const s = stateWith([a])
    const next = taskReducer(s, { type: 'advance', id: 'a' })
    expect(next).not.toBe(s)
    expect(next.tasks).not.toBe(s.tasks)
  })
})

describe('undo', () => {
  it('does nothing when there is nothing to undo', () => {
    const s = stateWith([a])
    expect(taskReducer(s, { type: 'undo' })).toBe(s)
  })

  it('reverts add, advance and remove one step at a time', () => {
    const s0 = stateWith([a])
    const s1 = taskReducer(s0, { type: 'add', id: 'n', title: 'New' })
    const s2 = taskReducer(s1, { type: 'advance', id: 'a' })
    const s3 = taskReducer(s2, { type: 'remove', id: 'n' })
    expect(s3.past).toHaveLength(3)

    const u1 = taskReducer(s3, { type: 'undo' })
    expect(u1.tasks).toEqual(s2.tasks)
    const u2 = taskReducer(u1, { type: 'undo' })
    expect(u2.tasks).toEqual(s1.tasks)
    const u3 = taskReducer(u2, { type: 'undo' })
    expect(u3.tasks).toEqual(s0.tasks)
    expect(u3.past).toEqual([])
  })

  it('brings back the tasks removed by clearDone', () => {
    const s = stateWith([a, c])
    const cleared = taskReducer(s, { type: 'clearDone' })
    expect(cleared.tasks).toEqual([a])
    expect(taskReducer(cleared, { type: 'undo' }).tasks).toEqual([a, c])
  })

  it('does not record filter changes and keeps the current filter', () => {
    let s = stateWith([a])
    s = taskReducer(s, { type: 'add', id: 'n', title: 'New' })
    s = taskReducer(s, { type: 'setFilter', filter: 'done' })
    expect(s.past).toHaveLength(1)
    const undone = taskReducer(s, { type: 'undo' })
    expect(undone.tasks).toEqual([a])
    expect(undone.filter).toBe('done')
  })

  it('does not record no-op actions', () => {
    let s = stateWith([a])
    s = taskReducer(s, { type: 'advance', id: 'nope' })
    s = taskReducer(s, { type: 'remove', id: 'nope' })
    s = taskReducer(s, { type: 'clearDone' })
    expect(s.past).toEqual([])
  })
})
