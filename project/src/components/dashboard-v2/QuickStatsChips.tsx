import { Link } from 'react-router-dom';

export default function QuickStatsChips({ stats }: { stats: { playlistsCount: number; topicsCompleted: number; mockAttempts: number; communityContribs: number } }) {
  const Chip = ({ label, value, href }: { label: string; value: number | string; href: string }) => (
    <Link to={href} className="rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900/60 transition">
      <span className="text-white font-medium">{value}</span> {label}
    </Link>
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Chip label="Playlists" value={stats.playlistsCount} href="/dashboard"/>
      <Chip label="Topics done" value={stats.topicsCompleted} href="/breakdowns"/>
      <Chip label="Mock attempts" value={stats.mockAttempts} href="/mock-tests"/>
      <Chip label="Community posts" value={stats.communityContribs} href="/community"/>
    </div>
  );
}



