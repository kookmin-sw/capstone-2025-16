import React from 'react';
import { FiServer, FiDatabase, FiShare2, FiLayers, FiTerminal, FiCpu } from 'react-icons/fi';

const Architecture = () => {
  const components = [
    { icon: <FiLayers />, title: "프론트엔드 클라이언트", description: "SvelteKit 기반의 사용자 인터페이스" },
    { icon: <FiServer />, title: "API 서버", description: "NestJS 기반의 RESTful API 서비스" },
    { icon: <FiTerminal />, title: "코호트 쿼리 서비스", description: "쿼리 생성 및 처리를 담당하는 Express 기반 서비스" },
    { icon: <FiCpu />, title: "AI 분석 서비스", description: "환자 데이터 분석 및 인사이트 추출을 위한 Python 기반 서비스" },
    { icon: <FiDatabase />, title: "ClickHouse 데이터베이스", description: "고성능 데이터 저장 및 분석 엔진" },
  ];

  return (
    <section id="architecture" className="relative py-24 overflow-hidden">
      {/* 배경 효과 - 전체 영역을 커버하도록 수정 */}
      <div className="absolute top-0 left-0 w-full h-full bg-bento-dark-900"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/circuit-board.svg')] opacity-5"></div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            <span className="bg-gradient-to-r from-bento-blue-400 to-bento-blue-200 bg-clip-text text-transparent">
              아키텍처
            </span>
          </h2>
          <p className="text-lg text-bento-gray-300 leading-relaxed">
            Bento는 <span className="text-white font-medium">마이크로서비스 아키텍처</span>를 기반으로 구축되었으며, 
            서비스 간 통신은 RESTful API와 메시지 큐를 통해 이루어지며, 
            모든 서비스는 도커 컨테이너로 관리됩니다.
          </p>
        </div>
        
        {/* grid-rows-1 추가하여 행 높이를 일정하게 설정 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
          {components.map((component, index) => (
            <div 
              key={index}
              className="group relative overflow-hidden backdrop-blur-sm h-full flex"
            >
              {/* 카드 테두리 그라디언트 효과 - rounded-xl과 정확히 맞추기 위해 수정 */}
              <div className="absolute inset-[0px] rounded-xl bg-gradient-to-r from-bento-blue-500 to-bento-accent-500 opacity-30 group-hover:opacity-100 transition duration-500 blur-[1px]"></div>
              
              {/* 카드 내용 - h-full 추가하여 높이를 부모 요소에 맞춤 */}
              <div className="relative bg-bento-dark-800/80 border border-bento-gray-700 p-6 rounded-xl hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="relative p-3 rounded-md mr-4 overflow-hidden">
                    {/* 아이콘 배경 그라디언트 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-bento-blue-500 to-bento-blue-700"></div>
                    <div className="relative z-10 text-white">
                      {React.cloneElement(component.icon, { size: 24 })}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{component.title}</h3>
                </div>
                {/* flex-grow 추가하여 컨텐츠가 남은 공간을 채우도록 설정 */}
                <p className="text-bento-gray-300 text-sm leading-relaxed flex-grow">{component.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="relative mt-16 text-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-0.5 w-full max-w-lg mx-auto bg-gradient-to-r from-transparent via-bento-gray-700 to-transparent"></div>
          </div>
          
          <div className="relative z-10 inline-flex items-center justify-center p-4 bg-bento-dark-900">
            <FiShare2 size={32} className="text-bento-blue-400 mr-4"/>
            <div className="text-left">
              <p className="text-lg text-bento-gray-200">
                서비스 간 통신은 <strong className="text-white">RESTful API</strong>와 <strong className="text-white">메시지 큐</strong>를 통해 이루어지며<br />
                모든 서비스는 <strong className="text-white">도커 컨테이너</strong>로 관리됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Architecture; 