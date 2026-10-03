export type Product = {
  slug: string;
  title: string;
  description: string;
  location: string;
  price: string;
  tag: string;
  rating: number;
  reviews: number;
  origin: string;
  category?: string;
  flavor: string;
  heatLevel: string;
  pairWith: string[];
  bundlePrice: string;
  bundleSave: string;
  bundleItems: string[];
  sizeOptions: { label: string; price: string; sku?: string; stock?: number }[];
  usage: string;
  frequentlyBought: string[];
  stock?: number;
};

// Title and slug only: descriptions mention "blends" and "packs" in passing and would misfile whole spices.
export function inferProductCategory(product: Pick<Product, "title" | "slug" | "description">): string {
  const haystack = `${product.title} ${product.slug}`.toLowerCase();

  if (/honey/.test(haystack)) return "Honey";
  if (/coffee/.test(haystack)) return "Coffee";
  if (/powder|ground/.test(haystack)) return "Powders";
  if (/masala|blend|mix/.test(haystack)) return "Blends & Masala";
  if (/\b(kit|pack|gift|combo)\b/.test(haystack)) return "Gift Packs";

  return "Whole Spices";
}

export function matchesProductQuery(
  product: Product,
  query: { category: string | null; origin: string | null; q: string | null; variant: string | null },
) {
  const { category, origin, q, variant } = query;
  const productCategory = product.category || inferProductCategory(product);
  const productOrigin = product.origin || product.location;

  if (category && productCategory !== category) {
    return false;
  }

  if (origin && productOrigin !== origin) {
    return false;
  }

  if (variant) {
    const normalizedVariant = variant.toLowerCase();
    const options = product.sizeOptions || [];
    const matchesVariant = options.some((option) => option.label.toLowerCase() === normalizedVariant);
    const fallbackText = `${product.title || ""}${product.description || ""}`.toLowerCase();

    if (!matchesVariant && !fallbackText.includes(normalizedVariant)) {
      return false;
    }
  }

  if (q) {
    const normalizedQuery = q.toLowerCase();
    const haystack = `${product.title} ${product.description} ${productOrigin} ${productCategory}`.toLowerCase();
    if (!haystack.includes(normalizedQuery)) {
      return false;
    }
  }

  return true;
}

