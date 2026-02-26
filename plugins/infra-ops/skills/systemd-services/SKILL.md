---
name: systemd-services
description: Create, manage, and troubleshoot systemd services and timers
---

# Systemd Services

Skill for creating, managing, and troubleshooting systemd services and timers. Covers unit file authoring, journal inspection, service lifecycle management, timer scheduling, and common failure diagnosis patterns.

## Unit File Structure

Systemd unit files define services, timers, mounts, and other system resources. They follow a declarative INI-style format with well-defined sections.

### Service Unit (`*.service`)

```ini
[Unit]
Description=My Application Service
Documentation=https://example.com/docs
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=300
StartLimitBurst=5

[Service]
Type=exec
User=appuser
Group=appuser
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/server --config /etc/myapp/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
TimeoutStartSec=30s
TimeoutStopSec=30s

# Hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths=/var/lib/myapp /var/log/myapp

# Environment
Environment=NODE_ENV=production
EnvironmentFile=-/etc/myapp/env

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target
```

### Service Types

| Type | Description | Use Case |
|------|-------------|----------|
| `simple` | Default. Process started by `ExecStart` is the main process. | Long-running daemons that don't fork |
| `exec` | Like simple, but systemd waits for the binary to execute. | Preferred over simple for most services |
| `forking` | Process forks and the parent exits. Requires `PIDFile=`. | Traditional Unix daemons |
| `oneshot` | Process exits after completing its task. | Setup scripts, one-time tasks |
| `notify` | Process sends `sd_notify()` when ready. | Services with startup health checks |
| `idle` | Execution delayed until all jobs dispatched. | Low-priority startup tasks |

## Service Management

### Lifecycle Commands

```bash
# Start a service
systemctl start <service>

# Stop a service
systemctl stop <service>

# Restart a service (stop + start)
systemctl restart <service>

# Reload service configuration without restart (if supported)
systemctl reload <service>

# Reload or restart (tries reload first)
systemctl reload-or-restart <service>

# Enable service to start on boot
systemctl enable <service>

# Enable and start immediately
systemctl enable --now <service>

# Disable service from starting on boot
systemctl disable <service>

# Mask a service (prevent starting entirely)
systemctl mask <service>

# Unmask a service
systemctl unmask <service>
```

### Status and Inspection

```bash
# Show detailed service status
systemctl status <service>

# Check if a service is active
systemctl is-active <service>

# Check if a service is enabled
systemctl is-enabled <service>

# Check if a service has failed
systemctl is-failed <service>

# List all running services
systemctl list-units --type=service --state=running

# List all failed services
systemctl list-units --type=service --state=failed

# Show all properties of a service
systemctl show <service>

# Show specific property
systemctl show <service> -p MainPID -p MemoryCurrent -p CPUUsageNSec

# Show service dependencies
systemctl list-dependencies <service>

# Show reverse dependencies
systemctl list-dependencies <service> --reverse

# Show unit file contents
systemctl cat <service>
```

### User Services

```bash
# Manage user-level services (runs as current user)
systemctl --user start <service>
systemctl --user status <service>
systemctl --user enable --now <service>

# Enable lingering (keep user services running after logout)
loginctl enable-linger <username>
```

## Journal Inspection

### Viewing Logs

```bash
# View logs for a specific service
journalctl -u <service>

# Follow logs in real-time
journalctl -u <service> -f

# Show logs since last boot
journalctl -u <service> -b

# Show logs since a specific time
journalctl -u <service> --since "2026-02-25 10:00:00"

# Show logs in a time range
journalctl -u <service> --since "1 hour ago" --until "30 minutes ago"

# Show last N lines
journalctl -u <service> -n 100

# Show only error-level and above
journalctl -u <service> -p err

# Output as JSON for structured parsing
journalctl -u <service> -o json-pretty

# Show logs for a specific PID
journalctl _PID=<pid>

# Show kernel messages
journalctl -k

# Show logs from all user services
journalctl --user

# Check journal disk usage
journalctl --disk-usage

# Vacuum journal to a specific size
journalctl --vacuum-size=500M

# Vacuum journal entries older than 2 weeks
journalctl --vacuum-time=2weeks
```

### Log Priority Levels

| Priority | Keyword | Description |
|----------|---------|-------------|
| 0 | `emerg` | System is unusable |
| 1 | `alert` | Immediate action required |
| 2 | `crit` | Critical conditions |
| 3 | `err` | Error conditions |
| 4 | `warning` | Warning conditions |
| 5 | `notice` | Normal but significant |
| 6 | `info` | Informational |
| 7 | `debug` | Debug-level messages |

## Timer Units

Timers are the systemd replacement for cron jobs, with better logging, dependency management, and resource control.

### Timer Unit (`*.timer`)

```ini
[Unit]
Description=Run backup every night at 2 AM

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

### Corresponding Service Unit

The timer activates a service with the same name (minus the `.timer` extension):

```ini
[Unit]
Description=Nightly backup job

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
User=backup
Nice=19
IOSchedulingClass=idle
```

### Timer Scheduling Patterns

```ini
# Every 15 minutes
OnCalendar=*:0/15

# Every hour on the hour
OnCalendar=hourly

# Daily at midnight
OnCalendar=daily

# Weekly on Monday at 3 AM
OnCalendar=Mon *-*-* 03:00:00

# First day of every month at noon
OnCalendar=*-*-01 12:00:00

# Every weekday at 8 AM
OnCalendar=Mon..Fri *-*-* 08:00:00

