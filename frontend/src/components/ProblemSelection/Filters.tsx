import React, { useMemo } from 'react';
import type { FiltersState, StatusFilter, DifficultyFilter } from './types';
import { Difficulty } from './types';

interface FiltersProps {
  activeFilters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  availableTopics: string[];
}

interface FilterButtonGroupProps<T> {
  label: string;
  options: readonly T[];
  selectedValue: T;
  onSelect: (value: T) => void;
}

const FilterButtonGroup = <T extends string>({ label, options, selectedValue, onSelect }: FilterButtonGroupProps<T>) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
      <span className="text-sm font-medium text-slate-400 mb-2 sm:mb-0">{label}:</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 ${
              selectedValue === option
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const MultiSelectTopicGroup: React.FC<{
  options: readonly string[];
  selectedValues: string[];
  onSelect: (value: string) => void;
}> = ({ options, selectedValues, onSelect }) => {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-slate-400 mb-2">Topics:</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 ${
              selectedValues.includes(option)
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};


export const Filters: React.FC<FiltersProps> = ({ activeFilters, setFilters, availableTopics }) => {
  const STATUS_FILTERS = ['All', 'Completed', 'Incomplete'];
  const DIFFICULTY_FILTERS = ['All', ...Object.values(Difficulty)];

  const allTopics = useMemo(() => ['All', ...availableTopics.sort()], [availableTopics]);

  const handleFilterChange = <K extends keyof Omit<FiltersState, 'topic'>>(key: K, value: FiltersState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTopicChange = (topic: string) => {
    setFilters(prev => {
      const currentTopics = prev.topic;
      let newTopics: string[];

      if (topic === 'All') {
        newTopics = ['All'];
      } else {
        const nonAllTopics = currentTopics.filter(t => t !== 'All');
        if (nonAllTopics.includes(topic)) {
          newTopics = nonAllTopics.filter(t => t !== topic);
        } else {
          newTopics = [...nonAllTopics, topic];
        }

        if (newTopics.length === 0) {
          newTopics = ['All'];
        }
      }

      return { ...prev, topic: newTopics };
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FilterButtonGroup<StatusFilter>
            label="Status"
            options={STATUS_FILTERS as StatusFilter[]}
            selectedValue={activeFilters.status}
            onSelect={(value) => handleFilterChange('status', value)}
          />
          <FilterButtonGroup<DifficultyFilter>
            label="Difficulty"
            options={DIFFICULTY_FILTERS as DifficultyFilter[]}
            selectedValue={activeFilters.difficulty}
            onSelect={(value) => handleFilterChange('difficulty', value)}
          />
        </div>
        <MultiSelectTopicGroup
          options={allTopics}
          selectedValues={activeFilters.topic}
          onSelect={handleTopicChange}
        />
      </div>
    </div>
  );
};
