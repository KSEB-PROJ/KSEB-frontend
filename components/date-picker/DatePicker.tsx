import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dayjs, { type Dayjs } from 'dayjs';
import clsx from 'clsx';
import styles from './DatePicker.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

interface Props {
    value: string | null;
    onChange: (iso: string | null) => void;
    showTime?: boolean;
    isEditable?: boolean;
}

const DatePicker: React.FC<Props> = ({ value, onChange, showTime = false, isEditable = true }) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const [calendarStyle, setCalendarStyle] = useState<React.CSSProperties>({});

    const [selectedDateTime, setSelectedDateTime] = useState<Dayjs>(() =>
        value ? dayjs(value) : dayjs()
    );
    const [cursor, setCursor] = useState<Dayjs>(value ? dayjs(value) : dayjs());

    useEffect(() => {
        const externalDate = value ? dayjs(value) : null;
        setSelectedDateTime(currentInternalDate => {
            if (externalDate && !externalDate.isSame(currentInternalDate)) {
                setCursor(externalDate);
                return externalDate;
            }
            if (!externalDate && value === null) {
                const now = dayjs();
                setCursor(now);
                return now;
            }
            return currentInternalDate;
        });
    }, [value]);

    useEffect(() => {
        if (open && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const calendarHeight = showTime ? 420 : 350;
            const calendarWidth = 280;
            let top, left = rect.left;

            if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
                top = rect.top - calendarHeight - 5;
            } else {
                top = rect.bottom + 5;
            }

            if (left + calendarWidth > window.innerWidth) {
                left = window.innerWidth - calendarWidth - 5;
            }

            setCalendarStyle({ position: 'fixed', top: `${top}px`, left: `${left}px` });
        }
    }, [open, showTime]);

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
        if (open) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
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
    
    const CalendarPopup = (
        <div ref={calendarRef} className={styles.calendar} style={calendarStyle} onClick={(e) => e.stopPropagation()}>
            <header className={styles.nav}>
                <button onClick={() => setCursor((c) => c.subtract(1, 'month'))}>‹</button>
                <span>{cursor.format('YYYY MMM')}</span>
                <button onClick={() => setCursor((c) => c.add(1, 'month'))}>›</button>
            </header>
            <div className={styles.weekHead}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d}>{d}</span>)}
            </div>
            {weeks.map((w, i) => (
                <div key={i} className={styles.weekRow}>
                    {w.map((day: Dayjs) => (
                        <button
                            key={day.toString()}
                            className={clsx(styles.day, {
                                [styles.today]: day.isSame(dayjs(), 'day'),
                                [styles.chosen]: day.isSame(selectedDateTime, 'day'),
                                [styles.dimmed]: !day.isSame(cursor, 'month'),
                            })}
                            onClick={() => handleDateSelect(day)}
                        >
                            {day.date()}
                        </button>
                    ))}
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
            ) : (<div style={{height: '1rem'}}></div>)}
        </div>
    );

    return (
        <div className={styles.wrapper}>
            <button
                ref={anchorRef}
                onClick={() => isEditable && setOpen((o) => !o)}
                className={styles.trigger}
                title="날짜 및 시간 설정"
                disabled={!isEditable}
            >
                <FontAwesomeIcon icon={faCalendarAlt} />
                {showTime && <FontAwesomeIcon icon={faClock} style={{fontSize: '0.8em', marginLeft: '4px'}} />}
            </button>
            {value && (
                <>
                    <span className={styles.text}>
                        {dayjs(value).format(showTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD')}
                    </span>
                    <button className={styles.clear} onClick={() => isEditable && onChange(null)} title="삭제" disabled={!isEditable}>×</button>
                </>
            )}
            {open && isEditable ? createPortal(CalendarPopup, document.body) : null}
        </div>
    );
};

export default DatePicker;