# Generate Incident Report

Create a comprehensive incident report for current or recent issues:

1. **Incident Detection**:
   - Query list_raised_alerts for active issues
   - Check find_anomalous_metrics for unusual behavior
   - Review alert_transitions for recent state changes
   - Identify incident start time

2. **Impact Assessment**:
   - Severity level (P1/P2/P3)
   - Affected services/containers
   - Performance degradation metrics
   - User impact estimation

3. **Timeline Construction**:
   - Query alert_transitions for event sequence
   - Get metric data around incident time
   - Identify initial trigger event
   - Document propagation of issues
   - Note when issues were detected

4. **Root Cause Analysis**:
   - Use find_correlated_metrics for incident period
   - Analyze metrics that changed significantly
   - Identify primary vs secondary causes
   - Check for cascading failures

5. **Supporting Data**:
   - Container resource usage during incident
   - System metrics (CPU, memory, I/O, network)
   - Process list at time of incident
   - Log excerpts if relevant

6. **Remediation Actions Taken**:
   - Document what was done to resolve
   - Include timestamps of actions
   - Note effectiveness of each action

7. **Lessons Learned**:
   - What worked well
   - What could be improved
   - Monitoring gaps identified
   - Process improvements needed

8. **Follow-up Actions**:
   - Short-term fixes needed
   - Long-term improvements
   - Monitoring enhancements
   - Documentation updates

For the current known incident (2025-10-21):
- Swap exhaustion (99.99%)
- MySQL memory spike (6.6 GB → 12.9 GB at 19:51 UTC)
- Disk space warning (94% full)

Generate report in markdown format suitable for:
- Saving to reports/ directory
- Sharing with team
- Post-mortem analysis
- Incident tracking system

Include:
- Executive summary
- Detailed timeline
- Technical analysis
- Graphs/charts (text-based if needed)
- Action items with owners
- Prevention recommendations
