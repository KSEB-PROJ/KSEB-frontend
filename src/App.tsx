import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MainPage from './pages/MainPage';

const App: React.FC = () => {
  useEffect(() => {
    // 1. Lenis 인스턴스 생성 및 설정
    const lenis = new Lenis();

    // 2. GSAP ScrollTrigger가 Lenis를 사용하도록 설정 (매우 중요!)
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);


    // 3. 애니메이션 프레임마다 Lenis 업데이트
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 4. 컴포넌트 언마운트 시 Lenis 인스턴스 정리
    return () => {
      lenis.destroy();
    };
  }, []);

  return <MainPage />;
};

export default App;