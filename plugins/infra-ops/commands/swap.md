# Swap Usage Investigation

Investigate swap usage which is currently CRITICAL (99.99%):

1. Query mem.swap metrics:
   - Current swap utilization percentage
   - Used vs free swap
   - Swap in/out rates (mem.swapio)
   - Historical swap usage trends

2. Identify what's in swap:
   - Query cgroup.mem_usage for all containers (RAM + swap)
   - Calculate swap usage per container
   - Focus on systemavo-db-1 (known to have 484 MB swap)

3. Analyze swap activity:
   - mem.swapio (swap in/out rates)
   - Check if system is actively thrashing
   - Correlate with performance degradation

4. Memory pressure analysis:
   - system.memory_some_pressure
   - system.memory_full_pressure
   - When did memory pressure begin?

5. Root cause investigation:
   - Review memory timeline for the swap spike
   - Identify the 19:51-19:52 UTC event (from CLAUDE.md)
   - Check what triggered the memory exhaustion
   - Correlate with container memory spikes

6. Impact assessment:
   - MySQL performance degradation (100-1000x slower)
   - Application response times
   - System-wide slowdowns
   - I/O saturation from swap activity

7. Query specific swap usage:
   - app.mysqld_swap_usage (if available)
   - Per-process swap from processes function
   - Identify largest swap consumers

8. Calculate swap impact:
   - Swap is on disk (1000x slower than RAM)
   - Database pages in swap = query slowdowns
   - Estimate performance penalty

Provide remediation steps:
1. **Immediate** (Emergency):
   - Identify queries/processes to kill
   - Restart containers using swap
   - Clear swap if safe: `swapoff -a && swapon -a`

2. **Short-term** (Hours):
   - Tune MySQL buffer pool size
   - Adjust container memory limits
   - Kill unnecessary processes

3. **Medium-term** (Days):
   - Schedule system restart
   - Upgrade RAM (32 GB → 64 GB)
   - Implement memory monitoring alerts

4. **Long-term** (Weeks):
   - Separate database to dedicated server
   - Implement high-availability architecture
   - Capacity planning process

Known critical state (from CLAUDE.md):
- Swap: 99.99% utilization
- MySQL: 484 MB in swap (CRITICAL)
- Memory spike: 6.6 GB → 12.9 GB at 19:51 UTC
