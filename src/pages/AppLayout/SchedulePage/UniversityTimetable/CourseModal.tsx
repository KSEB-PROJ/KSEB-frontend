import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faSignature, faUserTie, faCalendarDay, faClock,
    faMapMarkerAlt, faPalette, faArrowRight, faArrowLeft, faCheck
} from '@fortawesome/free-solid-svg-icons';
import type { Course } from '../../../../types';
import styles from './UniversityTimetable.module.css';
import toast from 'react-hot-toast';

/* ----- TimePicker (시간 선택 UI) ----- */
const TimePicker: React.FC<{ selected: string; onChange: (v: string) => void }> = ({ selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const opts = Array.from({ length: (21 - 9) * 2 + 1 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9;
        const minute = (i % 2) * 30;
        // HH:mm:ss 형식
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    });

    useEffect(() => {
        const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={ref} className={styles.timePicker}>
            <button type="button" onClick={() => setOpen(!open)} className={`${styles.input} ${styles.timeInput}`}>
                <FontAwesomeIcon icon={faClock} />
                {/* 표시되는 값은 HH:mm*/}
                <span>{selected ? selected.substring(0, 5) : '09:00'}</span>
            </button>
            {open && (
                <div className={styles.timePickerPopup}>
                    {/* 초를 제외하고 비교 */}
                    {opts.map(o => (
                        <div key={o} className={`${styles.timeOption} ${o === selected ? styles.selected : ''}`} onClick={() => { onChange(o); setOpen(false); }}>
                            {o.substring(0, 5)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


/* CourseModal 컴포넌트 */
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

    const change = (key: keyof Course, value: string) => {
        setForm((prev: Partial<Course> | null) => prev ? { ...prev, [key]: value } : null);
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSave = () => {
        if (form.courseName && form.dayOfWeek && form.startTime && form.endTime && form.professor && form.location) {
            const startTimeMinutes = timeToMin(form.startTime);
            const endTimeMinutes = timeToMin(form.endTime);

            if (startTimeMinutes >= endTimeMinutes) {
                toast.error('종료 시간은 시작 시간보다 늦어야 합니다.');
                setStep(2);
                return;
            }
            onSave({ ...form, themeColor: form.themeColor || colorPalette[0] } as Course);
        } else {
            toast.error('모든 필수 항목을 입력해주세요.');
        }
    };

    const handleDelete = () => {
        if (form.id && window.confirm('이 강의를 시간표에서 정말 삭제하시겠습니까?')) {
            onDelete(form.id);
        }
    };

    const stepTitles: { [key: number]: string } = {
        1: "핵심 정보",
        2: "시간 설정",
        3: "장소 지정",
        4: "테마 색상"
    };

    const colorPalette = [
        '88, 80, 230', '229, 9, 111', '23, 168, 143', '59, 130, 246',
        '232, 119, 45', '34, 197, 94', '234, 179, 8', '239, 68, 68'
    ];

    const progress = (step / 4) * 100;
    const modalContainerClass = `${styles.modalContainerV2} ${isClosing ? styles.closing : ''}`;

    return (
        <div className={styles.modalOverlayV2} onClick={handleClose}>
            <div className={modalContainerClass} onClick={e => e.stopPropagation()}>
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
                    {step === 1 && (
                        <div className={`${styles.modalStep} ${styles.activeStep}`}>
                            <div className={styles.stepHeader}>
                                <FontAwesomeIcon icon={faSignature} />
                                <h3>어떤 수업인가요?</h3>
                                <p>가장 핵심적인 강의명과 담당 교수님 성함을 알려주세요.</p>
                            </div>
                            <div className={styles.inputGroupV2}>
                                <input id="courseName" type="text" value={form.courseName || ''} onChange={e => change('courseName', e.target.value)} placeholder=" " />
                                <label htmlFor="courseName"><FontAwesomeIcon icon={faSignature} /> 강의명</label>
                            </div>
                            <div className={styles.inputGroupV2}>
                                <input id="professor" type="text" value={form.professor || ''} onChange={e => change('professor', e.target.value)} placeholder=" " />
                                <label htmlFor="professor"><FontAwesomeIcon icon={faUserTie} /> 담당 교수</label>
                            </div>
                        </div>
                    )}

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
                                        type="button"
                                        key={day}
                                        className={form.dayOfWeek === day ? styles.active : ''}
                                        onClick={() => change('dayOfWeek', day)}
                                    >
                                        {{ MO: '월', TU: '화', WE: '수', TH: '목', FR: '금' }[day]}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.timeSelector}>
                                <TimePicker selected={form.startTime || '09:00:00'} onChange={v => change('startTime', v)} />
                                <span className={styles.timeSeparator}>~</span>
                                <TimePicker selected={form.endTime || '10:00:00'} onChange={v => change('endTime', v)} />
                            </div>
                        </div>
                    )}

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
                                        type="button"
                                        key={c}
                                        className={form.themeColor === c ? styles.active : ''}
                                        style={{ '--swatch-color': `rgb(${c})` } as React.CSSProperties}
                                        onClick={() => change('themeColor', c)}
                                    >
                                        <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                <footer className={styles.modalFooterV2}>
                    <div>
                        {form.id && <button type="button" onClick={handleDelete} className={styles.deleteButtonV2}>삭제하기</button>}
                    </div>
                    <div className={styles.stepActions}>
                        {step > 1 && <button type="button" onClick={prevStep} className={styles.stepButton}><FontAwesomeIcon icon={faArrowLeft} /> 이전</button>}
                        {step < 4 && <button type="button" onClick={nextStep} className={`${styles.stepButton} ${styles.nextButton}`}><span>다음</span> <FontAwesomeIcon icon={faArrowRight} /></button>}
                        {step === 4 && <button type="button" onClick={handleSave} className={`${styles.stepButton} ${styles.saveButtonV2}`}><span>저장하기</span> <FontAwesomeIcon icon={faCheck} /></button>}
                    </div>
                </footer>
            </div>
        </div>
    );
};

const timeToMin = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(val => parseInt(val, 10));
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
};

export default CourseModal;