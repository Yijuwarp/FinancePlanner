import { memo } from 'react';
import type { MonthData, ActiveEventInfo } from '../utils/simulation';
import { formatINR } from '../utils/formatINR';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
}

/**
 * Formats the financial impact of an active event for display.
 */
function formatEventImpact(ae: ActiveEventInfo): string {
  if (ae.type === 'job_loss') return 'No salary';
  if (ae.type === 'one_time') return `-${formatINR(ae.oneTimeImpact)}`;
  
  const parts: string[] = [];
  if (ae.oneTimeImpact > 0) parts.push(`-${formatINR(ae.oneTimeImpact)}`);
  if (ae.recurringImpact > 0) parts.push(`-${formatINR(ae.recurringImpact)}/mo`);
  
  return parts.join(' + ') || '—';
}

/**
 * Custom tooltip component for the projections AreaChart.
 * Displays baseline, current balance, and active events for the hovered month.
 */
const ChartTooltip = memo(({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  
  const d = payload[0]?.payload as MonthData;
  if (!d) return null;

  const gap = d.baselineBalance - d.balance;
  const totalEventImpact = d.activeEvents.reduce(
    (acc, ae) => acc + ae.oneTimeImpact + ae.recurringImpact, 
    0
  );

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
          {[...d.activeEvents]
            .sort((a, b) => (b.oneTimeImpact + b.recurringImpact) - (a.oneTimeImpact + a.recurringImpact))
            .map((ae, i) => (
              <div key={i} className="tooltip-event-row">
                <span className="tooltip-event-label">{ae.label}</span>
                {ae.impactLevel && (
                  <span className={`impact-badge impact-badge-${ae.impactLevel}`}>
                    {ae.impactLevel === 'high' ? 'High' : ae.impactLevel === 'medium' ? 'Med' : 'Low'}
                  </span>
                )}
                <span className={`tooltip-event-impact ${ae.type === 'job_loss' ? 'tooltip-impact-jobloss' : ''}`}>
                  {formatEventImpact(ae)}
                </span>
              </div>
          ))}
        </>
      )}
    </div>
  );
});

export default ChartTooltip;
