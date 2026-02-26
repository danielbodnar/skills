// Chrome Gemini Nano - Multimodal Input Examples
// Experimental features for audio and image processing with Chrome AI

// Note: Multimodal features are experimental and may not be available in all versions
// Check official documentation for latest support status

// Image processing with Chrome AI (experimental)
class ImageAIProcessor {
  private session: any = null;
  
  async initialize(): Promise<void> {
    // Check if multimodal support is available
    const capabilities = await window.ai?.languageModel?.capabilities();
    
    if (!capabilities || capabilities.available !== 'readily') {
      throw new Error('AI not available for multimodal processing');
    }
    
    this.session = await window.ai.languageModel.create({
      temperature: 0.7,
      systemPrompt: 'You are an AI assistant that can analyze images and provide detailed descriptions.'
    });
  }
  
  async analyzeImage(imageData: Blob | File | ArrayBuffer): Promise<string> {
    if (!this.session) {
      await this.initialize();
    }
    
    try {
      // Convert image data to base64 for processing
      const base64Image = await this.convertToBase64(imageData);
      
      // Experimental: Send image data with prompt
      const response = await this.session.prompt(`
        Analyze this image and provide a detailed description. 
        Include objects, people, colors, composition, and any text visible.
        Image data: ${base64Image}
      `);
      
      return response;
    } catch (error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }
  
  async describeImageContent(imageElement: HTMLImageElement): Promise<string> {
    // Create canvas to extract image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    
    ctx.drawImage(imageElement, 0, 0);
    
    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image to blob'));
          return;
        }
        
        try {
          const description = await this.analyzeImage(blob);
          resolve(description);
        } catch (error) {
          reject(error);
        }
      }, 'image/jpeg', 0.8);
    });
  }
  
  async extractTextFromImage(imageData: Blob | File): Promise<string> {
    if (!this.session) {
      await this.initialize();
    }
    
    try {
      const base64Image = await this.convertToBase64(imageData);
      
      const response = await this.session.prompt(`
        Extract all visible text from this image. 
        Return only the text content, preserving the original formatting where possible.
        Image data: ${base64Image}
      `);
      
      return response;
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }
  
  async generateImageAltText(imageElement: HTMLImageElement): Promise<string> {
    try {
      const description = await this.describeImageContent(imageElement);
      
      const altText = await this.session.prompt(`
        Based on this image description, create a concise alt text for accessibility:
        "${description}"
        
        Guidelines:
        - Keep it under 150 characters
        - Focus on essential visual information
        - Be descriptive but concise
        - Avoid "image of" or "picture of"
      `);
      
      return altText.trim();
    } catch (error) {
      throw new Error(`Alt text generation failed: ${error.message}`);
    }
  }
  
  private async convertToBase64(data: Blob | File | ArrayBuffer): Promise<string> {
    if (data instanceof ArrayBuffer) {
      const blob = new Blob([data]);
      return await this.blobToBase64(blob);
    } else if (data instanceof Blob || data instanceof File) {
      return await this.blobToBase64(data);
    } else {
      throw new Error('Unsupported data type');
    }
  }
  
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  destroy(): void {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
  }
}

