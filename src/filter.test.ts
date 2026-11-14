import { describe, it, expect } from 'vitest'
import { filterTasks, countByFilter } from './filter'
import { taskReducer, type State, type Task } from './taskReducer'

const tasks: Task[] = [
  { id: '1', title: 'One', status: 'todo' },
  { id: '2', title: 'Two', status: 'in-progress' },
  { id: '3', title: 'Three', status: 'done' },
  { id: '4', title: 'Four', status: 'todo' },
]

describe('filterTasks', () => {
  it("returns every task for 'all'", () => {
    expect(filterTasks(tasks, 'all')).toEqual(tasks)
  })

  it('returns only the tasks with that status', () => {
    expect(filterTasks(tasks, 'todo').map((t) => t.id)).toEqual(['1', '4'])
    expect(filterTasks(tasks, 'in-progress').map((t) => t.id)).toEqual(['2'])
    expect(filterTasks(tasks, 'done').map((t) => t.id)).toEqual(['3'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterTasks(tasks.slice(0, 2), 'done')).toEqual([])
    expect(filterTasks([], 'todo')).toEqual([])
  })

  it('does not change the input array', () => {
    const frozen = [...tasks]
    Object.freeze(frozen)
    expect(() => filterTasks(frozen, 'todo')).not.toThrow()
    expect(frozen).toHaveLength(4)
  })
})

describe('countByFilter', () => {
  it('counts every filter', () => {
    expect(countByFilter(tasks)).toEqual({ all: 4, todo: 2, 'in-progress': 1, done: 1 })
  })

  it('returns zeros for an empty list', () => {
    expect(countByFilter([])).toEqual({ all: 0, todo: 0, 'in-progress': 0, done: 0 })
  })

  it('updates after a delete and an advance', () => {
    let s: State = { tasks, filter: 'all', past: [] }
    s = taskReducer(s, { type: 'remove', id: '1' })
    expect(countByFilter(s.tasks)).toEqual({ all: 3, todo: 1, 'in-progress': 1, done: 1 })
    s = taskReducer(s, { type: 'advance', id: '2' })
    expect(countByFilter(s.tasks)).toEqual({ all: 3, todo: 1, 'in-progress': 0, done: 2 })
  })

  it('sums of the status counts equal all', () => {
    const c = countByFilter(tasks)
    expect(c.todo + c['in-progress'] + c.done).toBe(c.all)
  })
})
