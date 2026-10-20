export type SizeId = 'personal' | 'medium' | 'large'
export type CrustId = 'hand' | 'thin' | 'pan' | 'burst'
export type CategoryId = 'pizza' | 'sides' | 'desserts' | 'drinks'
export type Tag = 'veg' | 'spicy' | 'chicken' | 'seafood' | 'new'

export type Topping =
  | 'pepperoni'
  | 'chicken'
  | 'olive'
  | 'capsicum'
  | 'onion'
  | 'mushroom'
  | 'jalapeno'
  | 'tomato'
  | 'paneer'
  | 'prawn'
  | 'basil'
  | 'chilli'
  | 'sausage'
  | 'corn'

export type SideArt = 'garlic-bread' | 'wings' | 'wedges' | 'pasta' | 'lava' | 'cola' | 'tea' | 'water'

export type Art = { kind: 'pizza'; toppings: Topping[]; sauce?: 'tomato' | 'bbq' | 'white' } | { kind: SideArt }

interface BaseProduct {
  id: string
  name: string
  description: string
  tags: Tag[]
  badge?: string
  art: Art
}

export interface PizzaProduct extends BaseProduct {
  category: 'pizza'
  prices: Record<SizeId, number>
}

export interface SimpleProduct extends BaseProduct {
  category: Exclude<CategoryId, 'pizza'>
  price: number
  unit: string
}

export type Product = PizzaProduct | SimpleProduct

export const SIZES: { id: SizeId; label: string; inches: number; serves: string }[] = [
  { id: 'personal', label: 'Personal', inches: 7, serves: 'Serves 1' },
  { id: 'medium', label: 'Medium', inches: 9, serves: 'Serves 2' },
  { id: 'large', label: 'Large', inches: 12, serves: 'Serves 3–4' },
]

export const CRUSTS: { id: CrustId; label: string; note: string; extra: Record<SizeId, number> }[] = [
  { id: 'hand', label: 'Hand Tossed', note: 'Soft & airy', extra: { personal: 0, medium: 0, large: 0 } },
  { id: 'thin', label: 'Thin Crust', note: 'Light & crispy', extra: { personal: 0, medium: 0, large: 0 } },
  { id: 'pan', label: 'Pan', note: 'Thick & buttery', extra: { personal: 200, medium: 300, large: 400 } },
  { id: 'burst', label: 'Cheese Burst', note: 'Molten cheese inside', extra: { personal: 450, medium: 650, large: 850 } },
]

export const EXTRA_TOPPINGS: { id: Topping; label: string; veg: boolean }[] = [
  { id: 'chicken', label: 'Chicken', veg: false },
  { id: 'pepperoni', label: 'Chicken Pepperoni', veg: false },
  { id: 'sausage', label: 'Chicken Sausage', veg: false },
  { id: 'prawn', label: 'Prawns', veg: false },
  { id: 'mushroom', label: 'Mushroom', veg: true },
  { id: 'onion', label: 'Onion', veg: true },
  { id: 'capsicum', label: 'Capsicum', veg: true },
  { id: 'olive', label: 'Black Olives', veg: true },
  { id: 'jalapeno', label: 'Jalapeño', veg: true },
  { id: 'tomato', label: 'Tomato', veg: true },
  { id: 'corn', label: 'Sweet Corn', veg: true },
  { id: 'paneer', label: 'Paneer', veg: true },
]

export const EXTRA_TOPPING_PRICE: Record<SizeId, number> = { personal: 150, medium: 220, large: 300 }
export const EXTRA_CHEESE_PRICE: Record<SizeId, number> = { personal: 200, medium: 300, large: 400 }

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'pizza', label: 'Pizzas' },
  { id: 'sides', label: 'Sides' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Drinks' },
]

