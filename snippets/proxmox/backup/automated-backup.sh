#!/bin/bash
# Automated Proxmox VE Backup Script
# Supports VM and container backups with rotation, notification, and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/backup-config.conf"
LOG_FILE="/var/log/proxmox-backup.log"
LOCK_FILE="/var/run/proxmox-backup.lock"

# Default configuration (can be overridden by config file)
BACKUP_STORAGE="backup-storage"
BACKUP_MODE="snapshot"
COMPRESSION="gzip"
RETENTION_DAILY=7
RETENTION_WEEKLY=4
RETENTION_MONTHLY=12
RETENTION_YEARLY=2
NOTIFICATION_EMAIL=""
HEALTHCHECK_URL=""
BACKUP_VMS=""
BACKUP_CONTAINERS=""
EXCLUDE_VMS=""
EXCLUDE_TEMPLATES=true
MAX_PARALLEL_JOBS=2

# Load configuration if exists
if [[ -f "$CONFIG_FILE" ]]; then
    # shellcheck source=/dev/null
    source "$CONFIG_FILE"
fi

# Logging function
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    cleanup
    exit 1
}

# Cleanup function
cleanup() {
    if [[ -f "$LOCK_FILE" ]]; then
        rm -f "$LOCK_FILE"
    fi
}

