import React from 'react';
import { 
  FiLayout, 
  FiServer, 
  FiDatabase, 
  FiCode, 
  FiCpu, 
  FiGitBranch,
  FiCheckCircle
} from 'react-icons/fi';

const SectionWrapper = ({ children, id, title }) => (
  <section id={id} className="py-16 md:py-24 bg-bento-gray/10">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-white">{title}</h2>
      {children}
    </div>
  </section>
);

const TechCategory = ({ category, technologies, details }) => (
  <div className="bg-bento-gray p-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-102 hover:shadow-bento-blue/30">
    <h3 className="text-2xl font-semibold text-bento-lightblue mb-4 border-b-2 border-bento-blue pb-2">{category}</h3>
    <p className="text-lg text-white font-medium mb-2"><strong>주요 기술:</strong> {technologies}</p>
    <div className="text-bento-lightgray space-y-1">
      {details.split('<br>').map((line, index) => (
        <p key={index} dangerouslySetInnerHTML={{ __html: line.replace(/•/g, '<span class="text-bento-accent mr-2">•</span>') }} />
      ))}
    </div>
  </div>
);

const TechStack = () => {
  const techData = [
    {
      category: "Frontend",
      technologies: "SvelteKit 5.0.0",
      details: [
        "TailwindCSS 3.4.17", 
        "D3.js 7.9.0", 
        "TypeScript", 
        "Vite 6.0.0", 
        "svelte-dnd-action (드래그 앤 드롭)"
      ],
      icon: <FiLayout />,
      color: "from-blue-400 to-purple-500"
    },
    {
      category: "Backend API",
      technologies: "NestJS 11.0.1",
      details: [
        "@clickhouse/client 1.11.1",
        "Kysely 0.28.2 (쿼리 빌더)",
        "@nestjs/swagger 11.1.5",
        "class-validator/transformer",
        "NATS 2.29.3 (메시징)"
      ],
      icon: <FiServer />,
      color: "from-teal-400 to-bento-blue-600"
    },
    {
      category: "AI",
      technologies: "Python",
      details: [
        "PyMuPDF 1.25.5",
        "Shap 0.47.2",
        "xgboost 3.0.0",
        "scikit-learn 1.6.1",
        "Pandas 2.2.3/NumPy 2.2.5"
      ],
      icon: <FiCpu />,
      color: "from-green-400 to-blue-500"
    },
    {
      category: "Database",
      technologies: "ClickHouse",
      details: [
        "고성능 열 지향 분석 데이터베이스",
        "실시간 쿼리 처리"
      ],
      icon: <FiDatabase />,
      color: "from-amber-400 to-orange-500"
    },
    {
      category: "공통 인프라",
      technologies: "Git",
      details: [
        "dotenv",
        "ESLint, Prettier",
        "환경 설정 및 코드 품질 관리"
      ],
      icon: <FiGitBranch />,
      color: "from-red-400 to-pink-500"
    }
  ];

  return (
    <section id="tech-stack" className="relative py-24 overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute top-0 left-0 w-full h-full bg-bento-dark-900"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('/circuit-board.svg')]"></div>
      
      {/* 장식 요소 */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-bento-blue-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-bento-accent-600/5 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 bg-clip-text text-transparent">
              기술 스택
            </span>
          </h2>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-bento-blue-500 to-bento-accent-600"></div>
          <p className="mt-4 text-bento-gray-300 max-w-2xl mx-auto">
            Bento는 최신 기술을 활용하여 의료 빅데이터 분석을 위한 강력하고 효율적인 솔루션을 제공합니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {techData.map((tech, index) => (
            <div 
              key={index}
              className="group relative animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* 배경 그라디언트 효과 */}
              <div className="absolute -inset-0.5 bg-gradient-to-r rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-300"></div>
              
              {/* 카드 컨텐츠 */}
              <div className="relative h-full bg-bento-dark-800/70 backdrop-blur-sm border border-bento-gray-700/50 p-6 rounded-xl overflow-hidden group-hover:shadow-lg transition-all duration-300">
                {/* 상단 헤더 */}
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${tech.color} text-white`}>
                    {React.cloneElement(tech.icon, { size: 24 })}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{tech.category}</h3>
                    <p className="text-bento-blue-400 font-medium">{tech.technologies}</p>
                  </div>
                </div>
                
                {/* 구분선 */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-bento-gray-700 to-transparent my-4"></div>
                
                {/* 기술 목록 */}
                <ul className="space-y-2 text-bento-gray-300">
                  {tech.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 group/item">
                      <span className="text-bento-blue-400 mt-0.5 transition-transform group-hover/item:scale-110">
                        <FiCheckCircle size={16} />
                      </span>
                      <span className="group-hover/item:text-white transition-colors">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStack; 