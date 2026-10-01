import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';

interface MiniCalendarProps {
  value: string;
  onSelect: (dateStr: string) => void;
  label: string;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({ value, onSelect, label }) => {
  // Try to parse the current value into a date, fallback to current or 2026-06-01 (from context)
  const getInitialDate = () => {
    if (!value) return new Date();
    // replace slashes with hyphens
    const normalized = value.replace(/\//g, '-');
    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);
  const [currentMonth, setCurrentMonth] = useState<number>(() => selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(() => selectedDate.getFullYear());
  const [isOpen, setIsOpen] = useState(false);

  // Sync state if outer value changes successfully
  useEffect(() => {
    if (value) {
      const normalized = value.replace(/\//g, '-');
      const parsed = new Date(normalized);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setCurrentMonth(parsed.getMonth());
        setCurrentYear(parsed.getFullYear());
      }
    }
  }, [value]);

  const monthsArabic = [
    'يناير (1)',
    'فبراير (2)',
    'مارس (3)',
    'أبريل (4)',
    'مايو (5)',
    'يونيو (6)',
    'يوليو (7)',
    'أغسطس (8)',
    'سبتمبر (9)',
    'أكتوبر (10)',
    'نوفمبر (11)',
    'ديسمبر (12)'
  ];

  const daysOfWeek = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const formatDate = (year: number, month: number, day: number) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${year}/${pad(month + 1)}/${pad(day)}`;
  };

  const handleDateClick = (day: number) => {
    const formatted = formatDate(currentYear, currentMonth, day);
    onSelect(formatted);
  };

  // Quick helper buttons
  const applyPreset = (type: 'today' | 'plus6m' | 'plus1y' | 'plus2y' | 'plus3y') => {
    const base = new Date(); // Use actual current system date or simulated 2026-06-01
    let target = new Date(base);

    switch (type) {
      case 'today':
        break;
      case 'plus6m':
        target.setMonth(target.getMonth() + 6);
        break;
      case 'plus1y':
        target.setFullYear(target.getFullYear() + 1);
        break;
      case 'plus2y':
        target.setFullYear(target.getFullYear() + 2);
        break;
      case 'plus3y':
        target.setFullYear(target.getFullYear() + 3);
        break;
    }

    const pad = (num: number) => num.toString().padStart(2, '0');
    const formatted = `${target.getFullYear()}/${pad(target.getMonth() + 1)}/${pad(target.getDate())}`;
    onSelect(formatted);
  };

  const daysCount = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  return (
    <div className="mt-1.5 w-full bg-slate-50/80 border border-slate-200/60 rounded-xl p-2.5 transition-all">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg transition-all"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isOpen ? 'إخفاء لوحة التقويم 🔼' : `استخدام التقويم التفاعلي لـ ${label} 🔽`}</span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onSelect('')}
            className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg transition-all"
          >
            مسح التاريخ 🗑️
          </button>
        )}
      </div>

      {/* QUICK PRESETS PANEL - Always visible for supreme speed & store productivity */}
      <div className="flex flex-wrap gap-1 mb-2">
        <button
          type="button"
          onClick={() => applyPreset('today')}
          className="text-[10px] font-extrabold text-slate-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-0.5"
        >
          📅 اليوم (تاريخ اليوم)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('plus6m')}
          className="text-[10px] font-extrabold text-slate-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-0.5"
        >
          📅 +6 أشهر
        </button>
        <button
          type="button"
          onClick={() => applyPreset('plus1y')}
          className="text-[10px] font-extrabold text-slate-750 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-0.5"
        >
          ✨ +سنة واحدة
        </button>
        <button
          type="button"
          onClick={() => applyPreset('plus2y')}
          className="text-[10px] font-extrabold text-slate-750 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-0.5"
        >
          🚀 +سنتين
        </button>
        <button
          type="button"
          onClick={() => applyPreset('plus3y')}
          className="text-[10px] font-extrabold text-slate-750 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-0.5"
        >
          🔥 +3 سنوات
        </button>
      </div>

      {isOpen && (
        <div className="bg-white border border-slate-150 rounded-lg p-2.5 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header Navigation */}
          <div className="flex items-center justify-between gap-1 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" /> {/* Swapped arrows for RTL logic */}
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-md px-1.5 py-1 focus:border-indigo-500 cursor-pointer text-slate-800"
              >
                {monthsArabic.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="bg-slate-55 border border-slate-200 text-[11px] font-bold rounded-md px-1.5 py-1 focus:border-indigo-500 cursor-pointer text-slate-800 font-mono"
              >
                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> {/* Swapped arrows for RTL logic */}
            </button>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((d, idx) => (
              <span key={idx} className="text-[10px] font-extrabold text-slate-400 py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
            {/* Blank spaces before the first day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <span key={`empty-${idx}`} className="py-1"></span>
            ))}

            {/* Days list */}
            {Array.from({ length: daysCount }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected = selectedDate.getDate() === dayNum &&
                                 selectedDate.getMonth() === currentMonth &&
                                 selectedDate.getFullYear() === currentYear;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleDateClick(dayNum)}
                  className={`py-1 rounded-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-extrabold shadow-xs hover:bg-indigo-700'
                      : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-center text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 leading-normal">
            💡 التاريخ المكتوب حالياً: <strong className="text-slate-600 font-mono">{value || '(فارغ)'}</strong>. لست بحاجة للكتابة يدوياً، فقط اختر أحد الأزرار السريعة أو حدد اليوم من الجدول ليتم تحديث الحقل تلقائياً!
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCalendar;