# Relative: 5 minutes after boot
OnBootSec=5min

# Relative: 30 minutes after last run completed
OnUnitInactiveSec=30min

# Combined: 1 min after boot, then every hour
OnBootSec=1min
OnUnitActiveSec=1h
```

### Timer Management

```bash
# List all timers and their next trigger time
systemctl list-timers --all

# Start a timer
systemctl enable --now <name>.timer

# Check timer status
systemctl status <name>.timer

# Manually trigger the associated service
systemctl start <name>.service

# Test a calendar expression
systemd-analyze calendar "Mon..Fri *-*-* 08:00:00"

# Show next N trigger times for a calendar expression
systemd-analyze calendar --iterations=5 "daily"
```

## Troubleshooting

### Service Fails to Start

```bash
# Check the service status for error messages
systemctl status <service>

# Check full journal output for the service
journalctl -u <service> -n 50 --no-pager

# Check for configuration errors in the unit file
systemd-analyze verify /etc/systemd/system/<service>.service

# Check if ExecStart binary exists and is executable
systemctl show <service> -p ExecStart

# Check for dependency issues
systemctl list-dependencies <service>

# Check security restrictions that might block execution
systemd-analyze security <service>
```

### Service Keeps Restarting

```bash
# Check restart count and limits
systemctl show <service> -p NRestarts

# Check start rate limiting
systemctl show <service> -p StartLimitIntervalSec -p StartLimitBurst

# View the exit code pattern
journalctl -u <service> | grep -E "exit|failed|error"

# Reset the failure counter
systemctl reset-failed <service>
```

### Service is Stuck Stopping

```bash
# Check the service state
systemctl show <service> -p ActiveState -p SubState

# Check the main PID
systemctl show <service> -p MainPID

# Check what the process is doing
strace -p $(systemctl show <service> -p MainPID --value) 2>&1 | head -20

# Force kill the service
systemctl kill <service> --signal=SIGKILL
```

### Analyzing Boot Performance

```bash
# Show boot time breakdown
systemd-analyze

# Show per-service boot timing
systemd-analyze blame

# Generate an SVG visualization of the boot process
systemd-analyze plot > boot-plot.svg

# Show the critical chain (longest dependency path)
systemd-analyze critical-chain

# Show the critical chain for a specific service
systemd-analyze critical-chain <service>
```

## Security Hardening

Systemd provides extensive sandboxing options for services:

```ini
[Service]
# Filesystem restrictions
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths=/var/lib/myapp
ReadOnlyPaths=/etc/myapp
InaccessiblePaths=/root

# Capability restrictions
NoNewPrivileges=yes
CapabilityBoundingSet=
AmbientCapabilities=

# Network restrictions
PrivateNetwork=yes
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6

# System call filtering
SystemCallFilter=@system-service
SystemCallArchitectures=native

# Namespace isolation
PrivateDevices=yes
PrivateUsers=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectControlGroups=yes
ProtectClock=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
LockPersonality=yes
MemoryDenyWriteExecute=yes
```

```bash
# Analyze security exposure of a service (lower score is better)
systemd-analyze security <service>

# Show detailed security assessment
systemd-analyze security <service> --no-pager
```

## Resource Control (cgroups)

```ini
[Service]
# Memory limits
MemoryMax=512M
MemoryHigh=400M

# CPU limits
CPUQuota=150%
CPUWeight=100

# I/O limits
IOWeight=100
IOReadBandwidthMax=/dev/sda 50M
IOWriteBandwidthMax=/dev/sda 30M

# Process limits
TasksMax=100

# Combined resource accounting
MemoryAccounting=yes
CPUAccounting=yes
IOAccounting=yes
```

## Common Patterns

### Drop-in Overrides

Override specific directives without editing the original unit file:

```bash
# Create a drop-in override
systemctl edit <service>
# This creates /etc/systemd/system/<service>.service.d/override.conf

# Or create manually
mkdir -p /etc/systemd/system/<service>.service.d/
cat > /etc/systemd/system/<service>.service.d/override.conf << 'CONF'
[Service]
Environment=DEBUG=true
MemoryMax=1G
CONF
systemctl daemon-reload
```

### Transient Services

Run a one-off command as a managed systemd service:

```bash
# Run a command as a transient service
systemd-run --unit=my-task --description="One-off task" /opt/scripts/task.sh

# Run with resource limits
systemd-run --unit=my-task --property=MemoryMax=256M /opt/scripts/task.sh

# Run as a specific user
systemd-run --uid=appuser --unit=my-task /opt/scripts/task.sh

# Run as a user service
systemd-run --user --unit=my-task /opt/scripts/task.sh
```

### Watchdog

Configure a service to be restarted if it stops sending health pings:

```ini
[Service]
Type=notify
WatchdogSec=30s
Restart=on-watchdog
```

The application must call `sd_notify("WATCHDOG=1")` periodically within the watchdog interval.

### Socket Activation

Start a service on-demand when a connection arrives:

```ini
# myapp.socket
[Unit]
Description=My App Socket

[Socket]
ListenStream=8080
Accept=no

[Install]
WantedBy=sockets.target
```

```bash
# Enable socket activation
systemctl enable --now myapp.socket

# The service starts automatically when a connection arrives on port 8080
```

## Reload After Changes

After modifying any unit file:

```bash
# Reload systemd manager configuration
systemctl daemon-reload

# Then restart the affected service
systemctl restart <service>
```
