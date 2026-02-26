#!/bin/bash
# TruffleHog Basic Scanning Examples
# Common scanning patterns and commands

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Basic Git repository scanning
scan_git_repo() {
    local repo_url="${1:-https://github.com/trufflesecurity/test_keys}"
    echo -e "${GREEN}Scanning Git repository: $repo_url${NC}"
    
    trufflehog git "$repo_url" \
        --results=verified,unknown \
        --json \
        --no-update
}

# Scan local Git repository
scan_local_git() {
    local repo_path="${1:-.}"
    echo -e "${GREEN}Scanning local Git repository: $repo_path${NC}"
    
    trufflehog git "file://$repo_path" \
        --results=verified,unknown \
        --since-commit=HEAD~10 \
        --json
}

# Scan GitHub organization
scan_github_org() {
    local org_name="${1}"
    if [[ -z "$org_name" ]]; then
        echo -e "${RED}Organization name required${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Scanning GitHub organization: $org_name${NC}"
    
    trufflehog github \
        --org="$org_name" \
        --results=verified,unknown \
        --json \
        --no-update
}

# Scan specific GitHub repository with comprehensive options
scan_github_repo() {
    local repo_url="${1}"
    if [[ -z "$repo_url" ]]; then
        echo -e "${RED}Repository URL required${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Scanning GitHub repository: $repo_url${NC}"
    
    trufflehog github \
        --repo="$repo_url" \
        --issue-comments \
        --pr-comments \
        --results=verified,unknown \
        --json
}

# Scan filesystem
scan_filesystem() {
    local path="${1:-.}"
    echo -e "${GREEN}Scanning filesystem: $path${NC}"
    
    trufflehog filesystem "$path" \
        --results=verified,unknown \
        --json \
        --no-update
}

# Scan multiple files and directories
scan_multiple_paths() {
    echo -e "${GREEN}Scanning multiple paths${NC}"
    
    trufflehog filesystem \
        ./config \
        ./scripts \
        ./src \
        --results=verified,unknown \
        --json
}

# Scan S3 bucket
scan_s3_bucket() {
    local bucket_name="${1}"
    if [[ -z "$bucket_name" ]]; then
        echo -e "${RED}S3 bucket name required${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Scanning S3 bucket: $bucket_name${NC}"
    
    trufflehog s3 \
        --bucket="$bucket_name" \
        --results=verified,unknown \
        --json
}

# Scan with Docker image
scan_docker_image() {
    local image_name="${1}"
    if [[ -z "$image_name" ]]; then
        echo -e "${RED}Docker image name required${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Scanning Docker image: $image_name${NC}"
    
    trufflehog docker \
        --image="$image_name" \
        --results=verified,unknown \
        --json
}

# Scan from standard input
scan_stdin() {
    echo -e "${GREEN}Scanning from standard input${NC}"
    echo -e "${YELLOW}Pipe data to this command or enter data manually (Ctrl+D to finish)${NC}"
    
    trufflehog stdin \
        --results=verified,unknown \
        --json
}

# Scan with fail on detection
scan_with_fail() {
    local repo_url="${1:-https://github.com/trufflesecurity/test_keys}"
    echo -e "${GREEN}Scanning with fail on detection: $repo_url${NC}"
    echo -e "${YELLOW}This will exit with code 183 if secrets are found${NC}"
    
    trufflehog git "$repo_url" \
        --results=verified,unknown \
        --fail \
        --json
}

# Scan with verbose output
scan_verbose() {
    local repo_url="${1:-https://github.com/trufflesecurity/test_keys}"
    echo -e "${GREEN}Scanning with verbose output: $repo_url${NC}"
    
    trufflehog git "$repo_url" \
        --results=verified,unknown \
        --log-level=3 \
        --json
}

# Scan with custom concurrency
scan_with_concurrency() {
    local repo_url="${1:-https://github.com/trufflesecurity/test_keys}"
    local concurrency="${2:-10}"
    echo -e "${GREEN}Scanning with $concurrency concurrent workers: $repo_url${NC}"
    
    trufflehog git "$repo_url" \
        --results=verified,unknown \
        --concurrency="$concurrency" \
        --json
}

# Display help
show_help() {
    echo -e "${GREEN}TruffleHog Basic Scanning Examples${NC}"
    echo ""
    echo "Available functions:"
    echo "  scan_git_repo [URL]           - Scan remote Git repository"
    echo "  scan_local_git [PATH]         - Scan local Git repository"
    echo "  scan_github_org ORG           - Scan GitHub organization"
    echo "  scan_github_repo URL          - Scan GitHub repository with comments"
    echo "  scan_filesystem [PATH]        - Scan filesystem"
    echo "  scan_multiple_paths           - Scan multiple directories"
    echo "  scan_s3_bucket BUCKET         - Scan S3 bucket"
    echo "  scan_docker_image IMAGE       - Scan Docker image"
    echo "  scan_stdin                    - Scan from standard input"
    echo "  scan_with_fail [URL]          - Scan and fail on detection"
    echo "  scan_verbose [URL]            - Scan with verbose output"
    echo "  scan_with_concurrency [URL] [N] - Scan with custom concurrency"
    echo ""
    echo "Examples:"
    echo "  scan_git_repo https://github.com/example/repo"
    echo "  scan_github_org mycompany"
    echo "  scan_s3_bucket my-bucket-name"
    echo "  scan_docker_image nginx:latest"
}

# Interactive menu
interactive_menu() {
    echo -e "${GREEN}TruffleHog Interactive Scanner${NC}"
    echo "Choose a scanning option:"
    echo "1. Git Repository"
    echo "2. Local Git Repository"
    echo "3. GitHub Organization"
    echo "4. GitHub Repository"
    echo "5. Filesystem"
    echo "6. S3 Bucket"
    echo "7. Docker Image"
    echo "8. From Standard Input"
    echo "9. Show Help"
    echo "0. Exit"
    
    read -p "Enter your choice (0-9): " choice
    
    case $choice in
        1)
            read -p "Enter Git repository URL: " repo_url
            scan_git_repo "$repo_url"
            ;;
        2)
            read -p "Enter local repository path (default: current directory): " repo_path
            scan_local_git "${repo_path:-.}"
            ;;
        3)
            read -p "Enter GitHub organization name: " org_name
            scan_github_org "$org_name"
            ;;
        4)
            read -p "Enter GitHub repository URL: " repo_url
            scan_github_repo "$repo_url"
            ;;
        5)
            read -p "Enter filesystem path (default: current directory): " fs_path
            scan_filesystem "${fs_path:-.}"
            ;;
        6)
            read -p "Enter S3 bucket name: " bucket_name
            scan_s3_bucket "$bucket_name"
            ;;
        7)
            read -p "Enter Docker image name: " image_name
            scan_docker_image "$image_name"
            ;;
        8)
            scan_stdin
            ;;
        9)
            show_help
            ;;
        0)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

# Main function
main() {
    if [[ $# -eq 0 ]]; then
        interactive_menu
    else
        case "$1" in
            help|--help|-h)
                show_help
                ;;
            *)
                echo -e "${RED}Unknown command: $1${NC}"
                show_help
                ;;
        esac
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi