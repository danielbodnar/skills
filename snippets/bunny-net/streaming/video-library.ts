// Bunny.net Stream Video Management
// Complete video streaming and encoding platform

interface VideoLibrary {
  Id: number;
  Name: string;
  ApiKey: string;
  ReadOnlyApiKey: string;
  HasWatermark: boolean;
  WatermarkHeight: number;
  WatermarkWidth: number;
  WatermarkPositionLeft: number;
  WatermarkPositionTop: number;
  EnabledResolutions: string;
  ViAiPublisherId?: string;
  CaptionsFontSize: number;
  CaptionsFontColor: string;
  CaptionsBackground: string;
  AllowEarlyPlay: boolean;
  PlayerTokenAuthenticationEnabled: boolean;
  AllowDirectPlay: boolean;
  EnableMP4Fallback: boolean;
  KeepOriginalFiles: boolean;
}

interface Video {
  guid: string;
  title: string;
  videoLibraryId: number;
  thumbnailCount: number;
  status: number; // 0=Created, 1=Uploaded, 2=Processing, 3=Finished, 4=Error, 5=Transcoding
  length: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailFileName: string;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: Chapter[];
  moments: Moment[];
  metaTags: MetaTag[];
  transcodingMessages: string[];
}

interface Chapter {
  title: string;
  start: number;
  end: number;
}

interface Moment {
  label: string;
  timestamp: number;
}

interface MetaTag {
  property: string;
  value: string;
}

interface UploadSession {
  guid: string;
  videoId: string;
  videoLibraryId: number;
  title: string;
  dateCreated: string;
  status: number;
  totalBytes: number;
  uploadedBytes: number;
  uploadUrl: string;
}

class BunnyStream {
  private apiKey: string;
  private libraryId: number;
  private baseUrl = 'https://video.bunnycdn.com';

