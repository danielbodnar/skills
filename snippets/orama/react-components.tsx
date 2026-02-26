// Orama React Components Examples
// Complete guide to using Orama UI components in React applications

import React, { useState, useEffect } from 'react'
import { 
  OramaSearchBox, 
  OramaChatBox, 
  OramaSearchButton,
  OramaCloud 
} from '@orama/react-components'
import { useSearch } from '@oramacloud/react-client'

// Basic Search Box Component
function BasicSearchBox() {
  return (
    <OramaSearchBox
      placeholder="Search documentation..."
      index={{
        endpoint: process.env.REACT_APP_ORAMA_ENDPOINT!,
        api_key: process.env.REACT_APP_ORAMA_API_KEY!
      }}
      resultMap={{
        title: 'title',
        description: 'content', 
        section: 'category'
      }}
      facetProperty="category"
      searchParams={{
        limit: 10,
        threshold: 0.7,
        boost: {
          title: 2,
          content: 1
        }
      }}
      themeConfig={{
        colors: {
          light: {
            '--background-color-primary': '#ffffff',
            '--text-color-primary': '#333333'
          },
          dark: {
            '--background-color-primary': '#1a1a1a', 
            '--text-color-primary': '#ffffff'
          }
        }
      }}
    />
  )
}

// Advanced Search Box with Custom Styling
function AdvancedSearchBox() {
  return (
    <OramaSearchBox
      placeholder="What can I help you find?"
      index={{
        endpoint: process.env.REACT_APP_ORAMA_ENDPOINT!,
        api_key: process.env.REACT_APP_ORAMA_API_KEY!
      }}
      resultMap={{
        title: 'name',
        description: 'description',
        section: 'category',
        path: 'url'
      }}
      sourceBaseUrl="https://example.com"
      searchParams={{
        mode: 'hybrid',
        limit: 15,
        where: {
          published: true
        },
        facets: {
          category: { limit: 5 },
          tags: { limit: 10 },
          publishDate: {
            ranges: [
              { from: '2024-01-01', to: '2024-06-30' },
              { from: '2024-07-01', to: '2024-12-31' }
            ]
          }
        }
      }}
      colorScheme="auto" // light, dark, or auto
      size="large"
      layout="modal" // inline or modal
      linksTarget="_blank"
    />
  )
}

// Chat Box Component for Conversational Search
function ConversationalChatBox() {
  return (
    <OramaChatBox
      index={{
        endpoint: process.env.REACT_APP_ORAMA_ENDPOINT!,
        api_key: process.env.REACT_APP_ORAMA_API_KEY!
      }}
      sourceBaseUrl="https://docs.example.com"
      sourcesMap={{
        title: 'title',
        description: 'excerpt',
        path: 'slug'
      }}
      suggestions={[
        'How do I get started?',
        'What are the main features?',
        'Can you show me examples?',
        'How do I integrate this?'
      ]}
      placeholder="Ask me anything about our documentation..."
      userContext="The user is a developer looking for implementation guidance"
      inferenceType="documentation"
      themeConfig={{
        colors: {
          light: {
            '--chat-bubble-user-bg': '#007bff',
            '--chat-bubble-assistant-bg': '#f8f9fa'
          }
        }
      }}
    />
  )
}

