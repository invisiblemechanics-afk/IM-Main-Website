import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '@/assets/images/IM_logo.png';

export const Logo: React.FC = () => {
  return (
    <Link to="/" className="inline-flex items-center space-x-3">
      <img 
        src={logoImg} 
        alt="Invisible Mechanics Logo" 
        className="w-8 h-8 flex-shrink-0"
      />
      <span className="text-xl font-bold whitespace-nowrap" style={{ color: '#9e7ae7' }}>
        Invisible Mechanics
      </span>
    </Link>
  );
};