// /frontend/src/utils/api.ts
export async function fetchProblem(problem_id: string) {
    const res = await fetch(`http://localhost:8000/api/problems/${problem_id}`);
    return res.json();
}