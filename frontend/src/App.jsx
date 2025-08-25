import React, { useEffect, useState } from 'react'
import { getEmployees, addEmployee, getProjects, createProject, updateProject, getTasks, updateTask } from './api'

// Add this CSS to your index.html or create a separate CSS file
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primary: #3B82F6;
    --primary-dark: #2563EB;
    --success: #10B981;
    --warning: #F59E0B;
    --danger: #EF4444;
    --gray-50: #F9FAFB;
    --gray-100: #F3F4F6;
    --gray-200: #E5E7EB;
    --gray-300: #D1D5DB;
    --gray-400: #9CA3AF;
    --gray-500: #6B7280;
    --gray-600: #4B5563;
    --gray-700: #374151;
    --gray-800: #1F2937;
    --gray-900: #111827;
    --white: #FFFFFF;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--gray-50);
    color: var(--gray-900);
    line-height: 1.6;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--gray-900);
    margin-bottom: 0.5rem;
  }

  .header p {
    color: var(--gray-600);
    font-size: 1.1rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--gray-200);
    text-align: center;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: var(--gray-600);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .main-layout {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .main-layout {
      grid-template-columns: 1fr;
    }
  }

  .card {
    background: var(--white);
    border-radius: 12px;
    border: 1px solid var(--gray-200);
    overflow: hidden;
  }

  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--gray-200);
    background: var(--gray-50);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--gray-900);
    margin: 0;
  }

  .card-content {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-weight: 500;
    color: var(--gray-700);
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--white);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: inherit;
  }

  .btn-primary {
    background: var(--primary);
    color: var(--white);
  }

  .btn-primary:hover {
    background: var(--primary-dark);
  }

  .btn-secondary {
    background: var(--gray-100);
    color: var(--gray-700);
    border: 1px solid var(--gray-300);
  }

  .btn-secondary:hover {
    background: var(--gray-200);
  }

  .btn-danger {
    background: var(--danger);
    color: var(--white);
    padding: 0.5rem;
  }

  .btn-danger:hover {
    background: #DC2626;
  }

  .btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .task-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--gray-200);
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .task-header h3 {
    color: var(--gray-900);
    font-size: 1.1rem;
    margin: 0;
  }

  .task-controls {
    display: flex;
    gap: 0.5rem;
  }

  .task-item {
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr auto;
    gap: 1rem;
    align-items: center;
  }

  .task-item:hover {
    background: var(--white);
    border-color: var(--gray-300);
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--gray-500);
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--gray-200);
  }

  th {
    background: var(--gray-50);
    font-weight: 600;
    color: var(--gray-700);
    font-size: 0.9rem;
  }

  tbody tr:hover {
    background: var(--gray-50);
  }

  .progress-bar {
    background: var(--gray-200);
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-pending { background: #FEF3C7; color: #92400E; }
  .status-in_progress { background: #DBEAFE; color: #1E40AF; }
  .status-done { background: #D1FAE5; color: #065F46; }
  .status-blocked { background: #FEE2E2; color: #991B1B; }

  .department-badge {
    background: var(--gray-100);
    color: var(--gray-700);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    display: inline-block;
    margin-top: 0.25rem;
  }

  .text-muted { color: var(--gray-500); }
  .text-primary { color: var(--primary); }
  .font-semibold { font-weight: 600; }
  .mb-4 { margin-bottom: 1rem; }
  .mt-4 { margin-top: 1rem; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 0.5rem; }

  .inline-input {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.3s ease;
    min-width: 120px;
  }

  .inline-input:hover {
    background: var(--gray-50);
    border-color: var(--gray-200);
  }

  .inline-input:focus {
    background: var(--white);
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .task-list-expanded {
    background: var(--gray-50);
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
    border: 1px solid var(--gray-200);
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .stats {
      grid-template-columns: 1fr;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .task-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .task-controls {
      flex-direction: column;
    }
    
    .task-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
  }
`;

function fmt(d) { 
  return d ? new Date(d).toISOString().slice(0, 10) : '' 
}

const DEPARTMENTS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'other', label: 'Other' }
]

export default function App() {
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '', 
    description: '', 
    start_date: '', 
    end_date: '', 
    assigned_employee: '', 
    tasks: []
  })
  const [newEmp, setNewEmp] = useState({
    name: '', 
    email: '', 
    department: 'other'
  })

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [emps, projs] = await Promise.all([getEmployees(), getProjects()])
        setEmployees(emps)
        setProjects(projs)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoading(false)
      }
    })()
  }, [])

  const addTask = () => {
    setForm(f => ({
      ...f, 
      tasks: [...f.tasks, {
        name: '', 
        description: '', 
        order: f.tasks.length + 1, 
        start_date: '', 
        end_date: '', 
        status: 'pending',
        completion_days: 1
      }]
    }))
  }

  const removeTask = (i) => setForm(f => ({
    ...f, 
    tasks: f.tasks.filter((_, idx) => idx !== i).map((t, idx) => ({...t, order: idx + 1}))
  }))

  const updateTaskForm = (i, patch) => setForm(f => ({
    ...f, 
    tasks: f.tasks.map((t, idx) => idx === i ? {...t, ...patch} : t)
  }))

  const autoChain = () => {
    let cur = form.start_date || ''
    if (!cur) {
      alert('Please set project start date first')
      return
    }
    
    const addDays = (d, n) => fmt(new Date(new Date(d).getTime() + n * 86400000))
    let tasks = [...form.tasks]
    
    for (let i = 0; i < tasks.length; i++) {
      if (!cur) break
      tasks[i].start_date = cur
      const completionDays = tasks[i].completion_days || 1
      tasks[i].end_date = addDays(cur, completionDays)
      cur = addDays(tasks[i].end_date, 1)
    }
    setForm(f => ({...f, tasks}))
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = {...form}
      if (!payload.assigned_employee) delete payload.assigned_employee
      payload.tasks = payload.tasks.map(t => ({
        ...t, 
        start_date: t.start_date || null, 
        end_date: t.end_date || null
      }))
      const res = await createProject(payload)
      setProjects(p => [res, ...p])
      setForm({
        title: '', 
        description: '', 
        start_date: '', 
        end_date: '', 
        assigned_employee: '', 
        tasks: []
      })
    } catch (error) {
      alert('Failed to create project: ' + error.message)
    }
  }

  const quickAddEmp = async () => {
    if (!newEmp.name || !newEmp.email) return
    try {
      const res = await addEmployee(newEmp)
      setEmployees(e => [...e, res])
      setNewEmp({name: '', email: '', department: 'other'})
    } catch (error) {
      alert('Failed to add employee: ' + error.message)
    }
  }

  const inlineUpdateProjectDate = async (p, field, value) => {
    try {
      const res = await updateProject(p.id, {[field]: value || null})
      setProjects(prev => prev.map(x => x.id === p.id ? {...x, ...res} : x))
    } catch (error) {
      alert('Failed to update project: ' + error.message)
    }
  }

  const [expanded, setExpanded] = useState(null)

  const handleTaskDateEdit = async (taskId, field, value, projectId) => {
    try {
      await updateTask(taskId, {[field]: value || null})
      const updatedTasks = await getTasks(projectId)
      setProjects(prev => prev.map(p => p.id === projectId ? {...p, tasks: updatedTasks} : p))
    } catch (error) {
      alert('Failed to update task: ' + error.message)
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>📋 Project Manager</h1>
        <p>Simple project and task management with smart scheduling</p>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{projects.length}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{projects.reduce((acc, p) => acc + (p.task_count || 0), 0)}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{employees.length}</div>
          <div className="stat-label">Team Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.completion_percentage || 0), 0) / projects.length) : 0}%
          </div>
          <div className="stat-label">Avg Completion</div>
        </div>
      </div>

      <div className="main-layout">
        {/* Left Panel - Forms */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Create New Project</h2>
          </div>
          <div className="card-content">
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input 
                  className="form-input"
                  placeholder="Enter project title" 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea"
                  rows="3" 
                  placeholder="Project description (optional)" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    className="form-input"
                    type="date" 
                    value={form.start_date} 
                    onChange={e => setForm({...form, start_date: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    className="form-input"
                    type="date" 
                    value={form.end_date} 
                    onChange={e => setForm({...form, end_date: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select 
                  className="form-select"
                  value={form.assigned_employee} 
                  onChange={e => setForm({...form, assigned_employee: e.target.value})}
                >
                  <option value="">Select team member</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department_display}) - {emp.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tasks Section */}
              <div className="task-section">
                <div className="task-header">
                  <h3>Tasks</h3>
                  <div className="task-controls">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-small" 
                      onClick={autoChain}
                    >
                      🔗 Auto-chain
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-small" 
                      onClick={addTask}
                    >
                      + Add Task
                    </button>
                  </div>
                </div>

                {form.tasks.length === 0 && (
                  <div className="empty-state">
                    <p>No tasks added yet. Click "Add Task" to get started.</p>
                  </div>
                )}

                {form.tasks.map((t, i) => (
                  <div key={i} className="task-item">
                    <input 
                      className="form-input"
                      value={t.name} 
                      onChange={e => updateTaskForm(i, {name: e.target.value})} 
                      placeholder={`Task ${i + 1} name`} 
                      required 
                    />
                    <input 
                      className="form-input"
                      type="date" 
                      value={t.start_date} 
                      onChange={e => updateTaskForm(i, {start_date: e.target.value})} 
                    />
                    <input 
                      className="form-input"
                      type="date" 
                      value={t.end_date} 
                      onChange={e => updateTaskForm(i, {end_date: e.target.value})} 
                    />
                    <select 
                      className="form-select"
                      value={t.status} 
                      onChange={e => updateTaskForm(i, {status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-small" 
                      onClick={() => removeTask(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-muted">💡 Smart scheduling included</span>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>

            {/* Employee Section */}
            <div className="task-section">
              <div className="task-header">
                <h3>Add Team Member</h3>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input 
                    className="form-input"
                    placeholder="Full name" 
                    value={newEmp.name} 
                    onChange={e => setNewEmp({...newEmp, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    className="form-input"
                    type="email"
                    placeholder="email@company.com" 
                    value={newEmp.email} 
                    onChange={e => setNewEmp({...newEmp, email: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={newEmp.department} 
                  onChange={e => setNewEmp({...newEmp, department: e.target.value})}
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={{textAlign: 'right'}}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={quickAddEmp}
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Projects Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Projects</h2>
            <span className="text-muted">{projects.length} projects</span>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{textAlign: 'center', padding: '3rem', color: 'var(--gray-500)'}}>
                <p>Loading projects...</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Assigned</th>
                      <th>Progress</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <React.Fragment key={p.id}>
                        <tr>
                          <td>
                            <div>
                              <div className="font-semibold text-primary">{p.title}</div>
                              {p.description && (
                                <div className="text-muted" style={{fontSize: '0.9rem', marginTop: '4px', maxWidth: '250px'}}>
                                  {p.description.substring(0, 80)}{p.description.length > 80 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {p.assigned_employee_detail ? (
                              <div>
                                <div>{p.assigned_employee_detail.name}</div>
                                <div className="department-badge">
                                  {p.assigned_employee_detail.department_display}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">Unassigned</span>
                            )}
                          </td>
                          <td>
                            <div style={{minWidth: '120px'}}>
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{width: `${p.completion_percentage || 0}%`}}
                                />
                              </div>
                              <div className="text-muted" style={{fontSize: '0.8rem'}}>
                                {p.completed_tasks || 0}/{p.task_count || 0} tasks ({p.completion_percentage || 0}%)
                              </div>
                            </div>
                          </td>
                          <td>
                            <input 
                              className="inline-input" 
                              type="date" 
                              value={fmt(p.start_date)} 
                              onChange={e => inlineUpdateProjectDate(p, 'start_date', e.target.value)} 
                            />
                          </td>
                          <td>
                            <input 
                              className="inline-input" 
                              type="date" 
                              value={fmt(p.end_date)} 
                              onChange={e => inlineUpdateProjectDate(p, 'end_date', e.target.value)} 
                            />
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                            >
                              {expanded === p.id ? 'Hide' : 'View'} Tasks
                            </button>
                          </td>
                        </tr>
                        {expanded === p.id && (
                          <tr>
                            <td colSpan="6">
                              <TaskList project={p} onTaskEdit={handleTaskDateEdit} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          No projects created yet. Create your first project!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskList({project, onTaskEdit}) {
  const [tasks, setTasks] = React.useState(project.tasks || [])
  
  React.useEffect(() => {
    setTasks(project.tasks || [])
  }, [project])

  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status}`
  }

  return (
    <div className="task-list-expanded">
      <h4 style={{margin: '0 0 12px 0', color: 'var(--gray-900)'}}>
        📋 Tasks for: {project.title}
      </h4>
      
      {(!tasks || tasks.length === 0) ? (
        <div className="empty-state">
          <p>No tasks defined for this project</p>
        </div>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <table style={{fontSize: '0.85rem'}}>
            <thead>
              <tr>
                <th>#</th>
                <th>Task Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight: '600', color: 'var(--primary)'}}>{t.order}</td>
                  <td>
                    <div style={{maxWidth: '200px'}}>
                      <strong>{t.name}</strong>
                      {t.description && (
                        <div className="text-muted" style={{fontSize: '0.75rem', marginTop: '2px'}}>
                          {t.description.substring(0, 50)}{t.description.length > 50 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <input 
                      className="inline-input" 
                      type="date" 
                      value={fmt(t.start_date)} 
                      onChange={e => onTaskEdit(t.id, 'start_date', e.target.value, project.id)} 
                    />
                  </td>
                  <td>
                    <input 
                      className="inline-input" 
                      type="date" 
                      value={fmt(t.end_date)} 
                      onChange={e => onTaskEdit(t.id, 'end_date', e.target.value, project.id)} 
                    />
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(t.status)}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-muted">
                    {t.completion_time ? 
                      `${t.completion_time.split(' ')[0]} days` : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{marginTop: '12px', padding: '8px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px'}}>
        <p className="text-muted" style={{fontSize: '0.8rem', margin: 0}}>
          💡 <strong>Smart Scheduling:</strong> When you modify a task's timeline, all subsequent tasks automatically adjust to maintain the project flow.
        </p>
      </div>
    </div>
  )
}