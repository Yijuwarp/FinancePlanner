import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { MonthData, ActiveEventInfo } from '../utils/simulation';
import { formatINR, formatINRShort } from '../utils/formatINR';
import type { LifeEvent } from '../utils/eventTemplates';

interface ChartViewProps {
  data: MonthData[];
  events: LifeEvent[];
  highlightedEventId?: string | null;
}

function EventStartLabel(props: any) {
  const { viewBox, value, yOffset = 0 } = props;
  if (!viewBox) return null;
  return (
    <text
      x={(viewBox.x || 0) + 4}
      y={14 + yOffset}
      fill="#e2e8f0"
      fontSize={10}
      fontWeight={500}
      fontFamily="Inter, sans-serif"
      textAnchor="start"
    >
      {value}
    </text>
  );
}

function formatEventImpact(ae: ActiveEventInfo): string {
  if (ae.type === 'job_loss') return 'No salary';
  if (ae.type === 'one_time') return `-${formatINR(ae.oneTimeImpact)}`;
  const parts: string[] = [];
  if (ae.oneTimeImpact > 0) parts.push(`-${formatINR(ae.oneTimeImpact)}`);
  if (ae.recurringImpact > 0) parts.push(`-${formatINR(ae.recurringImpact)}/mo`);
  return parts.join(' + ') || '—';
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as MonthData;
  if (!d) return null;

  const gap = d.baselineBalance - d.balance;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">{d.label}</div>

      <div className="tooltip-row">
        <span className="tooltip-dot tooltip-dot-baseline" />
        <span>Baseline:</span>
        <span className="tooltip-value">{formatINR(d.baselineBalance)}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-dot tooltip-dot-actual" />
        <span>With Events:</span>
        <span className="tooltip-value">{formatINR(d.balance)}</span>
      </div>
      {gap > 0 && (
        <div className="tooltip-row tooltip-row-gap">
          <span>Gap:</span>
          <span className="tooltip-value tooltip-value-negative">-{formatINR(gap)}</span>
        </div>
      )}

      <div className="tooltip-divider" />
      <div className="tooltip-row tooltip-row-small">
        <span>💼 Salary:</span>
        <span>{formatINR(d.salary)}/mo</span>
      </div>
      <div className="tooltip-row tooltip-row-small">
        <span>🛒 Expenses:</span>
        <span>{formatINR(d.expenses)}/mo</span>
      </div>

      {d.activeEvents.length > 0 && (
        <>
          <div className="tooltip-divider" />
          <div className="tooltip-events-header">🔥 Active Events</div>
          {d.activeEvents.map((ae, i) => (
            <div key={i} className="tooltip-event-row">
              <span className="tooltip-event-label">{ae.label}</span>
              <span className={`tooltip-event-impact ${ae.type === 'job_loss' ? 'tooltip-impact-jobloss' : ''}`}>
                {formatEventImpact(ae)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function ChartView({ data, events }: ChartViewProps) {
  const hasEvents = events.length > 0;

  // Group event starts by month to avoid overlapping lines
  const startsByMonth = new Map<string, string[]>();
  for (const event of events) {
    const dp = data.find(d => d.dateKey === event.date);
    if (!dp) continue;
    const existing = startsByMonth.get(dp.label) || [];
    existing.push(event.label);
    startsByMonth.set(dp.label, existing);
  }

  const tickInterval = Math.max(1, Math.floor(data.length / 12)) - 1;

  return (
    <div className="chart-view">
      <div className="chart-header">
        <h2 className="chart-title">Financial Projection</h2>
        <div className="chart-legend-inline">
          <span className="legend-item">
            <span className="legend-line legend-line-baseline" />
            Baseline
          </span>
          {hasEvents && (
            <span className="legend-item">
              <span className="legend-line legend-line-events" />
              With Events
            </span>
          )}
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />

            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatINRShort}
              width={55}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend content={() => null} />

            {/* Vertical lines at event starts */}
            {Array.from(startsByMonth.entries()).map(([xLabel, names], idx) => (
              <ReferenceLine
                key={`evt-line-${idx}`}
                x={xLabel}
                stroke="rgba(199, 210, 254, 0.45)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={<EventStartLabel value={names.join(', ')} yOffset={0} />}
              />
            ))}

            <Area
              type="monotone"
              dataKey="baselineBalance"
              name="Baseline"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#gradientBaseline)"
              dot={false}
              activeDot={{ r: 4, stroke: '#22c55e', fill: '#0f172a' }}
              animationDuration={800}
            />

            {hasEvents && (
              <Area
                type="monotone"
                dataKey="balance"
                name="With Events"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#gradientEvents)"
                dot={false}
                activeDot={{ r: 4, stroke: '#ef4444', fill: '#0f172a' }}
                animationDuration={800}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
