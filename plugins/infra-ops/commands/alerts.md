# Alert Status Report

Check all Netdata alerts on server-1:

1. List currently raised alerts (CRITICAL and WARNING):
   - Alert name and context
   - Current value vs threshold
   - When the alert was triggered
   - Impact assessment
   - Recommended actions

2. Review alert history (last 24 hours):
   - Alert transitions (state changes)
   - Frequency of alerts firing
   - Patterns in alert timing

3. Check alert counts by severity:
   - Critical: X alerts
   - Warning: X alerts
   - Clear: X alerts
   - Undefined: X alerts
   - Uninitialized: X alerts

4. For each active alert, provide:
   - Detailed description
   - Root cause analysis based on metrics
   - Step-by-step remediation guide
   - Priority level (P1/P2/P3)
   - Expected resolution time

5. Reference known alerts from CLAUDE.md:
   - used_swap (CRITICAL) - 99.99% swap
   - disk_space_usage (WARNING) - 94% full
   - system_post_update_reboot_status (WARNING)

Format output as an incident response checklist with clear action items.