# Lock file handling
acquire_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        local pid
        pid=$(cat "$LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            error_exit "Another backup process is already running (PID: $pid)"
        else
            log "WARN" "Stale lock file found, removing it"
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

# Send notification
send_notification() {
    local subject="$1"
    local message="$2"
    local status="$3"  # success, warning, error
    
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        {
            echo "Subject: $subject"
            echo "Content-Type: text/plain"
            echo ""
            echo "$message"
            echo ""
            echo "Backup completed at: $(date)"
            echo "Server: $(hostname)"
        } | sendmail "$NOTIFICATION_EMAIL" || log "WARN" "Failed to send email notification"
    fi
    
    # Send to health check service (like healthchecks.io)
    if [[ -n "$HEALTHCHECK_URL" ]]; then
        local health_url="$HEALTHCHECK_URL"
        if [[ "$status" == "error" ]]; then
            health_url="${HEALTHCHECK_URL}/fail"
        fi
        curl -m 10 --retry 3 -s "$health_url" || log "WARN" "Failed to ping health check URL"
    fi
}

# Check if storage exists and is available
check_storage() {
    local storage="$1"
    
    log "INFO" "Checking storage '$storage'"
    
    if ! pvesm status | grep -q "^$storage"; then
        error_exit "Storage '$storage' not found"
    fi
    
    local status
    status=$(pvesm status | awk -v storage="$storage" '$1 == storage {print $2}')
    
    if [[ "$status" != "active" ]]; then
        error_exit "Storage '$storage' is not active (status: $status)"
    fi
    
    log "INFO" "Storage '$storage' is available"
}

# Get list of VMs to backup
get_vm_list() {
    local vm_list=""
    
    if [[ -n "$BACKUP_VMS" ]]; then
        vm_list="$BACKUP_VMS"
    else
        # Get all VMs if no specific list provided
        vm_list=$(qm list | awk 'NR>1 {print $1}' | tr '\n' ',' | sed 's/,$//')
    fi
    
    # Remove excluded VMs
    if [[ -n "$EXCLUDE_VMS" ]]; then
        IFS=',' read -ra exclude_array <<< "$EXCLUDE_VMS"
        for exclude_vm in "${exclude_array[@]}"; do
            vm_list=$(echo "$vm_list" | sed "s/\b$exclude_vm\b//g" | sed 's/,,/,/g' | sed 's/^,//g' | sed 's/,$//g')
        done
    fi
    
    # Remove templates if configured
    if [[ "$EXCLUDE_TEMPLATES" == "true" ]]; then
        local filtered_list=""
        IFS=',' read -ra vm_array <<< "$vm_list"
        for vm in "${vm_array[@]}"; do
            if [[ -n "$vm" ]]; then
                local is_template
                is_template=$(qm config "$vm" | grep -c "^template: 1" || true)
                if [[ "$is_template" -eq 0 ]]; then
                    filtered_list="${filtered_list}${vm},"
                fi
            fi
        done
        vm_list=$(echo "$filtered_list" | sed 's/,$//')
    fi
    
    echo "$vm_list"
}

# Get list of containers to backup
get_container_list() {
    local container_list=""
    
    if [[ -n "$BACKUP_CONTAINERS" ]]; then
        container_list="$BACKUP_CONTAINERS"
    else
        # Get all containers if no specific list provided
        container_list=$(pct list | awk 'NR>1 {print $1}' | tr '\n' ',' | sed 's/,$//')
    fi
    
    echo "$container_list"
}

# Backup a single VM
backup_vm() {
    local vmid="$1"
    local start_time
    start_time=$(date +%s)
    
    log "INFO" "Starting backup of VM $vmid"
    
    # Check if VM exists
    if ! qm status "$vmid" >/dev/null 2>&1; then
        log "WARN" "VM $vmid does not exist, skipping"
        return 1
    fi
    
    # Get VM name for logging
    local vm_name
    vm_name=$(qm config "$vmid" | grep "^name:" | cut -d' ' -f2 || echo "vm-$vmid")
    
    # Perform backup
    local backup_options=(
        "$vmid"
        "--storage" "$BACKUP_STORAGE"
        "--mode" "$BACKUP_MODE"
        "--compress" "$COMPRESSION"
        "--quiet"
    )
    
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        backup_options+=("--mailto" "$NOTIFICATION_EMAIL")
    fi
    
    if vzdump "${backup_options[@]}"; then
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "INFO" "Backup of VM $vmid ($vm_name) completed successfully in ${duration}s"
        return 0
    else
        log "ERROR" "Backup of VM $vmid ($vm_name) failed"
        return 1
    fi
}

# Backup a single container
backup_container() {
    local vmid="$1"
    local start_time
    start_time=$(date +%s)
    
    log "INFO" "Starting backup of container $vmid"
    
    # Check if container exists
    if ! pct status "$vmid" >/dev/null 2>&1; then
        log "WARN" "Container $vmid does not exist, skipping"
        return 1
    fi
    
    # Get container name for logging
    local container_name
    container_name=$(pct config "$vmid" | grep "^hostname:" | cut -d' ' -f2 || echo "ct-$vmid")
    
    # Perform backup
    local backup_options=(
        "$vmid"
        "--storage" "$BACKUP_STORAGE"
        "--mode" "$BACKUP_MODE"
        "--compress" "$COMPRESSION"
        "--quiet"
    )
    
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        backup_options+=("--mailto" "$NOTIFICATION_EMAIL")
    fi
    
    if vzdump "${backup_options[@]}"; then
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "INFO" "Backup of container $vmid ($container_name) completed successfully in ${duration}s"
        return 0
    else
        log "ERROR" "Backup of container $vmid ($container_name) failed"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "INFO" "Starting backup cleanup"
    
    local storage_path
    storage_path=$(pvesm path "$BACKUP_STORAGE:" | sed 's/:$//')
    
    if [[ ! -d "$storage_path" ]]; then
        log "WARN" "Storage path '$storage_path' not found, skipping cleanup"
        return
    fi
    
    # Find backup files older than retention period
    local cutoff_date
    cutoff_date=$(date -d "$RETENTION_DAILY days ago" +%Y-%m-%d)
    
    find "$storage_path" -name "vzdump-*.tar.*" -type f -printf "%T@ %p\n" | sort -n | while read -r timestamp filepath; do
        local file_date
        file_date=$(date -d "@$timestamp" +%Y-%m-%d)
        
        if [[ "$file_date" < "$cutoff_date" ]]; then
            log "INFO" "Removing old backup: $(basename "$filepath")"
            rm -f "$filepath"
        fi
    done
    
    log "INFO" "Backup cleanup completed"
}

# Generate backup report
generate_report() {
    local success_count="$1"
    local error_count="$2"
    local total_count="$3"
    local start_time="$4"
    local end_time="$5"
    
    local duration=$((end_time - start_time))
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))
    local seconds=$((duration % 60))
    
    local report=""
    report+="Proxmox VE Backup Report\n"
    report+="========================\n\n"
    report+="Date: $(date)\n"
    report+="Duration: ${hours}h ${minutes}m ${seconds}s\n\n"
    report+="Summary:\n"
    report+="  Total backups: $total_count\n"
    report+="  Successful: $success_count\n"
    report+="  Failed: $error_count\n\n"
    
    if [[ "$error_count" -eq 0 ]]; then
        report+="Status: SUCCESS ✓\n"
    else
        report+="Status: PARTIAL FAILURE ⚠\n"
    fi
    
    echo -e "$report"
}

