export type TaskKind = 'simple' | 'timed' | 'steps';

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  recurrence: number;
  due_date: string | null;
  required: number;
  archived: number;
  created_at: number;
  kind: TaskKind;
  duration_min: number | null;
};

export type TaskStep = {
  id: number;
  task_id: number;
  title: string;
  position: number;
};

export type LockedApp = {
  package_name: string;
  label: string;
  locked_at: number;
};
