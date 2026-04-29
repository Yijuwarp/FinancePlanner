import { useMemo, memo, useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { MonthData } from '../utils/simulation';
import { formatINRShort } from '../utils/formatINR';
import type { LifeEvent } from '../utils/eventTemplates';
import ChartTooltip from './ChartTooltip';

interface ChartViewProps {
  data: MonthData[];
  events: LifeEvent[];
  highlightedEventId?: string | null;
  filterLevel: 'all' | 'medium' | 'high';
  isLagging?: boolean;
}

/**
 * Component for rendering event emojis above the vertical reference lines.
 */
const EventStartLabel = memo((props: any) => {
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
});

/**
 * The main financial projection chart.
 * Uses Recharts to visualize baseline vs. event-impacted balance.
 * 
 * @param props - Chart data and filtering configuration.
 */
const ChartView = memo(({ data, events, filterLevel, isLagging }: ChartViewProps) => {
  const hasEvents = events.length > 0;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 600px)').matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 600px)');
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  /**
   * Pre-calculates which months have event "starts" to display vertical markers.
   * Also manages stacking logic for multiple events starting in the same month or close together.
   * 
   * PERFORMANCE OPTIMIZATION: Limits total markers to 40 to prevent Recharts from lagging.
   */
  const startsByMonth = useMemo(() => {
    const map = new Map<string, { emoji: string; yOffset: number }[]>();
    let lastStartedMonthIdx = -10;
    let currentStackBase = 0;
    let markerCount = 0;
    const MAX_MARKERS = 40;

    for (const dp of data) {
      // Filter starters based on impact level and recurrence
      const starters = dp.activeEvents.filter(ae => {
        if (!ae.isStart) return false;
        
        // Hide repeat markers ONLY if they are low impact AND not in "All" mode
        if (ae.isRepeat && ae.impactLevel === 'low' && filterLevel !== 'all') return false;

        if (filterLevel === 'high') {
          return ae.impactLevel === 'high';
        }
        if (filterLevel === 'medium') {
          return ae.impactLevel === 'high' || ae.impactLevel === 'medium';
        }
        return true;
      });

      if (starters.length === 0) continue;
      
      // Stop adding markers if we hit the limit to preserve performance
      if (markerCount >= MAX_MARKERS) continue;

      const monthIdx = dp.monthIndex;
      // If events start very close to each other, stack them vertically to avoid overlap
      if (monthIdx - lastStartedMonthIdx < 3) {
        currentStackBase++;
      } else {
        currentStackBase = 0;
      }
      lastStartedMonthIdx = monthIdx;

      const existing: { emoji: string; yOffset: number }[] = [];
      starters.forEach((ae, i) => {
        existing.push({ 
          emoji: ae.emoji || '📍', 
          yOffset: (currentStackBase * 25) + (i * 25) 
        });
        markerCount++;
      });
      map.set(dp.label, existing);
    }
    return map;
  }, [data, filterLevel]);

  // Adjust X-axis label frequency based on data length
  const tickInterval = useMemo(() => 
    Math.max(1, Math.floor(data.length / 10)) - 1, 
    [data.length]
  );

  const chartData = useMemo(() => data.map((item) => ({
    ...item,
    baselinePositive: item.baselineBalance >= 0 ? item.baselineBalance : null,
    baselineNegative: item.baselineBalance < 0 ? item.baselineBalance : null,
    balancePositive: item.balance >= 0 ? item.balance : null,
    balanceNegative: item.balance < 0 ? item.balance : null,
  })), [data]);

  return (
    <div className={`chart-view ${isLagging ? 'chart-lagging' : ''}`}>
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
        <ResponsiveContainer width="100%" height={isMobile ? 320 : 400}>
          <AreaChart data={chartData} margin={{ top: 30, right: 10, left: isMobile ? 0 : 10, bottom: isMobile ? 20 : 0 }}>
            <defs>
              <linearGradient id="gradientBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />

            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              minTickGap={isMobile ? 28 : 14}
              tickMargin={isMobile ? 8 : 4}
              angle={isMobile ? -22 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 56 : 32}
              interval={isMobile ? 'preserveStartEnd' : tickInterval}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatINRShort}
              width={55}
            />

            <Tooltip content={<ChartTooltip />} />
            <Legend content={() => null} />

            {/* Vertical lines at event starts - always mounted to prevent tooltip resets */}
            {Array.from(startsByMonth.entries()).map(([xLabel, emojiItems], idx) => (
              <ReferenceLine
                key={`evt-line-${idx}`}
                x={xLabel}
                stroke="rgba(199, 210, 254, 0.4)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={<EventStartLabel emojis={emojiItems} />}
                className={isLagging ? 'chart-line-lagging' : ''}
              />
            ))}

            <Area
              type="monotone"
              dataKey="baselinePositive"
              name="Baseline"
              stroke="#22c55e"
              strokeDasharray="6 4"
              strokeWidth={2.5}
              fill="url(#gradientBaseline)"
              dot={false}
              activeDot={{ r: 4, stroke: '#22c55e', fill: '#0f172a' }}
              animationDuration={isLagging ? 0 : 500}
              isAnimationActive={true}
            />
            <Area
              type="monotone"
              dataKey="baselineNegative"
              name="Baseline (Negative)"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#gradientNegative)"
              dot={false}
              activeDot={{ r: 4, stroke: '#ef4444', fill: '#0f172a' }}
              animationDuration={isLagging ? 0 : 500}
              isAnimationActive={true}
            />

            {hasEvents && (
              <>
                <Area
                  type="monotone"
                  dataKey="balancePositive"
                  name="With Events"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#gradientEvents)"
                  dot={false}
                  activeDot={{ r: 4, stroke: '#8b5cf6', fill: '#0f172a' }}
                  animationDuration={isLagging ? 0 : 500}
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="balanceNegative"
                  name="With Events (Negative)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#gradientNegative)"
                  dot={false}
                  activeDot={{ r: 4, stroke: '#ef4444', fill: '#0f172a' }}
                  animationDuration={isLagging ? 0 : 500}
                  isAnimationActive={true}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default ChartView;