# Main backup function
main_backup() {
    local start_time
    start_time=$(date +%s)
    
    log "INFO" "Starting Proxmox VE backup process"
    
    # Check storage availability
    check_storage "$BACKUP_STORAGE"
    
    # Get backup lists
    local vm_list
    vm_list=$(get_vm_list)
    local container_list
    container_list=$(get_container_list)
    
    log "INFO" "VMs to backup: $vm_list"
    log "INFO" "Containers to backup: $container_list"
    
    local success_count=0
    local error_count=0
    local total_count=0
    
    # Backup VMs
    if [[ -n "$vm_list" ]]; then
        IFS=',' read -ra vm_array <<< "$vm_list"
        for vm in "${vm_array[@]}"; do
            if [[ -n "$vm" ]]; then
                ((total_count++))
                if backup_vm "$vm"; then
                    ((success_count++))
                else
                    ((error_count++))
                fi
            fi
        done
    fi
    
    # Backup containers
    if [[ -n "$container_list" ]]; then
        IFS=',' read -ra container_array <<< "$container_list"
        for container in "${container_array[@]}"; do
            if [[ -n "$container" ]]; then
                ((total_count++))
                if backup_container "$container"; then
                    ((success_count++))
                else
                    ((error_count++))
                fi
            fi
        done
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    local end_time
    end_time=$(date +%s)
    
    # Generate and send report
    local report
    report=$(generate_report "$success_count" "$error_count" "$total_count" "$start_time" "$end_time")
    
    echo "$report"
    echo "$report" >> "$LOG_FILE"
    
    # Send notification
    local status="success"
    local subject="Proxmox Backup Report - Success"
    
    if [[ "$error_count" -gt 0 ]]; then
        status="warning"
        subject="Proxmox Backup Report - Partial Failure"
    fi
    
    if [[ "$total_count" -eq 0 ]]; then
        status="error"
        subject="Proxmox Backup Report - No Backups Performed"
    fi
    
    send_notification "$subject" "$report" "$status"
    
    log "INFO" "Backup process completed: $success_count successful, $error_count failed"
    
    # Exit with error code if any backups failed
    if [[ "$error_count" -gt 0 ]] || [[ "$total_count" -eq 0 ]]; then
        exit 1
    fi
}

# Print usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -h, --help          Show this help message
    -c, --config FILE   Use specific configuration file
    -t, --test          Test mode (dry run)
    -v, --verbose       Verbose output
    --vms LIST          Comma-separated list of VM IDs to backup
    --containers LIST   Comma-separated list of container IDs to backup
    --storage STORAGE   Backup storage name
    --mode MODE         Backup mode (snapshot, suspend, stop)

Configuration file format:
    BACKUP_STORAGE="backup-storage"
    BACKUP_MODE="snapshot"
    COMPRESSION="gzip"
    RETENTION_DAILY=7
    NOTIFICATION_EMAIL="admin@example.com"
    HEALTHCHECK_URL="https://hc-ping.com/your-uuid"
    BACKUP_VMS="100,101,102"
    BACKUP_CONTAINERS="200,201,202"
    EXCLUDE_VMS="105"
    EXCLUDE_TEMPLATES=true

EOF
}

# Signal handlers
trap cleanup EXIT
trap 'error_exit "Interrupted by user"' INT TERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -t|--test)
            log "INFO" "Test mode enabled (dry run)"
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        --vms)
            BACKUP_VMS="$2"
            shift 2
            ;;
        --containers)
            BACKUP_CONTAINERS="$2"
            shift 2
            ;;
        --storage)
            BACKUP_STORAGE="$2"
            shift 2
            ;;
        --mode)
            BACKUP_MODE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            exit 1
            ;;
    esac
done

# Main execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    acquire_lock
    main_backup
fi

# Example cron job:
# 0 2 * * * /usr/local/bin/proxmox-backup.sh --config /etc/proxmox-backup.conf 2>&1 | logger -t proxmox-backup

# Example systemd service:
# [Unit]
# Description=Proxmox VE Backup
# After=pve-cluster.service
# 
# [Service]
# Type=oneshot
# ExecStart=/usr/local/bin/proxmox-backup.sh
# User=root
# 
# [Install]
# WantedBy=multi-user.target

# Example systemd timer:
# [Unit]
# Description=Run Proxmox VE backup daily
# Requires=proxmox-backup.service
# 
# [Timer]
# OnCalendar=daily
# Persistent=true
# 
# [Install]
# WantedBy=timers.target