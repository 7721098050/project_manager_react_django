import React, { useEffect, useState } from 'react'
import { getEmployees, addEmployee, getProjects, createProject, updateProject, getTasks, updateTask } from './api'

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
      <div className="header">
        <h1>🚀 Project Manager</h1>
        <p>Create projects, assign employees, plan tasks with automatic cascade scheduling when delays occur.</p>
      </div>

      <div className="main-layout">
        {/* Left Panel - Forms */}
        <div className="card form-section">
          <div className="card-header">
            <h2 className="card-title">Create New Project</h2>
          </div>

          <form onSubmit={submit} className="form-grid">
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input 
                placeholder="Enter project title" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                rows="3" 
                placeholder="Project description (optional)" 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input 
                  type="date" 
                  value={form.start_date} 
                  onChange={e => setForm({...form, start_date: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input 
                  type="date" 
                  value={form.end_date} 
                  onChange={e => setForm({...form, end_date: e.target.value})} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Employee</label>
              <select 
                value={form.assigned_employee} 
                onChange={e => setForm({...form, assigned_employee: e.target.value})}
              >
                <option value="">— Select Employee —</option>
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
                <h3 style={{margin: 0, color: 'var(--primary-orange)'}}>Project Tasks</h3>
                <div className="task-controls">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-small" 
                    onClick={autoChain}
                    title="Auto-schedule tasks sequentially"
                  >
                    🔗 Auto-chain
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-small" 
                    onClick={addTask}
                  >
                    ➕ Add Task
                  </button>
                </div>
              </div>

              {form.tasks.length === 0 && (
                <div className="empty-state">
                  <p>No tasks added yet. Click "Add Task" to get started.</p>
                </div>
              )}

              <div className="form-grid">
                {form.tasks.map((t, i) => (
                  <div key={i} className="task-row">
                    <input 
                      value={t.name} 
                      onChange={e => updateTaskForm(i, {name: e.target.value})} 
                      placeholder={`Task ${i + 1} name`} 
                      required 
                    />
                    <input 
                      type="date" 
                      value={t.start_date} 
                      onChange={e => updateTaskForm(i, {start_date: e.target.value})} 
                      title="Start Date"
                    />
                    <input 
                      type="date" 
                      value={t.end_date} 
                      onChange={e => updateTaskForm(i, {end_date: e.target.value})} 
                      title="End Date"
                    />
                    <select 
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
                      title="Remove Task"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
              <span className="text-muted">Completion time is auto-calculated</span>
              <button type="submit" className="btn btn-primary">
                🚀 Create Project
              </button>
            </div>
          </form>

          {/* Employee Section */}
          <div className="employee-section">
            <div className="card-header" style={{margin: '0 0 16px 0', padding: '16px 0 12px 0'}}>
              <h3 className="card-title" style={{fontSize: '1.25rem'}}>Quick Add Employee</h3>
            </div>
            
            <div className="form-grid">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input 
                    placeholder="Employee name" 
                    value={newEmp.name} 
                    onChange={e => setNewEmp({...newEmp, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email"
                    placeholder="employee@company.com" 
                    value={newEmp.email} 
                    onChange={e => setNewEmp({...newEmp, email: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  value={newEmp.department} 
                  onChange={e => setNewEmp({...newEmp, department: e.target.value})}
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={quickAddEmp}
                >
                  👤 Add Employee
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Projects Table */}
        <div className="card table-section">
          <div className="card-header">
            <h2 className="card-title">All Projects</h2>
            <span className="text-muted">{projects.length} projects</span>
          </div>

          {loading ? (
            <div className="loading">
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
                    <th>Duration</th>
                    <th>Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <React.Fragment key={p.id}>
                      <tr>
                        <td>
                          <div>
                            <strong style={{color: 'var(--primary-orange)'}}>{p.title}</strong>
                            {p.description && (
                              <div className="text-muted" style={{fontSize: '0.8rem', marginTop: '4px', maxWidth: '250px'}}>
                                {p.description.substring(0, 80)}{p.description.length > 80 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {p.assigned_employee_detail ? (
                            <div>
                              <div>{p.assigned_employee_detail.name}</div>
                              <span className="department-badge">
                                {p.assigned_employee_detail.department_display}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div style={{minWidth: '80px'}}>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{width: `${p.completion_percentage || 0}%`}}
                              />
                            </div>
                            <div style={{fontSize: '0.75rem', marginTop: '2px', color: 'var(--text-secondary)'}}>
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
                          <span className="text-muted">
                            {p.completion_time ? 
                              `${p.completion_time.split(' ')[0]} days` : '—'
                            }
                          </span>
                        </td>
                        <td>
                          <span 
                            className="text-link" 
                            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                          >
                            {expanded === p.id ? '👁️ Hide' : '👀 View'}
                          </span>
                        </td>
                      </tr>
                      {expanded === p.id && (
                        <tr>
                          <td colSpan="7">
                            <TaskList project={p} onTaskEdit={handleTaskDateEdit} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        No projects created yet. Create your first project using the form on the left!
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
      <h4 style={{margin: '0 0 12px 0', color: 'var(--primary-orange)'}}>
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
                <th>Business Days</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight: '600', color: 'var(--primary-orange)'}}>{t.order}</td>
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
                  <td className="text-muted">
                    {t.business_days || t.completion_days || '—'} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{marginTop: '12px', padding: '8px', background: 'rgba(255, 107, 53, 0.05)', borderRadius: '6px'}}>
        <p className="text-muted" style={{fontSize: '0.8rem', margin: 0}}>
          💡 <strong>Smart Scheduling:</strong> When you modify a task's timeline, all subsequent tasks automatically adjust to maintain the project flow.
        </p>
      </div>
    </div>
  )
}