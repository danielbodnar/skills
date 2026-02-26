# Network Analysis

Analyze network performance and identify issues on server-1:

1. Query network metrics for all interfaces:
   - net.net (bandwidth usage)
   - net.packets (packet rates)
   - net.errors (error counts)
   - net.drops (dropped packets)
   - net.operstate (link status)

2. Focus on key interfaces:
   - enp9s0f0np0 (primary physical - 40.160.12.139)
   - wg0 (WireGuard VPN)
   - Docker bridge networks

3. Analyze traffic patterns:
   - Inbound vs outbound ratios
   - Bandwidth utilization trends
   - Peak traffic periods
   - Unusual spikes or drops

4. Identify network issues:
   - Packet drops (especially on wg0 - known 4.1% anomaly)
   - Error rates
   - Link state changes
   - MTU mismatches

5. Check TCP metrics:
   - ip.tcphandshake (connection establishment)
   - ip.tcpreorders (packet reordering)
   - ip.tcpconnaborts (connection aborts)
   - Retransmission rates

6. Container network usage:
   - Network traffic per container
   - Identify high-bandwidth containers
   - Check for network pressure on cgroups

7. Investigate known issues:
   - WireGuard packet drops (4.1% anomaly rate)
   - TCP retransmissions (1.0% anomaly rate)
   - High outbound from maybach container (40 Mbps)

Provide recommendations for:
- Network optimization
- MTU tuning if needed
- VPN troubleshooting
- Traffic shaping if required
