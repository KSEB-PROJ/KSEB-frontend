import React, {
    useState,
    useMemo,
    useEffect,
    useLayoutEffect,
    useRef,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faChevronLeft,
    faChevronRight,
    faTimes,
    faSignature,
    faUserTie,
    faCalendarDay,
    faClock,
    faMapMarkerAlt,
    faPalette,
    faArrowRight,
    faArrowLeft,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import type { Course } from './types';
import styles from './UniversityTimetable.module.css';
import panelStyles from './SchedulePage.module.css';

/* ----- 레이아웃 상수 ----- */
const START_HOUR = 9;
const HOUR_ROWS = 13;
const CELL_H = 40;
const HEADER_H = 25;
const TIME_COL_W = 40;

/* ----- 데이터 & 팔레트 ----- */
const allMockCourses: Course[] = [
    {
        id: 1, course_code: 'CS101', course_name: '컴퓨터과학개론', professor: '김철수',
        semester: '2025-1', day_of_week: 'MO', start_time: '10:30', end_time: '12:00',
        location: '공학관 101호', color: '88, 80, 230'
    },
    {
        id: 2, course_code: 'GD203', course_name: 'UX/UI 디자인', professor: '박영희',
        semester: '2025-1', day_of_week: 'TU', start_time: '13:00', end_time: '15:00',
        location: '디자인관 302호', color: '229, 9, 111'
    },
    {
        id: 3, course_code: 'CS202', course_name: '자료구조', professor: '최민준',
        semester: '2025-S', day_of_week: 'WE', start_time: '09:00', end_time: '12:00',
        location: '공학관 203호', color: '23, 168, 143'
    },
];
const colorPalette = ['88, 80, 230', '229, 9, 111', '23, 168, 143', '232, 119, 45', '45, 155, 229', '34, 197, 94', '234, 179, 8'];

/* ----- 유틸 ----- */
const timeToMin = (t: string) => {
    const [h, m] = t.split(':').map(val => parseInt(val, 10));
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
};

/* ----- TimePicker (시간 선택 UI) ----- */
const TimePicker: React.FC<{ selected: string; onChange: (v: string) => void }> = ({ selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const opts = Array.from({ length: (21 - 9) * 2 + 1 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9;
        const minute = (i % 2) * 30;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    });

    useEffect(() => {
        const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={ref} className={styles.timePicker}>
            <button onClick={() => setOpen(!open)} className={`${styles.input} ${styles.timeInput}`}>
                <FontAwesomeIcon icon={faClock} />
                <span>{selected}</span>
            </button>
            {open && (
                <div className={styles.timePickerPopup}>
                    {opts.map(o => (
                        <div key={o} className={`${styles.timeOption} ${o === selected ? styles.selected : ''}`} onClick={() => { onChange(o); setOpen(false); }}>
                            {o}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


/* 
   - 4단계로 나누어 정보를 입력받는 UI/UX
   - 각 단계에 맞는 아이콘과 안내 메시지 제공
   - 프로그레스 바를 통해 진행 상황 시각화
 */
const CourseModal: React.FC<{
    course: Partial<Course> | null;
    onClose: () => void;
    onSave: (c: Course) => void;
    onDelete: (id: number) => void;
}> = ({ course, onClose, onSave, onDelete }) => {

    const [step, setStep] = useState(1);
    const [form, setForm] = useState<Partial<Course> | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setForm(course);
        setStep(1);
    }, [course]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    if (!form) return null;

    const change = (key: keyof Course, value: Course[keyof Course]) => {
        setForm(prev => prev ? { ...prev, [key]: value } : null);
    };


    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSave = () => {
        if (form.course_name && form.day_of_week && form.start_time && form.end_time && form.professor && form.location) {
            if (timeToMin(form.start_time) >= timeToMin(form.end_time)) {
                alert('종료 시간은 시작 시간보다 늦어야 합니다.');
                setStep(2);
                return;
            }
            onSave({ ...form, color: form.color || colorPalette[0] } as Course);
        } else {
            alert('모든 필수 항목을 입력해주세요.');
        }
    };

    const handleDelete = () => {
        if (form.id && window.confirm('이 강의를 시간표에서 정말 삭제하시겠습니까?')) {
            onDelete(form.id);
        }
    };

    // 단계별 제목 추가
    const stepTitles: { [key: number]: string } = {
        1: "핵심 정보",
        2: "시간 설정",
        3: "장소 지정",
        4: "테마 색상"
    };

    const progress = (step / 4) * 100;
    const modalContainerClass = `${styles.modalContainerV2} ${isClosing ? styles.closing : ''}`;

    return (
        <div className={styles.modalOverlayV2} onClick={handleClose}>
            <div className={modalContainerClass} onClick={e => e.stopPropagation()}>
                {/* --- 헤더: 프로그레스바, 단계 제목, 닫기 버튼 통합 --- */}
                <header className={styles.modalHeaderV2}>
                    <div className={styles.progressInfo}>
                        <span className={styles.stepTitle}>{`Step ${step}/4: ${stepTitles[step]}`}</span>
                        <div className={styles.progressWrapper}>
                            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    <button className={styles.closeButtonV2} onClick={handleClose}><FontAwesomeIcon icon={faTimes} /></button>
                </header>

                <main className={styles.modalContentV2}>
                    {/* --- Step 1: 강의 & 교수 정보 --- */}
                    {step === 1 && (
                        <div className={`${styles.modalStep} ${styles.activeStep}`}>
                            <div className={styles.stepHeader}>
                                <FontAwesomeIcon icon={faSignature} />
                                <h3>어떤 수업인가요?</h3>
                                <p>가장 핵심적인 강의명과 담당 교수님 성함을 알려주세요.</p>
                            </div>
                            <div className={styles.inputGroupV2}>
                                <input id="course_name" type="text" value={form.course_name || ''} onChange={e => change('course_name', e.target.value)} placeholder=" " />
                                <label htmlFor="course_name"><FontAwesomeIcon icon={faSignature} /> 강의명</label>
                            </div>
                            <div className={styles.inputGroupV2}>
                                <input id="professor" type="text" value={form.professor || ''} onChange={e => change('professor', e.target.value)} placeholder=" " />
                                <label htmlFor="professor"><FontAwesomeIcon icon={faUserTie} /> 담당 교수</label>
                            </div>
                        </div>
                    )}

                    {/* --- Step 2: 요일 & 시간 정보 --- */}
                    {step === 2 && (
                        <div className={`${styles.modalStep} ${styles.activeStep}`}>
                            <div className={styles.stepHeader}>
                                <FontAwesomeIcon icon={faCalendarDay} />
                                <h3>언제 수강하시나요?</h3>
                                <p>수업이 진행되는 요일과 시간을 선택해주세요.</p>
                            </div>
                            <div className={styles.daySelector}>
                                {['MO', 'TU', 'WE', 'TH', 'FR'].map(day => (
                                    <button
                                        key={day}
                                        className={form.day_of_week === day ? styles.active : ''}
                                        onClick={() => change('day_of_week', day)}
                                    >
                                        {{ MO: '월', TU: '화', WE: '수', TH: '목', FR: '금' }[day]}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.timeSelector}>
                                <TimePicker selected={form.start_time || '09:00'} onChange={v => change('start_time', v)} />
                                <span className={styles.timeSeparator}>~</span>
                                <TimePicker selected={form.end_time || '10:00'} onChange={v => change('end_time', v)} />
                            </div>
                        </div>
                    )}

                    {/* --- Step 3: 강의실 정보 --- */}
                    {step === 3 && (
                        <div className={`${styles.modalStep} ${styles.activeStep}`}>
                            <div className={styles.stepHeader}>
                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                <h3>어디서 진행되나요?</h3>
                                <p>강의실 위치나 온라인 강의 링크를 입력할 수 있습니다.</p>
                            </div>
                            <div className={styles.inputGroupV2}>
                                <input id="location" type="text" value={form.location || ''} onChange={e => change('location', e.target.value)} placeholder=" " />
                                <label htmlFor="location"><FontAwesomeIcon icon={faMapMarkerAlt} /> 강의실</label>
                            </div>
                        </div>
                    )}

                    {/* --- Step 4: 색상 선택 --- */}
                    {step === 4 && (
                        <div className={`${styles.modalStep} ${styles.activeStep}`}>
                            <div className={styles.stepHeader}>
                                <FontAwesomeIcon icon={faPalette} />
                                <h3>마지막으로, 색상을 골라주세요.</h3>
                                <p>시간표에서 이 강의를 나타낼 고유한 색상입니다.</p>
                            </div>
                            <div className={styles.colorPaletteV2}>
                                {colorPalette.map(c => (
                                    <button
                                        key={c}
                                        className={form.color === c ? styles.active : ''}
                                        style={{ '--swatch-color': `rgb(${c})` } as React.CSSProperties}
                                        onClick={() => change('color', c)}
                                    >
                                        {form.color === c && <FontAwesomeIcon icon={faCheck} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                {/* --- 푸터: 버튼 배치 --- */}
                <footer className={styles.modalFooterV2}>
                    <div>
                        {form.id && <button onClick={handleDelete} className={styles.deleteButtonV2}>삭제하기</button>}
                    </div>
                    <div className={styles.stepActions}>
                        {step > 1 && <button onClick={prevStep} className={styles.stepButton}><FontAwesomeIcon icon={faArrowLeft} /> 이전</button>}
                        {step < 4 && <button onClick={nextStep} className={`${styles.stepButton} ${styles.nextButton}`}>다음 <FontAwesomeIcon icon={faArrowRight} /></button>}
                        {step === 4 && <button onClick={handleSave} className={`${styles.stepButton} ${styles.saveButtonV2}`}>저장하기</button>}
                    </div>
                </footer>
            </div>
        </div>
    );
};


/* Main Component */
const UniversityTimetable: React.FC = () => {
    /* --- state --- */
    const [courses, setCourses] = useState<Course[]>(allMockCourses);
    const [semester, setSemester] = useState({ year: 2025, term: 1 });
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState<Partial<Course> | null>(null);
    const [anim, setAnim] = useState<'forward' | 'backward' | null>(null);

    /* 요일, 학기 매핑 */
    const termMap: Record<number, string> = { 1: '1학기', 2: '여름학기', 3: '2학기', 4: '겨울학기' };
    const semKey = `${semester.year}-${{ 1: '1', 2: 'S', 3: '2', 4: 'W' }[semester.term]}`;
    const dayIdx: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4 };

    /* --- 레퍼런스 & 레이아웃 측정 --- */
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

    /* --- 학기 이동 --- */
    const moveSem = (dir: 'prev' | 'next') => {
        setAnim(dir === 'next' ? 'forward' : 'backward');

        setTimeout(() => {
            setSemester((prev) => {
                let { year, term } = prev;

                if (dir === 'next') {
                    if (term === 4) {
                        year += 1;
                        term = 1;
                    } else {
                        term += 1;
                    }
                } else {
                    if (term === 1) {
                        year -= 1;
                        term = 4;
                    } else {
                        term -= 1;
                    }
                }
                return { year, term };
            });
            setAnim(null);
        }, 200);
    };

    /* --- 필터 & 충돌 검사 --- */
    const current = useMemo(() => courses.filter(c => c.semester === semKey), [courses, semKey]);
    const saveCourse = (d: Course) => {
        const ns = timeToMin(d.start_time), ne = timeToMin(d.end_time);
        const clash = courses.find(c => c.id !== d.id && c.semester === d.semester && c.day_of_week === d.day_of_week
            && ns < timeToMin(c.end_time) && ne > timeToMin(c.start_time));
        if (clash) { alert(`"${clash.course_name}" 강의와 시간이 겹칩니다.`); return; }
        setCourses(p => d.id ? p.map(c => c.id === d.id ? d : c) : [...p, { ...d, id: Date.now() }]);
        setModal(false);
    };
    const deleteCourse = (id: number) => { setCourses(p => p.filter(c => c.id !== id)); setModal(false); };

    /* --- 모달 오픈 --- */
    const openAdd = () => {
        setEditing({ semester: semKey, day_of_week: 'MO', start_time: '09:00', end_time: '10:00', color: colorPalette[0] });
        setModal(true);
    };
    const openEdit = (c: Course) => { setEditing(c); setModal(true); };

    /* --- 루프용 상수 --- */
    const hours = Array.from({ length: HOUR_ROWS }, (_, i) => START_HOUR + i);
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const animClass = anim === 'forward' ? styles.slideOutLeft : anim === 'backward' ? styles.slideOutRight : styles.slideIn;

    /* ================= render ================= */
    return (
        <>
            <div className={`${panelStyles.panel} ${styles.timetableContainer}`}>
                {/* 헤더 */}
                <div className={styles.timetableHeader}>
                    <div className={styles.semesterNavigator}>
                        <button onClick={() => moveSem('prev')} className={styles.navButton}><FontAwesomeIcon icon={faChevronLeft} /></button>
                        <h3 className={styles.semesterTitle}>{`${semester.year}년 ${termMap[semester.term]}`}</h3>
                        <button onClick={() => moveSem('next')} className={styles.navButton}><FontAwesomeIcon icon={faChevronRight} /></button>
                    </div>
                    <button onClick={openAdd} className={styles.addButton}><FontAwesomeIcon icon={faPlus} /></button>
                </div>

                {/* 그리드 & 강의 블록*/}
                <div ref={gridRef} className={`${styles.timetableGrid} ${animClass}`}>
                    {/* 빈 그리드(헤더, 시간, 셀) */}
                    <div />{days.map(d => <div key={d} className={styles.gridHeader}>{d}</div>)}
                    {hours.map(h => (
                        <React.Fragment key={h}>
                            <div className={styles.gridTime}>{h}:00</div>
                            {days.map((_, col) => {
                                const hasLecture = current.some(c => {
                                    if (dayIdx[c.day_of_week] !== col) return false;
                                    const s = timeToMin(c.start_time), e = timeToMin(c.end_time);
                                    const cs = h * 60, ce = (h + 1) * 60;
                                    return s < ce && e > cs;
                                });
                                return <div key={col} className={styles.gridCell} onClick={hasLecture ? undefined : openAdd} />;
                            })}
                        </React.Fragment>
                    ))}

                    {/* 강의 블록 렌더링 */}
                    {current.map(c => {
                        if (colW <= 0) return null;

                        const col = dayIdx[c.day_of_week];

                        const minutesSinceGridStart = timeToMin(c.start_time) - (START_HOUR * 60);
                        const top = HEADER_H + (minutesSinceGridStart / 60) * CELL_H + 15;
                        const durationMinutes = timeToMin(c.end_time) - timeToMin(c.start_time);
                        const height = (durationMinutes / 60) * CELL_H;
                        const left = TIME_COL_W + colW * col;

                        return (
                            <div key={c.id} className={styles.courseBlock}
                                style={{
                                    top: `${top}px`,
                                    left: `${left}px`,
                                    height: `${height - 1}px`,
                                    width: `${colW - 2}px`,
                                    '--course-color-rgb': c.color || colorPalette[0]
                                } as React.CSSProperties}
                                onClick={e => { e.stopPropagation(); openEdit(c); }}>
                                <div className={styles.courseName}>{c.course_name}</div>
                                <div className={styles.courseSubInfo}><span>{c.professor}</span><span>{c.location}</span></div>
                            </div>);
                    })}
                </div>
            </div>

            {modal && <CourseModal course={editing} onClose={() => setModal(false)} onSave={saveCourse} onDelete={deleteCourse} />}
        </>
    );
};

export default UniversityTimetable;