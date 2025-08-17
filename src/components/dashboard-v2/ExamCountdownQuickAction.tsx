import { Link } from 'react-router-dom';

export default function ExamCountdownQuickAction({ examDate, idleDays }: { examDate: Date | null; idleDays: number }) {
  const daysLeft = examDate ? Math.max(0, Math.ceil((+examDate - Date.now()) / (1000*60*60*24))) : null;
  const ctaHref = idleDays >= 3 ? '/diagnostic' : '/mock-tests';
  const ctaLabel = idleDays >= 3 ? 'Take a diagnostic' : 'Start a mock';
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
      <div>
        <div className="text-sm text-zinc-400">Exam Countdown</div>
        <div className="text-white text-2xl mt-1">
          {daysLeft != null ? `${daysLeft} days to go` : 'Set your exam date'}
        </div>
      </div>
      <Link to={ctaHref} className="rounded-xl px-4 py-2 bg-white text-black text-sm hover:opacity-90 transition">
        {ctaLabel}
      </Link>
    </div>
  );
}



