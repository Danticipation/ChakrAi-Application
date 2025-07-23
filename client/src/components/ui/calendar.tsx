import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  mode?: 'single' | 'range';
  selected?: {
    from?: Date;
    to?: Date;
  } | Date;
  onSelect?: (range: { from: Date; to: Date } | Date | undefined) => void;
  numberOfMonths?: number;
  className?: string;
}

export function Calendar({ 
  mode = 'single', 
  selected, 
  onSelect, 
  numberOfMonths = 1,
  className = "" 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [startDate, setStartDate] = React.useState<Date | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateSelected = (date: Date) => {
    if (mode === 'single' && selected instanceof Date) {
      return date.toDateString() === selected.toDateString();
    }
    if (mode === 'range' && selected && typeof selected === 'object' && 'from' in selected) {
      if (selected.from && selected.to) {
        return date >= selected.from && date <= selected.to;
      }
      if (selected.from) {
        return date.toDateString() === selected.from.toDateString();
      }
    }
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (mode === 'range' && selected && typeof selected === 'object' && 'from' in selected) {
      if (selected.from && selected.to) {
        return date > selected.from && date < selected.to;
      }
    }
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (mode === 'single') {
      onSelect?.(date);
    } else if (mode === 'range') {
      if (!startDate) {
        setStartDate(date);
        onSelect?.({ from: date, to: date });
      } else {
        if (date >= startDate) {
          onSelect?.({ from: startDate, to: date });
        } else {
          onSelect?.({ from: date, to: startDate });
        }
        setStartDate(null);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderMonth = (monthOffset: number = 0) => {
    const monthDate = new Date(currentMonth);
    monthDate.setMonth(monthDate.getMonth() + monthOffset);
    const days = getDaysInMonth(monthDate);

    return (
      <div key={monthOffset} className="p-3">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4">
          {monthOffset === 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
              className="p-1 h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="font-medium text-sm">
            {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
          </div>
          
          {monthOffset === numberOfMonths - 1 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('next')}
              className="p-1 h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          
          {monthOffset !== 0 && monthOffset !== numberOfMonths - 1 && (
            <div className="w-7" />
          )}
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <div key={index} className="aspect-square">
              {date ? (
                <Button
                  variant={isDateSelected(date) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateClick(date)}
                  className={`
                    h-full w-full p-0 text-sm font-normal
                    ${isDateSelected(date) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isDateInRange(date) ? 'bg-blue-100 hover:bg-blue-200' : ''}
                    ${date.toDateString() === new Date().toDateString() ? 'ring-1 ring-blue-300' : ''}
                  `}
                >
                  {date.getDate()}
                </Button>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-md shadow-lg ${className}`}>
      <div className={`grid ${numberOfMonths === 2 ? 'grid-cols-2' : 'grid-cols-1'} divide-x`}>
        {Array.from({ length: numberOfMonths }, (_, i) => renderMonth(i))}
      </div>
    </div>
  );
}