// Audio processing with Chrome AI (experimental)
class AudioAIProcessor {
  private session: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  async initialize(): Promise<void> {
    const capabilities = await window.ai?.languageModel?.capabilities();
    
    if (!capabilities || capabilities.available !== 'readily') {
      throw new Error('AI not available for audio processing');
    }
    
    this.session = await window.ai.languageModel.create({
      temperature: 0.5,
      systemPrompt: 'You are an AI assistant that can process audio content and provide transcriptions and analysis.'
    });
  }
  
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      console.log('Recording started');
    } catch (error) {
      throw new Error(`Recording start failed: ${error.message}`);
    }
  }
  
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Stop all audio tracks
        const tracks = this.mediaRecorder?.stream.getAudioTracks() || [];
        tracks.forEach(track => track.stop());
        
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!this.session) {
      await this.initialize();
    }
    
    try {
      // Convert audio to base64 for processing
      const base64Audio = await this.convertAudioToBase64(audioBlob);
      
      // Experimental: Send audio data with transcription request
      const response = await this.session.prompt(`
        Transcribe the following audio content to text.
        Preserve speaker intent and meaning.
        Audio data: ${base64Audio}
      `);
      
      return response;
    } catch (error) {
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
  }
  
  async analyzeAudioContent(audioBlob: Blob): Promise<{
    transcription: string;
    sentiment: string;
    summary: string;
    keyPoints: string[];
  }> {
    if (!this.session) {
      await this.initialize();
    }
    
    try {
      const transcription = await this.transcribeAudio(audioBlob);
      
      const analysis = await this.session.prompt(`
        Analyze this transcribed audio content:
        "${transcription}"
        
        Provide:
        1. Sentiment analysis (positive/neutral/negative)
        2. Brief summary (2-3 sentences)
        3. Key points (3-5 bullet points)
        
        Format as JSON with keys: sentiment, summary, keyPoints
      `);
      
      try {
        const parsed = JSON.parse(analysis);
        return {
          transcription,
          sentiment: parsed.sentiment || 'neutral',
          summary: parsed.summary || '',
          keyPoints: parsed.keyPoints || []
        };
      } catch {
        // Fallback if JSON parsing fails
        return {
          transcription,
          sentiment: 'neutral',
          summary: analysis,
          keyPoints: []
        };
      }
    } catch (error) {
      throw new Error(`Audio analysis failed: ${error.message}`);
    }
  }
  
  async generateAudioSummary(audioBlob: Blob): Promise<string> {
    const transcription = await this.transcribeAudio(audioBlob);
    
    const summary = await this.session.prompt(`
      Create a concise summary of this audio transcription:
      "${transcription}"
      
      Guidelines:
      - 2-3 sentences maximum
      - Capture main topics and key insights
      - Use clear, professional language
    `);
    
    return summary.trim();
  }
  
  private async convertAudioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:audio/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }
  
  destroy(): void {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }
}

// Multimodal UI components
class MultimodalAIInterface {
  private imageProcessor: ImageAIProcessor;
  private audioProcessor: AudioAIProcessor;
  private isRecording = false;
  
  constructor() {
    this.imageProcessor = new ImageAIProcessor();
    this.audioProcessor = new AudioAIProcessor();
  }
  
  async initialize(): Promise<void> {
    await Promise.all([
      this.imageProcessor.initialize(),
      this.audioProcessor.initialize()
    ]);
    
    this.setupImageDragDrop();
    this.setupAudioRecording();
    this.setupMultimodalControls();
  }
  
  private setupImageDragDrop(): void {
    const dropZone = document.createElement('div');
    dropZone.id = 'ai-image-drop-zone';
    dropZone.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 200px;
      height: 150px;
      border: 2px dashed #ccc;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9f9f9;
      cursor: pointer;
      z-index: 1000;
      font-family: system-ui;
      font-size: 14px;
      text-align: center;
    `;
    dropZone.textContent = '📷 Drop image here for AI analysis';
    
    // File input for click to upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await this.processImageFile(file);
      }
    });
    
    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = '#e3f2fd';
      dropZone.style.borderColor = '#2196f3';
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.backgroundColor = '#f9f9f9';
      dropZone.style.borderColor = '#ccc';
    });
    
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.style.backgroundColor = '#f9f9f9';
      dropZone.style.borderColor = '#ccc';
      
      const files = Array.from(e.dataTransfer?.files || []);
      const imageFile = files.find(file => file.type.startsWith('image/'));
      
      if (imageFile) {
        await this.processImageFile(imageFile);
      }
    });
    
    document.body.appendChild(dropZone);
    document.body.appendChild(fileInput);
  }
  
  private setupAudioRecording(): void {
    const recordButton = document.createElement('button');
    recordButton.id = 'ai-record-button';
    recordButton.style.cssText = `
      position: fixed;
      top: 200px;
      left: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background: #f44336;
      color: white;
      font-size: 24px;
      cursor: pointer;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    recordButton.textContent = '🎤';
    recordButton.title = 'Click to start/stop recording';
    
    recordButton.addEventListener('click', async () => {
      if (!this.isRecording) {
        await this.startRecording(recordButton);
      } else {
        await this.stopRecording(recordButton);
      }
    });
    
    document.body.appendChild(recordButton);
  }
  
