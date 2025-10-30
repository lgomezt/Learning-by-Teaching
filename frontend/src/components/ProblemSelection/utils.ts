import type { Problem, Difficulty } from './types';

interface ProblemMetadata {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  author?: string;
  created_at?: string;
}

export function parseProblemMarkdown(fileName: string, content: string): Problem | null {
  try {
    // Extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const metadata: Partial<ProblemMetadata> = {};

    // Parse YAML fields
    const titleMatch = frontmatter.match(/title:\s*"([^"]*)"/);
    const descriptionMatch = frontmatter.match(/description:\s*"([^"]*)"/);
    const difficultyMatch = frontmatter.match(/difficulty:\s*"([^"]*)"/);
    const tagsMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.*\n?)*)/);

    if (titleMatch) metadata.title = titleMatch[1];
    if (descriptionMatch) metadata.description = descriptionMatch[1];
    if (difficultyMatch) metadata.difficulty = difficultyMatch[1];

    if (tagsMatch) {
      const tagsContent = tagsMatch[1];
      metadata.tags = tagsContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1).trim())
        .filter(tag => tag.length > 0);
    }

    // Validate required fields
    if (!metadata.title || !metadata.description || !metadata.difficulty || !metadata.tags) {
      return null;
    }

    // Map difficulty to enum
    let difficulty: Difficulty;
    switch (metadata.difficulty.toLowerCase()) {
      case 'easy':
        difficulty = 'Easy'; // <-- Correct
        break;
      case 'medium':
        difficulty = 'Medium'; // <-- Correct
        break;
      case 'hard':
        difficulty = 'Hard'; // <-- Correct
        break;
      default:
        difficulty = 'Medium'; // <-- Correct
    }

    const id = fileName.replace('.md', '');

    return {
      id,
      title: metadata.title,
      description: metadata.description,
      difficulty,
      topics: metadata.tags,
      completed: false, // TODO: Track completion status
      fileName,
    };
  } catch (error) {
    console.error(`Error parsing problem markdown for ${fileName}:`, error);
    return null;
  }
}

export async function loadProblemsFromDirectory(): Promise<Problem[]> {
  try {
    // Fetch the list of problem files from the backend
    const response = await fetch('http://localhost:8000/api/problems');
    if (!response.ok) {
      throw new Error('Failed to fetch problems');
    }

    const data = await response.json();
    const problems: Problem[] = [];

    for (const problemData of data.problems) {
      const problem = parseProblemMarkdown(problemData.fileName, problemData.content);
      if (problem) {
        problems.push(problem);
      }
    }

    return problems;
  } catch (error) {
    console.error('Error loading problems:', error);
    return [];
  }
}
