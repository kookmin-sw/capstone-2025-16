import React, { useState, useEffect } from 'react';
import Introduction from './components/Introduction';
import Background from './components/Background';
import Features from './components/Features';
import Team from './components/Team';
import Architecture from './components/Architecture';
import TechStack from './components/TechStack';
import Footer from './components/Footer';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup function
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = ['introduction', 'background', 'features', 'architecture', 'tech-stack', 'team'];
  
  const getMenuName = (item) => {
    switch(item) {
      case 'introduction': return '소개';
      case 'background': return '배경지식';
      case 'features': return '주요 기능';
      case 'architecture': return '아키텍처';
      case 'tech-stack': return '기술스택';
      case 'team': return '팀원';
      default: return item;
    }
  };

  return (
    <div className="min-h-screen text-bento-gray-100 bg-gradient-to-br from-bento-dark-950 via-bento-dark-900 to-bento-dark-800">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/mesh-gradient.svg')] opacity-10 pointer-events-none z-0"></div>
      
      {/* Hero section gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-screen bg-gradient-radial from-bento-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
      
      <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-bento-dark-900/80 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}>
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <div className="relative bg-transparent p-1">
                <svg 
                  className="w-10 h-10 transform group-hover:scale-105 transition-transform drop-shadow-[0_0_8px_rgba(36,99,235,0.5)]" 
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
            </div>
            <h1 className="text-2xl font-bold text-white">
              <span className="bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 bg-clip-text text-transparent">Bento</span>
            </h1>
          </div>
          
          {/* 데스크탑 메뉴 */}
          <ul className="hidden md:flex space-x-8 text-lg">
            {menuItems.map((item) => (
              <li key={item}>
                <a 
                  href={`#${item}`} 
                  className="relative py-2 px-1 text-bento-gray-300 hover:text-white transition-colors group"
                >
                  <span className="relative z-10">{getMenuName(item)}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
            ))}
          </ul>
          
          {/* 모바일 메뉴 버튼 */}
          <div className="block md:hidden">
            <button 
              className="p-2 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              )}
            </button>
          </div>
        </nav>
        
        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-bento-dark-900/95 backdrop-blur-lg py-4 px-6 animate-fade-in-up">
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item}`} 
                    className="block py-2 px-4 text-bento-gray-300 hover:bg-bento-blue-500/10 hover:text-white rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {getMenuName(item)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <Introduction />
        <Background />
        <Features />
        <Architecture />
        <TechStack />
        <Team />
      </main>

      <Footer />
    </div>
  );
}

export default App; 