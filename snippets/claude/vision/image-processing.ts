// Claude Vision API Examples

import { Anthropic } from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 1. Basic Image Analysis
export async function analyzeImage(imagePath: string) {
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'What do you see in this image? Provide a detailed description.'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg', // or 'image/png', 'image/gif', 'image/webp'
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 2. Code Screenshot Analysis
export async function analyzeCodeScreenshot(imagePath: string) {
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this code screenshot and provide:
1. What programming language is being used
2. What the code does
3. Any potential bugs or improvements
4. Rewrite the code with improvements`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 3. UI/UX Design Analysis
export async function analyzeUIDesign(imagePath: string) {
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this UI design and provide:
1. Overall design assessment
2. Usability considerations
3. Accessibility improvements
4. Suggestions for better user experience
5. Technical implementation recommendations`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 4. Diagram to Code Conversion
export async function diagramToCode(imagePath: string, targetLanguage: string = 'typescript') {
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Convert this diagram/flowchart into ${targetLanguage} code:
1. Analyze the diagram structure
2. Identify components and their relationships
3. Generate clean, well-structured code
4. Include proper error handling and types
5. Add comments explaining the logic`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 5. Multiple Image Comparison
export async function compareImages(imagePath1: string, imagePath2: string) {
  const image1Data = readFileSync(imagePath1);
  const image2Data = readFileSync(imagePath2);
  const base64Image1 = image1Data.toString('base64');
  const base64Image2 = image2Data.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Compare these two images and provide:
1. Key differences between them
2. Similarities
3. Which one is better and why
4. Specific recommendations for improvement`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image1
            }
          },
          {
            type: 'text',
            text: 'versus'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image2
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 6. Chart/Graph Data Extraction
export async function extractChartData(imagePath: string) {
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract data from this chart/graph and provide:
1. Type of chart (bar, line, pie, etc.)
2. Data points and values
3. Trends and insights
4. JSON format of the data
5. Suggestions for data visualization improvements`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 7. Error Screenshot Debugging
export async function debugErrorScreenshot(imagePath: string) {
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this error screenshot and provide:
1. What the error means
2. Likely causes of the error
3. Step-by-step debugging approach
4. Code fixes or solutions
5. Prevention strategies for similar errors`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 8. Document OCR and Processing
export async function processDocument(imagePath: string) {
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract and process text from this document:
1. Extract all readable text
2. Identify document structure (headers, sections, lists)
3. Format as clean markdown
4. Summarize key information
5. Note any important details or action items`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

// 9. Vision Helper Functions
export class VisionHelper {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Get image media type from file extension
  private getMediaType(filePath: string): string {
    const extension = filePath.toLowerCase().split('.').pop();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
  }

  // Process image from URL
  async processImageFromUrl(imageUrl: string, prompt: string) {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    
    const mediaType = this.getMediaType(imageUrl);
    
    return await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as any,
                data: base64Image
              }
            }
          ]
        }
      ]
    });
  }

  // Batch process multiple images
  async batchProcessImages(imagePaths: string[], prompt: string) {
    const results = await Promise.allSettled(
      imagePaths.map(async (imagePath) => {
        const imageData = readFileSync(imagePath);
        const base64Image = imageData.toString('base64');
        const mediaType = this.getMediaType(imagePath);
        
        return await this.anthropic.messages.create({
          model: 'claude-3-haiku-20240307', // Use faster model for batch
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType as any,
                    data: base64Image
                  }
                }
              ]
            }
          ]
        });
      })
    );

    return results.map((result, index) => ({
      imagePath: imagePaths[index],
      success: result.status === 'fulfilled',
      content: result.status === 'fulfilled' ? result.value.content[0].text : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  // Streaming vision analysis
  async streamingVisionAnalysis(imagePath: string, prompt: string) {
    const imageData = readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mediaType = this.getMediaType(imagePath);
    
    const stream = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      stream: true,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as any,
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        const text = chunk.delta.text;
        fullResponse += text;
        process.stdout.write(text);
      }
    }

    return fullResponse;
  }
}

// 10. Specialized Analysis Functions
export async function analyzeArchitectureDiagram(imagePath: string) {
  return await diagramToCode(imagePath, 'typescript');
}

export async function analyzeAPIDocumentation(imagePath: string) {
  const helper = new VisionHelper();
  return await helper.processImageFromUrl(imagePath, `
    Analyze this API documentation and provide:
    1. Available endpoints and their methods
    2. Request/response formats
    3. Authentication requirements
    4. Rate limiting information
    5. Generate TypeScript client code for these APIs
  `);
}

export async function analyzeTestResults(imagePath: string) {
  const helper = new VisionHelper();
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze these test results and provide:
1. Summary of test status (passed/failed)
2. Identify failing tests and reasons
3. Suggestions for fixing failures
4. Code coverage analysis if visible
5. Recommendations for additional tests`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  return response.content[0].text;
}

export {
  analyzeImage,
  analyzeCodeScreenshot,
  analyzeUIDesign,
  diagramToCode,
  compareImages,
  extractChartData,
  debugErrorScreenshot,
  processDocument,
  VisionHelper,
  analyzeArchitectureDiagram,
  analyzeAPIDocumentation,
  analyzeTestResults
};