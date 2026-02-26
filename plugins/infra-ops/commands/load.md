# System Load Analysis

Analyze system load and identify whether the system is overloaded:

1. Query system.load metrics:
   - 1-minute load average (recent state)
   - 5-minute load average (short-term trend)
   - 15-minute load average (long-term trend)
   - Historical data for last 24 hours

2. Calculate load per core:
   - System has 16 cores (from CLAUDE.md)
   - Load/Core ratio (should be <1.0 for healthy)
   - Identify if system is CPU-bound

3. Correlate load with other metrics:
   - CPU utilization (system.cpu)
   - I/O wait time
   - Process count (system.processes)
   - Context switches (system.ctxt)

4. Analyze load patterns:
   - Peak load times
   - Load spikes and their causes
   - Correlation with known events (e.g., 21:01 UTC spike to 2.43)
   - Baseline vs current load

5. Check active processes:
   - Count of processes in run queue
   - system.active_processes metric
   - Processes in uninterruptible sleep (D state)

6. Review CPU pressure:
   - system.cpu_some_pressure
   - system.cpu_full_pressure
   - Scheduler latency metrics

7. Known baseline (from CLAUDE.md):
   - Current: 1.16 / 1.18 / 1.21
   - This is healthy for 16 cores (~7% utilization)
   - Peaks observed: 2.62 at 21:01 UTC

Provide analysis:
- Overall load health (healthy/moderate/high/critical)
- Load per core percentage
- Whether CPU is a bottleneck
- Comparison to memory/swap as bottleneck
- Load forecast for next few hours
- Recommended actions if overloaded

Interpretation guide:
- Load < cores: System healthy
- Load = cores: System at capacity
- Load > cores: System overloaded
- Load >> cores: System severely overloaded

For this system: Load of 1.2 on 16 cores = 7.5% utilization (HEALTHY)
