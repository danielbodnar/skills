/**
 * OpenRouter Structured Outputs Examples
 * 
 * This file demonstrates how to use JSON Schema to enforce structured
 * outputs from AI models through OpenRouter's API.
 */

import OpenAI from 'openai';

// Client setup
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Basic JSON object extraction
export const extractPersonData = async (text: string) => {
  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'user', content: `Extract person information from this text: ${text}` }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'person_extraction',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Full name of the person'
            },
            age: {
              type: 'number',
              description: 'Age in years'
            },
            occupation: {
              type: 'string',
              description: 'Job title or profession'
            },
            location: {
              type: 'string',
              description: 'City or location'
            },
            email: {
              type: 'string',
              pattern: '^[^@]+@[^@]+\\.[^@]+$',
              description: 'Email address if mentioned'
            }
          },
          required: ['name'],
          additionalProperties: false
        }
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  return content ? JSON.parse(content) : null;
};

// Complex nested structure
export const analyzeDocument = async (document: string) => {
  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'user', content: `Analyze this document and extract key information: ${document}` }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'document_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            key_points: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 10
            },
            entities: {
              type: 'object',
              properties: {
                people: {
                  type: 'array',
                  items: { type: 'string' }
                },
                organizations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                locations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                dates: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              additionalProperties: false
            },
            sentiment: {
              type: 'string',
              enum: ['positive', 'negative', 'neutral']
            },
            confidence_score: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence in the analysis from 0 to 1'
            },
            metadata: {
              type: 'object',
              properties: {
                word_count: { type: 'number' },
                estimated_reading_time: { type: 'number' },
                complexity_level: {
                  type: 'string',
                  enum: ['simple', 'moderate', 'complex']
                }
              },
              additionalProperties: false
            }
          },
          required: ['title', 'summary', 'key_points', 'sentiment'],
          additionalProperties: false
        }
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  return content ? JSON.parse(content) : null;
};

// Product recommendation system
export const generateProductRecommendations = async (userPreferences: string) => {
  const completion = await client.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { 
        role: 'system', 
        content: 'You are a product recommendation expert. Analyze user preferences and suggest relevant products.' 
      },
      { role: 'user', content: userPreferences }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'product_recommendations',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_name: { type: 'string' },
                  category: { type: 'string' },
                  price_range: {
                    type: 'object',
                    properties: {
                      min: { type: 'number' },
                      max: { type: 'number' },
                      currency: { type: 'string', default: 'USD' }
                    },
                    required: ['min', 'max'],
                    additionalProperties: false
                  },
                  features: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  match_score: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100
                  },
                  reasoning: { type: 'string' }
                },
                required: ['product_name', 'category', 'match_score', 'reasoning'],
                additionalProperties: false
              },
              minItems: 3,
              maxItems: 10
            },
            user_profile: {
              type: 'object',
              properties: {
                interests: {
                  type: 'array',
                  items: { type: 'string' }
                },
                budget_category: {
                  type: 'string',
                  enum: ['budget', 'mid-range', 'premium', 'luxury']
                },
                priority_factors: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['price', 'quality', 'brand', 'features', 'reviews']
                  }
                }
              },
              additionalProperties: false
            }
          },
          required: ['recommendations', 'user_profile'],
          additionalProperties: false
        }
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  return content ? JSON.parse(content) : null;
};

