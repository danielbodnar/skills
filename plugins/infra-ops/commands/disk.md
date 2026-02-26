# Disk Usage Analysis

Analyze disk space and I/O across all filesystems on server-1:

1. Query disk.space metrics for all mount points:
   - Used vs available space
   - Percentage utilization
   - Trend over last 24 hours
   - Growth rate estimation

2. Check disk.inodes metrics:
   - Inode usage percentage
   - Available inodes
   - Potential inode exhaustion

3. Analyze disk I/O patterns:
   - disk.io (read/write throughput)
   - disk.ops (operation counts)
   - disk.await (average wait times)
   - disk.util (utilization percentage)

4. Identify high-risk filesystems:
   - Flag any filesystem >90% full
   - Highlight rapid growth patterns
   - Check for inode issues

5. Provide cleanup recommendations:
   - Suggest log rotation if needed
   - Identify large files to investigate
   - Docker cleanup (images, volumes, logs)
   - MySQL binary log purging

6. For the known critical mount point `/mnt/data/oldserver/mnt/md3` (94% full):
   - Calculate days until full based on growth rate
   - Suggest immediate cleanup actions
   - Provide commands to free space

Include commands like:
```bash
# Find largest directories
du -sh /mnt/data/oldserver/mnt/md3/* | sort -rh | head -20

# Check Docker disk usage
docker system df

# Check MySQL binary logs
docker exec systemavo-db-1 mysql -e "SHOW BINARY LOGS;"
```
