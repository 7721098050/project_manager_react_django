
import React, { useEffect, useState } from 'react'
import { getEmployees, addEmployee, getProjects, createProject, updateProject, getTasks, updateTask } from './api'

function fmt(d){ return d ? new Date(d).toISOString().slice(0,10) : '' }

export default function App(){
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({title:'', description:'', start_date:'', end_date:'', assigned_employee:'', tasks:[]})
  const [newEmp, setNewEmp] = useState({name:'', email:''})

  useEffect(()=>{
    (async()=>{
      const [emps, projs] = await Promise.all([getEmployees(), getProjects()])
      setEmployees(emps); setProjects(projs); setLoading(false)
    })()
  },[])

  const addTask = () => {
    setForm(f => ({...f, tasks:[...f.tasks, {name:'', description:'', order:f.tasks.length+1, start_date:'', end_date:'', status:'pending'}]}))
  }
  const removeTask = (i) => setForm(f => ({...f, tasks: f.tasks.filter((_,idx)=>idx!==i).map((t,idx)=>({...t, order: idx+1}))}))
  const updateTaskForm = (i, patch) => setForm(f => ({...f, tasks: f.tasks.map((t,idx)=> idx===i ? {...t, ...patch} : t)}))

  const autoChain = ()=>{
    let cur = form.start_date || ''
    const addDays = (d, n)=> fmt(new Date(new Date(d).getTime()+ n*86400000))
    let tasks = [...form.tasks]
    for(let i=0;i<tasks.length;i++){
      if(!cur) break
      if(!tasks[i].start_date) tasks[i].start_date = cur
      if(!tasks[i].end_date){
        tasks[i].end_date = fmt(new Date(new Date(tasks[i].start_date).getTime() + 1*86400000))
      }
      cur = fmt(new Date(new Date(tasks[i].end_date).getTime() + 1*86400000))
    }
    setForm(f=>({...f, tasks}))
  }

  const submit = async (e)=>{
    e.preventDefault()
    const payload = {...form}
    if(!payload.assigned_employee) delete payload.assigned_employee
    payload.tasks = payload.tasks.map(t=> ({...t, start_date: t.start_date || null, end_date: t.end_date || null}))
    const res = await createProject(payload)
    setProjects(p=>[res, ...p])
    setForm({title:'', description:'', start_date:'', end_date:'', assigned_employee:'', tasks:[]})
  }

  const quickAddEmp = async ()=>{
    if(!newEmp.name || !newEmp.email) return
    const res = await addEmployee(newEmp)
    setEmployees(e=>[...e, res])
    setNewEmp({name:'', email:''})
  }

  const inlineUpdateProjectDate = async (p, field, value)=>{
    const res = await updateProject(p.id, {[field]: value || null})
    setProjects(prev => prev.map(x => x.id===p.id ? {...x, ...res} : x))
  }

  const [expanded, setExpanded] = useState(null)

  const handleTaskDateEdit = async (taskId, field, value, projectId)=>{
    const res = await updateTask(taskId, {[field]: value || null})
    const updatedTasks = await getTasks(projectId)
    setProjects(prev => prev.map(p => p.id===projectId ? {...p, tasks: updatedTasks} : p))
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Project Manager</h1>
        <p className="muted">Create projects, assign employees, plan tasks with automatic cascade when a task is delayed.</p>
        <div className="grid grid-2" style={{marginTop:12}}>
          <div>
            <h2>New Project</h2>
            <form onSubmit={submit} className="grid" style={{gap:10}}>
              <input placeholder="Project title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
              <textarea rows="3" placeholder="Description (optional)" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}></textarea>
              <div className="grid grid-2">
                <div>
                  <label className="muted">Start date</label>
                  <input type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})} />
                </div>
                <div>
                  <label className="muted">End date</label>
                  <input type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})} />
                </div>
              </div>
              <div>
                <label className="muted">Assign employee</label>
                <select value={form.assigned_employee} onChange={e=>setForm({...form, assigned_employee:e.target.value})}>
                  <option value="">— Select —</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>)}
                </select>
              </div>

              <div className="taskbox">
                <div className="row" style={{justifyContent:"space-between"}}>
                  <h2>Tasks</h2>
                  <div className="row">
                    <button type="button" className="pill" onClick={autoChain} title="Auto set sequential dates">Auto-chain</button>
                    <button type="button" className="pill" onClick={addTask}>+ Add Task</button>
                  </div>
                </div>
                {form.tasks.length===0 && <p className="muted">No tasks yet. Click “+ Add Task”.</p>}
                <div className="grid" style={{gap:8}}>
                  {form.tasks.map((t,i)=>(
                    <div key={i} className="taskrow">
                      <input value={t.name} onChange={e=>updateTaskForm(i,{name:e.target.value})} placeholder={`Task ${i+1} name`} required />
                      <input type="date" value={t.start_date} onChange={e=>updateTaskForm(i,{start_date:e.target.value})} />
                      <input type="date" value={t.end_date} onChange={e=>updateTaskForm(i,{end_date:e.target.value})} />
                      <select value={t.status} onChange={e=>updateTaskForm(i,{status:e.target.value})}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                      <button type="button" onClick={()=>removeTask(i)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row" style={{justifyContent:"space-between"}}>
                <span className="muted">Completion time is auto-calculated.</span>
                <button className="primary">Create Project</button>
              </div>
            </form>
            <div style={{marginTop:16}}>
              <h2>Quick Add Employee</h2>
              <div className="grid grid-2">
                <input placeholder="Name" value={newEmp.name} onChange={e=>setNewEmp({...newEmp, name:e.target.value})} />
                <input placeholder="Email" value={newEmp.email} onChange={e=>setNewEmp({...newEmp, email:e.target.value})} />
              </div>
              <div className="row" style={{marginTop:8, justifyContent:"flex-end"}}>
                <button className="pill" onClick={quickAddEmp}>Add Employee</button>
              </div>
            </div>
          </div>

          <div>
            <h2>All Projects</h2>
            {loading ? <p>Loading…</p> : (
              <div style={{overflowX:'auto'}}>
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Assigned</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Completion</th>
                      <th>Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <React.Fragment key={p.id}>
                        <tr>
                          <td><strong>{p.title}</strong><div className="muted" style={{maxWidth:320}}>{p.description}</div></td>
                          <td>{p.assigned_employee_detail ? p.assigned_employee_detail.name : <span className="muted">—</span>}</td>
                          <td>
                            <input className="inline-input" type="date" value={fmt(p.start_date)} onChange={e=>inlineUpdateProjectDate(p, 'start_date', e.target.value)} />
                          </td>
                          <td>
                            <input className="inline-input" type="date" value={fmt(p.end_date)} onChange={e=>inlineUpdateProjectDate(p, 'end_date', e.target.value)} />
                          </td>
                          <td>{p.completion_time || <span className="muted">—</span>}</td>
                          <td><span className="link" onClick={()=> setExpanded(expanded===p.id? null : p.id)}>{expanded===p.id? 'Hide' : 'View'}</span></td>
                        </tr>
                        {expanded===p.id && (
                          <tr>
                            <td colSpan="6">
                              <TaskList project={p} onTaskEdit={handleTaskDateEdit} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
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

function TaskList({project, onTaskEdit}){
  const [tasks, setTasks] = React.useState(project.tasks || [])
  React.useEffect(()=>{
    setTasks(project.tasks || [])
  }, [project])

  const fmt = (d)=> d ? new Date(d).toISOString().slice(0,10) : ''

  return (
    <div>
      <h2 style={{marginBottom:8}}>Tasks for: {project.title}</h2>
      {(!tasks || tasks.length===0) ? <p className="muted">No tasks</p> : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Completion</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td>{t.order}</td>
                <td>{t.name}</td>
                <td><input className="inline-input" type="date" value={fmt(t.start_date)} onChange={e=> onTaskEdit(t.id, 'start_date', e.target.value, project.id)} /></td>
                <td><input className="inline-input" type="date" value={fmt(t.end_date)} onChange={e=> onTaskEdit(t.id, 'end_date', e.target.value, project.id)} /></td>
                <td><span className="pill">{t.status}</span></td>
                <td>{t.completion_time || <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted" style={{marginTop:8}}>If Task 1 is delayed, subsequent tasks automatically shift by the same number of days.</p>
    </div>
  )
}
