import React from 'react';
import { FiGithub, FiMail } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bento-gray py-12 text-center border-t border-bento-gray/50">
      <div className="container mx-auto px-6">
        <div className="flex justify-center space-x-6 mb-6">
          <a 
            href="https://github.com/kookmin-sw/capstone-2025-16" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="GitHub Repository"
            className="text-bento-lightgray hover:text-bento-lightblue transition-colors duration-300"
          >
            <FiGithub size={28} />
          </a>
          {/* 필요하다면 이메일 주소나 다른 연락처 링크 추가 */}
          {/* 
          <a 
            href="mailto:contact@example.com" 
            aria-label="Contact Email"
            className="text-bento-lightgray hover:text-bento-lightblue transition-colors duration-300"
          >
            <FiMail size={28} />
          </a> 
          */}
        </div>
        <p className="text-bento-lightgray mb-2">
          Bento 프로젝트는 MIT 라이센스에 따라 배포됩니다.
        </p>
        <p className="text-sm text-gray-500">
          &copy; {currentYear} 2025 Capstone 16조. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer; 