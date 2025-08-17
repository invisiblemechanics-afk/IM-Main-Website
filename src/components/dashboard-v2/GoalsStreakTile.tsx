export default function GoalsStreakTile({ streak, todayTasks }: { streak: { current: number; longest: number }; todayTasks: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">Goals & Streak</div>
        <div className="text-xs text-zinc-400">Longest: {streak.longest}d</div>
      </div>
      <div className="mt-2 text-3xl text-white font-semibold">{streak.current} day{streak.current===1?'':'s'}</div>
      <ul className="mt-3 space-y-1 text-zinc-300 text-sm">
        {todayTasks.slice(0,3).map((t, i) => <li key={i}>• {t}</li>)}
        {todayTasks.length === 0 && <li>Set a weekly goal in the Goals page</li>}
      </ul>
    </div>
  );
}



