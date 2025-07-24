import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
    faPlus, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Course } from '../../../../types';
import styles from './UniversityTimetable.module.css';
import panelStyles from '../SchedulePage.module.css';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../../../api/timetable';
import toast from 'react-hot-toast';
import CourseModal from './CourseModal';
import { AxiosError } from 'axios';

/* ----- 레이아웃 상수 ----- */
const START_HOUR = 9;
const HOUR_ROWS = 13;
const CELL_H = 40;
const HEADER_H = 25;
const TIME_COL_W = 40;

/* ----- 데이터 & 팔레트 ----- */
const colorPalette = [
    '#5850E6', '#E5096F', '#17A88F', '#3B82F6',
    '#E8772D', '#22C55E', '#EAB308', '#EF4444'
];

/* ----- 유틸 ----- */
const timeToMin = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(val => parseInt(val, 10));
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
};

/* ----- Main Component ----- */
const UniversityTimetable: React.FC<{ onTimetableUpdate: () => void }> = ({ onTimetableUpdate }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [semester, setSemester] = useState({ year: 2025, term: 1 });
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState<Partial<Course> | null>(null);
    const [anim, setAnim] = useState<'forward' | 'backward' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const termMap: Record<number, string> = { 1: '1학기', 2: '여름학기', 3: '2학기', 4: '겨울학기' };
    const semKey = `${semester.year}-${{ 1: 'S1', 2: 'SU', 3: 'S2', 4: 'WI' }[semester.term]}`;
    const dayIdx: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };

    const gridRef = useRef<HTMLDivElement>(null);
    const [colW, setColW] = useState(0);

    const measureLayout = () => {
        if (gridRef.current) {
            const gridRect = gridRef.current.getBoundingClientRect();
            setColW((gridRect.width - TIME_COL_W) / 5);
        }
    };

    useLayoutEffect(() => {
        measureLayout();
        window.addEventListener('resize', measureLayout);
        return () => window.removeEventListener('resize', measureLayout);
    }, []);

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getCourses(semKey);
            setCourses(response.data);
        } catch (error) {
            toast.error("시간표를 불러오는 데 실패했습니다.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [semKey]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const moveSem = (dir: 'prev' | 'next') => {
        setAnim(dir === 'next' ? 'forward' : 'backward');
        setTimeout(() => {
            setSemester((prev) => {
                let { year, term } = prev;
                if (dir === 'next') {
                    term = term === 4 ? 1 : term + 1;
                    year = term === 1 ? year + 1 : year;
                } else {
                    term = term === 1 ? 4 : term - 1;
                    year = term === 4 ? year - 1 : year;
                }
                return { year, term };
            });
            setAnim(null);
        }, 200);
    };

    const saveCourse = (data: Course) => {
        const promise = data.id
            ? updateCourse(data.id, data)
            : createCourse({ ...data, courseCode: data.courseCode || "N/A" });

        toast.promise(promise, {
            loading: '저장 중...',
            success: () => {
                fetchCourses();
                onTimetableUpdate();
                setModal(false);
                return <b>저장되었습니다.</b>;
            },
            error: (err: AxiosError<{ message?: string }>) => {
                const message = err.response?.data?.message || "저장에 실패했습니다.";
                return <b>{message}</b>;
            }
        });
    };

    const deleteCourseById = (id: number) => {
        toast.promise(deleteCourse(id), {
            loading: '삭제 중...',
            success: () => {
                fetchCourses();
                onTimetableUpdate();
                setModal(false);
                return <b>삭제되었습니다.</b>;
            },
            error: <b>삭제에 실패했습니다.</b>
        });
    };

    const openAdd = () => {
        setEditing({
            semester: semKey,
            dayOfWeek: 'MO',
            startTime: '09:00:00',
            endTime: '10:00:00',
            themeColor: colorPalette[0]
        });
        setModal(true);
    };
    const openEdit = (c: Course) => { setEditing(c); setModal(true); };

    const hours = Array.from({ length: HOUR_ROWS }, (_, i) => START_HOUR + i);
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const animClass = anim === 'forward' ? styles.slideOutLeft : anim === 'backward' ? styles.slideOutRight : styles.slideIn;

    return (
        <>
            <div className={`${panelStyles.panel} ${styles.timetableContainer}`}>
                <div className={styles.timetableHeader}>
                    <div className={styles.semesterNavigator}>
                        <button onClick={() => moveSem('prev')} className={styles.navButton}><FontAwesomeIcon icon={faChevronLeft} /></button>
                        <h3 className={styles.semesterTitle}>{`${semester.year}년 ${termMap[semester.term]}`}</h3>
                        <button onClick={() => moveSem('next')} className={styles.navButton}><FontAwesomeIcon icon={faChevronRight} /></button>
                    </div>
                    <button onClick={openAdd} className={styles.addButton}><FontAwesomeIcon icon={faPlus} /></button>
                </div>

                <div ref={gridRef} className={`${styles.timetableGrid} ${animClass}`}>
                    <div />{days.map(d => <div key={d} className={styles.gridHeader}>{d}</div>)}
                    {hours.map(h => (
                        <React.Fragment key={h}>
                            <div className={styles.gridTime}>{h}:00</div>
                            {days.map((_, col) => {
                                const hasLecture = courses.some(c => dayIdx[c.dayOfWeek] === col && timeToMin(c.startTime) < (h + 1) * 60 && timeToMin(c.endTime) > h * 60);
                                return <div key={col} className={styles.gridCell} onClick={hasLecture ? undefined : openAdd} />;
                            })}
                        </React.Fragment>
                    ))}

                    {isLoading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>시간표를 불러오는 중...</div>
                    ) : (
                        courses.map(c => {
                            if (colW <= 0) return null;
                            const col = dayIdx[c.dayOfWeek];
                            const top = HEADER_H + (timeToMin(c.startTime) - START_HOUR * 60) / 60 * CELL_H + 15;
                            const height = (timeToMin(c.endTime) - timeToMin(c.startTime)) / 60 * CELL_H;
                            const left = TIME_COL_W + colW * col;

                            return (
                                <div key={c.id} className={styles.courseBlock}
                                    style={{ top: `${top}px`, left: `${left}px`, height: `${height - 1}px`, width: `${colW - 2}px`, '--course-color-rgb': c.themeColor || colorPalette[0] } as React.CSSProperties}
                                    onClick={e => { e.stopPropagation(); openEdit(c); }}>
                                    <div className={styles.courseName}>{c.courseName}</div>
                                    <div className={styles.courseSubInfo}><span>{c.professor}</span><span>{c.location}</span></div>
                                </div>);
                        })
                    )}
                </div>
            </div>

            {modal && <CourseModal course={editing} onClose={() => setModal(false)} onSave={saveCourse} onDelete={deleteCourseById} />}
        </>
    );
};

export default UniversityTimetable;