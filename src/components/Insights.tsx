import { memo } from 'react';
import type { Insight as InsightType } from '../utils/simulation';

interface InsightsProps {
  insights: InsightType[];
}

/**
 * Component to display a list of financial insights or warnings.
 * Uses different styles based on the insight type (danger, warning, etc.).
 */
const Insights = memo(({ insights }: InsightsProps) => {
  if (insights.length === 0) return null;

  return (
    <div className="insights-container">
      {insights.map((insight, i) => (
        <div key={i} className={`insight-card insight-card-${insight.type}`}>
          <span className="insight-icon">{insight.icon}</span>
          <p className="insight-message">{insight.message}</p>
        </div>
      ))}
    </div>
  );
});

export default Insights;
