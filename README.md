# Kanban Buddy

A simple, private kanban board for organizing tasks across columns, team members, and priorities — right in your browser.

Kanban Buddy lets you set up one or more boards, split each into columns like "Open," "In Progress," and "Done," and fill them with draggable task cards. You can assign tasks to team members, tag them with priority levels, give them story points and due dates, break them into subtasks, and track a running history of everything that happens to them. It's built for anyone who wants a lightweight, no-frills board for personal projects, freelance work, or small team planning — without signing up for anything.

## Features

### Boards
- **Multiple boards** — create as many boards as you like (e.g. one per project), each with its own columns, team members, and tasks.
- **Board search** — the search box at the top of the board list filters your boards by name as you type.
- **Board list at a glance** — each board in the sidebar shows its name plus a quick count of tasks and columns.
- **Edit or delete a board** — open a board and click **Edit Board** to rename it or permanently delete it (and everything inside it).

### Columns
- **Custom columns** — every new board starts with four columns (Open, In Progress, Waiting, Done), but you can add, rename, or remove columns freely.
- **"Done" column marking** — mark one column as your "Done" stage. Tasks dropped into it are treated as complete for statistics and overdue calculations. Only one column can be the Done column at a time.
- **Safe deletion** — a board always needs at least one column, so the last one can't be deleted. If you delete a column that still has tasks in it, you'll be asked to confirm — its tasks are automatically moved into the next available column rather than deleted.

### Tasks (Cards)
- **Full task details** — every task can have a title, an optional description, story points, a priority, a due date, an assignee, and a checklist of subtasks.
- **Create and edit anywhere** — use the **Add Task** button in the board toolbar, or click the edit (pencil) icon on any existing card to update it.
- **Delete a task** — from the edit form, use **Delete Task** (with a confirmation prompt).
- **Subtasks / checklist** — add as many subtask lines as you need inside a task, check them off individually, or remove a subtask row entirely. Each card shows a small ring and a "done/total" count summarizing subtask progress.
- **Priority flags** — set a task's priority to None, Low, Medium, or High. Priority shows as a colored left-edge stripe on the card (green/amber/red).
- **Points** — assign a numeric point value to each task (useful for effort/estimate tracking); shown as a badge on the card.
- **Due dates** — optionally set a due date. Cards past their due date are visually flagged as **overdue** (highlighted in red) as long as the task isn't already in the Done column.
- **Assignee** — assign a task to a team member from a dropdown, or leave it unassigned. Unassigned cards get a dashed border so they stand out, and the card footer shows either the assignee's initials or an "Unassigned" label.

### Moving Tasks
- **Drag and drop between columns** — drag any card to another column to change its status; the board automatically re-numbers cards as you drop them in a new position.
- **Drag to reorder within a column** — drag a card up or down inside the same column to reorder your priorities visually, with a smooth animated shuffle as other cards make room.
- **Automatic Done confirmation** — if you drag a task with unfinished subtasks into the Done column, you'll be asked whether to automatically mark all its subtasks complete as well.
- **Confetti** — moving a task into the Done column for the first time triggers a small confetti celebration.
- **History logging** — every column move, priority change, and reassignment is automatically recorded to the task's history (see below), so you don't lose track of how a card evolved.

