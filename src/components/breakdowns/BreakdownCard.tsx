import React from 'react';
import { Link } from 'react-router-dom';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { CardTile } from '../ui/CardTile';

export const BreakdownCard: React.FC = () => {
  return (
    <Link
      to="/breakdowns"
      data-cursor="surround"
      className="block"
    >
      <CardTile
        as="div"
        title="Breakdowns"
        description="Master tough problems step-by-step with guided breakdowns"
        icon={<BeakerIcon className="w-6 h-6 text-accent" />}
      />
    </Link>
  );
};