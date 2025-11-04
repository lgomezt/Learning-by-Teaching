// /frontend/src/utils/api.ts

// Get the API base URL from the environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function fetchProblem(file: File | string) {
  // If file is a string (problem filename), fetch from the backend
  if (typeof file === 'string') {
    const res = await fetch(`${API_BASE_URL}/problems/${file}`);
    console.log(res)
    if (!res.ok) {
      throw new Error(`Failed to load problem: ${res.statusText}`);
    }

    return res.json();
  }

  // Otherwise, upload the file
  const formData = new FormData();
  formData.append("file", file); // key MUST match 'file' in FastAPI

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to load problem: ${res.statusText}`);
  }

  return res.json();
}