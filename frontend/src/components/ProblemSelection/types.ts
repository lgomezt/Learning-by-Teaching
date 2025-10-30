export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  topics: string[];
  completed: boolean;
  fileName: string;
}

export type StatusFilter = 'All' | 'Completed' | 'Incomplete';
export type DifficultyFilter = Difficulty | 'All';
export type TopicFilter = string[];

export interface FiltersState {
  status: StatusFilter;
  difficulty: DifficultyFilter;
  topic: TopicFilter;
}
