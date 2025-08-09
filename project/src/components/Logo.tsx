import React from 'react';
import { Link } from 'react-router-dom';
import logoSvg from '../assets/images/invisible-mechanics-logo.svg';

export const Logo: React.FC = () => {
  return (
    <Link to="/" className="inline-flex items-center space-x-3">
      <img 
        src={logoSvg} 
        alt="Invisible Mechanics Logo" 
        className="w-8 h-8 flex-shrink-0"
      />
      <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
        Invisible Mechanics
      </span>
    </Link>
  );
};