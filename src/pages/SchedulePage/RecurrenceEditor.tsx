import React, { useState, useEffect } from 'react';
import { RRule, rrulestr, type Options } from 'rrule';
import dayjs from 'dayjs';
import styles from './RecurrenceEditor.module.css';

interface Props {
  rruleString: string | undefined;
  onChange: (rrule: string | undefined) => void;
  startDate: string;
}

const weekdayMap = [
  { value: 0, label: '월' }, { value: 1, label: '화' },
  { value: 2, label: '수' }, { value: 3, label: '목' },
  { value: 4, label: '금' }, { value: 5, label: '토' },
  { value: 6, label: '일' },
];

const RecurrenceEditor = ({ rruleString, onChange, startDate }: Props) => {
  const [freq, setFreq] = useState<string>('NONE');
  const [byweekday, setByweekday] = useState<number[]>([]);
  const [until, setUntil] = useState<string>('');

  useEffect(() => {
    if (rruleString) {
      try {
        const rule = rrulestr(rruleString);
        const options = rule.options;
        setFreq(String(options.freq));
        setByweekday(options.byweekday || []);
        setUntil(options.until ? dayjs(options.until).format('YYYY-MM-DD') : '');
      } catch {
        setFreq('NONE');
      }
    }
  }, [rruleString]);

  useEffect(() => {
    if (freq === 'NONE') {
      onChange(undefined);
      return;
    }
    const options: Partial<Options> = {
      freq: Number(freq),
      dtstart: dayjs(startDate).startOf('day').toDate(),
      wkst: 0,
    };
    if (byweekday.length > 0) options.byweekday = byweekday;
    if (until) options.until = dayjs(until).endOf('day').toDate();
    // @ts-expect-error rrule Options 타입 경고 무시
    const rule = new RRule(options);
    onChange(rule.toString());
  }, [freq, byweekday, until, startDate, onChange]);

  const handleFreqChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFreq = e.target.value;
    setFreq(newFreq);

    if (newFreq === String(RRule.WEEKLY) && byweekday.length === 0) {
      const startDayIndex = (dayjs(startDate).day() + 6) % 7;
      setByweekday([startDayIndex]);
    }
    if (newFreq !== String(RRule.WEEKLY)) setByweekday([]);
  };

  const handleWeekdayToggle = (dayValue: number) => {
    setByweekday(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    );
  };

  return (
    <div className={styles.editorContainer}>
      <select className={styles.select} value={freq} onChange={handleFreqChange}>
        <option value="NONE">반복 안 함</option>
        <option value={RRule.DAILY}>매일</option>
        <option value={RRule.WEEKLY}>매주</option>
        <option value={RRule.MONTHLY}>매월</option>
        <option value={RRule.YEARLY}>매년</option>
      </select>
      {freq === String(RRule.WEEKLY) && (
        <div className={styles.weekdaySelector}>
          {weekdayMap.map(day => (
            <button
              key={day.value}
              type="button"
              className={`${styles.weekdayButton} ${byweekday.includes(day.value) ? styles.selected : ''}`}
              onClick={() => handleWeekdayToggle(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}
      {freq !== 'NONE' && (
        <div className={styles.untilGroup}>
          <label className={styles.label}>종료일</label>
          <input
            type="date"
            className={styles.dateInput}
            value={until}
            onChange={e => setUntil(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default RecurrenceEditor;
