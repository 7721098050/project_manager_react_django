
const API = (path) => `http://127.0.0.1:8000/api/${path}`;

export async function getEmployees(){
  const r = await fetch(API('employees/'));
  return r.json();
}
export async function addEmployee(payload){
  const r = await fetch(API('employees/'), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  return r.json();
}
export async function getProjects(){
  const r = await fetch(API('projects/'));
  return r.json();
}
export async function createProject(payload){
  const r = await fetch(API('projects/'), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  return r.json();
}
export async function updateProject(id, payload){
  const r = await fetch(API(`projects/${id}/`), {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  return r.json();
}
export async function getTasks(projectId){
  const r = await fetch(API(`projects/${projectId}/tasks/`));
  return r.json();
}
export async function updateTask(id, payload){
  const r = await fetch(API(`tasks/${id}/`), {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  return r.json();
}