  constructor(apiKey: string, libraryId: number) {
    this.apiKey = apiKey;
    this.libraryId = libraryId;
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
      const error = await response.text();
      throw new Error(`Stream API error: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  // Video Management
  async listVideos(page: number = 1, itemsPerPage: number = 100, search?: string): Promise<{
    items: Video[];
    currentPage: number;
    totalItems: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      itemsPerPage: itemsPerPage.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    return this.request(`/library/${this.libraryId}/videos?${params}`);
  }

  async getVideo(videoId: string): Promise<Video> {
    return this.request(`/library/${this.libraryId}/videos/${videoId}`);
  }

  async createVideo(title: string, collectionId?: string): Promise<Video> {
    return this.request(`/library/${this.libraryId}/videos`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        collectionId,
      }),
    });
  }

  async updateVideo(videoId: string, updates: {
    title?: string;
    collectionId?: string;
    chapters?: Chapter[];
    moments?: Moment[];
    metaTags?: MetaTag[];
  }): Promise<Video> {
    return this.request(`/library/${this.libraryId}/videos/${videoId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  async deleteVideo(videoId: string): Promise<void> {
    await this.request(`/library/${this.libraryId}/videos/${videoId}`, {
      method: 'DELETE',
    });
  }

  // Upload Methods
  async createUploadSession(videoId: string): Promise<UploadSession> {
    return this.request(`/library/${this.libraryId}/videos/${videoId}/upload`, {
      method: 'POST',
    });
  }

  async uploadVideoFile(videoId: string, file: File | Uint8Array): Promise<void> {
    // Create upload session
    const session = await this.createUploadSession(videoId);
    
    // Upload file to the provided URL
    const response = await fetch(session.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  }

  async uploadFromUrl(videoId: string, url: string, headers?: Record<string, string>): Promise<void> {
    await this.request(`/library/${this.libraryId}/videos/${videoId}/fetchByUrl`, {
      method: 'POST',
      body: JSON.stringify({
        url,
        headers,
      }),
    });
  }

  // Thumbnail Management
  async setThumbnail(videoId: string, thumbnailUrl: string): Promise<void> {
    await this.request(`/library/${this.libraryId}/videos/${videoId}/thumbnail`, {
      method: 'POST',
      body: JSON.stringify({ thumbnailUrl }),
    });
  }

  async generateThumbnail(videoId: string, timestamp: number): Promise<void> {
    await this.request(`/library/${this.libraryId}/videos/${videoId}/thumbnail`, {
      method: 'POST',
      body: JSON.stringify({ timestamp }),
    });
  }

  // Captions/Subtitles
  async addCaption(videoId: string, srclang: string, label: string, captionsFile: string): Promise<void> {
    await this.request(`/library/${this.libraryId}/videos/${videoId}/captions/${srclang}`, {
      method: 'POST',
      body: JSON.stringify({
        label,
        captionsFile,
      }),
    });
  }

  async deleteCaption(videoId: string, srclang: string): Promise<void> {
    await this.request(`/library/${this.libraryId}/videos/${videoId}/captions/${srclang}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getVideoStatistics(
    videoId?: string,
    dateFrom?: string,
    dateTo?: string,
    hourly?: boolean
  ): Promise<any> {
    const params = new URLSearchParams();
    if (videoId) params.append('videoGuid', videoId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (hourly) params.append('hourly', 'true');

    return this.request(`/library/${this.libraryId}/statistics?${params}`);
  }

  // Embed and Playback
  getEmbedUrl(videoId: string, options?: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    preload?: 'auto' | 'metadata' | 'none';
    responsive?: boolean;
  }): string {
    const params = new URLSearchParams();
    
    if (options?.autoplay) params.append('autoplay', 'true');
    if (options?.loop) params.append('loop', 'true');
    if (options?.muted) params.append('muted', 'true');
    if (options?.preload) params.append('preload', options.preload);
    if (options?.responsive) params.append('responsive', 'true');

    const queryString = params.toString();
    return `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}${queryString ? '?' + queryString : ''}`;
  }

  getPlaylistUrl(videoId: string): string {
    return `https://video.bunnycdn.com/play/${this.libraryId}/${videoId}`;
  }

  getThumbnailUrl(videoId: string, width?: number, height?: number): string {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());

    const queryString = params.toString();
    return `https://vz-${this.libraryId}.b-cdn.net/${videoId}/thumbnail.jpg${queryString ? '?' + queryString : ''}`;
  }
}

// Library Management
class BunnyStreamManagement {
  private apiKey: string;
  private baseUrl = 'https://video.bunnycdn.com';

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
      const error = await response.text();
      throw new Error(`Stream Management API error: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  async listLibraries(): Promise<VideoLibrary[]> {
    return this.request('/library');
  }

  async createLibrary(name: string, config?: {
    hasWatermark?: boolean;
    enabledResolutions?: string;
    allowDirectPlay?: boolean;
    enableMP4Fallback?: boolean;
    keepOriginalFiles?: boolean;
  }): Promise<VideoLibrary> {
    return this.request('/library', {
      method: 'POST',
      body: JSON.stringify({
        Name: name,
        HasWatermark: config?.hasWatermark || false,
        EnabledResolutions: config?.enabledResolutions || '240p,360p,480p,720p,1080p',
        AllowDirectPlay: config?.allowDirectPlay || true,
        EnableMP4Fallback: config?.enableMP4Fallback || true,
        KeepOriginalFiles: config?.keepOriginalFiles || false,
      }),
    });
  }

  async updateLibrary(libraryId: number, updates: Partial<VideoLibrary>): Promise<VideoLibrary> {
    return this.request(`/library/${libraryId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  async deleteLibrary(libraryId: number): Promise<void> {
    await this.request(`/library/${libraryId}`, { method: 'DELETE' });
  }

  async resetApiKey(libraryId: number): Promise<{ ApiKey: string }> {
    return this.request(`/library/${libraryId}/resetApiKey`, { method: 'POST' });
  }
}

// High-level streaming operations
export class BunnyStreamManager {
  private management: BunnyStreamManagement;
  private streams: Map<number, BunnyStream> = new Map();

  constructor(apiKey: string) {
    this.management = new BunnyStreamManagement(apiKey);
  }

  async getStream(libraryId: number, libraryApiKey?: string): Promise<BunnyStream> {
    if (!this.streams.has(libraryId)) {
      if (!libraryApiKey) {
        const libraries = await this.management.listLibraries();
        const library = libraries.find(l => l.Id === libraryId);
        if (!library) {
          throw new Error(`Library ${libraryId} not found`);
        }
        libraryApiKey = library.ApiKey;
      }
      
      this.streams.set(libraryId, new BunnyStream(libraryApiKey, libraryId));
    }
    
    return this.streams.get(libraryId)!;
  }

  // Complete video upload and processing workflow
  async uploadVideo(libraryId: number, config: {
    title: string;
    file?: File | Uint8Array;
    url?: string;
    collectionId?: string;
    thumbnail?: string;
    chapters?: Chapter[];
    captions?: Array<{ lang: string; label: string; file: string }>;
  }): Promise<Video> {
    const stream = await this.getStream(libraryId);
    
    // Create video
    const video = await stream.createVideo(config.title, config.collectionId);
    
    try {
      // Upload video file
      if (config.file) {
        await stream.uploadVideoFile(video.guid, config.file);
      } else if (config.url) {
        await stream.uploadFromUrl(video.guid, config.url);
      } else {
        throw new Error('Either file or url must be provided');
      }

      // Set thumbnail if provided
      if (config.thumbnail) {
        await stream.setThumbnail(video.guid, config.thumbnail);
      }

      // Add chapters if provided
      if (config.chapters) {
        await stream.updateVideo(video.guid, { chapters: config.chapters });
      }

      // Add captions if provided
      if (config.captions) {
        for (const caption of config.captions) {
          await stream.addCaption(video.guid, caption.lang, caption.label, caption.file);
        }
      }

      return video;

    } catch (error) {
      // Cleanup on failure
      await stream.deleteVideo(video.guid);
      throw error;
    }
  }

  // Setup video library with optimized settings
  async setupLibrary(name: string, options?: {
    enabledResolutions?: string[];
    hasWatermark?: boolean;
    keepOriginalFiles?: boolean;
  }): Promise<VideoLibrary> {
    const resolutions = options?.enabledResolutions || ['480p', '720p', '1080p'];
    
    return this.management.createLibrary(name, {
      enabledResolutions: resolutions.join(','),
      hasWatermark: options?.hasWatermark || false,
      allowDirectPlay: true,
      enableMP4Fallback: true,
      keepOriginalFiles: options?.keepOriginalFiles || false,
    });
  }
}

// Usage examples
export async function streamingExamples() {
  const manager = new BunnyStreamManager(process.env.BUNNY_API_KEY!);

  try {
    // Setup new video library
    const library = await manager.setupLibrary('my-video-content', {
      enabledResolutions: ['720p', '1080p'],
      keepOriginalFiles: true,
    });

    console.log('Created library:', library);

    // Upload video with complete metadata
    const video = await manager.uploadVideo(library.Id, {
      title: 'My Amazing Video',
      url: 'https://example.com/video.mp4',
      chapters: [
        { title: 'Introduction', start: 0, end: 30 },
        { title: 'Main Content', start: 30, end: 120 },
        { title: 'Conclusion', start: 120, end: 150 },
      ],
      captions: [
        { lang: 'en', label: 'English', file: 'https://example.com/captions-en.vtt' },
        { lang: 'es', label: 'Spanish', file: 'https://example.com/captions-es.vtt' },
      ],
    });

    console.log('Uploaded video:', video);

    // Get stream client for direct operations
    const stream = await manager.getStream(library.Id);
    
    // Generate embed URL
    const embedUrl = stream.getEmbedUrl(video.guid, {
      autoplay: false,
      responsive: true,
      preload: 'metadata',
    });
    
    console.log('Embed URL:', embedUrl);

    // Get thumbnail URL
    const thumbnailUrl = stream.getThumbnailUrl(video.guid, 640, 360);
    console.log('Thumbnail URL:', thumbnailUrl);

    // Get video statistics
    const stats = await stream.getVideoStatistics(video.guid);
    console.log('Video statistics:', stats);

  } catch (error) {
    console.error('Streaming operation failed:', error);
  }
}