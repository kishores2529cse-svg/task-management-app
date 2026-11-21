import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../../types';

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenCreateTask?: (dateStr?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectTask,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!tasksByDate.has(key)) {
        tasksByDate.set(key, []);
      }
      tasksByDate.get(key)!.push(t);
    }
  });

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(new Date().getDate()).padStart(2, '0')}`;

  const calendarCells = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarCells.push({
      day,
      isCurrentMonth: false,
      dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      dateKey,
      isToday: dateKey === todayStr,
    });
  }

  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      dateKey: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-xs p-4 flex flex-col h-[calc(100vh-12rem)]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="px-2 py-0.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 pb-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-400">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 border-l border-t border-zinc-100 dark:border-zinc-800 auto-rows-fr overflow-y-auto">
        {calendarCells.map((cell, idx) => {
          const dayTasks = tasksByDate.get(cell.dateKey) || [];

          return (
            <div
              key={idx}
              className={`min-h-[80px] p-1.5 border-r border-b border-zinc-100 dark:border-zinc-800 transition-colors flex flex-col justify-between ${
                cell.isCurrentMonth
                  ? 'bg-white dark:bg-zinc-900'
                  : 'bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-400 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`text-[11px] font-mono w-5 h-5 rounded flex items-center justify-center ${
                    cell.isToday
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                      : cell.isCurrentMonth
                      ? 'text-zinc-700 dark:text-zinc-300'
                      : 'text-zinc-400'
                  }`}
                >
                  {cell.day}
                </span>

                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Day tasks chips */}
              <div className="space-y-0.5 mt-1 overflow-y-auto max-h-16">
                {dayTasks.slice(0, 3).map((t) => {
                  const isDone = t.status === 'DONE';
                  const isUrgent = t.priority === 'URGENT';

                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate flex items-center gap-1 transition-colors ${
                        isDone
                          ? 'bg-zinc-100 text-zinc-500 line-through dark:bg-zinc-800'
                          : isUrgent
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 font-medium'
                          : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full flex-shrink-0 ${
                          isUrgent ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'bg-zinc-400'
                        }`}
                      />
                      <span className="truncate">{t.title}</span>
                    </button>
                  );
                })}

                {dayTasks.length > 3 && (
                  <span className="text-[9px] text-zinc-400 font-mono pl-1 block">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
