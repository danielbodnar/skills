// Orama Geosearch Examples
// Complete guide to location-based search capabilities

import { create, insert, search, insertMultiple } from '@orama/orama'

// Create database with geopoint schema
const locationDB = create({
  schema: {
    id: 'string',
    name: 'string',
    description: 'string',
    category: 'string',
    location: 'geopoint',
    address: 'string',
    rating: 'number',
    priceRange: 'string',
    openHours: 'string',
    amenities: 'string[]',
    contact: {
      phone: 'string',
      email: 'string',
      website: 'string'
    }
  }
})

// Sample location data
const locations = [
  {
    id: '1',
    name: 'Central Park Coffee',
    description: 'Cozy coffee shop with outdoor seating and artisanal beverages',
    category: 'cafe',
    location: {
      lat: 40.7829,  // Near Central Park, NYC
      lon: -73.9654
    },
    address: '123 Park Ave, New York, NY 10001',
    rating: 4.5,
    priceRange: '$$',
    openHours: '6:00 AM - 10:00 PM',
    amenities: ['wifi', 'outdoor-seating', 'pet-friendly'],
    contact: {
      phone: '+1-555-123-4567',
      email: 'info@centralparkoffee.com',
      website: 'https://centralparkoffee.com'
    }
  },
  {
    id: '2',
    name: 'Times Square Deli',
    description: 'Classic New York deli serving fresh sandwiches and salads',
    category: 'restaurant',
    location: {
      lat: 40.7580,  // Times Square, NYC
      lon: -73.9855
    },
    address: '456 Broadway, New York, NY 10036',
    rating: 4.2,
    priceRange: '$',
    openHours: '7:00 AM - 11:00 PM',
    amenities: ['takeout', 'delivery', 'catering'],
    contact: {
      phone: '+1-555-987-6543',
      email: 'orders@timessquaredeli.com',
      website: 'https://timessquaredeli.com'
    }
  },
  {
    id: '3',
    name: 'Brooklyn Brewery Tour',
    description: 'Craft brewery offering tours and tastings of local beers',
    category: 'entertainment',
    location: {
      lat: 40.7218,  // Brooklyn, NY
      lon: -73.9570
    },
    address: '789 Brooklyn St, Brooklyn, NY 11201',
    rating: 4.7,
    priceRange: '$$$',
    openHours: '12:00 PM - 10:00 PM',
    amenities: ['tours', 'tastings', 'gift-shop', 'group-events'],
    contact: {
      phone: '+1-555-456-7890',
      email: 'tours@brooklynbrewery.com',
      website: 'https://brooklynbrewery.com'
    }
  },
  {
    id: '4',
    name: 'Hudson River Park',
    description: 'Scenic waterfront park with walking trails and recreation areas',
    category: 'park',
    location: {
      lat: 40.7359,  // Hudson River Park, NYC
      lon: -74.0087
    },
    address: 'Hudson River Park, New York, NY 10014',
    rating: 4.6,
    priceRange: 'Free',
    openHours: '6:00 AM - 1:00 AM',
    amenities: ['walking-trails', 'bike-paths', 'playground', 'dog-run'],
    contact: {
      phone: '+1-555-HUDSON',
      email: 'info@hudsonriverpark.org',
      website: 'https://hudsonriverpark.org'
    }
  },
  {
    id: '5',
    name: 'SoHo Art Gallery',
    description: 'Contemporary art gallery featuring emerging and established artists',
    category: 'culture',
    location: {
      lat: 40.7230,  // SoHo, NYC
      lon: -74.0020
    },
    address: '321 Spring St, New York, NY 10013',
    rating: 4.4,
    priceRange: 'Free',
    openHours: '10:00 AM - 8:00 PM',
    amenities: ['exhibitions', 'artist-talks', 'private-events'],
    contact: {
      phone: '+1-555-ART-SOHO',
      email: 'gallery@sohoart.com',
      website: 'https://sohoartgallery.com'
    }
  }
]

// Insert location data
insertMultiple(locationDB, locations)

// Basic radius search around Central Park
const nearCentralPark = search(locationDB, {
  term: '*', // Match all documents
  where: {
    location: {
      radius: {
        coordinates: {
          lat: 40.7829, // Central Park coordinates
          lon: -73.9654
        },
        unit: 'km',
        value: 2 // 2 kilometer radius
      }
    }
  },
  sortBy: [
    { property: 'rating', order: 'DESC' }
  ]
})

console.log('Near Central Park (2km radius):', nearCentralPark.hits.length, 'locations')

// Search by category within radius
const cafesNearby = search(locationDB, {
  term: 'coffee cafe',
  where: {
    category: 'cafe',
    location: {
      radius: {
        coordinates: {
          lat: 40.7580, // Times Square
          lon: -73.9855
        },
        unit: 'mi', // Miles instead of kilometers
        value: 5
      }
    }
  }
})

console.log('Cafes within 5 miles of Times Square:', cafesNearby.hits.length)

// Polygon search - find locations within Manhattan bounds
const manhattanBounds = [
  { lat: 40.8176, lon: -73.9442 }, // Upper East Side
  { lat: 40.8176, lon: -74.0059 }, // Upper West Side  
  { lat: 40.7047, lon: -74.0159 }, // Lower West Side
  { lat: 40.7047, lon: -73.9734 }, // Lower East Side
  { lat: 40.8176, lon: -73.9442 }  // Close the polygon
]

