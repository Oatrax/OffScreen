export type Task = {
  id: number;
  title: string;
  notes: string | null;
  recurrence: number;
  due_date: string | null;
  required: number;
  archived: number;
  created_at: number;
};

export type LockedApp = {
  package_name: string;
  label: string;
  locked_at: number;
};
