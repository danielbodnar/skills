# Capacity Planning Analysis

Analyze resource trends and project future capacity needs:

1. **Historical Trend Analysis**:
   - Query key metrics over 24 hours, 7 days, 30 days
   - Memory usage trends (system.ram)
   - CPU utilization trends (system.cpu)
   - Disk space growth (disk.space)
   - Network bandwidth trends
   - Container resource growth

2. **Growth Rate Calculations**:
   - Calculate daily/weekly/monthly growth rates
   - Project when resources will be exhausted
   - Identify seasonal patterns
   - Account for business growth

3. **Resource Utilization**:
   - Current usage vs total capacity
   - Headroom available for spikes
   - Time to 80% threshold
   - Time to 100% threshold

4. **Per-Resource Analysis**:

   **Memory**:
   - Current: 30.99 GB total, 18 GB used average
   - Swap: 99.99% (CRITICAL - no headroom)
   - MySQL trend: Spiked from 6.6 GB to 12.9 GB
   - Projection: Need 64 GB to handle spikes + growth

   **CPU**:
   - Current: 16 cores, ~7% average utilization
   - Peaks: Up to 24% during activity
   - Capacity: Plenty of headroom
   - Projection: No CPU upgrade needed soon

   **Disk Space**:
   - /mnt/data/oldserver/mnt/md3: 94% full (WARNING)
   - Growth rate: Calculate from historical data
   - Days until full: Estimate based on growth
   - Action needed: Cleanup or expansion

   **Network**:
   - Primary interface bandwidth usage
   - WireGuard VPN traffic
   - Container network patterns
   - Capacity planning for traffic growth

5. **Container Resource Forecasts**:
   - MySQL memory needs (current 6.6 GB baseline)
   - PHP application growth
   - maybach service trends
   - New services planned

6. **Cost Analysis** (if applicable):
   - RAM upgrade: 32 GB → 64 GB
   - Disk expansion costs
   - Separate database server option
   - Cloud vs on-premises comparison

7. **Recommendations Timeline**:

   **Immediate (Now - 1 week)**:
   - Address swap crisis
   - Free disk space
   - Optimize MySQL configuration

   **Short-term (1-4 weeks)**:
   - Plan memory upgrade
   - Implement monitoring thresholds
   - Schedule maintenance windows

   **Medium-term (1-3 months)**:
   - RAM upgrade execution
   - Database server separation planning
   - Capacity monitoring automation

   **Long-term (3-12 months)**:
   - High-availability architecture
   - Load balancing implementation
   - Multi-node infrastructure

8. **Capacity Thresholds**:
   - Set alerts at 70%, 80%, 90% for each resource
   - Define action plans for each threshold
   - Establish escalation procedures

9. **What-If Scenarios**:
   - 20% traffic increase impact
   - 50% user growth impact
   - New service additions
   - Disaster recovery needs

Generate report including:
- Executive summary with key findings
- Resource-by-resource analysis
- Growth projections with charts
- Investment recommendations
- Risk assessment
- Timeline for action items

Save to reports/capacity-planning-YYYY-MM-DD.md
