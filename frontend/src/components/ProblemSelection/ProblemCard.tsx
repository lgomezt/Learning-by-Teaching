import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Problem } from './types';
import { Difficulty } from './types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { SignalIcon } from './icons/SignalIcon';
import { useFiles } from '../../../context/filecontext';

interface ProblemCardProps {
  problem: Problem;
}

const difficultyStyles: Record<Difficulty, string> = {
  [Difficulty.Easy]: 'bg-green-500/10 text-green-400 ring-green-500/20',
  [Difficulty.Medium]: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  [Difficulty.Hard]: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  const { title, description, difficulty, topics, completed } = problem;
  const navigate = useNavigate();
  const { setSelectedFile } = useFiles();

  const handleClick = () => {
    setSelectedFile(problem.fileName);
    navigate('/ide');
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col bg-slate-800 border border-slate-700 rounded-lg overflow-hidden transition-all duration-300 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer"
    >
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
          {completed && (
            <span title="Completed">
                <CheckCircleIcon className="h-6 w-6 text-emerald-400 flex-shrink-0" />
            </span>
          )}
        </div>
        <p className="text-slate-300 text-sm leading-relaxed flex-grow">
          {description}
        </p>
      </div>

      <div className="bg-slate-800/50 border-t border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${difficultyStyles[difficulty]}`}>
                <SignalIcon className="h-4 w-4" />
                {difficulty}
            </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
            <CodeBracketIcon className="h-5 w-5 text-slate-400 mr-1" />
            {topics.map((topic) => (
                <span
                    key={topic}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300"
                >
                    {topic}
                </span>
            ))}
        </div>
      </div>
       <div className="bg-emerald-500 h-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
};
