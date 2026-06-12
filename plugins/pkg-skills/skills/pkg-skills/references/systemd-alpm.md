# systemd + alpm automation

How `systemctl --user enable pkg-skills.timer` keeps skills current.

## Contents

- [Units](#units)
- [The alpm → user bridge](#the-alpm--user-bridge)
- [Install sequence](#install-sequence)
- [Troubleshooting](#troubleshooting)

## Units

| Unit | Trigger | Action |
|------|---------|--------|
| `pkg-skills.timer` | daily (`Persistent=true`, 30min jitter) | starts pkg-skills.service |
| `pkg-skills.service` | timer / manual | `pkg-skills generate --changed-only` |
| `pkg-skills-drain.path` | `/var/lib/pkg-skills/spool` changes | starts pkg-skills-drain.service |
| `pkg-skills-drain.service` | path unit | `pkg-skills generate --drain` |

All units read `EnvironmentFile=-%E/pkg-skills/pkg-skills.conf` (%E = XDG config
home), so XDG overrides and GITHUB tokens can be set there.

## The alpm → user bridge

pacman hooks run as **root**; skill generation must run as the **user**. The
bridge is a world-writable spool file:

1. `/etc/pacman.d/hooks/pkg-skills.hook` (`PostTransaction`, `NeedsTargets`)
   appends every installed/upgraded package name to `/var/lib/pkg-skills/spool`
2. the user's `pkg-skills-drain.path` watches the spool
3. `generate --drain` reads + truncates the spool and regenerates only spooled
   packages that are opted in

Per-user managers (cargo, bun, npm, …) have no global hook — the daily timer's
`--changed-only` diff covers them. That is a deliberate trade-off: instant
updates for pacman, ≤24h for user-level managers.

## Install sequence

```bash
pkg-skills units install            # writes user units, prints the sudo steps
sudo install -Dm644 <plugin>/bin/alpm/pkg-skills.hook /etc/pacman.d/hooks/pkg-skills.hook
sudo mkdir -p /var/lib/pkg-skills; sudo touch /var/lib/pkg-skills/spool; sudo chmod 0666 /var/lib/pkg-skills/spool
systemctl --user daemon-reload
systemctl --user enable --now pkg-skills.timer pkg-skills-drain.path
```

## Troubleshooting

- `journalctl --user -u pkg-skills.service -e` — generation logs
- `systemctl --user list-timers pkg-skills.timer` — next scheduled run
- spool never drains → check the .path unit is active and the spool is mode 0666
- service fails with "command not found" → re-run `pkg-skills units install`
  after moving the binary (ExecStart embeds its absolute path)