const products: Product[] = [
  {
    slug: "kolli-hills-turmeric",
    title: "Kolli Hills Turmeric",
    description: "Premium turmeric grown at 4000ft altitude in Kolli Hills. Rich golden color and high curcumin.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹89",
    tag: "Best Seller",
    rating: 4.9,
    reviews: 342,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Earthy, warm, slightly bitter",
    heatLevel: "Mild",
    pairWith: ["Black Pepper", "Cinnamon", "Ginger"],
    bundlePrice: "₹249",
    bundleSave: "Save 12%",
    bundleItems: ["Turmeric", "Black Pepper", "Ginger"],
    sizeOptions: [
      { label: "100g", price: "₹89" },
      { label: "200g", price: "₹169" },
      { label: "500g", price: "₹349" },
    ],
    usage: "Keep in an airtight container. Use within 2 years for best potency. Add to curries, teas, and marinades.",
    frequentlyBought: ["Black Pepper", "Cardamom", "Cinnamon"],
  },
  {
    slug: "kanthari-chilli-green-dried",
    title: "Kanthari Chilli Green Dried",
    description: "Dried green kanthari chillies with a crisp texture and bright heat, ideal for spicy chutneys and pickles.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹79",
    tag: "Fiery",
    rating: 4.6,
    reviews: 174,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Sharp, tangy, intense heat",
    heatLevel: "Hot",
    pairWith: ["Lemon", "Curry Leaves", "Garlic"],
    bundlePrice: "₹199",
    bundleSave: "Save 10%",
    bundleItems: ["Kanthari Chilli", "Turmeric", "Curry Leaves"],
    sizeOptions: [
      { label: "50g", price: "₹79" },
      { label: "100g", price: "₹149" },
      { label: "200g", price: "₹279" },
    ],
    usage: "Dry roast lightly before grinding for fresh spice blends. Perfect in pickles, chutneys, and curry pastes.",
    frequentlyBought: ["Turmeric", "Fenugreek Seeds", "Mustard Seeds"],
  },
  {
    slug: "kolli-hills-black-pepper",
    title: "Kolli Hills Black Pepper",
    description: "Bold aromatic black peppercorns grown on pepper vines in Kolli Hills. Hand-picked and sun-dried.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹149",
    tag: "Spice Pick",
    rating: 4.8,
    reviews: 218,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Pungent, spicy, floral notes",
    heatLevel: "Medium",
    pairWith: ["Salt", "Cumin", "Coriander"],
    bundlePrice: "₹299",
    bundleSave: "Save 10%",
    bundleItems: ["Black Pepper", "Cumin", "Coriander"],
    sizeOptions: [
      { label: "50g", price: "₹149" },
      { label: "100g", price: "₹279" },
      { label: "250g", price: "₹599" },
    ],
    usage: "Store in a cool dark place. Grind fresh for peak aroma. Use in dals, curries, and stir-fries.",
    frequentlyBought: ["Coriander", "Turmeric", "Cardamom"],
  },
  {
    slug: "malabar-black-pepper",
    title: "Malabar Black Pepper",
    description: "Rich black pepper from Malabar with a powerful aroma and balanced heat, ideal for premium spice selections.",
    location: "Malabar, Kerala",
    price: "₹179",
    tag: "Premium",
    rating: 4.8,
    reviews: 195,
    origin: "Malabar, Kerala",
    flavor: "Sharp, woody, robust",
    heatLevel: "Medium",
    pairWith: ["Curry Leaves", "Coconut", "Turmeric"],
    bundlePrice: "₹359",
    bundleSave: "Save 11%",
    bundleItems: ["Malabar Pepper", "Turmeric", "Ginger"],
    sizeOptions: [
      { label: "50g", price: "₹179" },
      { label: "100g", price: "₹339" },
      { label: "250g", price: "₹749" },
    ],
    usage: "Use whole or freshly cracked. Excellent for gravies, dals, and seasoning roasted vegetables.",
    frequentlyBought: ["Cinnamon", "Cloves", "Cardamom"],
  },
  {
    slug: "kolli-hills-cinnamon",
    title: "Kolli Hills Cinnamon",
    description: "Sweet and fragrant cinnamon sticks harvested from Kolli Hills trees. Great for teas, desserts, and curry masalas.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹99",
    tag: "Warm",
    rating: 4.7,
    reviews: 132,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Sweet, woody, aromatic",
    heatLevel: "Mild",
    pairWith: ["Nutmeg", "Cloves", "Honey"],
    bundlePrice: "₹259",
    bundleSave: "Save 13%",
    bundleItems: ["Cinnamon", "Cloves", "Cardamom"],
    sizeOptions: [
      { label: "25g", price: "₹59" },
      { label: "50g", price: "₹99" },
      { label: "100g", price: "₹179" },
    ],
    usage: "Use in hot beverages, desserts, and savory dishes. Keep in a cool, dry place for lasting fragrance.",
    frequentlyBought: ["Cardamom", "Cloves", "Ginger"],
  },
  {
    slug: "kolli-hills-kalpasi",
    title: "Kolli Hills Kalpasi (Stone Flower)",
    description: "A rare aromatic fungus used in Chettinad and South Indian cuisine to add earthy, floral depth.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹99",
    tag: "Rare",
    rating: 4.6,
    reviews: 88,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Earthy, floral, umami-rich",
    heatLevel: "Mild",
    pairWith: ["Curry Leaves", "Coconut", "Fennel"],
    bundlePrice: "₹239",
    bundleSave: "Save 10%",
    bundleItems: ["Kalpasi", "Curry Powder", "Turmeric"],
    sizeOptions: [
      { label: "10g", price: "₹49" },
      { label: "25g", price: "₹99" },
      { label: "50g", price: "₹189" },
    ],
    usage: "Use sparingly in rice dishes, gravies, and masalas. Store sealed to preserve its delicate aroma.",
    frequentlyBought: ["Coriander", "Black Pepper", "Fennel"],
  },
  {
    slug: "ceylon-cinnamon",
    title: "Ceylon Cinnamon",
    description: "True Ceylon cinnamon with delicate sweetness and light citrus notes, perfect for premium desserts and drinks.",
    location: "Sri Lanka",
    price: "₹129",
    tag: "Ceylon",
    rating: 4.8,
    reviews: 142,
    origin: "Sri Lanka",
    flavor: "Sweet, citrusy, floral",
    heatLevel: "Mild",
    pairWith: ["Vanilla", "Honey", "Apple"],
    bundlePrice: "₹329",
    bundleSave: "Save 11%",
    bundleItems: ["Ceylon Cinnamon", "Cloves", "Nutmeg"],
    sizeOptions: [
      { label: "25g", price: "₹69" },
      { label: "50g", price: "₹129" },
      { label: "100g", price: "₹239" },
    ],
    usage: "Add to baking, warm beverages, and fruit compotes. Keep away from moisture for fresh flavor.",
    frequentlyBought: ["Turmeric", "Vanilla", "Nutmeg"],
  },
  {
    slug: "kolli-hills-cloves",
    title: "Kolli Hills Cloves",
    description: "Intensely aromatic whole cloves grown in Kolli Hills. Sun-dried flower buds with high eugenol oil.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹119",
    tag: "Authentic",
    rating: 4.7,
    reviews: 198,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Intense, warm, sweet, slightly numbing",
    heatLevel: "Mild",
    pairWith: ["Cinnamon", "Nutmeg", "Turmeric"],
    bundlePrice: "₹285",
    bundleSave: "Save 15%",
    bundleItems: ["Cloves", "Cinnamon", "Nutmeg", "Turmeric"],
    sizeOptions: [
      { label: "25g", price: "₹69" },
      { label: "50g", price: "₹119" },
      { label: "100g", price: "₹219" },
    ],
    usage: "Store in a dry container away from sunlight. Whole spices last 2-3 years. Toast before grinding for best aroma.",
    frequentlyBought: ["Turmeric", "Cinnamon", "Mace"],
  },
  {
    slug: "kolli-hills-mace",
    title: "Kolli Hills Mace",
    description: "Fragrant mace blades with warm, spicy-sweet notes. Great for meat masalas, biryani, and baking.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹149",
    tag: "Aromatic",
    rating: 4.7,
    reviews: 104,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Warm, sweet, subtly peppery",
    heatLevel: "Mild",
    pairWith: ["Nutmeg", "Cinnamon", "Cloves"],
    bundlePrice: "₹339",
    bundleSave: "Save 12%",
    bundleItems: ["Mace", "Nutmeg", "Cinnamon"],
    sizeOptions: [
      { label: "10g", price: "₹79" },
      { label: "25g", price: "₹149" },
      { label: "50g", price: "₹279" },
    ],
    usage: "Use in rich curries, desserts, and spice blends. Store in airtight packaging for the best flavor.",
    frequentlyBought: ["Nutmeg", "Cardamom", "Cinnamon"],
  },
  {
    slug: "kolli-hills-nutmeg",
    title: "Kolli Hills Nutmeg",
    description: "Single-origin nutmeg with sweet and woody notes, perfect for spice blends and holiday baking.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹129",
    tag: "Warm",
    rating: 4.6,
    reviews: 128,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Sweet, woody, slightly spicy",
    heatLevel: "Mild",
    pairWith: ["Cinnamon", "Cloves", "Milk"],
    bundlePrice: "₹299",
    bundleSave: "Save 10%",
    bundleItems: ["Nutmeg", "Cinnamon", "Cloves"],
    sizeOptions: [
      { label: "25g", price: "₹79" },
      { label: "50g", price: "₹129" },
      { label: "100g", price: "₹239" },
    ],
    usage: "Grate fresh into gravies, rice dishes, baked goods, and warm beverages for the best aroma.",
    frequentlyBought: ["Cinnamon", "Ginger", "Cloves"],
  },
  {
    slug: "kolli-hills-bay-leaf",
    title: "Kolli Hills Bay Leaf",
    description: "Fragrant bay leaves from Kolli Hills, ideal for biryanis, curries, stews, and slow-cooked dishes.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹49",
    tag: "Staple",
    rating: 4.5,
    reviews: 82,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Herbaceous, slightly bitter",
    heatLevel: "Mild",
    pairWith: ["Cinnamon", "Cloves", "Pepper"],
    bundlePrice: "₹119",
    bundleSave: "Save 10%",
    bundleItems: ["Bay Leaf", "Cinnamon", "Black Pepper"],
    sizeOptions: [
      { label: "25g", price: "₹29" },
      { label: "50g", price: "₹49" },
      { label: "100g", price: "₹89" },
    ],
    usage: "Add whole leaves to rice, soups, and curries during cooking. Remove before serving.",
    frequentlyBought: ["Black Pepper", "Cloves", "Cinnamon"],
  },
  {
    slug: "kolli-hills-tamarind",
    title: "Kolli Hills Tamarind",
    description: "Tamarind pods and pulp for tangy South Indian dishes, chutneys, and spice pastes.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹69",
    tag: "Tangy",
    rating: 4.6,
    reviews: 93,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Sour, fruity, rich",
    heatLevel: "Mild",
    pairWith: ["Jaggery", "Chili", "Curry Leaves"],
    bundlePrice: "₹179",
    bundleSave: "Save 12%",
    bundleItems: ["Tamarind", "Red Chili", "Coriander"],
    sizeOptions: [
      { label: "100g", price: "₹69" },
      { label: "200g", price: "₹129" },
      { label: "500g", price: "₹279" },
    ],
    usage: "Soak and squeeze pulp into curries, rasam, and chutneys. Store in a cool, dry place.",
    frequentlyBought: ["Turmeric", "Cumin", "Mustard Seeds"],
  },
  {
    slug: "kolli-hills-home-masala-mix",
    title: "Kolli Hills Home Masala Mix",
    description: "A balanced house masala blend for everyday cooking, made with authentic Indian spices.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹79",
    tag: "Everyday",
    rating: 4.7,
    reviews: 115,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Warm, savory, aromatic",
    heatLevel: "Medium",
    pairWith: ["Ginger", "Garlic", "Coriander"],
    bundlePrice: "₹199",
    bundleSave: "Save 14%",
    bundleItems: ["Masala Mix", "Turmeric", "Chili"],
    sizeOptions: [
      { label: "50g", price: "₹79" },
      { label: "100g", price: "₹149" },
      { label: "200g", price: "₹279" },
    ],
    usage: "Use as a finishing spice mix for sambars, curries, and vegetable dishes.",
    frequentlyBought: ["Turmeric", "Cumin", "Coriander"],
  },
  {
    slug: "kolli-hills-white-pepper",
    title: "Kolli Hills White Pepper",
    description: "Smooth white peppercorns with mild heat, perfect for light gravies, sauces, and soups.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹99",
    tag: "Smooth",
    rating: 4.6,
    reviews: 114,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Mild, earthy, slightly sharp",
    heatLevel: "Medium",
    pairWith: ["Cream", "Fish", "Potatoes"],
    bundlePrice: "₹239",
    bundleSave: "Save 13%",
    bundleItems: ["White Pepper", "Ginger", "Garlic"],
    sizeOptions: [
      { label: "25g", price: "₹59" },
      { label: "50g", price: "₹99" },
      { label: "100g", price: "₹179" },
    ],
    usage: "Grind into light sauces, soups, and seafood dishes. Store in a sealed jar away from heat.",
    frequentlyBought: ["Turmeric", "Cloves", "Cinnamon"],
  },
  {
    slug: "kolli-hills-dried-ginger",
    title: "Kolli Hills Dried Ginger",
    description: "Aromatic dried ginger pieces for masalas, herbal teas, and digestive blends.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹69",
    tag: "Zesty",
    rating: 4.5,
    reviews: 97,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Sharp, warming, slightly sweet",
    heatLevel: "Medium",
    pairWith: ["Turmeric", "Honey", "Lemon"],
    bundlePrice: "₹179",
    bundleSave: "Save 12%",
    bundleItems: ["Dried Ginger", "Turmeric", "Black Pepper"],
    sizeOptions: [
      { label: "50g", price: "₹39" },
      { label: "100g", price: "₹69" },
      { label: "200g", price: "₹129" },
    ],
    usage: "Use in spice blends, tea, and marinades. Keep in airtight packaging to preserve aroma.",
    frequentlyBought: ["Turmeric", "Honey", "Cloves"],
  },
  {
    slug: "kolli-hill-coffee-powder",
    title: "Kolli Hill Coffee Powder",
    description: "Rich Kolli Hills coffee powder brewed for strong, aromatic filter coffee and espresso blends.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹149",
    tag: "Bold",
    rating: 4.8,
    reviews: 214,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Bold, earthy, chocolate notes",
    heatLevel: "None",
    pairWith: ["Milk", "Cardamom", "Sugar"],
    bundlePrice: "₹329",
    bundleSave: "Save 11%",
    bundleItems: ["Coffee Powder", "Cardamom", "Jaggery"],
    sizeOptions: [
      { label: "100g", price: "₹149" },
      { label: "200g", price: "₹279" },
      { label: "500g", price: "₹649" },
    ],
    usage: "Brew as filter coffee or espresso. Store in an airtight container to keep the aroma fresh.",
    frequentlyBought: ["Cardamom", "Cloves", "Ginger"],
  },
  {
    slug: "fennel-seeds-saunf",
    title: "Fennel Seeds (Saunf)",
    description: "Sweet and cooling fennel seeds used in spice blends, digestive mixes, and confectionery.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹59",
    tag: "Cooling",
    rating: 4.5,
    reviews: 123,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Sweet, licorice-like, refreshing",
    heatLevel: "Mild",
    pairWith: ["Panch Phoron", "Cumin", "Coriander"],
    bundlePrice: "₹149",
    bundleSave: "Save 10%",
    bundleItems: ["Fennel", "Cumin", "Mustard Seeds"],
    sizeOptions: [
      { label: "50g", price: "₹39" },
      { label: "100g", price: "₹59" },
      { label: "200g", price: "₹109" },
    ],
    usage: "Use in pickles, masalas, and digestive teas. Chew after meals for a refreshing finish.",
    frequentlyBought: ["Coriander", "Mustard Seeds", "Cardamom"],
  },
  {
    slug: "mustard-seeds",
    title: "Mustard Seeds",
    description: "Essential Indian mustard seeds for tempering dals, curries, and pickles.",
    location: "India",
    price: "₹39",
    tag: "Essential",
    rating: 4.4,
    reviews: 98,
    origin: "India",
    flavor: "Pungent, slightly bitter",
    heatLevel: "Medium",
    pairWith: ["Fenugreek", "Curry Leaves", "Cumin"],
    bundlePrice: "₹99",
    bundleSave: "Save 11%",
    bundleItems: ["Mustard Seeds", "Fenugreek Seeds", "Curry Leaves"],
    sizeOptions: [
      { label: "50g", price: "₹25" },
      { label: "100g", price: "₹39" },
      { label: "200g", price: "₹69" },
    ],
    usage: "Temper in hot oil for dals, pickles, and chutneys. Store in a sealed jar to preserve the spice.",
    frequentlyBought: ["Fenugreek Seeds", "Cumin", "Turmeric"],
  },
  {
    slug: "fenugreek-seeds",
    title: "Fenugreek Seeds",
    description: "Bitter-sweet fenugreek seeds used in dals, curries, and spice blends.",
    location: "India",
    price: "₹45",
    tag: "Tradition",
    rating: 4.4,
    reviews: 102,
    origin: "India",
    flavor: "Bitter, nutty, aromatic",
    heatLevel: "Mild",
    pairWith: ["Mustard Seeds", "Turmeric", "Coriander"],
    bundlePrice: "₹119",
    bundleSave: "Save 10%",
    bundleItems: ["Fenugreek Seeds", "Mustard Seeds", "Cumin"],
    sizeOptions: [
      { label: "50g", price: "₹29" },
      { label: "100g", price: "₹45" },
      { label: "200g", price: "₹79" },
    ],
    usage: "Soak before using for better texture. Great in curries, vegetable dishes, and spice blends.",
    frequentlyBought: ["Mustard Seeds", "Curry Leaves", "Turmeric"],
  },
  {
    slug: "kolli-hills-honey",
    title: "Kolli Hills Honey",
    description: "Pure honey sourced from Kolli Hills wildflowers. Perfect for tea, desserts, and natural remedies.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹249",
    tag: "Pure",
    rating: 4.9,
    reviews: 278,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Floral, sweet, smooth",
    heatLevel: "None",
    pairWith: ["Lemon", "Ginger", "Turmeric"],
    bundlePrice: "₹599",
    bundleSave: "Save 15%",
    bundleItems: ["Honey", "Turmeric", "Ginger"],
    sizeOptions: [
      { label: "100g", price: "₹129" },
      { label: "250g", price: "₹249" },
      { label: "500g", price: "₹449" },
    ],
    usage: "Use as a natural sweetener in beverages, breakfast bowls, and marinades. Store in a cool place.",
    frequentlyBought: ["Turmeric", "Cinnamon", "Ginger"],
  },
  {
    slug: "kolli-hills-turmeric-powder",
    title: "Kolli Hills Turmeric Powder",
    description: "Finely ground turmeric powder for cooking, smoothies, and wellness rituals.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹69",
    tag: "Golden",
    rating: 4.8,
    reviews: 304,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Earthy, warm, mild bitterness",
    heatLevel: "Mild",
    pairWith: ["Black Pepper", "Coconut Milk", "Ginger"],
    bundlePrice: "₹179",
    bundleSave: "Save 13%",
    bundleItems: ["Turmeric Powder", "Black Pepper", "Cinnamon"],
    sizeOptions: [
      { label: "100g", price: "₹69" },
      { label: "200g", price: "₹129" },
      { label: "500g", price: "₹279" },
    ],
    usage: "Add to curries, soups, and smoothies. Store in airtight packaging away from heat and light.",
    frequentlyBought: ["Black Pepper", "Cumin", "Coriander"],
  },
  {
    slug: "kolli-hills-black-pepper-powder",
    title: "Kolli Hills Black Pepper Powder",
    description: "Ground black pepper with fragrant heat, ideal for seasoning salads, sauces, and marinades.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹89",
    tag: "Ground",
    rating: 4.7,
    reviews: 196,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Spicy, woody, sharp",
    heatLevel: "Medium",
    pairWith: ["Salt", "Garlic", "Lemon"],
    bundlePrice: "₹219",
    bundleSave: "Save 10%",
    bundleItems: ["Black Pepper Powder", "Turmeric", "Garlic"],
    sizeOptions: [
      { label: "50g", price: "₹89" },
      { label: "100g", price: "₹169" },
      { label: "200g", price: "₹329" },
    ],
    usage: "Sprinkle on savory dishes, eggs, and salads. Keep in a sealed container for fresh spice.",
    frequentlyBought: ["Salt", "Cumin", "Turmeric"],
  },
  {
    slug: "kolli-hills-white-pepper-powder",
    title: "Kolli Hills White Pepper Powder",
    description: "Fine white pepper powder with gentle heat, perfect for light sauces, soups, and seafood.",
    location: "Kolli Hills, Tamil Nadu",
    price: "₹79",
    tag: "Delicate",
    rating: 4.6,
    reviews: 178,
    origin: "Kolli Hills, Tamil Nadu",
    flavor: "Mild, earthy, slightly sharp",
    heatLevel: "Medium",
    pairWith: ["Fish", "Cream", "Vegetables"],
    bundlePrice: "₹199",
    bundleSave: "Save 12%",
    bundleItems: ["White Pepper Powder", "Salt", "Coriander"],
    sizeOptions: [
      { label: "50g", price: "₹79" },
      { label: "100g", price: "₹149" },
      { label: "200g", price: "₹279" },
    ],
    usage: "Use in light gravies, soups, and seafood dishes. Store away from moisture and strong odors.",
    frequentlyBought: ["Salt", "Cinnamon", "Turmeric"],
  },
];

export function getProducts() {
  return products.map((product) => ({
    ...product,
    category: product.category || inferProductCategory(product),
    stock: product.stock ?? 10,
    sizeOptions: normalizeSizeOptions(product),
  }));
}

function priceNumber(value: string) {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

function skuSlug(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function normalizeSizeOptions(product: Pick<Product, "slug" | "price" | "sizeOptions" | "stock">) {
  const targetWeights = [100, 250, 500, 1000];
  const existing = product.sizeOptions || [];
  const basePrice = priceNumber(product.price);

  return targetWeights.map((weight) => {
    const existingOption = existing.find((option) => Number(option.label.replace(/[^0-9]/g, "")) === weight);
    return {
      label: weight >= 1000 ? "1kg" : `${weight}g`,
      price: existingOption?.price || `₹${Math.round((basePrice * weight) / 100)}`,
      sku: existingOption?.sku || `${skuSlug(product.slug)}-${weight >= 1000 ? "1KG" : `${weight}G`}`,
      stock: existingOption?.stock ?? product.stock ?? 10,
    };
  });
}

export function getProduct(slug: string) {
  return getProducts().find((item) => item.slug === slug);
}
