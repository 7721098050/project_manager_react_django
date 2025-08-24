const API = (path) => `http://127.0.0.1:8000/api/${path}`;

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  return response.json();
};

export async function getEmployees() {
  const response = await fetch(API('employees/'));
  return handleResponse(response);
}

export async function addEmployee(payload) {
  const response = await fetch(API('employees/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function getEmployeeProjects(employeeId) {
  const response = await fetch(API(`employees/${employeeId}/projects/`));
  return handleResponse(response);
}

export async function getProjects() {
  const response = await fetch(API('projects/'));
  return handleResponse(response);
}

export async function createProject(payload) {
  const response = await fetch(API('projects/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function updateProject(id, payload) {
  const response = await fetch(API(`projects/${id}/`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function deleteProject(id) {
  const response = await fetch(API(`projects/${id}/`), {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.status}`);
  }
}

export async function autoScheduleProject(projectId) {
  const response = await fetch(API(`projects/${projectId}/auto_schedule/`), {
    method: 'POST'
  });
  return handleResponse(response);
}

export async function getTasks(projectId) {
  const response = await fetch(API(`projects/${projectId}/tasks/`));
  return handleResponse(response);
}

export async function updateTask(id, payload) {
  const response = await fetch(API(`tasks/${id}/`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function shiftTask(taskId, days) {
  const response = await fetch(API(`tasks/${taskId}/shift/`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days })
  });
  return handleResponse(response);
}

export async function setTaskCompletionDays(taskId, completionDays) {
  const response = await fetch(API(`tasks/${taskId}/set_completion_days/`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completion_days: completionDays })
  });
  return handleResponse(response);
}

export async function getProjectTimeline() {
  const response = await fetch(API('tasks/project_timeline/'));
  return handleResponse(response);
}

export async function deleteTask(id) {
  const response = await fetch(API(`tasks/${id}/`), {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.status}`);
  }
}