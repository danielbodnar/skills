# CPU Analysis

Analyze CPU performance and identify bottlenecks on server-1:

1. Query system.cpu metrics:
   - User CPU time
   - System CPU time
   - I/O wait time
   - Steal time (should be 0 on bare metal)
   - Idle time
   - Show trends over last 3 hours

2. Check per-core CPU usage if available:
   - Identify if load is balanced
   - Find cores at 100% utilization
   - Check for CPU affinity issues

3. Analyze system load:
   - system.load (1/5/15 minute averages)
   - Compare to core count (16 cores)
   - Identify if system is overloaded
   - Check load trends

4. Review CPU-intensive processes:
   - Query app.cpu_utilization metrics
   - Identify top CPU consumers
   - Check for runaway processes

5. Container CPU usage:
   - CPU usage per container (from cgroups)
   - Identify containers consuming >100% (multi-core)
   - Check for CPU throttling
   - CPU pressure metrics

6. Analyze context switches and interrupts:
   - system.ctxt (context switches)
   - system.intr (interrupts)
   - system.softirqs (software interrupts)
   - High rates may indicate thrashing

7. Known high CPU consumers (from CLAUDE.md):
   - maybach: 120.77% (normal for this service?)
   - systemavo-db-1: 78.89% (MySQL under load)
   - systemavo-systemavo-1: 4.05% (PHP app)

Provide analysis:
- Overall CPU health (healthy/loaded/critical)
- Bottleneck identification
- Optimization recommendations
- Whether CPU is a limiting factor
- Process priority adjustments needed

Note: Current average is 7.18%, so CPU is NOT the bottleneck. Focus on identifying why certain containers have high usage and if it's expected.