  private setupMultimodalControls(): void {
    // Add context menu for images
    document.addEventListener('contextmenu', async (e) => {
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'IMG') {
        e.preventDefault();
        await this.showImageContextMenu(e, target as HTMLImageElement);
      }
    });
  }
  
  private async processImageFile(file: File): Promise<void> {
    try {
      const analysis = await this.imageProcessor.analyzeImage(file);
      const altText = await this.imageProcessor.extractTextFromImage(file);
      
      this.showImageAnalysisResults({
        filename: file.name,
        analysis,
        extractedText: altText
      });
    } catch (error) {
      console.error('Image processing failed:', error);
      alert('Image analysis failed. Please try again.');
    }
  }
  
  private async startRecording(button: HTMLButtonElement): Promise<void> {
    try {
      await this.audioProcessor.startRecording();
      this.isRecording = true;
      
      button.style.backgroundColor = '#4caf50';
      button.textContent = '⏹️';
      button.title = 'Click to stop recording';
    } catch (error) {
      console.error('Recording start failed:', error);
      alert('Recording failed. Please check microphone permissions.');
    }
  }
  
  private async stopRecording(button: HTMLButtonElement): Promise<void> {
    try {
      const audioBlob = await this.audioProcessor.stopRecording();
      this.isRecording = false;
      
      button.style.backgroundColor = '#f44336';
      button.textContent = '🎤';
      button.title = 'Click to start recording';
      
      const analysis = await this.audioProcessor.analyzeAudioContent(audioBlob);
      this.showAudioAnalysisResults(analysis);
    } catch (error) {
      console.error('Recording stop failed:', error);
      alert('Recording processing failed. Please try again.');
    }
  }
  
  private async showImageContextMenu(event: MouseEvent, img: HTMLImageElement): Promise<void> {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: absolute;
      left: ${event.pageX}px;
      top: ${event.pageY}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10001;
      min-width: 180px;
    `;
    
    const actions = [
      { label: '🔍 Analyze Image', action: () => this.analyzeImageElement(img) },
      { label: '📝 Generate Alt Text', action: () => this.generateAltText(img) },
      { label: '📄 Extract Text', action: () => this.extractImageText(img) }
    ];
    
    actions.forEach(({ label, action }) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 10px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 14px;
      `;
      
      button.addEventListener('click', async () => {
        menu.remove();
        await action();
      });
      
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#f5f5f5';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
      });
      
      menu.appendChild(button);
    });
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking elsewhere
    const removeMenu = (e: Event) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', removeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 100);
  }
  
  private async analyzeImageElement(img: HTMLImageElement): Promise<void> {
    try {
      const description = await this.imageProcessor.describeImageContent(img);
      this.showImageAnalysisResults({
        filename: img.src,
        analysis: description,
        extractedText: ''
      });
    } catch (error) {
      console.error('Image analysis failed:', error);
      alert('Image analysis failed. Please try again.');
    }
  }
  
  private async generateAltText(img: HTMLImageElement): Promise<void> {
    try {
      const altText = await this.imageProcessor.generateImageAltText(img);
      
      // Update the image's alt attribute
      img.alt = altText;
      
      // Show the generated alt text
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10002;
        max-width: 300px;
      `;
      notification.innerHTML = `
        <strong>Alt text generated:</strong><br>
        "${altText}"
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
    } catch (error) {
      console.error('Alt text generation failed:', error);
      alert('Alt text generation failed. Please try again.');
    }
  }
  
  private async extractImageText(img: HTMLImageElement): Promise<void> {
    try {
      // Convert image to blob for text extraction
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });
      
      const extractedText = await this.imageProcessor.extractTextFromImage(blob);
      
      this.showTextExtractionResults(extractedText);
    } catch (error) {
      console.error('Text extraction failed:', error);
      alert('Text extraction failed. Please try again.');
    }
  }
  
  private showImageAnalysisResults(results: {
    filename: string;
    analysis: string;
    extractedText: string;
  }): void {
    const modal = this.createModal('Image Analysis Results');
    modal.innerHTML = `
      <h3>📷 Image Analysis</h3>
      <p><strong>File:</strong> ${results.filename}</p>
      <div style="margin: 15px 0;">
        <strong>Description:</strong>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 5px;">
          ${results.analysis}
        </div>
      </div>
      ${results.extractedText ? `
        <div style="margin: 15px 0;">
          <strong>Extracted Text:</strong>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 5px;">
            ${results.extractedText}
          </div>
        </div>
      ` : ''}
      <button onclick="this.parentElement.remove()" 
              style="padding: 8px 15px; background: #4285f4; color: white; 
                     border: none; border-radius: 5px; cursor: pointer;">
        Close
      </button>
    `;
    
    document.body.appendChild(modal);
  }
  
  private showAudioAnalysisResults(results: {
    transcription: string;
    sentiment: string;
    summary: string;
    keyPoints: string[];
  }): void {
    const modal = this.createModal('Audio Analysis Results');
    modal.innerHTML = `
      <h3>🎤 Audio Analysis</h3>
      <div style="margin: 15px 0;">
        <strong>Transcription:</strong>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 5px;">
          ${results.transcription}
        </div>
      </div>
      <div style="margin: 15px 0;">
        <strong>Sentiment:</strong> <span style="color: ${
          results.sentiment === 'positive' ? '#4caf50' : 
          results.sentiment === 'negative' ? '#f44336' : '#ff9800'
        };">${results.sentiment}</span>
      </div>
      <div style="margin: 15px 0;">
        <strong>Summary:</strong>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 5px;">
          ${results.summary}
        </div>
      </div>
      ${results.keyPoints.length > 0 ? `
        <div style="margin: 15px 0;">
          <strong>Key Points:</strong>
          <ul style="margin-top: 5px;">
            ${results.keyPoints.map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <button onclick="this.parentElement.remove()" 
              style="padding: 8px 15px; background: #4285f4; color: white; 
                     border: none; border-radius: 5px; cursor: pointer;">
        Close
      </button>
    `;
    
    document.body.appendChild(modal);
  }
  
  private showTextExtractionResults(text: string): void {
    const modal = this.createModal('Extracted Text');
    modal.innerHTML = `
      <h3>📄 Extracted Text</h3>
      <div style="margin: 15px 0;">
        <textarea style="width: 100%; height: 200px; padding: 10px; 
                         border: 1px solid #ccc; border-radius: 5px; resize: vertical;"
                  readonly>${text}</textarea>
      </div>
      <div style="margin: 15px 0;">
        <button onclick="navigator.clipboard.writeText('${text.replace(/'/g, "\\'")}'); 
                         this.textContent='Copied!'; setTimeout(() => this.textContent='Copy to Clipboard', 2000);"
                style="padding: 8px 15px; background: #4caf50; color: white; 
                       border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
          Copy to Clipboard
        </button>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="padding: 8px 15px; background: #4285f4; color: white; 
                       border: none; border-radius: 5px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  private createModal(title: string): HTMLElement {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-height: 500px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      z-index: 10003;
      padding: 20px;
      overflow-y: auto;
      font-family: system-ui;
    `;
    
    return modal;
  }
  
  destroy(): void {
    this.imageProcessor.destroy();
    this.audioProcessor.destroy();
    
    // Clean up UI elements
    document.getElementById('ai-image-drop-zone')?.remove();
    document.getElementById('ai-record-button')?.remove();
  }
}

// Initialize multimodal interface
async function initializeMultimodalAI(): Promise<void> {
  try {
    const multimodalInterface = new MultimodalAIInterface();
    await multimodalInterface.initialize();
    console.log('Multimodal AI interface initialized');
  } catch (error) {
    console.error('Multimodal AI initialization failed:', error);
    console.log('Falling back to text-only AI features');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMultimodalAI);
} else {
  initializeMultimodalAI();
}

export {
  ImageAIProcessor,
  AudioAIProcessor,
  MultimodalAIInterface,
  initializeMultimodalAI
};