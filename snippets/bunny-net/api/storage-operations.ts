// Bunny.net Edge Storage API Operations
// HTTP API for global storage with automatic replication

interface StorageZone {
  Id: number;
  Name: string;
  Region: string;
  ReadOnlyPassword: string;
  Password: string;
  DateModified: string;
  Replication: boolean;
  PullZones: Array<{ Id: number; Name: string }>;
}

class BunnyStorage {
  private apiKey: string;
  private storageZoneName: string;
  private storagePassword: string;
  private baseUrl: string;

  constructor(config: {
    apiKey: string;
    storageZoneName: string;
    storagePassword: string;
    region?: string;
  }) {
    this.apiKey = config.apiKey;
    this.storageZoneName = config.storageZoneName;
    this.storagePassword = config.storagePassword;
    this.baseUrl = `https://${config.region || 'storage'}.bunnycdn.com`;
  }

  private getStorageUrl(path: string): string {
    return `${this.baseUrl}/${this.storageZoneName}${path}`;
  }

  private getHeaders(contentType?: string): HeadersInit {
    return {
      'AccessKey': this.storagePassword,
      ...(contentType && { 'Content-Type': contentType }),
    };
  }

  // Upload file to storage
  async uploadFile(filePath: string, content: Uint8Array | string, contentType?: string): Promise<void> {
    const url = this.getStorageUrl(filePath);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(contentType),
      body: content,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  }

  // Upload from local file (Bun/Node.js)
  async uploadLocalFile(localPath: string, remotePath: string): Promise<void> {
    try {
      const file = Bun.file(localPath);
      const content = await file.arrayBuffer();
      const contentType = file.type || 'application/octet-stream';
      
      await this.uploadFile(remotePath, new Uint8Array(content), contentType);
    } catch (error) {
      throw new Error(`Failed to upload local file: ${error}`);
    }
  }

  // Download file from storage
  async downloadFile(filePath: string): Promise<Uint8Array> {
    const url = this.getStorageUrl(filePath);
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  // List files in directory
  async listFiles(directory: string = '/'): Promise<FileInfo[]> {
    const url = this.getStorageUrl(directory);
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`List failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    const url = this.getStorageUrl(filePath);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
    }
  }

  // Create directory
  async createDirectory(dirPath: string): Promise<void> {
    const url = this.getStorageUrl(`${dirPath}/`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Create directory failed: ${response.status} ${response.statusText}`);
    }
  }

  // Get file info
  async getFileInfo(filePath: string): Promise<FileInfo> {
    const response = await fetch(this.getStorageUrl(filePath), {
      method: 'HEAD',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Get file info failed: ${response.status} ${response.statusText}`);
    }

    return {
      ObjectName: filePath,
      Length: parseInt(response.headers.get('Content-Length') || '0'),
      LastChanged: response.headers.get('Last-Modified') || '',
      IsDirectory: false,
      ServerId: parseInt(response.headers.get('Server-Id') || '0'),
      Checksum: response.headers.get('Checksum') || '',
      ReplicatedZones: response.headers.get('Replicated-Zones') || '',
    };
  }

  // Bulk operations
  async uploadMultipleFiles(files: Array<{ localPath: string; remotePath: string }>): Promise<void> {
    const uploadPromises = files.map(({ localPath, remotePath }) =>
      this.uploadLocalFile(localPath, remotePath)
    );

    await Promise.all(uploadPromises);
  }

  // Sync directory
  async syncDirectory(localDir: string, remoteDir: string): Promise<void> {
    // This would require file system access and recursive directory traversal
    // Implementation depends on runtime (Bun, Node.js, Deno)
    throw new Error('Directory sync not implemented - implement based on your runtime');
  }
}

interface FileInfo {
  ObjectName: string;
  Length: number;
  LastChanged: string;
  IsDirectory: boolean;
  ServerId: number;
  Checksum: string;
  ReplicatedZones: string;
}

// Management API for storage zones
class BunnyStorageManagement {
  private apiKey: string;
  private baseUrl = 'https://api.bunny.net';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'AccessKey': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listStorageZones(): Promise<StorageZone[]> {
    return this.request('/storagezone');
  }

  async createStorageZone(name: string, region: string = 'DE'): Promise<StorageZone> {
    return this.request('/storagezone', {
      method: 'POST',
      body: JSON.stringify({ Name: name, Region: region }),
    });
  }

  async getStorageZone(id: number): Promise<StorageZone> {
    return this.request(`/storagezone/${id}`);
  }

  async deleteStorageZone(id: number): Promise<void> {
    await this.request(`/storagezone/${id}`, { method: 'DELETE' });
  }

  async resetStorageZonePassword(id: number): Promise<{ Password: string }> {
    return this.request(`/storagezone/${id}/resetPassword`, { method: 'POST' });
  }
}

// Usage examples
export async function storageExamples() {
  // Initialize storage client
  const storage = new BunnyStorage({
    apiKey: process.env.BUNNY_API_KEY!,
    storageZoneName: 'my-storage',
    storagePassword: process.env.BUNNY_STORAGE_PASSWORD!,
    region: 'de', // or 'ny', 'la', 'sg'
  });

  try {
    // Upload a text file
    await storage.uploadFile('/documents/readme.txt', 'Hello from Bunny Storage!', 'text/plain');
    
    // Upload binary file from local filesystem
    await storage.uploadLocalFile('./image.jpg', '/images/uploaded-image.jpg');
    
    // List files in directory
    const files = await storage.listFiles('/images/');
    console.log('Files in /images/:', files);
    
    // Download file
    const fileContent = await storage.downloadFile('/documents/readme.txt');
    console.log('Downloaded content:', new TextDecoder().decode(fileContent));
    
    // Get file information
    const fileInfo = await storage.getFileInfo('/images/uploaded-image.jpg');
    console.log('File info:', fileInfo);
    
    // Create directory
    await storage.createDirectory('/assets/css');
    
    // Delete file
    await storage.deleteFile('/temp/old-file.txt');

  } catch (error) {
    console.error('Storage operation failed:', error);
  }
}

// Management example
export async function managementExample() {
  const management = new BunnyStorageManagement(process.env.BUNNY_API_KEY!);

  try {
    // List all storage zones
    const zones = await management.listStorageZones();
    console.log('Storage zones:', zones);

    // Create new storage zone
    const newZone = await management.createStorageZone('my-new-storage', 'NY');
    console.log('Created storage zone:', newZone);

    // Reset password for security
    const newPassword = await management.resetStorageZonePassword(newZone.Id);
    console.log('New password:', newPassword.Password);

  } catch (error) {
    console.error('Management operation failed:', error);
  }
}