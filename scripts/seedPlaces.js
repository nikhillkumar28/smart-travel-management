const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Place = require('../models/Place');

const PLACE_SEED = [
  {
    name: 'Amber Fort',
    city: 'Jaipur',
    category: 'historical',
    priceLevel: 2,
    rating: 4.7,
    tags: ['fort', 'unesco', 'palace'],
    description: 'Hilltop Rajput fort with courtyards, mirror work, and views over Maota Lake.',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Hawa Mahal',
    city: 'Jaipur',
    category: 'historical',
    priceLevel: 1,
    rating: 4.4,
    tags: ['palace', 'architecture'],
    description: 'Pink sandstone facade of 953 windows built for royal women to watch street life.',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'City Palace Jaipur',
    city: 'Jaipur',
    category: 'cultural',
    priceLevel: 3,
    rating: 4.5,
    tags: ['palace', 'museum'],
    description: 'Royal complex of museums, courtyards, and still-used palace buildings in the old city.',
    image: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Jal Mahal',
    city: 'Jaipur',
    category: 'nature',
    priceLevel: 1,
    rating: 4.2,
    tags: ['lake', 'palace', 'viewpoint'],
    description: 'Water palace sitting in Man Sagar Lake, best enjoyed from the lakeside walkway.',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Baga Beach',
    city: 'Goa',
    category: 'nature',
    priceLevel: 2,
    rating: 4.3,
    tags: ['beach', 'nightlife'],
    description: 'Busy beach stretch with shacks, water sports, and a lively evening scene.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Dudhsagar Falls',
    city: 'Goa',
    category: 'adventure',
    priceLevel: 2,
    rating: 4.6,
    tags: ['waterfall', 'trek', 'jeep'],
    description: 'Four-tier waterfall on the Goa–Karnataka border, reached by jeep trail through forest.',
    image: 'https://images.unsplash.com/photo-1432405976523-cd1ac089d22d?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Basilica of Bom Jesus',
    city: 'Goa',
    category: 'religious',
    priceLevel: 1,
    rating: 4.5,
    tags: ['church', 'unesco'],
    description: 'UNESCO baroque church in Old Goa that holds the relics of St. Francis Xavier.',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b8af1fe0?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Anjuna Flea Market',
    city: 'Goa',
    category: 'cultural',
    priceLevel: 2,
    rating: 4.1,
    tags: ['market', 'shopping'],
    description: 'Weekly beach market with clothes, crafts, and street food along Anjuna.',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Red Fort',
    city: 'Delhi',
    category: 'historical',
    priceLevel: 2,
    rating: 4.6,
    tags: ['fort', 'unesco', 'mughal'],
    description: 'Mughal sandstone fort in Old Delhi and the site of the Independence Day address.',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Qutub Minar',
    city: 'Delhi',
    category: 'historical',
    priceLevel: 1,
    rating: 4.5,
    tags: ['minaret', 'unesco'],
    description: '73-metre brick minaret from the 13th century, surrounded by ruined mosque courtyards.',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Chandni Chowk Food Walk',
    city: 'Delhi',
    category: 'food',
    priceLevel: 1,
    rating: 4.4,
    tags: ['street-food', 'old-delhi'],
    description: 'Crowded lanes of paratha, jalebi, and kebab stalls in Old Delhi.',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Humayun Tomb',
    city: 'Delhi',
    category: 'historical',
    priceLevel: 2,
    rating: 4.7,
    tags: ['tomb', 'unesco', 'garden'],
    description: 'Garden tomb that later inspired the design of the Taj Mahal.',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Gateway of India',
    city: 'Mumbai',
    category: 'historical',
    priceLevel: 1,
    rating: 4.4,
    tags: ['monument', 'harbour'],
    description: 'Arch on the Mumbai waterfront, a classic first stop and ferry point to Elephanta.',
    image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Marine Drive',
    city: 'Mumbai',
    category: 'nature',
    priceLevel: 1,
    rating: 4.5,
    tags: ['promenade', 'sunset'],
    description: 'Curved seaside boulevard known as the Queen’s Necklace after dark.',
    image: 'https://images.unsplash.com/photo-1570168007438-d8b0ed8b1d3d?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Elephanta Caves',
    city: 'Mumbai',
    category: 'religious',
    priceLevel: 2,
    rating: 4.3,
    tags: ['caves', 'unesco', 'ferry'],
    description: 'Rock-cut Shiva temples on an island in Mumbai Harbour, reached by ferry.',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b8af1fe0?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'City Palace Udaipur',
    city: 'Udaipur',
    category: 'cultural',
    priceLevel: 3,
    rating: 4.6,
    tags: ['palace', 'lake'],
    description: 'Palaces stacked above Lake Pichola with courtyards, murals, and museum rooms.',
    image: 'https://images.unsplash.com/photo-1617518127992-1c5f4c0f0c0c?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Lake Pichola Boat Ride',
    city: 'Udaipur',
    category: 'nature',
    priceLevel: 2,
    rating: 4.5,
    tags: ['lake', 'boat'],
    description: 'Boat trip past palaces and ghats, especially striking around sunset.',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Solang Valley',
    city: 'Manali',
    category: 'adventure',
    priceLevel: 3,
    rating: 4.4,
    tags: ['paragliding', 'snow', 'valley'],
    description: 'Adventure valley for paragliding, zorbing, and snow sports near Manali.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Hadimba Temple',
    city: 'Manali',
    category: 'religious',
    priceLevel: 1,
    rating: 4.3,
    tags: ['temple', 'cedar-forest'],
    description: 'Wooden pagoda temple dedicated to Hidimba Devi, set among deodar trees.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Old Manali Cafes',
    city: 'Manali',
    category: 'food',
    priceLevel: 2,
    rating: 4.2,
    tags: ['cafes', 'backpacker'],
    description: 'Relaxed cafe stretch with Himalayan views, momos, and long breakfasts.',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=800&q=80'
  }
];

async function seedPlacesIfEmpty() {
  const existing = await Place.countDocuments();
  if (existing > 0) {
    console.log(`Places collection already has ${existing} documents; skip seed.`);
    return existing;
  }

  await Place.insertMany(PLACE_SEED);
  console.log(`Seeded ${PLACE_SEED.length} places.`);
  return PLACE_SEED.length;
}

async function runCli() {
  dotenv.config();
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Missing MONGO_URI in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  try {
    await seedPlacesIfEmpty();
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { PLACE_SEED, seedPlacesIfEmpty };
