import Sparkline from './Sparkline';

export default function PerformanceSnapshot({ trends }: { trends: { diagnostics: number[]; mocks: number[]; completion: number[] } }) {
  const Item = ({ label, series }: { label: string; series: number[] }) => (
    <div className="flex items-center justify-between rounded-xl border border-white/10 p-3">
      <div className="text-sm text-zinc-300">{label}</div>
      <div className="text-zinc-200">
        <Sparkline data={series}/>
      </div>
    </div>
  );
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-3">
      <div className="text-sm text-zinc-400">Performance Snapshot</div>
      <Item label="Diagnostic score" series={trends.diagnostics}/>
      <Item label="Mock accuracy" series={trends.mocks}/>
      <Item label="Topic completion" series={trends.completion}/>
    </div>
  );
}



