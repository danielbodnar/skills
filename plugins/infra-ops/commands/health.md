# System Health Check

Perform a comprehensive health check of server-1, including:
- Active alerts (critical, warning, clear status)
- Node health and connectivity
- System load averages
- Memory usage (RAM and swap)
- CPU utilization
- Container status and resource usage

Use Netdata MCP tools to query current system state and provide a concise summary with:
1. Overall health status (healthy/degraded/critical)
2. Active alerts requiring attention
3. Resource utilization summary
4. Any anomalies detected in the last hour
5. Recommendations for immediate action if needed

Format the output as a clear, actionable status report suitable for incident response or daily checks.
