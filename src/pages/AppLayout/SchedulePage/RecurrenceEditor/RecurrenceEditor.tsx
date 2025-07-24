import React, { useState, useEffect, useRef } from 'react';
import { RRule, rrulestr } from 'rrule';
import dayjs from 'dayjs';
import styles from './RecurrenceEditor.module.css';
import DatePicker from '../../../../components/date-picker/DatePicker';

interface Props {
  rruleString?: string;
  onChange: (rrule: string | undefined) => void;
  startDate: string;
  modalKey?: string;
  isEditable?: boolean;
}

const RRuleWeekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
const weekdayMap = [{ value: 0, label: '월' }, { value: 1, label: '화' }, { value: 2, label: '수' }, { value: 3, label: '목' }, { value: 4, label: '금' }, { value: 5, label: '토' }, { value: 6, label: '일' }];

const RecurrenceEditor: React.FC<Props> = ({ rruleString, onChange, startDate, modalKey, isEditable = true }) => {
  const [freq, setFreq] = useState<string>('NONE');
  const [byweekday, setByweekday] = useState<number[]>([]);
  const [until, setUntil] = useState<string | null>(null);
  const didInit = useRef(false);

  useEffect(() => {
    didInit.current = false;
  }, [modalKey]);

  useEffect(() => {
    if (didInit.current) return;
    if (!rruleString) {
      setFreq('NONE'); setByweekday([]); setUntil(null);
      didInit.current = true;
      return;
    }
    try {
      const rule = rrulestr(`DTSTART:${dayjs(startDate).format('YYYYMMDDTHHmmss')}Z\nRRULE:${rruleString}`);
      setFreq(String(rule.options.freq));
      setByweekday(rule.options.byweekday || []);
      setUntil(rule.options.until ? dayjs(rule.options.until).toISOString() : null);
      didInit.current = true;
    } catch {
      setFreq('NONE'); setByweekday([]); setUntil(null);
      didInit.current = true;
    }
  }, [rruleString, startDate]);

  useEffect(() => {
    if (!didInit.current || !isEditable) return;
    if (freq === 'NONE' || !dayjs(startDate).isValid()) {
      onChange(undefined);
      return;
    }
    const selectedWeekdays = byweekday.map((i) => RRuleWeekdays[i]);
    const opts: Partial<RRule.Options> = {
      freq: Number(freq),
      wkst: RRule.MO,
      ...(selectedWeekdays.length > 0 ? { byweekday: selectedWeekdays } : {}),
      ...(until && dayjs(until).isValid()
        ? { until: dayjs(until).endOf('day').toDate() }
        : {}),
    };
    
    const rule = new RRule(opts as RRule.Options);
    // [수정] "RRULE:" 접두사를 제거하고 순수 규칙만 전달
    const ruleString = rule.toString();
    const finalRruleString = ruleString.startsWith('RRULE:') ? ruleString.substring(6) : ruleString;

    if (finalRruleString !== rruleString) {
        onChange(finalRruleString);
    }

  }, [freq, byweekday, until, startDate, onChange, rruleString, isEditable]);

  const handleFreqChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setFreq(v);
    if (v === String(RRule.WEEKLY) && byweekday.length === 0 && dayjs(startDate).isValid()) {
      const idx = (dayjs(startDate).day() + 6) % 7;
      setByweekday([idx]);
    }
    if (v !== String(RRule.WEEKLY)) {
      setByweekday([]);
    }
  };

  const handleWeekdayToggle = (dayValue: number) => {
    setByweekday((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort((a, b) => a - b)
    );
  };

  return (
    <div className={styles.editorContainer}>
      <select className={styles.select} value={freq} onChange={handleFreqChange} disabled={!isEditable}>
        <option value="NONE">반복 안 함</option>
        <option value={String(RRule.DAILY)}>매일</option>
        <option value={String(RRule.WEEKLY)}>매주</option>
        <option value={String(RRule.MONTHLY)}>매월</option>
        <option value={String(RRule.YEARLY)}>매년</option>
      </select>

      {freq === String(RRule.WEEKLY) && (
        <div className={styles.weekdaySelector}>
          {weekdayMap.map((day) => (
            <button
              key={day.value}
              type="button"
              className={`${styles.weekdayButton} ${byweekday.includes(day.value) ? styles.selected : ''}`}
              onClick={() => handleWeekdayToggle(day.value)}
              disabled={!isEditable}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}

      {freq !== 'NONE' && (
        <div className={styles.untilGroup}>
          <label className={styles.label}>종료일</label>
          <DatePicker value={until} onChange={setUntil} showTime={false} isEditable={isEditable} />
        </div>
      )}
    </div>
  );
};

export default RecurrenceEditor;