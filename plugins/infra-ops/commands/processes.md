# Process Analysis

Execute Netdata's processes function to analyze running processes on server-1:

1. Run the `processes` function with:
   - Sort by Memory (descending)
   - Limit to top 20 processes
   - Include all columns for analysis

2. Analyze top memory consumers:
   - Identify processes using >1 GB RAM
   - Check for memory leaks (growing over time)
   - Flag processes using swap
   - Compare to expected baselines

3. Analyze top CPU consumers:
   - Sort by CPU usage
   - Identify runaway processes
   - Check CPU context switches
   - Compare user vs system time

4. Check file descriptor usage:
   - Processes with high FD counts
   - Approaching FD limits
   - Socket vs file vs pipe breakdown

5. Review process hierarchy:
   - Parent-child relationships (PPID)
   - Process categories (from apps_groups.conf)
   - Container process isolation

6. Identify concerning patterns:
   - Zombie processes
   - Processes in uninterruptible sleep (D state)
   - High page fault rates
   - Excessive I/O wait

7. MySQL process analysis (PID 1042433):
   - Memory: RSS, Virtual, Swap
   - CPU: User vs System time
   - I/O: Read/write operations
   - Threads: Count and state
   - FDs: Open file descriptors

8. Known processes to check:
   - mysqld (PID 1042433) - 6.4 GB RSS, 484 MB swap
   - sshd - 79-96 threads (12.5% anomaly rate)
   - containerd - CPU spikes (3.3% anomaly)

Provide recommendations for:
- Processes to investigate further
- Processes to restart
- Memory limit adjustments
- CPU affinity optimizations
