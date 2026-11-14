# Assignment 3: Task Manager with a Reducer

**Batıkan Karakan, 1700002010**

A Vite + React + TypeScript Task Manager. All state lives in `App` with `useReducer` and goes down as props.
The state is `{ tasks, filter, past }`; the filtered list and the counts are derived while rendering.

```
npm install
npm run dev       # open the address it prints
npm run build     # type check (strict) and build
npm test          # run the Vitest tests
```

Needs Node.js 20.19 or newer.

## Files

- `src/taskReducer.ts`: `State`, `Action`, `initialState`, `taskReducer` (R1 to R3, Bonus 1).
- `src/filter.ts`: `Filter`, `filterTasks`, `countByFilter`; no React (R4).
- `src/App.tsx`: `useReducer`; `AddForm`, `FilterBar`, `TaskList`, Clear done and Undo buttons (R5, R6).
- `src/TaskRow.tsx`: one row with title, status, Next and Delete.
- `src/*.test.ts`: Vitest tests (Bonus 2).
- `screenshots/`: `all.png`, `todo.png`, `in-progress.png`, `done.png`.

## Screenshots

| All | To do | In progress | Done |
| --- | --- | --- | --- |
| ![All](screenshots/all.png) | ![To do](screenshots/todo.png) | ![In progress](screenshots/in-progress.png) | ![Done](screenshots/done.png) |

## Bonuses claimed

Bonus 1, Bonus 2, Bonus 3 and Bonus 4.

## Bonus 1: Undo

The state is `{ tasks: Task[]; filter: Filter; past: Task[][] }`. `past` is a stack of earlier task lists,
newest last. Every action that changes the tasks (`add`, `advance`, `remove`, `clearDone`) goes through one
helper, `withTasks`, which pushes the old list onto `past`; `{ type: 'undo' }` pops the last list back into
`tasks`.

- The filter is not part of the history, so `setFilter` is not undoable and undo keeps the current filter.
- Undo after `clearDone` brings the cleared tasks back.
- An action that changes nothing (an unknown id, or `clearDone` with no done tasks) returns the same state
  and is not recorded, so Undo never "undoes" nothing.
- Undo with an empty `past` returns the same state, and the Undo button is disabled when `past` is empty.

## Bonus 2: Tests

Vitest, 27 tests in `src/taskReducer.test.ts` and `src/filter.test.ts`. They cover every action, advancing
three times back to `todo`, purity (the input state is deep-frozen with `Object.freeze`, so a mutation would
throw, and it is compared with a `structuredClone` copy after a chain of actions), `filterTasks`,
`countByFilter`, undo, and edge cases: unknown ids, empty lists, `clearDone` with nothing done, counts after a
delete, and no-op actions not being recorded in the history.

Output of `npm test`:

```
 RUN  v5.1.0 assignment3

 ✓ src/filter.test.ts > filterTasks > returns every task for 'all'
 ✓ src/filter.test.ts > filterTasks > returns only the tasks with that status
 ✓ src/filter.test.ts > filterTasks > returns an empty list when nothing matches
 ✓ src/filter.test.ts > filterTasks > does not change the input array
 ✓ src/filter.test.ts > countByFilter > counts every filter
 ✓ src/filter.test.ts > countByFilter > returns zeros for an empty list
 ✓ src/filter.test.ts > countByFilter > updates after a delete and an advance
 ✓ src/filter.test.ts > countByFilter > sums of the status counts equal all
 ✓ src/taskReducer.test.ts > initialState > has no tasks, filter all and no history
 ✓ src/taskReducer.test.ts > add > appends a task with status todo
 ✓ src/taskReducer.test.ts > add > works on an empty list
 ✓ src/taskReducer.test.ts > advance > moves todo -> in-progress -> done -> todo
 ✓ src/taskReducer.test.ts > advance > changes only the matching task and keeps the others as the same objects
 ✓ src/taskReducer.test.ts > advance > returns the same state for an unknown id
 ✓ src/taskReducer.test.ts > remove > deletes that task
 ✓ src/taskReducer.test.ts > remove > returns the same state for an unknown id
 ✓ src/taskReducer.test.ts > setFilter > stores the filter and keeps the same tasks
 ✓ src/taskReducer.test.ts > clearDone > removes every done task and keeps the filter
 ✓ src/taskReducer.test.ts > clearDone > returns the same state when nothing is done
 ✓ src/taskReducer.test.ts > clearDone > works on an empty list
 ✓ src/taskReducer.test.ts > purity > never changes the old state
 ✓ src/taskReducer.test.ts > purity > returns a new state object and a new tasks array when tasks change
 ✓ src/taskReducer.test.ts > undo > does nothing when there is nothing to undo
 ✓ src/taskReducer.test.ts > undo > reverts add, advance and remove one step at a time
 ✓ src/taskReducer.test.ts > undo > brings back the tasks removed by clearDone
 ✓ src/taskReducer.test.ts > undo > does not record filter changes and keeps the current filter
 ✓ src/taskReducer.test.ts > undo > does not record no-op actions

 Test Files  2 passed (2)
      Tests  27 passed (27)
```

## Bonus 3: Explain your reducer

**Why pure.** React decides if anything changed with checking old and new states by reference (old === new). If it change the old array in place and return it, the reference would be the same and it would think nothing has changed. About the mutation, React only check for the state reference, so if we mutate something, it will change the state content, but not the reference, so the comp wouldn't be changed.

**Why the caller creates the id.** `randomUUID` returns a different unique value every call, so if we put it for both caller and reducer, first, it will create an unique id for the input, and another unique id for the output, because of that, they both would be different and if we call it two times with same state and action, it would give us two different result. Reducer must be a pure basic function, it should give the same output for every same input.

**Why derived, not stored.** Let me explain this with a simple example. For example, if we know the birth of mine and today's date, we can calculate my age instead of using another variable like `age`, because if we do that, we should keep the `age` up to date everytime, and it creates unnecessary dependency, they call that `single source of truth`, if we compute everything from minimal variable as we can, it would help us to avoid for the next unforgivable mistakes/bugs. In our case, the filtered list and the counts can be computed from `tasks` and `filter`. If we store them, the exactly same information would live in two different place and we would keep them in sync for every move and for example if we forgot to update `filteredTasks`, a task moved to Done would still be under `To do`.

**Filter in the reducer.** One reducer whould see the whole state, so it became easier to write `clearDone`, but because of that, every task case now has to copy that state again and again instead of just returning the array.

## Bonus 4: Git repository

https://github.com/batikankarakan/assignment3-task-manager

The history shows the work in steps (starter, state shape and new actions, filter functions, filter bar,
undo, tests, screenshots, README). `node_modules` and `dist` are in `.gitignore`. After `git clone`,
`npm install` and `npm run dev` the app runs.