export const PRODUCTS: Product[] = [
  {
    id: 'devilled-chicken',
    category: 'pizza',
    name: 'Devilled Chicken',
    description: 'Sri Lankan devilled chicken, onion, capsicum and a kick of chilli flakes.',
    tags: ['chicken', 'spicy'],
    badge: 'Most loved',
    prices: { personal: 1190, medium: 2490, large: 3690 },
    art: { kind: 'pizza', toppings: ['chicken', 'onion', 'capsicum', 'chilli'] },
  },
  {
    id: 'pepperoni-classic',
    category: 'pizza',
    name: 'Pepperoni Classic',
    description: 'Generous chicken pepperoni over 100% mozzarella and our signature tomato sauce.',
    tags: ['chicken'],
    badge: 'Classic',
    prices: { personal: 1090, medium: 2290, large: 3390 },
    art: { kind: 'pizza', toppings: ['pepperoni'] },
  },
  {
    id: 'kochchi-paneer',
    category: 'pizza',
    name: 'Kochchi Paneer',
    description: 'Paneer tikka, red onion and fiery kochchi chilli. A local favourite.',
    tags: ['veg', 'spicy', 'new'],
    badge: 'New',
    prices: { personal: 1090, medium: 2290, large: 3390 },
    art: { kind: 'pizza', toppings: ['paneer', 'onion', 'jalapeno', 'chilli'] },
  },
  {
    id: 'bbq-chicken',
    category: 'pizza',
    name: 'Smoky BBQ Chicken',
    description: 'BBQ-glazed chicken, red onion and sweet corn on a smoky barbecue base.',
    tags: ['chicken'],
    prices: { personal: 1190, medium: 2490, large: 3690 },
    art: { kind: 'pizza', toppings: ['chicken', 'onion', 'corn'], sauce: 'bbq' },
  },
  {
    id: 'hot-spicy-chicken',
    category: 'pizza',
    name: 'Hot & Spicy Chicken',
    description: 'Spicy chicken, jalapeño, onion and red chilli. For those who like it hot.',
    tags: ['chicken', 'spicy'],
    prices: { personal: 1190, medium: 2490, large: 3690 },
    art: { kind: 'pizza', toppings: ['chicken', 'jalapeno', 'onion', 'chilli'] },
  },
  {
    id: 'chilli-prawn',
    category: 'pizza',
    name: 'Chilli Prawn',
    description: 'Tender prawns tossed in garlic chilli butter with capsicum and onion.',
    tags: ['seafood', 'spicy'],
    prices: { personal: 1390, medium: 2890, large: 4190 },
    art: { kind: 'pizza', toppings: ['prawn', 'capsicum', 'onion', 'chilli'] },
  },
  {
    id: 'veggie-paradise',
    category: 'pizza',
    name: 'Veggie Paradise',
    description: 'Mushroom, capsicum, black olives, onion and juicy tomato.',
    tags: ['veg'],
    prices: { personal: 990, medium: 2090, large: 3090 },
    art: { kind: 'pizza', toppings: ['mushroom', 'capsicum', 'olive', 'onion', 'tomato'] },
  },
  {
    id: 'margherita',
    category: 'pizza',
    name: 'Margherita',
    description: 'Simply mozzarella, tomato sauce and fresh basil. Light and always right.',
    tags: ['veg'],
    prices: { personal: 890, medium: 1890, large: 2790 },
    art: { kind: 'pizza', toppings: ['tomato', 'basil'] },
  },
  {
    id: 'chicken-sausage-feast',
    category: 'pizza',
    name: 'Chicken Sausage Feast',
    description: 'Chicken sausage, chicken pepperoni, mushroom and a creamy white sauce.',
    tags: ['chicken'],
    prices: { personal: 1290, medium: 2690, large: 3890 },
    art: { kind: 'pizza', toppings: ['sausage', 'pepperoni', 'mushroom'], sauce: 'white' },
  },
  {
    id: 'garlic-bread',
    category: 'sides',
    name: 'Garlic Bread',
    description: 'Freshly baked breadsticks brushed with garlic butter and herbs.',
    tags: ['veg'],
    price: 690,
    unit: '8 pcs',
    art: { kind: 'garlic-bread' },
  },
  {
    id: 'chicken-wings',
    category: 'sides',
    name: 'Hot Chicken Wings',
    description: 'Oven-roasted wings in a sticky hot glaze.',
    tags: ['chicken', 'spicy'],
    badge: 'Most loved',
    price: 1290,
    unit: '6 pcs',
    art: { kind: 'wings' },
  },
  {
    id: 'potato-wedges',
    category: 'sides',
    name: 'Potato Wedges',
    description: 'Crispy seasoned wedges with a garlic mayo dip.',
    tags: ['veg'],
    price: 690,
    unit: 'Regular',
    art: { kind: 'wedges' },
  },
  {
    id: 'chicken-pasta',
    category: 'sides',
    name: 'Creamy Chicken Pasta',
    description: 'Penne in a creamy white sauce with chicken and mushroom.',
    tags: ['chicken'],
    price: 1390,
    unit: 'Bowl',
    art: { kind: 'pasta' },
  },
  {
    id: 'lava-cake',
    category: 'desserts',
    name: 'Choco Lava Cake',
    description: 'Warm chocolate cake with a gooey molten centre.',
    tags: ['veg'],
    badge: 'Sweet pick',
    price: 590,
    unit: '1 pc',
    art: { kind: 'lava' },
  },
  {
    id: 'cola',
    category: 'drinks',
    name: 'Cola',
    description: 'Ice-cold and fizzy. Best with something spicy.',
    tags: ['veg'],
    price: 450,
    unit: '1.5 L',
    art: { kind: 'cola' },
  },
  {
    id: 'iced-tea',
    category: 'drinks',
    name: 'Lemon Iced Tea',
    description: 'Ceylon tea, a squeeze of lemon, lightly sweetened.',
    tags: ['veg'],
    price: 390,
    unit: '500 ml',
    art: { kind: 'tea' },
  },
  {
    id: 'water',
    category: 'drinks',
    name: 'Mineral Water',
    description: 'Still water.',
    tags: ['veg'],
    price: 150,
    unit: '1 L',
    art: { kind: 'water' },
  },
]

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]))

export function fromPrice(p: Product): number {
  return p.category === 'pizza' ? p.prices.personal : p.price
}

export const TAG_LABEL: Record<Tag, string> = {
  veg: 'Veg',
  spicy: 'Spicy',
  chicken: 'Chicken',
  seafood: 'Seafood',
  new: 'New',
}
