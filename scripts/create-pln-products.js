// Create test products in PLN for BM Beauty
// Run with: node scripts/create-pln-products.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_BM_BEAUTY_PLACEHOLDER');

const products = [
  {
    name: 'Rzęsy - Volume 2D',
    description: 'Stylizacja rzęs metodą volume 2D',
    price: 28000, // 280.00 PLN in cents
    currency: 'pln',
    type: 'beauty',
  },
  {
    name: 'Rzęsy - Classic',
    description: 'Klasyczna stylizacja rzęs 1:1',
    price: 18000, // 180.00 PLN in cents
    currency: 'pln',
    type: 'beauty',
  },
  {
    name: 'Brwi - Laminacja',
    description: 'Laminacja brwi z farbowaniem',
    price: 15000, // 150.00 PLN in cents
    currency: 'pln',
    type: 'beauty',
  },
  {
    name: 'PMU Brwi',
    description: 'Permanentny makijaż brwi',
    price: 80000, // 800.00 PLN in cents
    currency: 'pln',
    type: 'beauty',
  },
  {
    name: 'Fitness - Trening personalny',
    description: 'Trening personalny 60 minut',
    price: 20000, // 200.00 PLN in cents
    currency: 'pln',
    type: 'fitness',
  },
  {
    name: 'Fitness - Pakiet 10 treningów',
    description: 'Pakiet 10 treningów personalnych',
    price: 180000, // 1800.00 PLN in cents
    currency: 'pln',
    type: 'fitness',
  },
];

async function createProducts() {
  console.log('Creating PLN products for BM Beauty...\n');

  for (const productData of products) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          type: productData.type,
          currency: productData.currency,
        },
      });

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: productData.currency,
        nickname: productData.name,
        metadata: {
          type: productData.type,
        },
      });

      console.log(`✅ Created: ${productData.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Price: ${productData.price / 100} ${productData.currency.toUpperCase()}\n`);
    } catch (error) {
      console.error(`❌ Error creating ${productData.name}:`, error.message);
      console.log('   Make sure you have updated the STRIPE_SECRET_KEY in this script\n');
    }
  }
}

// Check if the API key is set
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('PLACEHOLDER')) {
  console.log('❌ Please update the STRIPE_SECRET_KEY in this script first:');
  console.log('1. Get your key from https://dashboard.stripe.com/apikeys');
  console.log('2. Set environment variable: export STRIPE_SECRET_KEY=sk_test_...\n');
  process.exit(1);
}

createProducts().then(() => {
  console.log('Done! Products created in your Stripe dashboard.');
  console.log('You can now use these Price IDs in your application.');
}).catch(error => {
  console.error('Error:', error.message);
});