const inManhattan = search(locationDB, {
  term: '*',
  where: {
    location: {
      polygon: {
        coordinates: manhattanBounds
      }
    }
  },
  facets: {
    category: {},
    priceRange: {}
  }
})

console.log('Locations in Manhattan polygon:', inManhattan.hits.length)
console.log('Manhattan facets:', inManhattan.facets)

// Advanced geosearch with multiple filters
const restaurantsWithDelivery = search(locationDB, {
  term: 'food restaurant dining',
  where: {
    category: {
      in: ['restaurant', 'cafe']
    },
    rating: {
      gte: 4.0
    },
    amenities: {
      contains: 'delivery'
    },
    location: {
      radius: {
        coordinates: {
          lat: 40.7128, // NYC center
          lon: -74.0060
        },
        unit: 'km',
        value: 10
      }
    }
  },
  sortBy: [
    { property: 'rating', order: 'DESC' },
    { property: 'priceRange', order: 'ASC' }
  ],
  limit: 10
})

console.log('High-rated restaurants with delivery:', restaurantsWithDelivery.hits.length)

// Distance-based sorting (custom implementation)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Search and sort by distance manually
function searchByDistance(userLat: number, userLon: number, maxDistance: number = 5) {
  const allResults = search(locationDB, {
    term: '*',
    limit: 100 // Get all results
  })

  // Calculate distances and filter
  const withDistances = allResults.hits
    .map(hit => ({
      ...hit,
      distance: calculateDistance(userLat, userLon, hit.document.location.lat, hit.document.location.lon)
    }))
    .filter(hit => hit.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)

  return withDistances
}

// Find nearby locations with custom distance sorting
const userLocation = { lat: 40.7580, lon: -73.9855 } // Times Square
const nearbyLocations = searchByDistance(userLocation.lat, userLocation.lon, 3)

console.log('Nearby locations with distances:')
nearbyLocations.forEach(location => {
  console.log(`${location.document.name}: ${location.distance.toFixed(2)}km away`)
})

// Geosearch with faceted navigation
const geoFacetedSearch = search(locationDB, {
  term: 'entertainment culture',
  where: {
    location: {
      radius: {
        coordinates: { lat: 40.7128, lon: -74.0060 },
        unit: 'mi',
        value: 8
      }
    }
  },
  facets: {
    category: { limit: 10 },
    priceRange: {},
    rating: {
      ranges: [
        { from: 0, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 4.5 },
        { from: 4.5, to: 5 }
      ]
    }
  },
  groupBy: {
    properties: ['category'],
    maxResult: 2
  }
})

console.log('Entertainment venues with facets:', geoFacetedSearch.facets)

// Bounding box search alternative to polygon
function searchInBoundingBox(
  northLat: number, 
  southLat: number, 
  eastLon: number, 
  westLon: number
) {
  return search(locationDB, {
    term: '*',
    where: {
      'location.lat': {
        gte: southLat,
        lte: northLat
      },
      'location.lon': {
        gte: westLon,
        lte: eastLon
      }
    }
  })
}

// Search within Manhattan bounding box
const manhattanBox = searchInBoundingBox(
  40.8176, // North (Upper Manhattan)
  40.7047, // South (Lower Manhattan)
  -73.9734, // East
  -74.0159  // West
)

console.log('Manhattan bounding box search:', manhattanBox.hits.length, 'locations')

// Multi-radius search for finding locations at different distances
function multiRadiusSearch(centerLat: number, centerLon: number) {
  const radii = [1, 3, 5, 10] // kilometers
  const results: Record<string, any> = {}

  radii.forEach(radius => {
    const searchResults = search(locationDB, {
      term: '*',
      where: {
        location: {
          radius: {
            coordinates: { lat: centerLat, lon: centerLon },
            unit: 'km',
            value: radius
          }
        }
      },
      facets: {
        category: {}
      }
    })

    results[`${radius}km`] = {
      count: searchResults.count,
      categories: searchResults.facets?.category
    }
  })

  return results
}

// Get location distribution at different distances
const distributionFromTimesSquare = multiRadiusSearch(40.7580, -73.9855)
console.log('Location distribution from Times Square:', distributionFromTimesSquare)

export {
  locationDB,
  locations,
  nearCentralPark,
  cafesNearby,
  inManhattan,
  restaurantsWithDelivery,
  calculateDistance,
  searchByDistance,
  searchInBoundingBox,
  multiRadiusSearch
}

// Example of real-world geosearch application
export function findNearbyServices(
  userLat: number,
  userLon: number,
  serviceType: string,
  maxDistance: number = 5,
  maxResults: number = 10
) {
  return search(locationDB, {
    term: serviceType,
    where: {
      location: {
        radius: {
          coordinates: { lat: userLat, lon: userLon },
          unit: 'km',
          value: maxDistance
        }
      },
      rating: {
        gte: 3.5 // Only well-rated places
      }
    },
    sortBy: [
      { property: 'rating', order: 'DESC' }
    ],
    limit: maxResults,
    facets: {
      category: {},
      priceRange: {},
      amenities: { limit: 15 }
    }
  })
}

console.log('Geosearch examples loaded successfully')