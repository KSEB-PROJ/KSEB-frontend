import React, { useState, useRef, useEffect, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import clsx from 'clsx';
import styles from './DatePicker.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

interface Props {
    value: string | null;
    onChange: (iso: string | null) => void;
    showTime?: boolean;
}

const DatePicker: React.FC<Props> = ({ value, onChange, showTime = false }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<'bottom' | 'top'>('bottom');

    const [selectedDateTime, setSelectedDateTime] = useState<Dayjs>(() =>
        value ? dayjs(value) : dayjs()
    );
    const [cursor, setCursor] = useState<Dayjs>(value ? dayjs(value) : dayjs());

    // useEffect의 의존성 경고를 해결하기 위해 함수형 업데이트를 사용합니다.
    useEffect(() => {
        const externalDate = value ? dayjs(value) : null;
        setSelectedDateTime(currentInternalDate => {
            if (externalDate && !externalDate.isSame(currentInternalDate)) {
                setCursor(externalDate); // 커서도 함께 업데이트
                return externalDate;
            }
            if (!externalDate && value === null) {
                const now = dayjs();
                setCursor(now);
                return now;
            }
            return currentInternalDate; // 변경이 없으면 기존 상태 유지
        });
    }, [value]);
    
    useEffect(() => {
        if (open && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 350) {
                setPosition('top');
            } else {
                setPosition('bottom');
            }
        }
    }, [open]);

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

    const weeks = useMemo(() => {
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
    }, [cursor]);

    const timeOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i < 24 * 2; i++) {
            const hour = Math.floor(i / 2);
            const minute = (i % 2) * 30;
            options.push(dayjs().hour(hour).minute(minute).second(0));
        }
        return options;
    }, []);

    const handleDateSelect = (day: Dayjs) => {
        const newDateTime = selectedDateTime.year(day.year()).month(day.month()).date(day.date());
        setSelectedDateTime(newDateTime);
        setCursor(newDateTime);
        if (!showTime) {
            onChange(newDateTime.toISOString());
            setOpen(false);
        }
    };

    const handleTimeSelect = (time: Dayjs) => {
        const newDateTime = selectedDateTime.hour(time.hour()).minute(time.minute());
        setSelectedDateTime(newDateTime);
    }

    const handleConfirm = () => {
        onChange(selectedDateTime.toISOString());
        setOpen(false);
    };

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <button
                ref={anchorRef}
                onClick={() => setOpen((o) => !o)}
                className={styles.trigger}
                title="날짜 및 시간 설정"
            >
                <FontAwesomeIcon icon={faCalendarAlt} />
                {showTime && <FontAwesomeIcon icon={faClock} style={{fontSize: '0.8em', marginLeft: '4px'}} />}
            </button>

            {value && (
                <>
                    <span className={styles.text}>
                        {dayjs(value).format(showTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD')}
                    </span>
                    <button
                        className={styles.clear}
                        onClick={() => onChange(null)}
                        title="삭제"
                    >
                        ×
                    </button>
                </>
            )}

            {open && (
                <div ref={calendarRef} className={`${styles.calendar} ${position === 'top' ? styles.calendarPositionedTop : ''}`}>
                    <header className={styles.nav}>
                        <button onClick={() => setCursor((c) => c.subtract(1, 'month'))}>‹</button>
                        <span>{cursor.format('YYYY MMM')}</span>
                        <button onClick={() => setCursor((c) => c.add(1, 'month'))}>›</button>
                    </header>

                    <div className={styles.weekHead}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>

                    {weeks.map((w, i) => (
                        <div key={i} className={styles.weekRow}>
                            {w.map((day: Dayjs) => {
                                const isToday = day.isSame(dayjs(), 'day');
                                const isChosen = day.isSame(selectedDateTime, 'day');
                                const isDimmed = !day.isSame(cursor, 'month');
                                return (
                                    <button
                                        key={day.toString()}
                                        className={clsx(styles.day, {
                                            [styles.today]: isToday,
                                            [styles.chosen]: isChosen,
                                            [styles.dimmed]: isDimmed,
                                        })}
                                        onClick={() => handleDateSelect(day)}
                                    >
                                        {day.date()}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                    
                    {showTime ? (
                        <>
                            <div className={styles.timePicker}>
                                {timeOptions.map(time => (
                                    <button
                                        key={time.format('HH:mm')}
                                        className={clsx(styles.timeOption, {
                                            [styles.chosenTime]: time.hour() === selectedDateTime.hour() && time.minute() === selectedDateTime.minute(),
                                        })}
                                        onClick={() => handleTimeSelect(time)}
                                    >
                                        {time.format('HH:mm')}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.actions}>
                                <button className={styles.confirmButton} onClick={handleConfirm}>확인</button>
                            </div>
                        </>
                    ) : (
                        <div style={{height: '1rem'}}></div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DatePicker;