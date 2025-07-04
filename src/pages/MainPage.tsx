// MainPage 컴포넌트: 메인 랜딩/소개 페이지
// - 섹션별로 구조/컨셉 분리, 각 부분 GSAP 스크롤 애니메이션 적용

import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion'; // 버튼 등 미묘한 인터랙션용
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// 아이콘: 기능별 직관적 구분
import { FiArrowRight, FiZap, FiBox, FiRepeat, FiAward, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom'; // ← 추가
import styles from './MainPage.module.css';

gsap.registerPlugin(ScrollTrigger);
const MotionLink = motion(Link);
// MainPage 전체 컴포넌트
const MainPage: React.FC = () => {
  // 전체 페이지 DOM 참조 (GSAP 애니메이션 타겟팅용)
  const mainRef = useRef<HTMLDivElement>(null);
  // 가로 스크롤 섹션 참조
  const horizontalSectionRef = useRef<HTMLElement>(null);

  // 마운트/업데이트 시 애니메이션 등록
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      /** 1. 히어로 섹션: Parallax + 3D 효과 (페이지 첫 화면, 브랜드 메시지 강조)
       * - 마우스 움직임 따라 텍스트 3D 회전, 스크롤 다운 시 섹션 자체 축소(zoom out)
       * - 협업의 예술적 느낌 강조 (감성 브랜딩용)
       */
      const heroSection = mainRef.current?.querySelector(`.${styles.heroSection}`) as HTMLElement | null;
      const heroContent = mainRef.current?.querySelector(`.${styles.heroContent}`);

      if (heroSection && heroContent) {
        gsap.to(heroSection, {
          scale: 0.8, // 스크롤 내릴수록 섹션 크기 줄임 (focus-out 효과)
          ease: 'power2.in',
          scrollTrigger: {
            trigger: heroSection,
            start: 'bottom bottom',
            end: 'bottom top',
            scrub: true,
          },
        });

        // 마우스 위치에 따라 heroContent 3D 회전
        heroSection.addEventListener('mousemove', (e: MouseEvent) => {
          const { clientX, clientY } = e;
          const { offsetWidth, offsetHeight } = heroSection;
          const xPos = (clientX / offsetWidth - 0.5) * 40;
          const yPos = (clientY / offsetHeight - 0.5) * 40;
          gsap.to(heroContent, {
            rotationY: xPos,
            rotationX: -yPos,
            transformPerspective: 1000,
            duration: 1,
            ease: 'power3.out',
          });
        });
      }

      /** 2. 솔루션 섹션: 텍스트 하이라이트
       * - '복잡함', '아이디어의 본질' 키워드에 그라데이션 underline 애니메이션
       * - 스크롤 구간별 강조 효과로 메시지 집중
       */
      const solutionSection = mainRef.current?.querySelector(`.${styles.solutionSection}`);
      if (solutionSection) {
        const highlights = gsap.utils.toArray<HTMLElement>(`.${styles.highlight}`);
        highlights.forEach(highlight => {
          gsap.fromTo(highlight,
            { '--highlight-width': '0%' }, // 커스텀 CSS 변수 애니메이션
            {
              '--highlight-width': '100%',
              ease: 'none',
              scrollTrigger: {
                trigger: highlight,
                start: 'center 80%',
                end: 'center 50%',
                scrub: true
              }
            }
          );
        });
      }

      /** 3. How-To(사용법/프로세스) 섹션: 스텝별 등장
       * - 각 step이 아래에서 위로 페이드인(스크롤 등장)
       * - 아이디어가 작품이 되는 과정 설명(협업 방식 안내, 서비스 onboarding)
       */
      const howToSteps = gsap.utils.toArray<HTMLElement>(`.${styles.howToStep}`);
      howToSteps.forEach((step) => {
        gsap.fromTo(step, { autoAlpha: 0, y: 50 }, {
          autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 80%',
          }
        });
      });

      /** 4. 가로 스크롤 섹션(주요 기능 소개)
       * - 여러 featureCard(핵심기능 카드)가 좌우로 넘어감
       * - 스크롤 시 옆으로 이동(갤러리 느낌)
       * - 서비스 주요 기능/장점 명확하게 전달
       */
      const horizontalSection = horizontalSectionRef.current;
      if (horizontalSection) {
        const cards = gsap.utils.toArray<HTMLElement>(`.${styles.featureCard}`);
        gsap.to(cards, {
          xPercent: -100 * (cards.length - 1),
          ease: 'none',
          scrollTrigger: {
            trigger: horizontalSection,
            pin: true, // 섹션 고정 (가로 스크롤 효과)
            scrub: 1,
            end: () => `+=${horizontalSection.offsetWidth * (cards.length - 1)}`,
          }
        });
      }

      /** 5. Testimonial(사용자 피드백) 섹션
       * - 각 피드백 카드가 페이드인(등장)
       * - 실사용자/수상/칭찬 등 신뢰성 강조, CTA 유도
       */
      const testimonials = gsap.utils.toArray<HTMLElement>(`.${styles.testimonialCard}`);
      testimonials.forEach(card => {
        gsap.fromTo(card, { autoAlpha: 0, scale: 0.95 }, {
          autoAlpha: 1, scale: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          }
        })
      });

    }, mainRef);

    // 컴포넌트 언마운트시 GSAP context 해제(메모리 관리)
    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className={styles.container}>
      {/* 배경 효과 (파티클/그라데이션 등, 시각적 임팩트) */}
      <div className={styles.backgroundEffect}></div>

      <main>
        {/* 1. 히어로 섹션: 브랜드 메시지/감성 키워드, 3D 효과 */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1>협업의 예술</h1>
            <p>흩어진 아이디어의 파편을 모아, 하나의 걸작으로</p>
          </div>
        </section>

        {/* 2. 솔루션(핵심 가치/컨셉 소개) */}
        <section className={styles.solutionSection}>
          <div className={styles.solutionContent}>
            <h2>
              <span className={styles.highlight}>복잡함</span>이라는 어둠을 걷어내고,<br />
              <span className={styles.highlight}>아이디어의 본질</span>이라는<br />
              순수한 빛에 집중합니다.
            </h2>
          </div>
        </section>

        {/* 3. How-To: 팀플메이트 협업 과정 (3단계: 아이디어 -> 작품) */}
        <section className={styles.howToSection}>
          <div className={styles.sectionHeader}>
            <h2>하나의 걸작이 완성되는 과정</h2>
            <p>팀플메이트는 3단계의 체계적인 워크플로우를 통해 당신의 아이디어를 조각합니다.</p>
          </div>
          <div className={styles.howToGrid}>
            {/* 01. 영감의 수집 (AI 브레인스토밍, 자료 모으기) */}
            <div className={styles.howToStep}>
              <div className={styles.stepNumber}>01</div>
              <h3>영감의 수집 (Gather)</h3>
              <p>AI와 함께 브레인스토밍하고, 흩어진 자료와 생각을 한 곳으로 모아 영감의 원석을 마련합니다.</p>
            </div>
            {/* 02. 아이디어의 조각 (공동 편집, 피드백, 구조화) */}
            <div className={styles.howToStep}>
              <div className={styles.stepNumber}>02</div>
              <h3>아이디어의 조각 (Shape)</h3>
              <p>실시간 공동 편집과 유기적인 피드백을 통해 아이디어의 불필요한 부분을 깎아내고, 핵심을 다듬습니다.</p>
            </div>
            {/* 03. 결과물의 완성 (AI 코치, 마무리, 발표 준비) */}
            <div className={styles.howToStep}>
              <div className={styles.stepNumber}>03</div>
              <h3>결과물의 완성 (Polish)</h3>
              <p>AI 코치의 도움으로 최종 결과물을 완벽하게 연마하고, 세상에 내놓을 준비를 마칩니다.</p>
            </div>
          </div>
        </section>

        {/* 4. Gallery(가로 스크롤, 주요 기능/장점 설명) */}
        <section ref={horizontalSectionRef} className={styles.horizontalSection}>
          <div className={styles.featureCard}>
            <div className={styles.cardContent}>
              <FiZap size={40} />
              <h3>AI 기반 자동화</h3>
              <p>단순 반복 작업을 AI에게 맡기고 창의적인 에너지에 집중하세요. 회의록 요약, 일정 조율은 이제 AI의 몫입니다.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.cardContent}>
              <FiBox size={40} />
              <h3>중앙화된 워크스페이스</h3>
              <p>모든 대화, 파일, 일정을 하나의 캔버스에 담아 정보의 파편화를 막습니다. 모두가 같은 그림을 보며 협업하세요.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.cardContent}>
              <FiRepeat size={40} />
              <h3>몰입형 발표 및 피드백</h3>
              <p>AI 코치와 함께 발표를 연습하고, 팀원들과 입체적인 피드백을 주고받으세요. 최고의 결과는 정교한 다듬기에서 나옵니다.</p>
            </div>
          </div>
        </section>

        {/* 5. Testimonials: 실제 사용자 평가/피드백, 서비스 신뢰도 상승 */}
        <section className={styles.testimonialSection}>
          <div className={styles.sectionHeader}>
            <h2>이미 증명된 가치</h2>
            <p>최고의 팀들은 팀플메이트와 함께 최고의 결과물을 만들어가고 있습니다.</p>
          </div>
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              <FiAward className={styles.testimonialIcon} />
              <p>"팀플 한 학기 내내 썼는데, 이것 없이 옛날로 돌아가라고 하면 못 할 것 같아요. 삶의 질이 달라집니다."</p>
              <span>- 김OO (연세대학교)</span>
            </div>
            <div className={styles.testimonialCard}>
              <FiMessageCircle className={styles.testimonialIcon} />
              <p>"자료 찾고, 정리하고, 회의록 쓰는 시간이 절반으로 줄었어요. 남는 시간에 아이디어 회의를 더 할 수 있었죠."</p>
              <span>- 이XX (고려대학교)</span>
            </div>
          </div>
        </section>

        {/* 6. CTA(콜 투 액션): 바로 시작/회원가입 유도 */}
        <section className={styles.ctaSection}>
          <h2>이제, 당신의 캔버스에<br />첫 획을 그을 시간입니다.</h2>
          <MotionLink
            to="/login"
            className={styles.ctaButton}
            whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
          >
            팀플메이트 시작하기 <FiArrowRight />
          </MotionLink>

        </section>

        {/* 푸터(저작권/마무리) */}
        <footer className={styles.footer}>
          <p>&copy; {new Date().getFullYear()} 팀플메이트. All Rights Reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default MainPage;
