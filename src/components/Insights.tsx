import { memo } from 'react';
import type { Insight } from '../utils/simulation';

interface InsightsProps {
  insights: Insight[];
}

const Insights = memo(({ insights }: InsightsProps) => {
  if (insights.length === 0) return null;

  return (
    <div className="insights-panel">
      <h3 className="insights-title">
        <span className="insights-title-icon">🔮</span>
        Key Insights
      </h3>
      <div className="insights-grid">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`insight-card insight-card-${insight.type}`}
            id={`insight-${i}`}
          >
            <span className="insight-icon">{insight.icon}</span>
            <span className="insight-message">{insight.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Insights;

