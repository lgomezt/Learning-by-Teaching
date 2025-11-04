// index.tsx - Main component that loads problems from the backend and handles filtering
// ProblemCard.tsx - Individual problem card with click handler to navigate to IDE
// ProblemList.tsx - Groups and displays problems by topic
// Filters.tsx - Filter controls for status, difficulty, and topics (dynamically generated from available problems)
// types.ts - TypeScript interfaces for Problem, Difficulty, and Filters
// utils.ts - Markdown parser to extract YAML frontmatter and loadProblemsFromDirectory() function
// icons/ - SVG icon components (CheckCircle, CodeBracket, Signal)

import { useState, useMemo, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Filters } from './Filters';
import { ProblemList } from './ProblemList';
import type { Problem, FiltersState } from './types';
import { loadProblems } from './utils';
import LoadingComponent from '../../utils/loadingcomponent';

function ProblemSelection() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const { getAccessTokenSilently } = useAuth0();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersState>({
    status: 'All',
    difficulty: 'All',
    topic: ['All'],
  });

  useEffect(() => {
    // Define an async function so we can use await
    const initialize = async () => {
      // Only run when Auth0 is no longer loading
      if (!isLoading) {
        
        // Step 1: Sync the user (if they are logged in)
        if (isAuthenticated && user) {
          try {
            const response = await fetch('http://localhost:8000/api/users/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.sub,
                email: user.email,
                name: user.name,
              }),
            });
            if (!response.ok) throw new Error('Failed to sync user');
          } catch (error) {
            console.error('Error syncing user:', error);
          }
        }
        
        // Step 2: Load problems (this happens after user sync)
        await fetchProblems();
      }
    };

    // Call the async function
    initialize();

  }, [isAuthenticated, user, isLoading]);

  const availableTopics = useMemo(() => {
    const topicSet = new Set<string>();
    problems.forEach(problem => {
      problem.topics?.forEach(topic => topicSet.add(topic));
    });
    return Array.from(topicSet);
  }, [problems]);

  const handleAddNewProblem = async (file: File) => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    try {
      setLoading(true); 

      // Get the secure token from Auth0
      const token = await getAccessTokenSilently();
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file); // The 'file' key must match your FastAPI endpoint

      // POST the file to your new protected endpoint
      const response = await fetch('http://localhost:8000/api/problems/upload', {
        method: 'POST',
        headers: {
          // DO NOT set 'Content-Type': 'multipart/form-data'
          // The browser sets it automatically with the correct boundary
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file.');
      }

      const newProblem = await response.json();
      alert(`Successfully uploaded problem: ${newProblem.title}`);  

      // 3. Refresh the list after successful upload
      await fetchProblems(); // This will re-run the 'loadProblems' function

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed.');
    } finally {
      setLoading(false); 
    }
  };

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const loadedProblems = await loadProblems();
      setProblems(loadedProblems);
    } catch (error) {
      console.error("Failed to fetch problems:", error);
    } finally {
      setLoading(false);
    }
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
        problem.topics?.some(topic => filters.topic.includes(topic));
      return statusMatch && difficultyMatch && topicMatch;
    });
  }, [filters, problems]);

  if (loading) {
    return (
      <LoadingComponent message="Loading..." />
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
