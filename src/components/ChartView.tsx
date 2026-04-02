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
  const { viewBox, emojis = [] } = props;
  if (!viewBox || !emojis.length) return null;
  return (
    <g>
      {emojis.map((item: any, i: number) => (
        <text
          key={i}
          x={(viewBox.x || 0) + 5}
          y={25 + item.yOffset}
          fontSize={18}
          textAnchor="start"
          style={{ cursor: 'default', userSelect: 'none' }}
        >
          {item.emoji}
        </text>
      ))}
    </g>
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
  const totalEventImpact = d.activeEvents.reduce((acc, ae) => acc + ae.oneTimeImpact + ae.recurringImpact, 0);

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
      {totalEventImpact > 0 && (
        <div className="tooltip-row tooltip-row-small">
          <span>💸 Event Expenses:</span>
          <span className="tooltip-value-negative">-{formatINR(totalEventImpact)}/mo</span>
        </div>
      )}

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

  // Group event starts by month and calculate vertical offsets
  const startsByMonth = new Map<string, { emoji: string; yOffset: number }[]>();
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  
  let lastMonthIndex = -10;
  let currentStackBase = 0;

  for (const event of sortedEvents) {
    const dp = data.find(d => d.dateKey === event.date);
    if (!dp) continue;

    const monthIdx = dp.monthIndex;
    
    // If events are within 3 months, stack them higher to avoid horizontal collision
    if (monthIdx - lastMonthIndex < 3) {
      currentStackBase++;
    } else {
      currentStackBase = 0;
    }
    lastMonthIndex = monthIdx;

    const existing = startsByMonth.get(dp.label) || [];
    // If multiple events in SAME month, they also stack
    const localOffset = existing.length * 25;
    existing.push({ emoji: event.emoji, yOffset: (currentStackBase * 25) + localOffset });
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
            {Array.from(startsByMonth.entries()).map(([xLabel, emojiItems], idx) => (
              <ReferenceLine
                key={`evt-line-${idx}`}
                x={xLabel}
                stroke="rgba(199, 210, 254, 0.4)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={<EventStartLabel emojis={emojiItems} />}
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
