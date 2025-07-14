// /frontend/src/utils/api.ts
export async function fetchProblem(file: File) {
  const formData = new FormData();
  formData.append("file", file); // key MUST match 'file' in FastAPI

  const res = await fetch("http://localhost:8000/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to load problem: ${res.statusText}`);
  }

  return res.json();
}