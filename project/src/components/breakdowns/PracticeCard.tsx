import React from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { CardTile } from '../ui/CardTile';

export const PracticeCard: React.FC = () => {
  return (
    <Link
      to="/practice"
      data-cursor="surround"
      className="block"
    >
      <CardTile
        as="div"
        title="Practice"
        description="Solve practice problems by topic"
        icon={<AcademicCapIcon className="w-6 h-6 text-accent" />}
      />
    </Link>
  );
};