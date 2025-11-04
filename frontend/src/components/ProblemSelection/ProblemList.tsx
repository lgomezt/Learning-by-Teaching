import React, { useMemo } from 'react';
import { ProblemCard } from './ProblemCard';
import type { Problem } from './types';
import { UploadProblemCard } from './UploadProblemCard';

interface ProblemListProps {
  problems: Problem[];
  activeTopicFilter: string[];
  onNewProblem: (file: File) => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({ problems, activeTopicFilter, onNewProblem }) => {

  const groupedProblems = useMemo(() => {
    const groups: { [key: string]: Problem[] } = {};

    if (activeTopicFilter.includes('All')) {
      // If 'All' is selected, group all filtered problems by their first topic
      problems.forEach(problem => {
        const mainTopic = problem.tags[0] || 'Uncategorized';
        if (!groups[mainTopic]) {
          groups[mainTopic] = [];
        }
        groups[mainTopic].push(problem);
      });
      return groups;
    }

    // If specific topics are selected, create a group for each selected topic
    // that has matching problems.
    activeTopicFilter.forEach(topic => {
      const problemsInTopic = problems.filter(p => p.tags.includes(topic));
      if (problemsInTopic.length > 0) {
        groups[topic] = problemsInTopic;
      }
    });

    return groups;
  }, [problems, activeTopicFilter]);

  const sortedTopics = useMemo(() => Object.keys(groupedProblems).sort(), [groupedProblems]);

  if (problems.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-slate-800 border border-slate-700 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UploadProblemCard onFileUpload={onNewProblem} />
          <div className='flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 border-slate-600'>
            <h3 className="text-xl font-medium text-white">No Problems Found</h3>
            <p className="text-slate-400 mt-2">Try adjusting your filters to find more challenges.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sortedTopics.map((topic, index) => (
        <section key={topic}>
          <h2 className="text-xl font-medium text-white border-b-2 border-slate-700 pb-2 mb-6">
            {topic}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* We only show this card in the very first topic section (index === 0) */}
            {/* and only when the 'All' filter is active, so it feels like a general 'add' button. */}
            {activeTopicFilter.includes('All') && index === 0 && (
              <UploadProblemCard onFileUpload={onNewProblem} />
            )}

            {/* The existing logic to map over problems remains the same */}
            {groupedProblems[topic].map((problem) => (
              <ProblemCard key={problem.problem_id} problem={problem} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
