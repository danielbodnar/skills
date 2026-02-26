#!/bin/bash
# TruffleHog Security Monitoring and Automation Script
# Comprehensive monitoring, alerting, and remediation automation

# Configuration
CONFIG_FILE="${HOME}/.trufflehog-monitor.conf"
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
LOG_DIR="${HOME}/.local/share/trufflehog-monitor/logs"
CACHE_DIR="${HOME}/.local/share/trufflehog-monitor/cache"
REPORT_DIR="${HOME}/.local/share/trufflehog-monitor/reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_CONFIG="# TruffleHog Monitor Configuration
SCAN_INTERVAL=3600  # Scan interval in seconds (1 hour)
REPOSITORIES=()     # Array of repositories to monitor
SLACK_WEBHOOK=''    # Slack webhook URL for alerts
EMAIL_ALERTS=''     # Email address for alerts
GITHUB_TOKEN=''     # GitHub token for API access
ALERT_THRESHOLD=1   # Alert if this many verified secrets found
LOG_RETENTION=30    # Days to keep logs
ENABLE_AUTO_REMEDIATION=false  # Automatically create issues/PRs
MAX_CONCURRENT_SCANS=3  # Maximum concurrent scans
SCAN_TIMEOUT=300    # Scan timeout in seconds
"

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_DIR/monitor.log"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_debug() { log "DEBUG" "$@"; }

# Setup functions
setup_directories() {
    mkdir -p "$LOG_DIR" "$CACHE_DIR" "$REPORT_DIR"
    log_info "Created monitoring directories"
}

create_default_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        cat > "$CONFIG_FILE" << EOF
$DEFAULT_CONFIG
EOF
        log_info "Created default configuration file: $CONFIG_FILE"
        echo -e "${YELLOW}Please edit $CONFIG_FILE to configure your monitoring settings${NC}"
        return 1
    fi
    return 0
}

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        log_info "Loaded configuration from $CONFIG_FILE"
    else
        log_warn "Configuration file not found, using defaults"
        eval "$DEFAULT_CONFIG"
    fi
}

# Repository management
add_repository() {
    local repo_url="$1"
    if [[ -z "$repo_url" ]]; then
        echo -e "${RED}Repository URL required${NC}"
        return 1
    fi
    
    # Validate repository URL
    if ! validate_repository_url "$repo_url"; then
        echo -e "${RED}Invalid repository URL: $repo_url${NC}"
        return 1
    fi
    
    # Add to config
    local temp_file=$(mktemp)
    grep -v "^REPOSITORIES=" "$CONFIG_FILE" > "$temp_file"
    echo "REPOSITORIES=($(printf '"%s" ' "${REPOSITORIES[@]}" "$repo_url"))" >> "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
    
    log_info "Added repository: $repo_url"
    echo -e "${GREEN}✓ Repository added: $repo_url${NC}"
}

remove_repository() {
    local repo_url="$1"
    if [[ -z "$repo_url" ]]; then
        echo -e "${RED}Repository URL required${NC}"
        return 1
    fi
    
    # Remove from array
    local new_repos=()
    for repo in "${REPOSITORIES[@]}"; do
        if [[ "$repo" != "$repo_url" ]]; then
            new_repos+=("$repo")
        fi
    done
    
    # Update config
    local temp_file=$(mktemp)
    grep -v "^REPOSITORIES=" "$CONFIG_FILE" > "$temp_file"
    echo "REPOSITORIES=($(printf '"%s" ' "${new_repos[@]}"))" >> "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
    
    log_info "Removed repository: $repo_url"
    echo -e "${GREEN}✓ Repository removed: $repo_url${NC}"
}

