export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
  problem_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
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
