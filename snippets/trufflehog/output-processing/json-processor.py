#!/usr/bin/env python3
"""
TruffleHog JSON Output Processor
Comprehensive tools for processing and analyzing TruffleHog JSON output
"""

import json
import sys
import argparse
import csv
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Set
from collections import defaultdict, Counter
import hashlib

class TruffleHogProcessor:
    """Main processor for TruffleHog JSON output"""
    
    def __init__(self, input_file: str = None, input_data: str = None):
        self.secrets = []
        self.stats = {}
        
        if input_file:
            self.load_from_file(input_file)
        elif input_data:
            self.load_from_string(input_data)
    
    def load_from_file(self, file_path: str):
        """Load secrets from JSON file"""
        try:
            with open(file_path, 'r') as f:
                content = f.read().strip()
                if not content:
                    self.secrets = []
                    return
                
                # Handle both single object and array formats
                if content.startswith('['):
                    self.secrets = json.loads(content)
                else:
                    # Handle newline-delimited JSON
                    self.secrets = []
                    for line in content.split('\n'):
                        if line.strip():
                            self.secrets.append(json.loads(line))
        except Exception as e:
            print(f"Error loading file {file_path}: {e}", file=sys.stderr)
            self.secrets = []
    
    def load_from_string(self, content: str):
        """Load secrets from JSON string"""
        try:
            if not content.strip():
                self.secrets = []
                return
            
            if content.startswith('['):
                self.secrets = json.loads(content)
            else:
                # Handle newline-delimited JSON
                self.secrets = []
                for line in content.split('\n'):
                    if line.strip():
                        self.secrets.append(json.loads(line))
        except Exception as e:
            print(f"Error parsing JSON: {e}", file=sys.stderr)
            self.secrets = []
    
    def generate_statistics(self) -> Dict[str, Any]:
        """Generate comprehensive statistics"""
        if not self.secrets:
            return {"total": 0, "message": "No secrets found"}
        
        stats = {
            "total": len(self.secrets),
            "verified": sum(1 for s in self.secrets if s.get("Verified", False)),
            "unverified": sum(1 for s in self.secrets if not s.get("Verified", False)),
            "by_detector": dict(Counter(s.get("DetectorName", "Unknown") for s in self.secrets)),
            "by_source": dict(Counter(s.get("SourceName", "Unknown") for s in self.secrets)),
            "by_file": dict(Counter(self._get_file_path(s) for s in self.secrets)),
            "verification_rate": 0
        }
        
        if stats["total"] > 0:
            stats["verification_rate"] = (stats["verified"] / stats["total"]) * 100
        
        # Additional analysis
        stats["unique_files"] = len(set(self._get_file_path(s) for s in self.secrets))
        stats["detector_types"] = len(stats["by_detector"])
        stats["high_entropy_secrets"] = sum(1 for s in self.secrets if self._estimate_entropy(s.get("Raw", "")) > 3.5)
        
        self.stats = stats
        return stats
    
    def _get_file_path(self, secret: Dict[str, Any]) -> str:
        """Extract file path from secret metadata"""
        metadata = secret.get("SourceMetadata", {}).get("Data", {})
        
        # Try different source types
        if "Git" in metadata:
            return metadata["Git"].get("file", "unknown")
        elif "Filesystem" in metadata:
            return metadata["Filesystem"].get("file", "unknown")
        elif "GitHub" in metadata:
            return metadata["GitHub"].get("file", "unknown")
        else:
            return "unknown"
    
    def _estimate_entropy(self, text: str) -> float:
        """Simple entropy estimation"""
        if not text:
            return 0.0
        
        char_counts = Counter(text)
        text_length = len(text)
        entropy = -sum((count / text_length) * 
                      (count / text_length).bit_length() 
                      for count in char_counts.values())
        return entropy
    
    def filter_secrets(self, 
                      verified_only: bool = False,
                      detector_names: List[str] = None,
                      exclude_detectors: List[str] = None,
                      file_patterns: List[str] = None,
                      min_entropy: float = None) -> List[Dict[str, Any]]:
        """Filter secrets based on various criteria"""
        filtered = self.secrets
        
        if verified_only:
            filtered = [s for s in filtered if s.get("Verified", False)]
        
        if detector_names:
            filtered = [s for s in filtered if s.get("DetectorName") in detector_names]
        
        if exclude_detectors:
            filtered = [s for s in filtered if s.get("DetectorName") not in exclude_detectors]
        
        if file_patterns:
            import fnmatch
            filtered = [s for s in filtered 
                       if any(fnmatch.fnmatch(self._get_file_path(s), pattern) 
                             for pattern in file_patterns)]
        
        if min_entropy:
            filtered = [s for s in filtered 
                       if self._estimate_entropy(s.get("Raw", "")) >= min_entropy]
        
        return filtered
    
    def deduplicate_secrets(self, secrets: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Remove duplicate secrets based on content hash"""
        if secrets is None:
            secrets = self.secrets
        
        seen_hashes = set()
        unique_secrets = []
        
        for secret in secrets:
            # Create hash based on detector name, raw value, and file
            content = f"{secret.get('DetectorName', '')}-{secret.get('Raw', '')}-{self._get_file_path(secret)}"
            content_hash = hashlib.md5(content.encode()).hexdigest()
            
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_secrets.append(secret)
        
        return unique_secrets
    
    def export_to_csv(self, output_file: str, secrets: List[Dict[str, Any]] = None):
        """Export secrets to CSV format"""
        if secrets is None:
            secrets = self.secrets
        
        if not secrets:
            print("No secrets to export")
            return
        
        fieldnames = [
            'DetectorName', 'Verified', 'Raw', 'RawV2', 'Redacted',
            'SourceType', 'SourceName', 'File', 'Timestamp'
        ]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for secret in secrets:
                row = {
                    'DetectorName': secret.get('DetectorName', ''),
                    'Verified': secret.get('Verified', False),
                    'Raw': secret.get('Raw', '')[:50] + '...' if len(secret.get('Raw', '')) > 50 else secret.get('Raw', ''),
                    'RawV2': secret.get('RawV2', ''),
                    'Redacted': secret.get('Redacted', ''),
                    'SourceType': secret.get('SourceType', ''),
                    'SourceName': secret.get('SourceName', ''),
                    'File': self._get_file_path(secret),
                    'Timestamp': datetime.now().isoformat()
                }
                writer.writerow(row)
        
        print(f"Exported {len(secrets)} secrets to {output_file}")
    
    def generate_html_report(self, output_file: str):
        """Generate HTML report"""
        stats = self.generate_statistics()
        
        html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>TruffleHog Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .critical { background: #ffebee; border-left: 4px solid #f44336; }
        .warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .safe { background: #e8f5e8; border-left: 4px solid #4caf50; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .verified { color: #f44336; font-weight: bold; }
        .unverified { color: #ff9800; }
        .code { font-family: monospace; background: #f5f5f5; padding: 2px 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TruffleHog Security Scan Report</h1>
        <p>Generated on: {timestamp}</p>
    </div>
    
    <div class="stats">
        <div class="stat-box">
            <h3>{total}</h3>
            <p>Total Secrets</p>
        </div>
        <div class="stat-box">
            <h3 class="verified">{verified}</h3>
            <p>Verified</p>
        </div>
        <div class="stat-box">
            <h3 class="unverified">{unverified}</h3>
            <p>Unverified</p>
        </div>
        <div class="stat-box">
            <h3>{verification_rate:.1f}%</h3>
            <p>Verification Rate</p>
        </div>
    </div>
    
    <div class="{alert_class}">
        <h2>Security Status</h2>
        <p>{security_message}</p>
    </div>
    
    <h2>Summary by Detector Type</h2>
    <table>
        <tr><th>Detector</th><th>Count</th><th>Percentage</th></tr>
        {detector_rows}
    </table>
    
    <h2>Summary by File</h2>
    <table>
        <tr><th>File</th><th>Count</th></tr>
        {file_rows}
    </table>
    
    <h2>Recent Detections</h2>
    <table>
        <tr><th>Detector</th><th>Status</th><th>File</th><th>Snippet</th></tr>
        {detection_rows}
    </table>
</body>
</html>
        """
        
        # Determine security status
        if stats["verified"] > 0:
            alert_class = "critical"
            security_message = f"⚠️ CRITICAL: {stats['verified']} verified secrets found! Immediate action required."
        elif stats["unverified"] > 0:
            alert_class = "warning"
            security_message = f"⚠️ WARNING: {stats['unverified']} unverified secrets detected. Review recommended."
        else:
            alert_class = "safe"
            security_message = "✅ No secrets detected. Repository appears secure."
        
        # Generate table rows
        detector_rows = ""
        for detector, count in sorted(stats["by_detector"].items(), key=lambda x: x[1], reverse=True):
            percentage = (count / stats["total"]) * 100
            detector_rows += f"<tr><td>{detector}</td><td>{count}</td><td>{percentage:.1f}%</td></tr>"
        
        file_rows = ""
        for file_path, count in sorted(stats["by_file"].items(), key=lambda x: x[1], reverse=True)[:20]:
            file_rows += f"<tr><td class='code'>{file_path}</td><td>{count}</td></tr>"
        
        detection_rows = ""
        for secret in self.secrets[:20]:  # Show first 20
            status = "Verified" if secret.get("Verified", False) else "Unverified"
            status_class = "verified" if secret.get("Verified", False) else "unverified"
            snippet = secret.get("Redacted", secret.get("Raw", ""))[:50] + "..."
            detection_rows += f"""
            <tr>
                <td>{secret.get('DetectorName', 'Unknown')}</td>
                <td class="{status_class}">{status}</td>
                <td class="code">{self._get_file_path(secret)}</td>
                <td class="code">{snippet}</td>
            </tr>
            """
        
        # Fill template
        html_content = html_template.format(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            total=stats["total"],
            verified=stats["verified"],
            unverified=stats["unverified"],
            verification_rate=stats["verification_rate"],
            alert_class=alert_class,
            security_message=security_message,
            detector_rows=detector_rows,
            file_rows=file_rows,
            detection_rows=detection_rows
        )
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"HTML report generated: {output_file}")
    
    def print_summary(self, detailed: bool = False):
        """Print summary to console"""
        stats = self.generate_statistics()
        
        if stats["total"] == 0:
            print("✅ No secrets detected")
            return
        
        print(f"\n📊 TruffleHog Scan Summary")
        print(f"{'='*50}")
        print(f"Total secrets found: {stats['total']}")
        print(f"Verified secrets: {stats['verified']} ({stats['verification_rate']:.1f}%)")
        print(f"Unverified secrets: {stats['unverified']}")
        print(f"Unique files affected: {stats['unique_files']}")
        print(f"Detector types used: {stats['detector_types']}")
        
        if stats["verified"] > 0:
            print(f"\n🚨 CRITICAL: {stats['verified']} verified secrets require immediate attention!")
        
        print(f"\n🔍 Top Detectors:")
        for detector, count in sorted(stats["by_detector"].items(), key=lambda x: x[1], reverse=True)[:10]:
            percentage = (count / stats["total"]) * 100
            print(f"  {detector}: {count} ({percentage:.1f}%)")
        
        if detailed:
            print(f"\n📁 Files with most secrets:")
            for file_path, count in sorted(stats["by_file"].items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {file_path}: {count}")
    
    def export_remediation_guide(self, output_file: str):
        """Export remediation guide"""
        verified_secrets = self.filter_secrets(verified_only=True)
        
        guide_content = f"""# TruffleHog Remediation Guide

Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}

## Summary
- Total secrets: {len(self.secrets)}
- Verified secrets: {len(verified_secrets)}
- Files affected: {len(set(self._get_file_path(s) for s in self.secrets))}

## Immediate Actions Required

### 1. Revoke Verified Credentials
The following verified credentials must be revoked immediately:

"""
        
        for secret in verified_secrets:
            guide_content += f"""
#### {secret.get('DetectorName', 'Unknown')} in {self._get_file_path(secret)}
- **Status**: VERIFIED (Active credential)
- **Action**: Revoke this credential immediately
- **Redacted Value**: `{secret.get('Redacted', 'N/A')}`
- **Next Steps**: 
  1. Revoke the credential in the respective service
  2. Generate a new credential
  3. Update application configuration
  4. Remove from Git history if needed
"""
        
        guide_content += """

### 2. Remove from Git History
For credentials committed to Git, remove them from history:

```bash
# For specific files
git filter-branch --force --index-filter \\
  'git rm --cached --ignore-unmatch path/to/secret/file' \\
  --prune-empty --tag-name-filter cat -- --all

# Alternative using BFG Repo-Cleaner (recommended)
bfg --replace-text secrets.txt repo.git
```

### 3. Prevent Future Incidents
1. Set up TruffleHog pre-commit hooks
2. Configure CI/CD secret scanning
3. Use environment variables for secrets
4. Implement secret management solutions
5. Regular security training for developers

### 4. Monitoring
- Set up alerts for new secret detections
- Regular scans of all repositories
- Monitor for unauthorized access using revoked credentials
"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        print(f"Remediation guide generated: {output_file}")

def main():
    parser = argparse.ArgumentParser(description="Process TruffleHog JSON output")
    parser.add_argument("input", help="Input JSON file (use '-' for stdin)")
    parser.add_argument("--stats", action="store_true", help="Show statistics")
    parser.add_argument("--verified-only", action="store_true", help="Show only verified secrets")
    parser.add_argument("--detectors", nargs="+", help="Filter by detector names")
    parser.add_argument("--exclude-detectors", nargs="+", help="Exclude detector names")
    parser.add_argument("--min-entropy", type=float, help="Minimum entropy threshold")
    parser.add_argument("--dedupe", action="store_true", help="Remove duplicates")
    parser.add_argument("--csv", help="Export to CSV file")
    parser.add_argument("--html", help="Generate HTML report")
    parser.add_argument("--remediation", help="Generate remediation guide")
    parser.add_argument("--detailed", action="store_true", help="Detailed output")
    
    args = parser.parse_args()
    
    # Load input
    if args.input == "-":
        input_data = sys.stdin.read()
        processor = TruffleHogProcessor(input_data=input_data)
    else:
        processor = TruffleHogProcessor(input_file=args.input)
    
    # Apply filters
    secrets = processor.filter_secrets(
        verified_only=args.verified_only,
        detector_names=args.detectors,
        exclude_detectors=args.exclude_detectors,
        min_entropy=args.min_entropy
    )
    
    if args.dedupe:
        secrets = processor.deduplicate_secrets(secrets)
    
    # Update processor with filtered secrets for stats
    if secrets != processor.secrets:
        filtered_processor = TruffleHogProcessor()
        filtered_processor.secrets = secrets
        processor = filtered_processor
    
    # Generate outputs
    if args.stats or not any([args.csv, args.html, args.remediation]):
        processor.print_summary(detailed=args.detailed)
    
    if args.csv:
        processor.export_to_csv(args.csv, secrets)
    
    if args.html:
        processor.generate_html_report(args.html)
    
    if args.remediation:
        processor.export_remediation_guide(args.remediation)
    
    # Exit with appropriate code
    stats = processor.generate_statistics()
    if stats.get("verified", 0) > 0:
        sys.exit(2)  # Verified secrets found
    elif stats.get("total", 0) > 0:
        sys.exit(1)  # Unverified secrets found
    else:
        sys.exit(0)  # No secrets found

if __name__ == "__main__":
    main()