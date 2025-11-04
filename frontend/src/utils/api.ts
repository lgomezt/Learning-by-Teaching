// /frontend/src/utils/api.ts
export async function fetchProblem(file: File | string) {
  // If file is a string (problem filename), fetch from the backend
  if (typeof file === 'string') {
    const res = await fetch(`http://localhost:8000/api/problems/${file}`);
    console.log(res)
    if (!res.ok) {
      throw new Error(`Failed to load problem: ${res.statusText}`);
    }

    return res.json();
  }

  // Otherwise, upload the file
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