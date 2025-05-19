import React, { useState, useEffect } from 'react';
import { FiGithub, FiYoutube, FiArrowDown, FiZap, FiTarget } from 'react-icons/fi';

const SectionWrapper = ({ children, id, title }) => (
  <section id={id} className="py-16 md:py-24 bg-bento-dark animate-fade-in-up">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-white">
        {title}
      </h2>
      {children}
    </div>
  </section>
);

const Introduction = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const introSection = document.getElementById('introduction');
      if (introSection) {
        const rect = introSection.getBoundingClientRect();
        setIsVisible(rect.bottom > 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="introduction" className="relative min-h-screen pt-28 pb-16 flex flex-col justify-center overflow-hidden">
      {/* 향상된 배경 효과 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkM2Q2MTIyIiBvcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30"></div>
      
      {/* 향상된 장식용 형태들 */}
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-bento-blue-600/40 to-bento-blue-800/40 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute top-40 -right-20 w-80 h-80 bg-gradient-to-r from-bento-accent-400/30 to-bento-accent-600/30 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-bento-blue-500/40 rounded-full blur-sm animate-ping-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-bento-accent-500/50 rounded-full blur-sm animate-ping-slow"></div>

      {/* 새로운 배경 애니메이션 요소들 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 움직이는 그라디언트 원들 */}
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-bento-blue-500/20 to-bento-accent-500/20 rounded-full blur-2xl animate-float-delayed"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-gradient-to-r from-bento-accent-500/20 to-bento-blue-500/20 rounded-full blur-2xl animate-float"></div>
        
        {/* 움직이는 선들 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-bento-blue-500/30 to-transparent animate-slide-right"></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-bento-accent-500/30 to-transparent animate-slide-left"></div>
          <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-bento-blue-500/30 to-transparent animate-slide-right"></div>
        </div>

        {/* 움직이는 점들 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-bento-blue-500/30 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 5}s infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* 반짝이는 효과 */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle ${3 + Math.random() * 2}s infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* 향상된 헤더 섹션 */}
        <div className="text-center mb-20">
          <div className="relative inline-block animate-fade-in-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-bento-blue-500/50 to-bento-accent-500/50 rounded-lg blur-xl opacity-75"></div>
            <h1 className="relative text-5xl md:text-7xl font-bold mb-6 px-4 py-2">
              <span className="bg-gradient-to-r from-white via-bento-blue-200 to-white bg-clip-text text-transparent">
                Bento
              </span>
            </h1>
          </div>
          
          <p className="text-xl md:text-3xl font-medium text-bento-gray-300 animate-fade-in-up mt-6" style={{ animationDelay: '0.2s' }}>
            의료 빅데이터 분석을 <span className="relative inline-block">
              <span className="absolute -inset-1 bg-gradient-to-r from-bento-blue-400/20 to-bento-accent-300/20 rounded-lg blur"></span>
              <span className="relative bg-gradient-to-r from-bento-blue-400 to-bento-accent-300 bg-clip-text text-transparent font-semibold">빠르고 간편하게</span>
            </span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-10" style={{ animationDelay: '0.4s' }}>
            <div className="h-1 w-16 bg-gradient-to-r from-bento-blue-500 to-transparent rounded-full animate-width"></div>
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-bento-accent-500 to-transparent rounded-full animate-width" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-1 w-16 bg-gradient-to-l from-bento-blue-500 to-transparent rounded-full animate-width" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-16">
          {/* 향상된 설명 섹션 */}
          <div className="lg:w-1/2 space-y-8 text-lg leading-relaxed animate-slide-in-left">
            <div className="relative group">
              {/* 카드 배경 효과 */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-700 group-hover:duration-200"></div>
              
              <div className="relative p-7 md:p-8 rounded-2xl bg-bento-dark-800/80 backdrop-blur-md border border-bento-gray-700/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-bento-blue-500/10 to-bento-accent-500/10 rounded-full blur-2xl"></div>
                
                <div className="flex items-center mb-6">
                  <div className="mr-4 p-3 rounded-lg bg-gradient-to-br from-bento-blue-600/20 to-bento-accent-600/20 backdrop-blur-md border border-white/5">
                    <FiTarget className="text-2xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">프로젝트 소개</h3>
                </div>
                
                <p className="mb-6">
                  Bento는 급격히 증가하는 의료 데이터를 빠르고 효율적으로 탐색 및 시각화하여 
                  연구 기획과 진행 속도를 획기적으로 개선하는 시스템입니다.
                </p>
                <p className="mb-6">
                  현재 가장 많이 사용하는 Atlas 프로그램보다 <span className="relative inline-block">
                    <span className="absolute inset-0 bg-bento-accent-500/20 blur-sm rounded-md"></span>
                    <span className="relative text-bento-accent-300 font-semibold">최대 3,000배 빠른 속도</span>
                  </span>를 자랑하며, 
                  기본 제공 차트 외에도 사용자가 직접 정의한 통계 지표를 기반으로 원하는 데이터를 
                  자유롭게 그래프로 생성·분석할 수 있습니다.
                </p>
                <p>
                  Bento는 방대한 데이터 처리 병목 현상을 해소하고, AI 분석 도구를 활용해 
                  연구 설계 단계의 신뢰도와 효율성을 높여 연구 진행 속도를 획기적으로 단축합니다.
                </p>
              </div>
            </div>
            
            <div className="relative group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-700 group-hover:duration-200"></div>
              
              <div className="relative p-7 md:p-8 rounded-2xl bg-bento-dark-800/80 backdrop-blur-md border border-bento-gray-700/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="mr-4 p-3 rounded-lg bg-gradient-to-br from-bento-blue-600/20 to-bento-accent-600/20 backdrop-blur-md border border-white/5">
                    <FiZap className="text-2xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">핵심 기능</h3>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full bg-bento-blue-500/20 text-bento-blue-300">•</span>
                    <span>의료 데이터 빠른 탐색 및 분석</span>
                  </li>
                  <li className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full bg-bento-blue-500/20 text-bento-blue-300">•</span>
                    <span>맞춤형 코호트 생성 및 통계 분석</span>
                  </li>
                  <li className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full bg-bento-blue-500/20 text-bento-blue-300">•</span>
                    <span>강력한 시각화 도구</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <a 
                href="https://github.com/kookmin-sw/capstone-2025-16" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative inline-flex items-center px-6 py-3 overflow-hidden rounded-lg font-semibold"
              >
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out bg-gradient-to-r from-bento-blue-600/80 to-bento-blue-800/80 backdrop-blur-sm"></span>
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 group-hover:opacity-100 bg-gradient-to-r from-bento-blue-500 to-bento-blue-700 group-hover:shadow-[0_0_15px_rgba(36,99,235,0.5)]"></span>
                <span className="relative flex items-center">
                  <FiGithub className="mr-2 h-5 w-5" /> GitHub 프로젝트
                </span>
              </a>
              <a 
                href="https://www.youtube.com/watch?v=o_7Hi4Ujmps"
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative inline-flex items-center px-6 py-3 overflow-hidden rounded-lg font-semibold"
              >
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out bg-gradient-to-r from-red-600/80 to-red-700/80 backdrop-blur-sm"></span>
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 group-hover:opacity-100 bg-gradient-to-r from-red-500 to-red-700 group-hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]"></span>
                <span className="relative flex items-center">
                  <FiYoutube className="mr-2 h-5 w-5" /> 소개 영상 보기
                </span>
              </a>
            </div>
          </div>
          
          {/* 향상된 로고 영역 */}
          <div className="lg:w-2/5 mt-10 lg:mt-0 animate-slide-in-right flex flex-col justify-center">
            <div className="relative group transform transition-all duration-500 hover:scale-105">
              {/* 로고 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-bento-blue-500/20 to-bento-accent-500/20 rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 animate-pulse-slow"></div>
              
              <div className="relative flex items-center justify-center p-8">
                <div className="relative perspective-1000">
                  <div className="transform transition-all duration-700 group-hover:rotate-y-12">
                    <svg 
                      className="w-full h-auto rounded-lg drop-shadow-[0_0_20px_rgba(36,99,235,0.6)]" 
                      viewBox="130 130 340 340"
                      fill="none">
                      <path 
                        fill="#2463eb"
                        d="M269.21,189.19h-10.93c-1.39,0-2.52,1.13-2.52,2.52v14.68h-14.68c-1.39,0-2.52,1.13-2.52,2.52v10.93c0,1.39,1.13,2.52,2.52,2.52h14.68v13.45c0,1.39,1.13,2.52,2.52,2.52h10.93c1.39,0,2.52-1.13,2.52-2.52v-13.45h14.68c1.39,0,2.52-1.13,2.52-2.52v-10.93c0-1.39-1.13-2.52-2.52-2.52h-14.68v-14.68c0-1.39-1.13-2.52-2.52-2.52Z" 
                      />
                      <path 
                        fill="#155dfc"
                        d="M301.84,137.49c-65.8,0-119.55,52.12-119.81,116.18l12.29,.05c.24-57.32,48.47-103.95,107.52-103.95,9.11,0,17.96,1.11,26.42,3.19v109.95h-37.09c-4.22,0-8.27,1.56-11.41,4.38l-18.25,16.43-18.25-16.43c-3.14-2.82-7.19-4.38-11.41-4.38h-35.17c-1.7-2.93-4.87-4.92-8.5-4.92-5.42,0-9.83,4.41-9.83,9.83s4.41,9.83,9.83,9.83c3.63,0,6.8-1.98,8.5-4.92h35.18c1.79,0,3.5,.66,4.83,1.86l24.83,22.35,24.83-22.35c1.33-1.2,3.04-1.85,4.83-1.85h118.2v53.05c0,25.17-9.23,48.3-24.58,66.34v-27.23c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v37.34c-1.6,1.44-3.23,2.84-4.92,4.18v-53.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v60.79c-2,1.26-4.05,2.46-6.14,3.59v-82.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v87.52c-1.62,.68-3.26,1.32-4.92,1.92v-109.1c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v112.14c-8.83,2.28-18.09,3.5-27.65,3.5-42.35,0-79.05-23.89-96.57-58.51,13.95-.03,27.63,1.41,40.73,4.28,15.92,3.49,27.19,8.22,37.13,12.39,11.07,4.64,21.74,10,31.71,15.94,1.01,.6,2.15,.9,3.3,.9s2.2-.28,3.19-.84c2-1.14,3.24-3.27,3.24-5.57v-69.49c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v63.58c-8.86-4.99-18.19-9.55-27.81-13.58-9.81-4.12-22.03-9.24-38.82-12.92-15.15-3.32-31-4.8-47.16-4.44-4.29-11.26-6.64-23.42-6.64-36.11v-44.45h-12.29v44.45c0,64.33,53.75,116.66,119.81,116.66s119.81-52.33,119.81-116.66v-71.65c0-64.33-53.75-116.66-119.81-116.66ZM340.55,262.92v-106.14c40.22,15.12,68.82,53.06,68.82,97.37v8.77h-68.82Z" 
                      />
                    </svg>
                  </div>
                  
                  {/* 3D 효과 요소들 */}
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-bento-blue-500/20 rounded-full blur-2xl animate-pulse-slow"></div>
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-bento-accent-500/20 rounded-full blur-2xl animate-float"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-10 bg-gradient-to-r p-px from-bento-blue-500/50 to-bento-accent-600/50 rounded-xl animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="bg-bento-dark-800/80 backdrop-blur-sm px-6 py-4 rounded-xl">
                <p className="text-center text-bento-gray-300 italic">
                  "Bento로 의료 데이터 분석의 새로운 패러다임을 경험하세요"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 아래로 스크롤 표시 - 스크롤에 따른 가시성 제어 */}
        <div className={`fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <a href="#background" className="flex flex-col items-center group">
            <span className="text-sm mb-3 text-bento-gray-400 group-hover:text-bento-blue-400 transition-colors duration-300">
              더 알아보기
            </span>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-bento-blue-500/0 to-bento-blue-500/30 rounded-full blur-md group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
              <div className="relative p-2 rounded-full bg-bento-dark-800/80 backdrop-blur-sm border border-bento-gray-700/50 group-hover:border-bento-blue-500/50 transition-all duration-300">
                <FiArrowDown className="h-6 w-6 text-bento-gray-400 group-hover:text-bento-blue-400 transition-colors duration-300 animate-bounce" />
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Introduction; 