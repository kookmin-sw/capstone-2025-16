import React from 'react';
import { FiCode, FiDatabase, FiLayers, FiServer, FiCpu, FiCloud, FiActivity, FiGithub } from 'react-icons/fi';

const Team = () => {
  // 팀원별 고유 아이콘 설정 (색상은 통일)
  const teamMembers = {
    ai: [
      { 
        name: "장원준", 
        role: "인공지능 개발", 
        color: "from-bento-blue-500 to-bento-blue-700",
        icon: <FiCpu />,
        description: "AI 모델 설계 및 개발 총괄",
        github: "https://github.com/IamWonILuvWon",
        githubUsername: "IamWonILuvWon"
      },
      { 
        name: "정채원", 
        role: "인공지능 개발", 
        color: "from-bento-blue-500 to-bento-blue-700",
        icon: <FiCpu />,
        description: "머신러닝 모델 개발 및 데이터 분석",
        github: "https://github.com/chloebh9",
        githubUsername: "chloebh9"
      },
      { 
        name: "배진우", 
        role: "인공지능 개발", 
        color: "from-bento-blue-500 to-bento-blue-700",
        icon: <FiCpu />,
        description: "AI 모델 최적화 및 인프라 관리",
        github: "https://github.com/bgw4399",
        githubUsername: "bgw4399"
      },
    ],
    frontend: [
      { 
        name: "임혜진", 
        role: "프론트엔드 개발", 
        color: "from-bento-blue-500 to-bento-blue-700",
        icon: <FiLayers />,
        description: "사용자 인터페이스 설계 및 프론트엔드 개발",
        github: "https://github.com/ima9ine4",
        githubUsername: "ima9ine4"
      },
      { 
        name: "권세건", 
        role: "프론트엔드 개발", 
        color: "from-bento-blue-500 to-bento-blue-700",
        icon: <FiLayers />,
        description: "컴포넌트 설계 및 프론트엔드 개발",
        github: "https://github.com/honeybugs",
        githubUsername: "honeybugs"
      },
      { 
        name: "이재영", 
        role: "프론트엔드 개발", 
        color: "from-bento-blue-500 to-bento-blue-700",
        icon: <FiLayers />,
        description: "사용자 경험 및 인터랙션 디자인",
        github: "https://github.com/rktlskan021",
        githubUsername: "rktlskan021"
      },
    ],
    backend: [
      { 
        name: "이수혁", 
        role: "백엔드 개발", 
        color: "from-bento-blue-500 to-bento-blue-700",
        icon: <FiDatabase />,
        description: "백엔드 API 개발 및 데이터베이스 설계",
        github: "https://github.com/cg10036",
        githubUsername: "cg10036"
      },
    ]
  };

  const roleTitles = {
    ai: "인공지능 개발",
    frontend: "프론트엔드 개발",
    backend: "백엔드 개발"
  };

  const MemberCard = ({ member, index }) => (
    <div 
      className="group relative transform transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500"></div>
      
      <div className="relative flex flex-col items-center p-6 h-full bg-bento-dark-800/70 backdrop-blur-sm border border-bento-gray-700/50 rounded-xl overflow-hidden group-hover:shadow-xl transition-all duration-300">
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 rounded-full blur-sm opacity-70"></div>
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-bento-dark-800 border border-bento-gray-700/50 backdrop-blur-sm z-10">
            <img 
              src={`https://github.com/${member.githubUsername}.png`}
              alt={member.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-1 group-hover:bg-gradient-to-r from-white to-bento-blue-200 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {member.name}
        </h3>
        
        <p className="bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 bg-clip-text text-transparent font-medium text-sm mb-3">
          {member.role}
        </p>
        
        <div className="h-px w-0 group-hover:w-32 bg-gradient-to-r from-transparent via-bento-gray-500 to-transparent my-3 transition-all duration-700"></div>
        
        <p className="text-bento-gray-300 text-sm text-center opacity-0 group-hover:opacity-100 transition-all duration-500 mt-1">
          {member.description}
        </p>

        <a 
          href={member.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-bento-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2"
        >
          <FiGithub className="w-5 h-5" />
          <span className="text-sm">{member.githubUsername}</span>
        </a>
      </div>
    </div>
  );

  return (
    <section id="team" className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-bento-dark-900 to-bento-dark-950"></div>
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkM2Q2MTIyIiBvcGFjaXR5PSIwLjIiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="absolute top-20 right-10 w-96 h-96 bg-bento-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute top-60 left-10 w-64 h-64 bg-bento-accent-600/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-bento-blue-600/5 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-10 right-20 w-72 h-72 bg-bento-accent-600/8 rounded-full blur-3xl animate-float-delayed"></div>
      
      <div className="absolute top-40 left-1/3 w-4 h-4 bg-bento-blue-500/30 rounded-full blur-sm animate-ping-slow"></div>
      <div className="absolute bottom-60 right-1/4 w-3 h-3 bg-bento-accent-500/40 rounded-full blur-sm animate-ping-slow"></div>
      <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-bento-blue-500/50 rounded-full animate-ping-slow"></div>
      
      <div className="container relative z-10 mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 bg-clip-text text-transparent relative inline-block">
              팀원 소개
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </span>
          </h2>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 animate-width"></div>
          <p className="mt-4 text-bento-gray-300 max-w-2xl mx-auto">
            다양한 전문 분야를 가진 우리 팀원들이 함께 Bento 프로젝트를 개발했습니다.
          </p>
        </div>

        {Object.entries(teamMembers).map(([role, members]) => (
          <div key={role} className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              <span className="bg-gradient-to-r from-bento-blue-500 to-bento-accent-600 bg-clip-text text-transparent">
                {roleTitles[role]}
              </span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member, index) => (
                <MemberCard key={index} member={member} index={index} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bento-blue-500/30 to-transparent"></div>
    </section>
  );
};

export default Team; 