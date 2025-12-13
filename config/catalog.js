const catalogItems = {
  promotional: {
    name: 'Promotional',
    items: [
      {
        id: 'promo-shirt',
        name: 'T-Shirt',
        basePrice: 500,
        image: '/images/products/t-shirt.jpg',
        description: 'High-quality cotton t-shirt perfect for promotional events'
      },
      {
        id: 'promo-hoodie',
        name: 'Hoodie',
        basePrice: 1500,
        image: '/images/products/hoodie.jpg',
        description: 'Comfortable hoodie for brand promotion'
      },
      {
        id: 'promo-ticket',
        name: 'Event Tickets',
        basePrice: 50,
        image: '/images/products/ticket.jpg',
        description: 'Custom printed event tickets'
      },
      {
        id: 'promo-banner',
        name: 'Banner',
        basePrice: 2000,
        image: '/images/products/cap.jpg',
        description: 'Custom branded Caps'
      }
    ]
  },
  uniforms: {
    name: 'Uniforms',
    items: [
      {
        id: 'uni-hoodie',
        name: 'Games Tracksuit',
        basePrice: 1800,
        image: '/images/products/tracksuite.jpg',
        description: 'Professional uniform hoodie'
      },
      {
        id: 'uni-shirt',
        name: 'Uniform Shirt',
        basePrice: 800,
        image: '/images/products/school-shirt.jpg',
        description: 'Smart uniform shirt'
      },
      {
        id: 'uni-overall',
        name: 'Overall',
        basePrice: 2500,
        image: '/images/products/Overall.png',
        description: 'Durable work overalls'
      }
    ]
  }
};

const kenyaCounties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot'
];

module.exports = { catalogItems, kenyaCounties };
