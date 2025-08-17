import React from 'react';
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { CardTile } from '../ui/CardTile';

export const CommunityTileCard: React.FC = () => {
  return (
    <Link
      to="/community"
      data-cursor="surround"
      className="block"
    >
      <CardTile
        as="div"
        title="Community"
        description="Discuss problems, tips & study plans"
        icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-accent" />}
      />
    </Link>
  );
};

