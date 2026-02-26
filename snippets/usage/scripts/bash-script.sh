#!/usr/bin/env -S usage bash

#USAGE name "File Processor"
#USAGE bin "process-files"
#USAGE about "Process files with various options"
#USAGE version "1.0.0"
#USAGE author "Daniel Bodnar"

#USAGE flag "-f --force" help="Overwrite existing files without confirmation"
#USAGE flag "-v --verbose" help="Enable verbose output" count=true
#USAGE flag "-u --user <user>" help="User to run as" env="PROCESS_USER" default="current"
#USAGE flag "--backup" help="Create backup before processing"
#USAGE flag "--format <format>" help="Output format" default="json"

#USAGE arg "<input>" help="Input file or directory to process"
#USAGE arg "[output]" help="Output file or directory" default="output"

# Set strict error handling
set -euo pipefail

# Function to log messages based on verbosity
log() {
    local level=$1
    shift
    local message="$*"
    
    case $level in
        "error")
            echo "ERROR: $message" >&2
            ;;
        "warn")
            echo "WARN: $message" >&2
            ;;
        "info")
            if [[ "${usage_verbose:-0}" -ge 1 ]]; then
                echo "INFO: $message"
            fi
            ;;
        "debug")
            if [[ "${usage_verbose:-0}" -ge 2 ]]; then
                echo "DEBUG: $message"
            fi
            ;;
    esac
}

# Main processing function
process_file() {
    local input_file="$1"
    local output_file="$2"
    
    log "info" "Processing file: $input_file"
    log "debug" "Output file: $output_file"
    log "debug" "Format: ${usage_format}"
    log "debug" "User: ${usage_user}"
    
    # Check if input file exists
    if [[ ! -f "$input_file" ]]; then
        log "error" "Input file not found: $input_file"
        exit 1
    fi
    
    # Create backup if requested
    if [[ "${usage_backup:-false}" == "true" ]]; then
        local backup_file="${input_file}.backup.$(date +%Y%m%d_%H%M%S)"
        log "info" "Creating backup: $backup_file"
        cp "$input_file" "$backup_file"
    fi
    
    # Check if output file exists and handle force flag
    if [[ -f "$output_file" && "${usage_force:-false}" != "true" ]]; then
        log "error" "Output file exists and --force not specified: $output_file"
        exit 1
    fi
    
    # Process the file based on format
    case "${usage_format}" in
        "json")
            log "info" "Converting to JSON format"
            # Convert to JSON (example implementation)
            jq -R -s 'split("\n") | map(select(length > 0)) | {lines: .}' "$input_file" > "$output_file"
            ;;
        "csv")
            log "info" "Converting to CSV format"
            # Convert to CSV (example implementation)
            awk '{print NR "," $0}' "$input_file" > "$output_file"
            ;;
        "xml")
            log "info" "Converting to XML format"
            # Convert to XML (example implementation)
            echo '<?xml version="1.0" encoding="UTF-8"?>' > "$output_file"
            echo '<document>' >> "$output_file"
            while IFS= read -r line; do
                echo "  <line>$line</line>" >> "$output_file"
            done < "$input_file"
            echo '</document>' >> "$output_file"
            ;;
        *)
            log "error" "Unsupported format: ${usage_format}"
            exit 1
            ;;
    esac
    
    log "info" "Processing completed successfully"
}

# Main execution
main() {
    local input="${usage_input}"
    local output="${usage_output:-output}"
    
    log "info" "Starting file processing"
    log "debug" "Input: $input"
    log "debug" "Output: $output"
    
    if [[ -d "$input" ]]; then
        # Process directory
        log "info" "Processing directory: $input"
        
        # Create output directory if it doesn't exist
        mkdir -p "$output"
        
        # Process each file in the directory
        for file in "$input"/*; do
            if [[ -f "$file" ]]; then
                local basename=$(basename "$file")
                local output_file="$output/${basename}.${usage_format}"
                process_file "$file" "$output_file"
            fi
        done
    else
        # Process single file
        if [[ "$output" == "output" ]]; then
            output="${input%.*}.${usage_format}"
        fi
        process_file "$input" "$output"
    fi
    
    log "info" "All processing completed"
}

# Run main function
main "$@"