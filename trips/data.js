// Content for the Driftway concept. Places are real; prices, ratings and stories are illustrative.
window.DRIFT = {
  destinations: [
    { id: 'hallstatt', name: 'Hallstatt', country: 'Austria', cat: ['mountain', 'culture'], scene: 'lake', rating: 4.9, price: 1180, nightly: 140, temp: 17,
      acts: [
        ['Sunrise lakeshore walk', 'morning', 'nature', 0], ['Salt mine tour & slide', 'morning', 'adventure', 38], ['Skywalk viewpoint funicular', 'afternoon', 'nature', 22],
        ['Old-town bakery crawl', 'morning', 'food', 18], ['Rent an electric boat', 'afternoon', 'relax', 30], ['Bone House & parish church', 'afternoon', 'culture', 3],
        ['Five Fingers platform hike', 'morning', 'adventure', 0], ['Lakeside fish dinner', 'evening', 'food', 46], ['Alpine spa evening', 'evening', 'relax', 40],
        ['Gosau lakes day trip', 'afternoon', 'nature', 14], ['Zither music night', 'evening', 'culture', 15], ['Stargazing on the jetty', 'evening', 'nature', 0]
      ] },
    { id: 'nusa', name: 'Nusa Penida', country: 'Indonesia', cat: ['beach', 'adventure'], scene: 'cove', rating: 4.8, price: 780, nightly: 70, temp: 29,
      acts: [
        ['Kelingking cliff viewpoint', 'morning', 'nature', 2], ['Snorkel with manta rays', 'morning', 'adventure', 45], ['Crystal Bay swim', 'afternoon', 'relax', 0],
        ['Warung lunch crawl', 'afternoon', 'food', 12], ['Broken Beach & Angel\'s Billabong', 'afternoon', 'nature', 3], ['Temple cave Goa Giri Putri', 'morning', 'culture', 4],
        ['Diamond Beach stairs', 'morning', 'adventure', 2], ['Seafood sunset BBQ', 'evening', 'food', 20], ['Beach yoga at dusk', 'evening', 'relax', 10],
        ['Seaweed farm visit', 'afternoon', 'culture', 5], ['Cliff jumping at Banah', 'afternoon', 'adventure', 0], ['Night market satay', 'evening', 'food', 8]
      ] },
    { id: 'banff', name: 'Banff', country: 'Canada', cat: ['mountain', 'adventure'], scene: 'peaks', rating: 4.9, price: 1240, nightly: 160, temp: 14,
      acts: [
        ['Moraine Lake sunrise', 'morning', 'nature', 0], ['Canoe on Lake Louise', 'morning', 'relax', 60], ['Johnston Canyon catwalks', 'afternoon', 'adventure', 0],
        ['Gondola to Sulphur summit', 'afternoon', 'nature', 70], ['Bison burger lunch', 'afternoon', 'food', 24], ['Whyte Museum visit', 'afternoon', 'culture', 10],
        ['Via ferrata climb', 'morning', 'adventure', 140], ['Hot springs soak', 'evening', 'relax', 18], ['Wildlife dusk drive', 'evening', 'nature', 0],
        ['Craft brewery tasting', 'evening', 'food', 25], ['Cave & Basin heritage', 'morning', 'culture', 9], ['Fireside fondue dinner', 'evening', 'food', 55]
      ] },
    { id: 'maldives', name: 'Baa Atoll', country: 'Maldives', cat: ['beach'], scene: 'lagoon', rating: 4.9, price: 1620, nightly: 260, temp: 30,
      acts: [
        ['House-reef snorkel', 'morning', 'nature', 0], ['Hanifaru Bay manta swim', 'morning', 'adventure', 90], ['Overwater hammock time', 'afternoon', 'relax', 0],
        ['Maldivian curry class', 'afternoon', 'food', 40], ['Sandbank picnic', 'afternoon', 'relax', 120], ['Local island village visit', 'morning', 'culture', 25],
        ['Kayak the lagoon', 'afternoon', 'adventure', 20], ['Sunset dolphin cruise', 'evening', 'nature', 70], ['Beach cinema night', 'evening', 'relax', 0],
        ['Reef-to-table dinner', 'evening', 'food', 85], ['Bodu beru drum show', 'evening', 'culture', 0], ['Night snorkel bioluminescence', 'evening', 'adventure', 50]
      ] },
    { id: 'ubud', name: 'Ubud', country: 'Indonesia', cat: ['culture', 'mountain'], scene: 'terraces', rating: 4.7, price: 690, nightly: 55, temp: 26,
      acts: [
        ['Tegallalang rice terraces', 'morning', 'nature', 3], ['Campuhan ridge walk', 'morning', 'nature', 0], ['Water temple Tirta Empul', 'morning', 'culture', 4],
        ['Balinese cooking class', 'afternoon', 'food', 30], ['Monkey forest sanctuary', 'afternoon', 'nature', 6], ['Silver-making workshop', 'afternoon', 'culture', 35],
        ['Ayung river rafting', 'morning', 'adventure', 40], ['Jungle swing & pools', 'afternoon', 'adventure', 25], ['Traditional massage', 'afternoon', 'relax', 15],
        ['Legong dance at the palace', 'evening', 'culture', 8], ['Babi guling feast', 'evening', 'food', 9], ['Mount Batur sunrise trek', 'morning', 'adventure', 45]
      ] },
    { id: 'wadirum', name: 'Wadi Rum', country: 'Jordan', cat: ['adventure', 'culture'], scene: 'dunes', rating: 4.8, price: 940, nightly: 90, temp: 24,
      acts: [
        ['4x4 desert safari', 'morning', 'adventure', 40], ['Lawrence\'s Spring hike', 'morning', 'nature', 0], ['Camel ride at golden hour', 'afternoon', 'adventure', 30],
        ['Sand-dune sandboarding', 'afternoon', 'adventure', 15], ['Bedouin tea & stories', 'afternoon', 'culture', 0], ['Petroglyph canyon walk', 'morning', 'culture', 0],
        ['Zarb underground BBQ', 'evening', 'food', 20], ['Stargazing bubble tent', 'evening', 'relax', 60], ['Hot-air balloon at dawn', 'morning', 'nature', 180],
        ['Rock bridge scramble', 'afternoon', 'adventure', 0], ['Spice market in Aqaba', 'afternoon', 'food', 10], ['Desert campfire music', 'evening', 'culture', 0]
      ] }
  ],
  stories: [
    { name: 'Amaya Perera', from: 'Colombo, Sri Lanka', color: '#f5893b', date: 'Oct 2026', trip: 'Ubud',
      text: 'As a solo traveller, safety was my biggest worry. Driftway planned a gentle first day, then let the adventure build. The rafting guide is now a friend.' },
    { name: 'Lucas Moreau', from: 'Lyon, France', color: '#2f6fd6', date: 'Sep 2026', trip: 'Banff',
      text: 'We changed plans three times because of weather and the itinerary just reshuffled itself. Canoe at sunrise on day four was the best hour of my year.' },
    { name: 'Priya Nair', from: 'Bengaluru, India', color: '#6cc04a', date: 'Aug 2026', trip: 'Nusa Penida',
      text: 'The budget was honest down to the ferry. No surprises, just mantas, cliffs and the best sambal I have ever had. Already planning the next one.' },
    { name: 'Tom Becker', from: 'Hamburg, Germany', color: '#e8505b', date: 'Jul 2026', trip: 'Wadi Rum',
      text: 'Sleeping in a bubble tent under that sky felt unreal. The local guide Driftway paired us with made the desert feel like home.' },
    { name: 'Hana Sato', from: 'Osaka, Japan', color: '#14a3a8', date: 'Jun 2026', trip: 'Hallstatt',
      text: 'Slow days were exactly that: slow. A boat, a bakery and a quiet lake. I didn\'t open a single booking app the whole week.' }
  ]
};