// Code analysis and suggestions
export const analyzeCode = async (code: string, language: string) => {
  const completion = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { 
        role: 'system', 
        content: 'You are a code analysis expert. Analyze the provided code for quality, bugs, and improvements.' 
      },
      { role: 'user', content: `Analyze this ${language} code:\n\n${code}` }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'code_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            overall_quality: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'poor']
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['bug', 'performance', 'style', 'security', 'maintainability']
                  },
                  severity: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low']
                  },
                  description: { type: 'string' },
                  line_number: { type: 'number' },
                  suggested_fix: { type: 'string' }
                },
                required: ['type', 'severity', 'description'],
                additionalProperties: false
              }
            },
            strengths: {
              type: 'array',
              items: { type: 'string' }
            },
            improvements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  suggestion: { type: 'string' },
                  impact: {
                    type: 'string',
                    enum: ['high', 'medium', 'low']
                  }
                },
                required: ['category', 'suggestion', 'impact'],
                additionalProperties: false
              }
            },
            complexity_score: {
              type: 'number',
              minimum: 1,
              maximum: 10,
              description: 'Code complexity from 1 (simple) to 10 (very complex)'
            }
          },
          required: ['overall_quality', 'issues', 'complexity_score'],
          additionalProperties: false
        }
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  return content ? JSON.parse(content) : null;
};

// Weather data extraction with validation
export const extractWeatherInfo = async (weatherText: string) => {
  const completion = await client.chat.completions.create({
    model: 'google/gemini-pro',
    messages: [
      { role: 'user', content: `Extract weather information from: ${weatherText}` }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'weather_extraction',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            location: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                country: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', minimum: -90, maximum: 90 },
                    longitude: { type: 'number', minimum: -180, maximum: 180 }
                  },
                  additionalProperties: false
                }
              },
              required: ['city'],
              additionalProperties: false
            },
            current_conditions: {
              type: 'object',
              properties: {
                temperature: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string', enum: ['C', 'F'] }
                  },
                  required: ['value', 'unit'],
                  additionalProperties: false
                },
                humidity: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100
                },
                wind_speed: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', minimum: 0 },
                    unit: { type: 'string', enum: ['mph', 'kmh', 'm/s'] }
                  },
                  additionalProperties: false
                },
                condition: { type: 'string' },
                visibility: { type: 'string' }
              },
              additionalProperties: false
            },
            forecast: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  high_temp: { type: 'number' },
                  low_temp: { type: 'number' },
                  condition: { type: 'string' },
                  precipitation_chance: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100
                  }
                },
                required: ['date', 'condition'],
                additionalProperties: false
              }
            }
          },
          required: ['location'],
          additionalProperties: false
        }
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  return content ? JSON.parse(content) : null;
};

// Multi-model structured output comparison
export const compareStructuredOutputs = async (prompt: string, schema: any) => {
  const models = [
    'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-pro'
  ];

  const results = await Promise.allSettled(
    models.map(async (model) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: {
            type: 'json_schema',
            json_schema: schema
          }
        });

        const content = completion.choices[0]?.message?.content;
        return {
          model,
          result: content ? JSON.parse(content) : null,
          success: true
        };
      } catch (error: any) {
        return {
          model,
          error: error.message,
          success: false
        };
      }
    })
  );

  return results.map((result, index) => ({
    model: models[index],
    ...(result.status === 'fulfilled' ? result.value : { error: result.reason, success: false })
  }));
};

// Example usage
export const runStructuredOutputExamples = async () => {
  try {
    console.log('Person extraction example:');
    const personData = await extractPersonData(
      'John Smith is a 35-year-old software engineer living in San Francisco. You can reach him at john.smith@email.com'
    );
    console.log(JSON.stringify(personData, null, 2));

    console.log('\nDocument analysis example:');
    const docAnalysis = await analyzeDocument(
      'Climate change is one of the most pressing issues of our time. Scientists worldwide agree that immediate action is needed to reduce carbon emissions and transition to renewable energy sources.'
    );
    console.log(JSON.stringify(docAnalysis, null, 2));

    console.log('\nCode analysis example:');
    const codeAnalysis = await analyzeCode(`
      function add(a, b) {
        return a + b;
      }
      
      var result = add(1, "2");
      console.log(result);
    `, 'javascript');
    console.log(JSON.stringify(codeAnalysis, null, 2));

  } catch (error) {
    console.error('Error running structured output examples:', error);
  }
};