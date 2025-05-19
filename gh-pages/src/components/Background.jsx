import React from 'react';
import { FiDatabase, FiUsers, FiZap, FiLayers } from 'react-icons/fi';

const Background = () => {
  // 배경 지식 항목 정의
  const backgroundItems = [
    {
      id: 1,
      title: "CDM 데이터",
      icon: <FiDatabase className="text-3xl" />,
      description: "병원마다 서로 다른 구조로 이루어진 데이터베이스의 자료구조를 통일된 형식으로 변환하는 자료모형입니다. 데이터베이스의 자료구조를 통일하면 데이터베이스에 직접 접근하지 않고도 분석을 설계할 수 있으므로, 자료의 보안을 유지하면서도 빠르고 체계적으로 데이터를 활용할 수 있습니다."
    },
    {
      id: 2,
      title: "코호트 구성",
      icon: <FiUsers className="text-3xl" />,
      description: "CDM 데이터에서 연구 목적에 맞는 공통된 특성을 지닌 환자 집단을 만들기 위해 해당 특성을 만족하는 필터 조건들을 추가하는 과정을 말합니다."
    }
  ];

  return (
    <section id="background" className="relative py-24 overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-bento-dark-900 to-bento-dark-950"></div>
      
      {/* 그리드 패턴 배경 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkM2Q2MTIyIiBvcGFjaXR5PSIwLjIiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-20"></div>
      
      {/* 장식 요소 */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-bento-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-20 left-10 w-80 h-80 bg-bento-accent-600/10 rounded-full blur-3xl animate-float"></div>
      
      {/* 추가 장식 요소 */}
      <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-bento-blue-500/40 rounded-full blur-sm animate-ping-slow"></div>
      <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-bento-accent-500/50 rounded-full animate-ping-slow"></div>
      
      <div className="container relative z-10 mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 bg-clip-text text-transparent">
              배경 지식
            </span>
          </h2>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 animate-width"></div>
          <p className="mt-6 text-bento-gray-300 max-w-2xl mx-auto">
            Bento 프로젝트를 이해하기 위한 핵심 개념을 알아보세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {backgroundItems.map((item) => (
            <div 
              key={item.id} 
              className="group relative animate-fade-in-up"
              style={{ animationDelay: `${item.id * 0.2}s` }}
            >
              {/* 카드 배경 그라디언트 효과 */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500"></div>
              
              <div className="relative h-full bg-bento-dark-800/70 backdrop-blur-sm border border-bento-gray-700/50 rounded-xl overflow-hidden group-hover:shadow-xl transition-all duration-300 p-7">
                {/* 상단 아이콘 영역 */}
                <div className="mb-6 flex items-center">
                  <div className="mr-4 p-3 rounded-lg bg-gradient-to-br from-bento-blue-600/20 to-bento-accent-600/20 backdrop-blur-md border border-bento-gray-700/30">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:bg-gradient-to-r from-white to-bento-blue-200 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {item.title}
                  </h3>
                </div>
                
                {/* 구분선 */}
                <div className="h-px w-full bg-gradient-to-r from-bento-blue-500/20 via-bento-accent-600/20 to-transparent mb-5"></div>
                
                {/* 내용 */}
                <p className="text-bento-gray-300 leading-relaxed">
                  {item.description}
                </p>
                
                {/* 하단 장식 */}
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-bento-blue-500/5 to-transparent rounded-tl-full"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 추가 컨텐츠 영역 */}
        <div className="mt-16 bg-gradient-to-r p-[1px] from-bento-blue-500/40 to-bento-accent-600/40 rounded-xl animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="w-full h-full bg-bento-dark-800/70 backdrop-blur-sm p-8 rounded-xl">
            <div className="flex items-center mb-6">
              <FiZap className="text-3xl mr-4 text-bento-blue-500" />
              <h3 className="text-2xl font-bold text-white">Bento 프로젝트의 차별점</h3>
            </div>
            <p className="text-bento-gray-300 leading-relaxed">
              Bento 프로젝트는 병원 데이터의 구조적 차이를 극복하고 환자 데이터를 안전하게 활용하여 
              보다 효과적인 의사결정을 지원하는 도구입니다. CDM 데이터와 코호트 구성 기술을 통해 
              환자 정보의 보안을 유지하면서도 데이터 기반의 통찰력을 얻을 수 있습니다.
            </p>
          </div>
        </div>
      </div>
      
      {/* 하단 경계선 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bento-blue-500/30 to-transparent"></div>
    </section>
  );
};

export default Background; 