// Search Button Component
function CustomSearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <OramaSearchButton
        size="medium"
        colorScheme="light"
        onClick={() => setIsSearchOpen(true)}
        themeConfig={{
          colors: {
            light: {
              '--button-background': '#4f46e5',
              '--button-text': '#ffffff'
            }
          }
        }}
      >
        🔍 Search docs
      </OramaSearchButton>

      {isSearchOpen && (
        <div className="search-modal-overlay">
          <div className="search-modal">
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="close-button"
            >
              ×
            </button>
            <OramaSearchBox
              placeholder="Search..."
              index={{
                endpoint: process.env.REACT_APP_ORAMA_ENDPOINT!,
                api_key: process.env.REACT_APP_ORAMA_API_KEY!
              }}
              resultMap={{
                title: 'title',
                description: 'content'
              }}
              onResults={(results) => {
                console.log('Search results:', results)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

// Using React SDK Hooks
function SearchWithHooks() {
  const { 
    search, 
    results, 
    loading, 
    error,
    facets,
    count
  } = useSearch({
    endpoint: process.env.REACT_APP_ORAMA_ENDPOINT!,
    api_key: process.env.REACT_APP_ORAMA_API_KEY!
  })

  const [query, setQuery] = useState('')
  const [selectedFacets, setSelectedFacets] = useState<Record<string, any>>({})

  useEffect(() => {
    if (query.trim()) {
      search({
        term: query,
        mode: 'hybrid',
        where: selectedFacets,
        facets: {
          category: {},
          tags: { limit: 10 },
          publishDate: {}
        }
      })
    }
  }, [query, selectedFacets, search])

  const handleFacetChange = (facet: string, value: any, checked: boolean) => {
    setSelectedFacets(prev => ({
      ...prev,
      [facet]: checked ? value : undefined
    }))
  }

  return (
    <div className="search-interface">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your search query..."
        />
      </div>

      <div className="search-content">
        <div className="facets-sidebar">
          <h3>Filters</h3>
          {facets && Object.entries(facets).map(([facetName, facetValues]) => (
            <div key={facetName} className="facet-group">
              <h4>{facetName}</h4>
              {Array.isArray(facetValues.values) && facetValues.values.map((value: any) => (
                <label key={value.value}>
                  <input
                    type="checkbox"
                    onChange={(e) => handleFacetChange(facetName, value.value, e.target.checked)}
                  />
                  {value.value} ({value.count})
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="search-results">
          {loading && <div>Searching...</div>}
          {error && <div>Error: {error.message}</div>}
          
          {results && (
            <>
              <div className="results-info">
                Found {count} results
              </div>
              
              {results.map((hit, index) => (
                <div key={hit.id || index} className="search-result">
                  <h3>{hit.document.title}</h3>
                  <p>{hit.document.description || hit.document.content}</p>
                  <div className="result-meta">
                    Score: {hit.score.toFixed(3)} | 
                    Category: {hit.document.category}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Complete App with Orama Cloud Provider
function OramaApp() {
  return (
    <OramaCloud 
      endpoint={process.env.REACT_APP_ORAMA_ENDPOINT!}
      apiKey={process.env.REACT_APP_ORAMA_API_KEY!}
    >
      <div className="app">
        <header className="app-header">
          <h1>My Documentation Site</h1>
          <CustomSearchButton />
        </header>

        <main className="main-content">
          <section className="search-section">
            <h2>Search Our Documentation</h2>
            <BasicSearchBox />
          </section>

          <section className="advanced-search-section">
            <h2>Advanced Search</h2>
            <SearchWithHooks />
          </section>

          <section className="chat-section">
            <h2>Ask Questions</h2>
            <ConversationalChatBox />
          </section>
        </main>
      </div>
    </OramaCloud>
  )
}

// Custom Theme Configuration
const customTheme = {
  colors: {
    light: {
      '--primary-color': '#3b82f6',
      '--background-color-primary': '#ffffff',
      '--background-color-secondary': '#f8fafc',
      '--text-color-primary': '#1e293b',
      '--text-color-secondary': '#64748b',
      '--border-color-primary': '#e2e8f0',
      '--shadow-color': 'rgba(0, 0, 0, 0.1)'
    },
    dark: {
      '--primary-color': '#60a5fa',
      '--background-color-primary': '#0f172a',
      '--background-color-secondary': '#1e293b',
      '--text-color-primary': '#f1f5f9',
      '--text-color-secondary': '#94a3b8',
      '--border-color-primary': '#334155',
      '--shadow-color': 'rgba(0, 0, 0, 0.3)'
    }
  },
  typography: {
    '--font-family': 'Inter, system-ui, sans-serif',
    '--font-size-base': '16px',
    '--font-weight-normal': '400',
    '--font-weight-bold': '600'
  },
  spacing: {
    '--spacing-xs': '4px',
    '--spacing-sm': '8px', 
    '--spacing-md': '16px',
    '--spacing-lg': '24px',
    '--spacing-xl': '32px'
  }
}

// Themed Search Component
function ThemedSearchBox() {
  return (
    <OramaSearchBox
      placeholder="Search with custom theme..."
      index={{
        endpoint: process.env.REACT_APP_ORAMA_ENDPOINT!,
        api_key: process.env.REACT_APP_ORAMA_API_KEY!
      }}
      resultMap={{
        title: 'title',
        description: 'content'
      }}
      themeConfig={customTheme}
      colorScheme="auto"
    />
  )
}

export {
  BasicSearchBox,
  AdvancedSearchBox,
  ConversationalChatBox,
  CustomSearchButton,
  SearchWithHooks,
  OramaApp,
  ThemedSearchBox,
  customTheme
}

export default OramaApp