list_repositories() {
    echo -e "${BLUE}Monitored Repositories:${NC}"
    if [[ ${#REPOSITORIES[@]} -eq 0 ]]; then
        echo -e "${YELLOW}No repositories configured${NC}"
        return
    fi
    
    for i in "${!REPOSITORIES[@]}"; do
        local repo="${REPOSITORIES[$i]}"
        local cache_file="$CACHE_DIR/$(echo "$repo" | tr '/' '_').json"
        local last_scan="Never"
        
        if [[ -f "$cache_file" ]]; then
            last_scan=$(date -r "$cache_file" '+%Y-%m-%d %H:%M:%S')
        fi
        
        echo -e "  $((i+1)). $repo"
        echo -e "     Last scan: $last_scan"
    done
}

validate_repository_url() {
    local url="$1"
    # Basic URL validation
    if [[ "$url" =~ ^https?://github\.com/.+/.+$ ]] || \
       [[ "$url" =~ ^git@github\.com:.+/.+\.git$ ]] || \
       [[ "$url" =~ ^https?://gitlab\.com/.+/.+$ ]]; then
        return 0
    fi
    return 1
}

# Scanning functions
scan_repository() {
    local repo_url="$1"
    local output_file="$2"
    local repo_name=$(basename "$repo_url" .git)
    
    log_info "Starting scan of repository: $repo_url"
    
    # Create scan command
    local scan_cmd="trufflehog git '$repo_url' --results=verified,unknown --json --no-update --concurrency=5"
    
    # Add GitHub token if available
    if [[ -n "$GITHUB_TOKEN" ]]; then
        export GITHUB_TOKEN
    fi
    
    # Execute scan with timeout
    if timeout "$SCAN_TIMEOUT" bash -c "$scan_cmd" > "$output_file" 2>/dev/null; then
        local secret_count=$(wc -l < "$output_file" 2>/dev/null || echo 0)
        log_info "Scan completed for $repo_name: $secret_count secrets found"
        return 0
    else
        log_error "Scan failed or timed out for $repo_name"
        return 1
    fi
}

scan_all_repositories() {
    local scan_results=()
    local pids=()
    local concurrent_scans=0
    
    log_info "Starting batch scan of ${#REPOSITORIES[@]} repositories"
    
    for repo in "${REPOSITORIES[@]}"; do
        local repo_name=$(basename "$repo" .git)
        local output_file="$CACHE_DIR/${repo_name}_$(date +%Y%m%d_%H%M%S).json"
        
        # Wait if max concurrent scans reached
        while [[ $concurrent_scans -ge $MAX_CONCURRENT_SCANS ]]; do
            wait -n  # Wait for any background job to complete
            ((concurrent_scans--))
        done
        
        # Start scan in background
        {
            scan_repository "$repo" "$output_file"
            echo "$repo:$?:$output_file" >> "$CACHE_DIR/scan_results.tmp"
        } &
        
        pids+=($!)
        ((concurrent_scans++))
        
        log_info "Started scan for $repo_name (PID: ${pids[-1]})"
    done
    
    # Wait for all scans to complete
    log_info "Waiting for all scans to complete..."
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    # Process results
    if [[ -f "$CACHE_DIR/scan_results.tmp" ]]; then
        while IFS=':' read -r repo exit_code output_file; do
            scan_results+=("$repo:$exit_code:$output_file")
        done < "$CACHE_DIR/scan_results.tmp"
        rm -f "$CACHE_DIR/scan_results.tmp"
    fi
    
    log_info "Batch scan completed"
    process_scan_results "${scan_results[@]}"
}

process_scan_results() {
    local results=("$@")
    local total_secrets=0
    local verified_secrets=0
    local alert_repos=()
    local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
    local summary_file="$REPORT_DIR/scan_summary_$timestamp.json"
    
    echo "{" > "$summary_file"
    echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$summary_file"
    echo "  \"repositories\": [" >> "$summary_file"
    
    local first=true
    for result in "${results[@]}"; do
        IFS=':' read -r repo exit_code output_file <<< "$result"
        local repo_name=$(basename "$repo" .git)
        
        [[ "$first" == true ]] && first=false || echo "    ," >> "$summary_file"
        
        if [[ $exit_code -eq 0 && -f "$output_file" ]]; then
            local secret_count=$(wc -l < "$output_file" 2>/dev/null || echo 0)
            local verified_count=0
            
            if [[ -s "$output_file" ]]; then
                verified_count=$(jq -r '. | select(.Verified == true)' "$output_file" 2>/dev/null | wc -l || echo 0)
            fi
            
            total_secrets=$((total_secrets + secret_count))
            verified_secrets=$((verified_secrets + verified_count))
            
            # Check alert threshold
            if [[ $verified_count -ge $ALERT_THRESHOLD ]]; then
                alert_repos+=("$repo:$verified_count")
            fi
            
            echo "    {" >> "$summary_file"
            echo "      \"repository\": \"$repo\"," >> "$summary_file"
            echo "      \"status\": \"success\"," >> "$summary_file"
            echo "      \"total_secrets\": $secret_count," >> "$summary_file"
            echo "      \"verified_secrets\": $verified_count," >> "$summary_file"
            echo "      \"output_file\": \"$output_file\"" >> "$summary_file"
            echo "    }" >> "$summary_file"
            
            log_info "Repository $repo_name: $secret_count total, $verified_count verified"
        else
            echo "    {" >> "$summary_file"
            echo "      \"repository\": \"$repo\"," >> "$summary_file"
            echo "      \"status\": \"failed\"," >> "$summary_file"
            echo "      \"error_code\": $exit_code" >> "$summary_file"
            echo "    }" >> "$summary_file"
            
            log_error "Repository $repo_name: scan failed"
        fi
    done
    
    echo "  ]," >> "$summary_file"
    echo "  \"summary\": {" >> "$summary_file"
    echo "    \"total_repositories\": ${#results[@]}," >> "$summary_file"
    echo "    \"total_secrets\": $total_secrets," >> "$summary_file"
    echo "    \"verified_secrets\": $verified_secrets," >> "$summary_file"
    echo "    \"alert_repositories\": ${#alert_repos[@]}" >> "$summary_file"
    echo "  }" >> "$summary_file"
    echo "}" >> "$summary_file"
    
    log_info "Scan summary: $total_secrets total secrets, $verified_secrets verified across ${#results[@]} repositories"
    
    # Send alerts if needed
    if [[ ${#alert_repos[@]} -gt 0 ]]; then
        send_security_alert "$summary_file" "${alert_repos[@]}"
    fi
    
    # Auto-remediation if enabled
    if [[ "$ENABLE_AUTO_REMEDIATION" == "true" && ${#alert_repos[@]} -gt 0 ]]; then
        initiate_auto_remediation "${alert_repos[@]}"
    fi
}

# Alert functions
send_security_alert() {
    local summary_file="$1"
    shift
    local alert_repos=("$@")
    
    log_warn "Security alert triggered for ${#alert_repos[@]} repositories"
    
    local message="🚨 **TruffleHog Security Alert**\n\n"
    message+="**Verified secrets detected in the following repositories:**\n\n"
    
    for repo_info in "${alert_repos[@]}"; do
        IFS=':' read -r repo count <<< "$repo_info"
        message+="• \`$repo\`: **$count verified secrets**\n"
    done
    
    message+="\n**Summary:**\n"
    message+="• Alert time: $(date)\n"
    message+="• Total repositories scanned: $(jq -r '.summary.total_repositories' "$summary_file")\n"
    message+="• Total secrets found: $(jq -r '.summary.total_secrets' "$summary_file")\n"
    message+="• Verified secrets: $(jq -r '.summary.verified_secrets' "$summary_file")\n"
    message+="\n**Immediate action required to revoke exposed credentials!**"
    
    # Send Slack alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        send_slack_alert "$message"
    fi
    
    # Send email alert
    if [[ -n "$EMAIL_ALERTS" ]]; then
        send_email_alert "$message" "$summary_file"
    fi
}

send_slack_alert() {
    local message="$1"
    
    local payload=$(cat << EOF
{
    "text": "TruffleHog Security Alert",
    "attachments": [
        {
            "color": "danger",
            "text": "$message",
            "footer": "TruffleHog Monitor",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    if curl -X POST -H 'Content-type: application/json' \
           --data "$payload" \
           "$SLACK_WEBHOOK" >/dev/null 2>&1; then
        log_info "Slack alert sent successfully"
    else
        log_error "Failed to send Slack alert"
    fi
}

send_email_alert() {
    local message="$1"
    local attachment="$2"
    
    local subject="🚨 TruffleHog Security Alert - Verified Secrets Detected"
    local body=$(echo -e "$message" | sed 's/\*\*//g' | sed 's/`//g')
    
    if command -v mail >/dev/null 2>&1; then
        echo "$body" | mail -s "$subject" -a "$attachment" "$EMAIL_ALERTS"
        log_info "Email alert sent to $EMAIL_ALERTS"
    else
        log_warn "Mail command not available, email alert not sent"
    fi
}

# Auto-remediation functions
initiate_auto_remediation() {
    local alert_repos=("$@")
    
    log_info "Initiating auto-remediation for ${#alert_repos[@]} repositories"
    
    for repo_info in "${alert_repos[@]}"; do
        IFS=':' read -r repo count <<< "$repo_info"
        create_security_issue "$repo" "$count"
    done
}

create_security_issue() {
    local repo="$1"
    local secret_count="$2"
    
    if [[ -z "$GITHUB_TOKEN" ]]; then
        log_warn "GitHub token not configured, cannot create issues"
        return 1
    fi
    
    # Extract owner and repo name from URL
    local repo_path=$(echo "$repo" | sed -E 's|.*github\.com[:/]([^/]+/[^/]+)\.git?.*|\1|')
    
    local issue_title="🚨 Security Alert: $secret_count Verified Secrets Detected"
    local issue_body="## Security Alert

TruffleHog has detected **$secret_count verified secrets** in this repository.

### Immediate Actions Required:
1. **Revoke all exposed credentials immediately**
2. **Generate new credentials**
3. **Update application configurations**
4. **Remove secrets from Git history**

### Detection Details:
- Scan time: $(date)
- Verified secrets: $secret_count
- Scanner: TruffleHog Monitor

### Next Steps:
1. Run TruffleHog locally to see detailed results:
   \`\`\`bash
   trufflehog git $repo --results=verified --json
   \`\`\`

2. Remove secrets from Git history:
   \`\`\`bash
   # Using BFG Repo-Cleaner (recommended)
   bfg --replace-text secrets.txt repo.git
   \`\`\`

3. Set up pre-commit hooks to prevent future incidents:
   \`\`\`bash
   # Add TruffleHog pre-commit hook
   echo 'trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail' > .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   \`\`\`

### Important:
- **This is an automated alert from TruffleHog Monitor**
- **Treat this as a high-priority security incident**
- **Monitor for unauthorized access using the exposed credentials**

---
*Generated by TruffleHog Monitor on $(date)*"
    
    local api_url="https://api.github.com/repos/$repo_path/issues"
    local payload=$(jq -n \
                    --arg title "$issue_title" \
                    --arg body "$issue_body" \
                    '{title: $title, body: $body, labels: ["security", "urgent"]}')
    
    if curl -s -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            -X POST \
            -d "$payload" \
            "$api_url" >/dev/null; then
        log_info "Created security issue for $repo"
    else
        log_error "Failed to create security issue for $repo"
    fi
}

# Maintenance functions
cleanup_old_files() {
    local retention_days="${LOG_RETENTION:-30}"
    
    log_info "Cleaning up files older than $retention_days days"
    
    # Clean up logs
    find "$LOG_DIR" -name "*.log" -type f -mtime +$retention_days -delete 2>/dev/null || true
    
    # Clean up cache files
    find "$CACHE_DIR" -name "*.json" -type f -mtime +$retention_days -delete 2>/dev/null || true
    
    # Clean up reports
    find "$REPORT_DIR" -name "*.json" -type f -mtime +$retention_days -delete 2>/dev/null || true
    
    log_info "Cleanup completed"
}

rotate_logs() {
    local log_file="$LOG_DIR/monitor.log"
    local max_size=10485760  # 10MB
    
    if [[ -f "$log_file" && $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0) -gt $max_size ]]; then
        local timestamp=$(date +%Y%m%d_%H%M%S)
        mv "$log_file" "${log_file}.${timestamp}"
        gzip "${log_file}.${timestamp}" 2>/dev/null || true
        log_info "Log rotated: monitor.log.${timestamp}.gz"
    fi
}

# Status and reporting functions
show_status() {
    echo -e "${BLUE}TruffleHog Monitor Status${NC}"
    echo -e "${BLUE}========================${NC}"
    
    # Configuration status
    echo -e "\n${CYAN}Configuration:${NC}"
    echo -e "  Config file: $CONFIG_FILE"
    echo -e "  Repositories: ${#REPOSITORIES[@]}"
    echo -e "  Scan interval: ${SCAN_INTERVAL}s ($(($SCAN_INTERVAL / 60)) minutes)"
    echo -e "  Alert threshold: $ALERT_THRESHOLD verified secrets"
    echo -e "  Auto-remediation: $ENABLE_AUTO_REMEDIATION"
    
    # Directory status
    echo -e "\n${CYAN}Storage:${NC}"
    echo -e "  Log directory: $LOG_DIR ($(ls -1 "$LOG_DIR" 2>/dev/null | wc -l) files)"
    echo -e "  Cache directory: $CACHE_DIR ($(ls -1 "$CACHE_DIR" 2>/dev/null | wc -l) files)"
    echo -e "  Report directory: $REPORT_DIR ($(ls -1 "$REPORT_DIR" 2>/dev/null | wc -l) files)"
    
    # Recent activity
    echo -e "\n${CYAN}Recent Activity:${NC}"
    local latest_log="$LOG_DIR/monitor.log"
    if [[ -f "$latest_log" ]]; then
        echo -e "  Last log entry: $(tail -1 "$latest_log" 2>/dev/null || echo 'No logs')"
    else
        echo -e "  No recent activity"
    fi
    
    # Service status (if running as daemon)
    local pid_file="$CACHE_DIR/monitor.pid"
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "\n${GREEN}✓ Monitor daemon is running (PID: $pid)${NC}"
        else
            echo -e "\n${YELLOW}⚠ Monitor daemon PID file exists but process is not running${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "\n${YELLOW}⚠ Monitor daemon is not running${NC}"
    fi
}

generate_report() {
    local report_type="${1:-summary}"
    local days="${2:-7}"
    local output_file="$REPORT_DIR/report_$(date +%Y%m%d_%H%M%S).html"
    
    log_info "Generating $report_type report for last $days days"
    
    # Find recent scan results
    local scan_files=()
    while IFS= read -r -d '' file; do
        scan_files+=("$file")
    done < <(find "$REPORT_DIR" -name "scan_summary_*.json" -mtime -$days -print0 2>/dev/null)
    
    if [[ ${#scan_files[@]} -eq 0 ]]; then
        echo -e "${YELLOW}No scan results found for the last $days days${NC}"
        return 1
    fi
    
    # Generate HTML report
    cat > "$output_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TruffleHog Monitor Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; flex: 1; }
        .critical { background: #ffebee; border-left: 4px solid #f44336; }
        .warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .safe { background: #e8f5e8; border-left: 4px solid #4caf50; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .trend { margin: 20px 0; }
        .chart { height: 200px; background: #f9f9f9; border: 1px solid #ddd; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TruffleHog Security Monitor Report</h1>
        <p>Generated on: $(date)</p>
        <p>Period: Last $days days</p>
    </div>
EOF
    
    # Process scan files and add data to report
    local total_scans=0
    local total_secrets=0
    local total_verified=0
    
    for file in "${scan_files[@]}"; do
        if [[ -f "$file" ]]; then
            local scans=$(jq -r '.summary.total_repositories' "$file" 2>/dev/null || echo 0)
            local secrets=$(jq -r '.summary.total_secrets' "$file" 2>/dev/null || echo 0)
            local verified=$(jq -r '.summary.verified_secrets' "$file" 2>/dev/null || echo 0)
            
            total_scans=$((total_scans + scans))
            total_secrets=$((total_secrets + secrets))
            total_verified=$((total_verified + verified))
        fi
    done
    
    # Add summary metrics to report
    cat >> "$output_file" << EOF
    <div class="summary">
        <div class="metric">
            <h3>$total_scans</h3>
            <p>Total Scans</p>
        </div>
        <div class="metric">
            <h3>$total_secrets</h3>
            <p>Secrets Found</p>
        </div>
        <div class="metric">
            <h3>$total_verified</h3>
            <p>Verified Secrets</p>
        </div>
        <div class="metric">
            <h3>${#REPOSITORIES[@]}</h3>
            <p>Monitored Repos</p>
        </div>
    </div>
    
    <div class="$([ $total_verified -gt 0 ] && echo "critical" || echo "safe")">
        <h2>Security Status</h2>
        <p>$([ $total_verified -gt 0 ] && echo "⚠️ $total_verified verified secrets require attention" || echo "✅ No verified secrets detected")</p>
    </div>
    
    <h2>Repository Summary</h2>
    <table>
        <tr><th>Repository</th><th>Last Scan</th><th>Secrets</th><th>Verified</th><th>Status</th></tr>
EOF
    
    # Add repository data
    for repo in "${REPOSITORIES[@]}"; do
        local repo_name=$(basename "$repo" .git)
        local latest_file=$(ls -t "$CACHE_DIR"/${repo_name}_*.json 2>/dev/null | head -1)
        local last_scan="Never"
        local secrets=0
        local verified=0
        local status="Unknown"
        
        if [[ -f "$latest_file" ]]; then
            last_scan=$(date -r "$latest_file" '+%Y-%m-%d %H:%M')
            secrets=$(wc -l < "$latest_file" 2>/dev/null || echo 0)
            verified=$(jq -r '. | select(.Verified == true)' "$latest_file" 2>/dev/null | wc -l || echo 0)
            status=$([ $verified -gt 0 ] && echo "⚠️ Alert" || [ $secrets -gt 0 ] && echo "⚠️ Review" || echo "✅ Clean")
        fi
        
        cat >> "$output_file" << EOF
        <tr>
            <td>$repo_name</td>
            <td>$last_scan</td>
            <td>$secrets</td>
            <td>$verified</td>
            <td>$status</td>
        </tr>
EOF
    done
    
    cat >> "$output_file" << 'EOF'
    </table>
    
    <div class="trend">
        <h2>Trend Analysis</h2>
        <div class="chart">
            <p style="text-align: center; line-height: 200px;">Chart placeholder - implement with your preferred charting library</p>
        </div>
    </div>
    
    <h2>Recommendations</h2>
    <ul>
        <li>Ensure all repositories have pre-commit hooks configured</li>
        <li>Regular security training for development teams</li>
        <li>Implement secret management solutions</li>
        <li>Set up automated credential rotation</li>
        <li>Monitor for unauthorized access using exposed credentials</li>
    </ul>
    
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Generated by TruffleHog Monitor - $(date)</p>
    </footer>
</body>
</html>
EOF
    
    echo -e "${GREEN}✓ Report generated: $output_file${NC}"
    log_info "HTML report generated: $output_file"
    
    # Open report if desktop environment available
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$output_file" >/dev/null 2>&1 &
    elif command -v open >/dev/null 2>&1; then
        open "$output_file" >/dev/null 2>&1 &
    fi
}

# Daemon functions
start_daemon() {
    local pid_file="$CACHE_DIR/monitor.pid"
    
    if [[ -f "$pid_file" ]]; then
        local existing_pid=$(cat "$pid_file")
        if kill -0 "$existing_pid" 2>/dev/null; then
            echo -e "${YELLOW}Monitor daemon is already running (PID: $existing_pid)${NC}"
            return 1
        else
            rm -f "$pid_file"
        fi
    fi
    
    echo -e "${BLUE}Starting TruffleHog Monitor daemon...${NC}"
    
    # Start daemon in background
    nohup bash -c "
        echo \$\$ > '$pid_file'
        while true; do
            $(declare -f load_config setup_directories log_info log_error scan_all_repositories cleanup_old_files rotate_logs)
            load_config
            setup_directories
            log_info 'Daemon scan cycle starting'
            scan_all_repositories
            cleanup_old_files
            rotate_logs
            log_info 'Daemon scan cycle completed, sleeping for $SCAN_INTERVAL seconds'
            sleep '$SCAN_INTERVAL'
        done
    " >/dev/null 2>&1 &
    
    local daemon_pid=$!
    echo "$daemon_pid" > "$pid_file"
    
    log_info "Monitor daemon started with PID: $daemon_pid"
    echo -e "${GREEN}✓ Monitor daemon started (PID: $daemon_pid)${NC}"
    echo -e "${CYAN}Use '$0 stop' to stop the daemon${NC}"
}

stop_daemon() {
    local pid_file="$CACHE_DIR/monitor.pid"
    
    if [[ ! -f "$pid_file" ]]; then
        echo -e "${YELLOW}Monitor daemon is not running${NC}"
        return 1
    fi
    
    local pid=$(cat "$pid_file")
    
    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${BLUE}Stopping monitor daemon (PID: $pid)...${NC}"
        kill "$pid"
        
        # Wait for process to stop
        local count=0
        while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
            sleep 1
            ((count++))
        done
        
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Process did not stop gracefully, forcing...${NC}"
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$pid_file"
        log_info "Monitor daemon stopped"
        echo -e "${GREEN}✓ Monitor daemon stopped${NC}"
    else
        echo -e "${YELLOW}Process not running, cleaning up PID file${NC}"
        rm -f "$pid_file"
    fi
}

# Interactive menu
interactive_menu() {
    while true; do
        echo -e "\n${GREEN}TruffleHog Security Monitor${NC}"
        echo -e "${GREEN}==========================${NC}"
        echo "1.  Status"
        echo "2.  Add repository"
        echo "3.  Remove repository"
        echo "4.  List repositories"
        echo "5.  Scan all repositories"
        echo "6.  Start daemon"
        echo "7.  Stop daemon"
        echo "8.  Generate report"
        echo "9.  View configuration"
        echo "10. Test alerts"
        echo "11. Cleanup old files"
        echo "12. Exit"
        
        read -p "Choose an option (1-12): " choice
        
        case $choice in
            1) show_status ;;
            2) 
                read -p "Enter repository URL: " repo_url
                add_repository "$repo_url"
                ;;
            3)
                list_repositories
                read -p "Enter repository URL to remove: " repo_url
                remove_repository "$repo_url"
                ;;
            4) list_repositories ;;
            5) scan_all_repositories ;;
            6) start_daemon ;;
            7) stop_daemon ;;
            8)
                read -p "Report period in days [7]: " days
                generate_report "summary" "${days:-7}"
                ;;
            9)
                echo -e "\n${CYAN}Current Configuration:${NC}"
                cat "$CONFIG_FILE"
                ;;
            10)
                echo -e "${BLUE}Testing alert system...${NC}"
                send_security_alert "/dev/null" "test-repo:1"
                ;;
            11) cleanup_old_files ;;
            12) 
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice${NC}"
                ;;
        esac
        
        read -p "Press Enter to continue..."
    done
}

# Help function
show_help() {
    cat << 'EOF'
TruffleHog Security Monitor

USAGE:
    trufflehog-monitor [COMMAND] [OPTIONS]

COMMANDS:
    setup                   Initial setup and configuration
    add <repo-url>          Add repository to monitoring
    remove <repo-url>       Remove repository from monitoring
    list                    List monitored repositories
    scan                    Scan all repositories once
    start                   Start monitoring daemon
    stop                    Stop monitoring daemon  
    status                  Show status and statistics
    report [days]           Generate HTML report (default: 7 days)
    cleanup                 Clean up old files
    config                  Show configuration
    interactive             Interactive menu
    help                    Show this help message

EXAMPLES:
    trufflehog-monitor setup
    trufflehog-monitor add https://github.com/user/repo.git
    trufflehog-monitor start
    trufflehog-monitor report 30
    trufflehog-monitor interactive

CONFIGURATION:
    Edit ~/.trufflehog-monitor.conf to customize settings

FILES:
    ~/.trufflehog-monitor.conf                    Configuration file
    ~/.local/share/trufflehog-monitor/logs/       Log files
    ~/.local/share/trufflehog-monitor/cache/      Scan cache
    ~/.local/share/trufflehog-monitor/reports/    Generated reports
EOF
}

# Main function
main() {
    # Initialize
    setup_directories
    
    # Handle commands
    case "${1:-interactive}" in
        setup)
            create_default_config
            echo -e "${GREEN}Setup completed. Edit $CONFIG_FILE to configure your settings.${NC}"
            ;;
        add)
            load_config
            add_repository "$2"
            ;;
        remove)
            load_config
            remove_repository "$2"
            ;;
        list)
            load_config
            list_repositories
            ;;
        scan)
            load_config
            scan_all_repositories
            ;;
        start)
            load_config
            start_daemon
            ;;
        stop)
            stop_daemon
            ;;
        status)
            load_config
            show_status
            ;;
        report)
            load_config
            generate_report "summary" "${2:-7}"
            ;;
        cleanup)
            cleanup_old_files
            ;;
        config)
            load_config
            echo -e "${CYAN}Configuration file: $CONFIG_FILE${NC}"
            cat "$CONFIG_FILE"
            ;;
        interactive)
            load_config
            interactive_menu
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi