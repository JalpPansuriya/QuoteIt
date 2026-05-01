import React from 'react';
import { useStore } from '../store/useStore';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';

interface FilterBarProps {
  fromDate: string;
  toDate: string;
  onDateChange: (from: string, to: string) => void;
  projectId: string;
  onProjectChange: (id: string) => void;
  showDate?: boolean;
  showProject?: boolean;
}

export const FilterBar = ({
  fromDate,
  toDate,
  onDateChange,
  projectId,
  onProjectChange,
  showDate = true,
  showProject = true,
}: FilterBarProps) => {
  const { projects } = useStore();

  return (
    <Card className="p-4 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {showDate && (
          <>
            <div className="w-full sm:w-auto flex-1 max-w-[200px]">
              <Input
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => onDateChange(e.target.value, toDate)}
                className="bg-slate-50 border-slate-200 focus:bg-white h-11"
              />
            </div>
            <div className="w-full sm:w-auto flex-1 max-w-[200px]">
              <Input
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => onDateChange(fromDate, e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white h-11"
              />
            </div>
          </>
        )}
        
        {showProject && (
          <div className="w-full sm:w-72">
            <Select
              label="Project Selection"
              value={projectId}
              onChange={(e) => onProjectChange(e.target.value)}
              className="bg-slate-50 border-slate-200 focus:bg-white h-11"
            >
              <option value="All">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
};
