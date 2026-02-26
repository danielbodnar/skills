# Anomaly Detection Report

Use Netdata's ML-powered anomaly detection to identify unusual system behavior:

1. Find anomalous metrics in the last 1 hour:
   - Set cardinality_limit to 30 for top anomalies
   - Include anomaly rate percentages
   - Show min/max/avg values for context

2. For each anomaly found:
   - Explain what the metric represents
   - Show the anomaly rate (% of samples that were anomalous)
   - Identify if this is concerning or expected behavior
   - Provide context from system knowledge (CLAUDE.md)

3. Categorize anomalies by severity:
   - 🔴 Critical (>10% anomaly rate or system-critical metrics)
   - 🟡 Warning (5-10% anomaly rate)
   - 🔵 Info (1-5% anomaly rate or expected variations)

4. Check for correlated anomalies:
   - Do multiple related metrics show anomalies?
   - Are anomalies concentrated in specific time windows?
   - Are they related to known incidents?

5. Compare to baseline from CLAUDE.md:
   - SSH threads (12.5% anomaly rate - known)
   - WireGuard drops (4.1% - investigate)
   - Container CPU spikes (3.3% - monitor)

Provide actionable recommendations for each significant anomaly.
