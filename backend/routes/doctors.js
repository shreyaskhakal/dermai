// ============================================================
//  DOCTORS ROUTE — Nearby Dermatologist Finder
// ============================================================
const express = require('express');
const router = express.Router();

// Demo dermatologist data (used when no Google API key or as fallback)
const DEMO_DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist & Cosmetologist',
    address: '12 MG Road, Koramangala, Bangalore - 560034',
    phone: '+91 80 4567 8901',
    rating: 4.9,
    reviewCount: 842,
    distance: '0.8 km',
    distanceVal: 0.8,
    availability: 'Open now · Closes 8 PM',
    isOpen: true,
    tags: ['Eczema', 'Psoriasis', 'Acne', 'Laser'],
    mapUrl: 'https://www.google.com/maps/search/dermatologist',
    appointmentUrl: '#',
    icon: '🏥',
    nextSlot: 'Today 4:30 PM'
  },
  {
    id: 'd2',
    name: 'Dr. Arjun Mehta',
    specialization: 'Clinical Dermatologist',
    address: '45 Brigade Road, Shivajinagar, Bangalore - 560001',
    phone: '+91 80 2345 6789',
    rating: 4.7,
    reviewCount: 534,
    distance: '1.4 km',
    distanceVal: 1.4,
    availability: 'Open now · Closes 7 PM',
    isOpen: true,
    tags: ['Fungal', 'Skin Cancer', 'Rosacea', 'Vitiligo'],
    mapUrl: 'https://www.google.com/maps/search/dermatologist',
    appointmentUrl: '#',
    icon: '🏥',
    nextSlot: 'Tomorrow 10:00 AM'
  },
  {
    id: 'd3',
    name: 'Apollo Skin & Hair Clinic',
    specialization: 'Multi-Specialty Skin Clinic',
    address: '78 Outer Ring Rd, HSR Layout, Bangalore - 560102',
    phone: '+91 80 3456 7890',
    rating: 4.8,
    reviewCount: 1204,
    distance: '2.1 km',
    distanceVal: 2.1,
    availability: 'Open 24/7',
    isOpen: true,
    tags: ['All Conditions', 'Emergency', 'Surgery', 'Pediatric'],
    mapUrl: 'https://www.google.com/maps/search/dermatologist',
    appointmentUrl: '#',
    icon: '🏨',
    nextSlot: 'Today 6:00 PM'
  },
  {
    id: 'd4',
    name: 'Dr. Kavya Reddy',
    specialization: 'Aesthetic Dermatologist',
    address: '33 Jayanagar 4th Block, Bangalore - 560041',
    phone: '+91 80 5678 9012',
    rating: 4.6,
    reviewCount: 378,
    distance: '3.2 km',
    distanceVal: 3.2,
    availability: 'Opens at 10 AM',
    isOpen: false,
    tags: ['Acne Scars', 'Pigmentation', 'Anti-aging', 'PRP'],
    mapUrl: 'https://www.google.com/maps/search/dermatologist',
    appointmentUrl: '#',
    icon: '🌟',
    nextSlot: 'Tomorrow 11:00 AM'
  },
  {
    id: 'd5',
    name: 'Fortis Skin Care Center',
    specialization: 'Hospital-Based Dermatology',
    address: '154 Cunningham Rd, Near MG Road, Bangalore - 560052',
    phone: '+91 80 6789 0123',
    rating: 4.5,
    reviewCount: 672,
    distance: '4.0 km',
    distanceVal: 4.0,
    availability: 'Open now · Closes 9 PM',
    isOpen: true,
    tags: ['Inpatient', 'Biopsy', 'Allergy Testing', 'Phototherapy'],
    mapUrl: 'https://www.google.com/maps/search/dermatologist',
    appointmentUrl: '#',
    icon: '🏥',
    nextSlot: 'Today 7:00 PM'
  }
];

// GET /api/doctors/nearby
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, query, radius = 5000 } = req.query;
    const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (GMAPS_KEY && GMAPS_KEY !== 'your_google_maps_api_key_here' && lat && lng) {
      // Real Google Places API call
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${lat},${lng}&radius=${radius}&type=doctor&keyword=dermatologist&key=${GMAPS_KEY}`;

      const fetch = require('node-fetch');
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const doctors = data.results.slice(0, 8).map((place, i) => ({
          id: place.place_id,
          name: place.name,
          specialization: 'Dermatologist',
          address: place.vicinity,
          rating: place.rating || 4.5,
          reviewCount: place.user_ratings_total || 0,
          distance: `${((Math.random() * 4) + 0.5).toFixed(1)} km`,
          isOpen: place.opening_hours?.open_now || false,
          availability: place.opening_hours?.open_now ? 'Open now' : 'Check hours',
          tags: ['Dermatology'],
          mapUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          icon: '🏥',
          nextSlot: 'Call to book'
        }));

        return res.json({ success: true, doctors, source: 'google_places', total: doctors.length });
      }
    }

    // Demo fallback (filter by query if provided)
    let doctors = DEMO_DOCTORS;
    if (query) {
      const q = query.toLowerCase();
      doctors = doctors.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      doctors,
      source: 'demo',
      total: doctors.length,
      note: 'Demo data. Add GOOGLE_MAPS_API_KEY to .env for real results.'
    });
  } catch (err) {
    console.error('Doctors route error:', err);
    res.json({ success: true, doctors: DEMO_DOCTORS, source: 'demo', total: DEMO_DOCTORS.length });
  }
});

// GET /api/doctors/mapskey — return API key for frontend Maps embed
router.get('/mapskey', (req, res) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const hasKey = key && key !== 'your_google_maps_api_key_here';
  res.json({ hasKey, key: hasKey ? key : null });
});

// GET /api/doctors/nearest - Fetch nearest clinic and phone number via Details API
router.get('/nearest', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Missing coordinates' });
    
    const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (GMAPS_KEY && GMAPS_KEY !== 'your_google_maps_api_key_here') {
      const fetch = require('node-fetch');
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=doctor&keyword=dermatologist&key=${GMAPS_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (searchData.status === 'OK' && searchData.results.length > 0) {
        const placeId = searchData.results[0].place_id;
        
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address&key=${GMAPS_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        
        if (detailsData.status === 'OK') {
          return res.json({ 
            success: true, 
            doctor: {
              name: detailsData.result.name,
              address: detailsData.result.formatted_address,
              phone: detailsData.result.formatted_phone_number || 'No phone listed'
            },
            source: 'google'
          });
        }
      }
    }
    
    res.json({
      success: true,
      doctor: {
        name: DEMO_DOCTORS[0].name,
        address: DEMO_DOCTORS[0].address,
        phone: DEMO_DOCTORS[0].phone
      },
      source: 'demo'
    });
  } catch (err) {
    console.error('Nearest doctor error:', err);
    res.status(500).json({ error: 'Server error fetching nearest clinic' });
  }
});

module.exports = router;
