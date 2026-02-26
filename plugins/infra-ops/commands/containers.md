# Container Resource Analysis

Analyze all running containers on server-1 and provide detailed resource usage:

1. Execute the `containers-vms` function to get current stats
2. Query cgroup metrics for each container:
   - CPU usage (user + system)
   - Memory usage (RAM + swap)
   - Disk I/O (reads/writes)
   - Network traffic (in/out)
3. Identify containers with high resource usage or anomalies
4. Compare current usage to typical baselines (from CLAUDE.md)
5. Highlight any containers approaching resource limits

Present results in a table format showing:
- Container name
- CPU %
- Memory (GB)
- Swap usage (if any)
- Disk I/O rates
- Network throughput
- Process count
- Status/Health

Flag any concerning patterns and provide recommendations.
