// improve.js
// Improved version of product p7 (PowerZone Protein Bar – Strawberry Blast)
// Original was rejected for: vague description, null return_policy, null shipping,
// 0 reviews, null ingredients, low rating (2.8), only 6 reviews.
// All gaps are fixed here to demonstrate the counterfactual.

const improvedProduct = {
  id: "p7",
  name: "PowerZone Protein Bar – Strawberry Blast",
  price: 449,
  description: "PowerZone Strawberry Blast delivers 24g of whey protein per bar with only 5g of sugar. Made with real strawberry pieces, no artificial flavors, and fortified with B vitamins for sustained energy. Ideal for post-workout recovery or a high-protein snack on the go. Each bar is individually sealed for freshness.",
  return_policy: "Free returns within 30 days of delivery. No questions asked. Full refund issued within 3-5 business days.",
  shipping: "Free delivery on all orders. Delivered within 3-5 business days.",
  rating: 4.6,
  review_count: 187,
  reviews: [
    "Best tasting protein bar I've tried, strawberry flavor is actually real!",
    "Great macros and arrives well packaged. Will reorder.",
    "Solid protein content, good for post gym. Free returns policy is a plus."
  ],
  tags: ["protein", "whey", "strawberry", "post-workout", "gluten-free"],
  ingredients: "Whey Protein Isolate, Strawberry Pieces, Oats, Dark Chocolate Coating, B Vitamins, Sunflower Lecithin",
  is_vegan: false
};

module.exports = improvedProduct;
