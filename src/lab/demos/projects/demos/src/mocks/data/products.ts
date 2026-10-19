export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

/** In-memory "database". Changes last until the page reloads. */
export const products: Product[] = [
  {
    id: '1',
    name: 'Mechanical Keyboard',
    price: 129.99,
    description: 'Tactile switches, aluminum frame.',
  },
  { id: '2', name: 'Wireless Mouse', price: 49.5, description: 'Ergonomic, 70-day battery life.' },
  { id: '3', name: '27" Monitor', price: 329, description: '1440p IPS panel, 144Hz.' },
  { id: '4', name: 'USB-C Dock', price: 189, description: 'Two displays, 100W passthrough.' },
  {
    id: '5',
    name: 'Desk Lamp',
    price: 39.95,
    description: 'Dimmable, adjustable color temperature.',
  },
];

const adjectives = [
  'Compact',
  'Wireless',
  'Ergonomic',
  'Pro',
  'Silent',
  'Portable',
  'Smart',
  'Ultra',
];
const nouns = [
  'Keyboard',
  'Mouse',
  'Monitor',
  'Dock',
  'Lamp',
  'Headset',
  'Webcam',
  'Speaker',
  'Hub',
];

/** 500 generated products (ids 1001–1500). Deterministic, so pages are stable across reloads. */
export const largeProducts: Product[] = Array.from({ length: 500 }, (_, i) => {
  const name = `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${Math.floor(i / 72) + 1}`;
  return {
    id: String(1001 + i),
    name,
    price: ((i * 37) % 500) + 9.99,
    description: `Generated item #${i + 1}: ${name}.`,
  };
});

export function findProduct(id: unknown) {
  return products.find((p) => p.id === id) ?? largeProducts.find((p) => p.id === id);
}

/** Each item is broken in a different way, for practicing validation and defensive UI. */
export const malformedProducts: unknown[] = [
  { id: '1', name: 'Mechanical Keyboard', price: 129.99 }, // valid, for contrast
  { id: '2', name: '', price: 49.5 }, // empty name
  { id: '3', name: '27" Monitor', price: '329' }, // price is a string
  { id: '4', name: 'USB-C Dock', price: -189 }, // negative price
  { id: null, name: 'Desk Lamp', price: 39.95 }, // null id
  { id: '6', title: 'Webcam', cost: 89 }, // wrong property names
  { id: '2', name: 'Duplicate Id', price: 10 }, // duplicate id
  { id: '8', name: 'X'.repeat(300), price: 1e9 }, // absurdly long name, huge price
];

export const malformedProduct = { id: '3', name: null, price: 'free', description: 42 };