### Team Members
- **Add team members per board** — click the **+** button next to the team row to add a person by name. Names must be unique within a board.
- **Team chips with initials avatars** — each member appears as a colored chip with their initials; colors are assigned automatically and consistently per person.
- **Edit or remove a member** — hover a chip to reveal an edit (pencil) icon; removing someone unassigns them from any tasks they were on (recorded in that task's history) rather than deleting those tasks.
- **Filter the board by member** — click a team chip to show only that person's tasks; click multiple chips to filter by several people at once. An active filter chip is highlighted.
- **Drag-to-assign** — you can drag a team chip directly onto a task card to instantly assign that task to them, without opening the edit form. The card gives a little "bounce" animation to confirm the change.

### Priority Filtering
- Next to the team row, four small flag buttons let you filter the board to show only High, Medium, Low, or "No priority" tasks — click to toggle any combination on or off.
- Like team members, you can also **drag a priority flag directly onto a task card** to set its priority instantly.
- When any team or priority filter is active, a status strip appears above the board summarizing the active filters, with a one-click **Clear** button to reset everything.

### Task History
- Click the clock/history icon on any card to open its **History** panel — a timeline of everything that's happened to that task: when it was created, every column move, every reassignment, and every priority change, each with a timestamp.
- **Add your own notes** — type into the note box at the bottom of the history panel and hit send to leave a free-text note on the task's timeline (handy for status updates or context you want to remember later).

### Board Overview & Workload Stats
- Click **Overview** on any board to open a dashboard showing:
  - Total tasks, total points, team size, and how many tasks are Done.
  - A **Load by User** chart — a horizontal bar per team member showing their share of story points, color-coded to match their avatar.
  - A toggle between **Active only** (points from tasks not yet in the Done column) and **All tasks** (every task regardless of status), so you can see either current workload or total contribution.

### Data Export & Import
- **Export** — click the download icon in the sidebar to export your data as a JSON backup file. You can choose exactly which boards to include, and optionally exclude task history from the file to keep it smaller.
- **Import** — click the upload icon to load a previously exported JSON file. If you already have boards saved, you'll be asked whether to **Replace All** (wipe existing boards and use only the imported ones) or **Append** (add the imported boards alongside what you already have). You can also choose whether to bring imported task history along.
- **Sample board** — if you don't have any boards yet, the empty state offers a link to load a ready-made sample board so you can see the app populated with example columns, tasks, and team members before building your own.

## How to Use

1. **Create a board.** Click **Add Board** in the sidebar (or the button in the empty state) and give it a name.
2. **Set up your columns.** A new board starts with Open / In Progress / Waiting / Done. Use **Add Column** to add more, or click a column's pencil icon to rename it, delete it, or mark it as the Done stage.
3. **Add your team.** Click the **+** button in the team row to add each person who will be assigned tasks.
4. **Add tasks.** Click **Add Task**, fill in a title (required) and any optional details — description, points, priority, due date, assignee, column, and subtasks — then save.
5. **Work the board.** Drag cards between columns as work progresses, or drag a team chip or priority flag straight onto a card for a quick update. Click a card's history icon anytime to see (or add to) its timeline.
6. **Check in on progress.** Open **Overview** to see totals and who's carrying the most workload.
7. **Back up your data.** Periodically use the export button to save a JSON copy of your boards, especially before clearing browser data or switching devices.

## Tips & Shortcuts

- **Drag directly onto a card**: both team member chips and priority flags are draggable — dropping one onto a task is faster than opening the edit form when you just need to reassign or re-prioritize.
- **Overdue tasks stand out automatically**: any task with a due date in the past turns red, unless it's already sitting in the Done column — no manual flagging needed.
- **Unassigned tasks are easy to spot**: look for the dashed card border, which flags anything nobody currently owns.
- **Filters stack**: you can combine a team filter and a priority filter at the same time (e.g. "just Priya's high-priority tasks") — the status strip above the board tells you exactly what's filtered and lets you clear it in one click.
- **Deleting is guarded**: boards, columns, and tasks all ask for confirmation before deleting, and deleting a non-empty column moves its tasks elsewhere instead of destroying them.
- **History is a lightweight audit trail**: even without manually adding notes, every priority change, reassignment, and column move is automatically logged — useful for retracing a task's journey later.
- **Export before big changes**: since all data lives only in this browser, exporting a JSON backup before importing, replacing, or clearing data is good insurance.

## Customization

Open the gear/settings icon in the top-right corner to personalize the app:
- **Theme** — switch between Light and Dark mode.
- **Accent color** — choose from several accent colors (Indigo, Blue, Green, Rose, Amber, Purple) to change the app's highlight color throughout buttons, active states, and links.

Your theme and accent choices are remembered automatically for the next time you open the app.

## Your Data

Everything you create in Kanban Buddy — boards, columns, tasks, team members, and history — is saved directly in your browser's local storage. Nothing is uploaded anywhere or shared with anyone; your boards stay on your device unless you explicitly export them. Because of this, clearing your browser's site data (or using a different browser/device) means your boards won't be there — so use the export/import feature if you want to move your data or keep a backup.
