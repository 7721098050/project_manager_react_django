
# Project Manager (React + Django)

A clean, minimal full‑stack project management starter:
- Add projects with description, start/end dates, assigned employee.
- Add tasks to a project (with order). Completion time auto-calculates.
- Inline edit project and task dates.
- If an earlier task is delayed, later tasks automatically shift (cascade).

## Stack
- **Backend:** Django + Django REST Framework, SQLite, CORS enabled.
- **Frontend:** React (Vite). No CSS frameworks—pure CSS with a polished dark UI.

---

## 1) Backend Setup

```bash
cd backend
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Migrate & run
python manage.py migrate
python manage.py runserver
```

API root will be at http://127.0.0.1:8000/api/

### Create a superuser (optional)
```bash
python manage.py createsuperuser
# Admin at http://127.0.0.1:8000/admin/
```

---

## 2) Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Visit the app at http://127.0.0.1:5173/

> If the backend runs on a different host/port, update `src/api.js`.

---

## 3) How the Cascade Works

- Tasks have an `order` within their project.
- When you edit a task's `end_date`, the backend shifts all **subsequent** tasks' `start_date` and `end_date` by the same delta.
- You can also edit the `start_date`; only the edited task changes (no cascade) unless the `end_date` changes too.

**Completion time** (for both projects and tasks) is auto-calculated as `end_date - start_date`.

---

## 4) Creating a Project with Tasks

- Use the New Project form.
- Add tasks with the **+ Add Task** button.
- Optional: click **Auto‑chain** to automatically assign sequential dates starting from the project start date.

---

## 5) Inline Editing

- In **All Projects**, edit project dates inline.
- Click **View** to expand tasks and edit task dates inline.
- If Task 1 is delayed by one day, Task 2 (and later) will shift by one day automatically.

---

## 6) Notes & Tips

- This is a starter; extend models as needed (e.g., priorities, dependencies graph, multiple assignees).
- To enforce that each task starts the day after the previous task ends, you can enhance validation in `TaskViewSet.update`.
- For production, set a strong `SECRET_KEY`, restrict `ALLOWED_HOSTS`, and configure a real DB and static hosting.

---

## 7) API Cheatsheet

- `GET /api/projects/` – list projects
- `POST /api/projects/` – create project with optional `tasks` list
- `PATCH /api/projects/{id}/` – update fields
- `GET /api/projects/{id}/tasks/` – list tasks for a project
- `PATCH /api/tasks/{id}/` – update a task (cascades on `end_date` change)
- `POST /api/tasks/{id}/shift/` – shift task by `{"days": N}` and cascade

---

## 8) Troubleshooting

- If CORS errors occur, ensure backend is running and `CORS_ALLOW_ALL_ORIGINS = True` in settings.
- On Windows PowerShell, remove directories with `Remove-Item -Recurse -Force .\node_modules` (not `rmdir /s /q`).

---

## License
MIT
