// index.tsx - Main component that loads problems from the backend and handles filtering
// ProblemCard.tsx - Individual problem card with click handler to navigate to IDE
// ProblemList.tsx - Groups and displays problems by topic
// Filters.tsx - Filter controls for status, difficulty, and topics (dynamically generated from available problems)
// types.ts - TypeScript interfaces for Problem, Difficulty, and Filters
// utils.ts - Markdown parser to extract YAML frontmatter and loadProblemsFromDirectory() function
// icons/ - SVG icon components (CheckCircle, CodeBracket, Signal)

import React, { useState, useMemo, useEffect } from 'react';
import { Filters } from './Filters';
import { ProblemList } from './ProblemList';
import type { Problem, FiltersState } from './types';
import { loadProblemsFromDirectory, parseProblemMarkdown } from './utils';

function ProblemSelection() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersState>({
    status: 'All',
    difficulty: 'All',
    topic: ['All'],
  });

  useEffect(() => {
    async function fetchProblems() {
      setLoading(true);
      const loadedProblems = await loadProblemsFromDirectory();
      setProblems(loadedProblems);
      setLoading(false);
    }
    fetchProblems();
  }, []);

  const availableTopics = useMemo(() => {
    const topicSet = new Set<string>();
    problems.forEach(problem => {
      problem.topics.forEach(topic => topicSet.add(topic));
    });
    return Array.from(topicSet);
  }, [problems]);

  const handleAddNewProblem = (file: File) => {
    // 1. Create a new FileReader instance
    const reader = new FileReader();

    // 2. Define what happens when the file is successfully read
    reader.onload = (event) => {
      // The file content is now available as a string
      const content = event.target?.result as string;
      if (!content) {
        console.error("Could not read file content.");
        return;
      }

      // 3. Call your existing parser with the file's name and its content!
      const newProblem = parseProblemMarkdown(file.name, content);

      // 4. If parsing was successful, update the state
      if (newProblem) {
        setProblems(currentProblems => [newProblem, ...currentProblems]);
      } else {
        // Add feedback for the user if the markdown format is wrong
        console.error("Failed to parse the markdown file. Check the format.", file.name);
        alert("Error: The uploaded markdown file could not be parsed. Please check the frontmatter format.");
      }
    };

    // 5. Define what happens if there's an error reading the file
    reader.onerror = (error) => {
      console.error("Error reading the file:", error);
    };

    // 6. Start the reading process. This is an asynchronous operation.
    reader.readAsText(file);
  };

  const filteredProblems = useMemo(() => {
    return problems.filter((problem: Problem) => {
      const statusMatch =
        filters.status === 'All' ||
        (filters.status === 'Completed' ? problem.completed : !problem.completed);
      const difficultyMatch =
        filters.difficulty === 'All' || problem.difficulty === filters.difficulty;
      const topicMatch =
        filters.topic.includes('All') ||
        problem.topics.some(topic => filters.topic.includes(topic));
      return statusMatch && difficultyMatch && topicMatch;
    });
  }, [filters, problems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-lg text-slate-300">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Select a Challenge
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Filter through our curated list of problems to find your next challenge.
          </p>
        </header>

        <div className="space-y-8">
          <Filters
            activeFilters={filters}
            setFilters={setFilters}
            availableTopics={availableTopics}
          />
          <ProblemList 
            problems={filteredProblems} 
            activeTopicFilter={filters.topic} 
            onNewProblem={handleAddNewProblem}
            />
        </div>
      </main>
    </div>
  );
}

export default ProblemSelection;
