import React, { useState, useRef, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import clsx from 'clsx';
import styles from './DatePicker.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

interface Props {
    value: string | null;                 // ISO 8601 문자열
    onChange: (iso: string | null) => void;
}

const DatePicker: React.FC<Props> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const [cursor, setCursor] = useState<Dayjs>(() =>
        value ? dayjs(value) : dayjs()
    );

    /* 외부 클릭 시 달력 닫기 */
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(e.target as Node) &&
                !anchorRef.current?.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    /* 현재 달력에 표시할 주 단위 배열 생성 */
    const weeks = () => {
        const start = cursor.startOf('month').startOf('week');
        const end = cursor.endOf('month').endOf('week');
        const days: Dayjs[] = [];
        let d = start;
        while (d.isBefore(end)) {
            days.push(d);
            d = d.add(1, 'day');
        }
        return Array.from({ length: days.length / 7 }, (_, i) =>
            days.slice(i * 7, i * 7 + 7)
        );
    };

    return (
        <div className={styles.wrapper}>
            {/* 트리거 버튼 */}
            <button
                ref={anchorRef}
                onClick={() => setOpen((o) => !o)}
                className={styles.trigger}
                title="만료일 설정"
            >
                <FontAwesomeIcon icon={faCalendarAlt} />
            </button>

            {/* 선택된 날짜 텍스트 / 클리어 */}
            {value && (
                <>
                    <span className={styles.text}>{dayjs(value).format('YYYY-MM-DD')}</span>
                    <button
                        className={styles.clear}
                        onClick={() => onChange(null)}
                        title="삭제"
                    >
                        ×
                    </button>
                </>
            )}

            {/* 달력 팝업 */}
            {open && (
                <div ref={calendarRef} className={styles.calendar}>
                    <header className={styles.nav}>
                        <button
                            onClick={() => setCursor((c: Dayjs) => c.subtract(1, 'month'))}
                        >
                            ‹
                        </button>
                        <span>{cursor.format('YYYY MMM')}</span>
                        <button onClick={() => setCursor((c: Dayjs) => c.add(1, 'month'))}>
                            ›
                        </button>
                    </header>

                    <div className={styles.weekHead}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>

                    {weeks().map((w, i) => (
                        <div key={i} className={styles.weekRow}>
                            {w.map((day: Dayjs) => {
                                const isToday = day.isSame(dayjs(), 'day');
                                const isChosen = value ? day.isSame(dayjs(value), 'day') : false;
                                const isDimmed = !day.isSame(cursor, 'month');
                                return (
                                    <button
                                        key={day.toString()}
                                        className={clsx(styles.day, {
                                            [styles.today]: isToday,
                                            [styles.chosen]: isChosen,
                                            [styles.dimmed]: isDimmed,
                                        })}
                                        onClick={() => {
                                            onChange(day.startOf('day').toISOString());
                                            setOpen(false);
                                        }}
                                    >
                                        {day.date()}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DatePicker;
