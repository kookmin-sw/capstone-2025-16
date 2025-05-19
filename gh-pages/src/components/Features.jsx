import React from 'react';
import { FiUsers, FiBarChart2, FiCpu, FiZap } from 'react-icons/fi';

const Features = () => {
  const featuresData = [
    {
      icon: <FiUsers />,
      title: "코호트 정의",
      description: "드래그 앤 드롭으로 필터 조건을 손쉽게 설정하고, 그 결과 선별된 환자 수를 실시간으로 확인할 수 있습니다. 직관적인 UI/UX와 LLM을 활용한 코호트 구성, 쿼리 load/export 기능을 제공합니다."
    },
    {
      icon: <FiBarChart2 />,
      title: "통계",
      description: "여러 코호트를 한눈에 비교·분석할 수 있는 그래프를 제공하며, 개별 환자의 상세 데이터도 실시간으로 확인할 수 있습니다. 사용자가 직접 정의한 통계 지표 기반의 시각화·분석이 가능합니다."
    },
    {
      icon: <FiCpu />,
      title: "환자군 특징 분석",
      description: "AI 분석을 통해 코호트 집단의 특징을 추가적으로 파악하여 연구진에게 제시합니다. 이를 통해 연구 계획에 빠진 내용이나 관련된 새로운 특징을 발견할 수 있습니다."
    },
    {
      icon: <FiZap />,
      title: "압도적인 속도",
      description: "Clickhouse 데이터베이스의 쿼리 빌더 라이브러리 문제 해결 및 쿼리 병목 현상 해소로, 업계 표준인 Atlas보다 950배 빠른 속도를 자랑합니다."
    }
  ];

  return (
    <section id="features" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-bento-dark-900 via-bento-dark-950 to-bento-dark-900"></div>

      {/* 장식용 서클 */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-bento-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-bento-accent-500/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-bento-blue-200 to-white bg-clip-text text-transparent">
              주요 기능
            </span>
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-bento-blue-500 to-bento-accent-500 mx-auto"></div>
        </div>

        {/* 프로젝트 소개 이미지 */}
        <div className="mb-16">
          <img
            src="https://github.com/kookmin-sw/capstone-2025-16/raw/master/Logo/16%E1%84%8C%E1%85%A9_%E1%84%83%E1%85%A1%E1%84%92%E1%85%A1%E1%86%A8%E1%84%8C%E1%85%A6%E1%84%80%E1%85%A1%E1%86%AB%E1%84%8F%E1%85%A2%E1%86%B8%E1%84%89%E1%85%B3%E1%84%90%E1%85%A9%E1%86%AB%E1%84%83%E1%85%B5%E1%84%8C%E1%85%A1%E1%84%8B%E1%85%B5%E1%86%AB_%E1%84%91%E1%85%A9%E1%84%89%E1%85%B3%E1%84%90%E1%85%A5.jpg"
            alt="Bento 프로젝트 소개"
            className="w-full max-w-4xl mx-auto rounded-lg shadow-2xl"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuresData.map((feature, index) => (
            <div
              key={index}
              className="feature-card group relative transform transition-all duration-300 hover:-translate-y-2"
            >
              {/* 글로우 효과 */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-bento-blue-500 to-bento-accent-500 rounded-xl opacity-0 group-hover:opacity-70 blur transition duration-300 group-hover:animate-glow"></div>

              {/* 배경 효과 */}
              <div className="relative flex flex-col h-full bg-bento-dark-800/70 backdrop-blur-sm border border-bento-gray-700/50 p-6 rounded-xl overflow-hidden">
                {/* 라인 데코레이션 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-bento-blue-500 via-bento-blue-300 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6 p-3">
                    {/* 아이콘 배경 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-bento-blue-500/20 to-bento-blue-800/20 rounded-full blur-sm"></div>
                    <div className="relative p-3 bg-gradient-to-br from-bento-blue-600 to-bento-blue-800 rounded-full text-white transform transition-transform group-hover:scale-110">
                      {React.cloneElement(feature.icon, { size: 32 })}
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-bento-blue-300 transition-colors">{feature.title}</h3>
                  <p className="text-bento-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features; 