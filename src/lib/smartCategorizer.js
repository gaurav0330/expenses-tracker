// Smart Merchant & Keyword to Category Mapping Dictionary
// Covers top Indian & Global digital brands, food, transport, entertainment, shopping, utility & healthcare keywords

const KEYWORD_MAP = [
  // 1. Food & Dining
  {
    category: 'Food & Dining',
    keywords: [
      'swiggy', 'zomato', 'starbucks', 'mcdonald', 'mcd', 'kfc', 'burger king', 'domino', 
      'pizza', 'subway', 'chai', 'coffee', 'cafe', 'restaurant', 'dhaba', 'hotel', 'biryani',
      'blinkit', 'zepto', 'instamart', 'grofers', 'bigbasket', 'dmart', 'supermarket', 'grocery',
      'haldiram', 'barbeque', 'bbq', 'lunch', 'dinner', 'breakfast', 'brunch', 'bakery', 'cake',
      'sweet', 'sweets', 'snack', 'snacks', 'food', 'eatclub', 'faasos', 'behrouz', 'bakingo'
    ]
  },
  // 2. Transportation & Fuel
  {
    category: 'Transportation',
    keywords: [
      'uber', 'ola', 'rapido', 'petrol', 'diesel', 'fuel', 'cng', 'shell', 'hpcl', 'bpcl', 
      'iocl', 'indian oil', 'hindustan petroleum', 'bharat petroleum', 'fastag', 'toll', 
      'metro', 'bus', 'auto', 'rickshaw', 'cab', 'taxi', 'parking', 'mechanic', 'car wash', 
      'garage', 'chalan', 'challan', 'flight', 'indigo', 'air india', 'vistara', 'spicejet', 
      'akasa', 'irctc', 'railway', 'train', 'ticket', 'redbus', 'abhibus'
    ]
  },
  // 3. Entertainment & Streaming
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'hotstar', 'disney', 'prime video', 'amazon prime video', 'spotify', 
      'apple music', 'youtube', 'yt music', 'bookmyshow', 'bms', 'movie', 'cinema', 
      'pvr', 'inox', 'cinepolis', 'theatre', 'theater', 'steam', 'playstation', 'psn', 
      'xbox', 'gaming', 'pubg', 'bgmi', 'concert', 'event', 'audible', 'zee5', 'sonyliv'
    ]
  },
  // 4. Shopping & Retail
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'zara', 'h&m', 'hnm', 
      'tata cliq', 'reliance digital', 'croma', 'apple store', 'uniqlo', 'westside', 
      'max fashion', 'decathlon', 'shoes', 'clothing', 'clothes', 'dress', 'shirt', 
      'electronics', 'laptop', 'mobile', 'gadget', 'lenskart', 'retail', 'mall'
    ]
  },
  // 5. Bills & Utilities
  {
    category: 'Bills & Utilities',
    keywords: [
      'electricity', 'power bill', 'bescom', 'mseb', 'tneb', 'cesc', 'water bill', 'gas bill', 
      'cylinder', 'indane', 'hp gas', 'bharat gas', 'wifi', 'internet', 'broadband', 
      'airtel', 'jio', 'vi', 'vodafone', 'bsnl', 'recharge', 'dth', 'tata play', 'dish tv', 
      'rent', 'maintenance', 'society', 'utility', 'bills', 'electricity bill'
    ]
  },
  // 6. Health & Fitness
  {
    category: 'Health & Fitness',
    keywords: [
      'cult.fit', 'cultfit', 'cult', 'gym', 'fitness', 'workout', 'apollo', 'pharmacy', 
      'medplus', '1mg', 'tata 1mg', 'netmeds', 'pharmeasy', 'medicine', 'medicines', 
      'doctor', 'hospital', 'clinic', 'dentist', 'dental', 'pathology', 'blood test', 
      'lab test', 'supplement', 'protein', 'whey'
    ]
  },
  // 7. Travel & Vacation
  {
    category: 'Travel',
    keywords: [
      'makemytrip', 'mmt', 'goibibo', 'cleartrip', 'yatra', 'airbnb', 'oyo', 'agoda', 
      'booking.com', 'resort', 'vacation', 'holiday', 'trip', 'tour', 'homestay', 'hostel'
    ]
  },
  // 8. Salary & Professional Inflow
  {
    category: 'Salary',
    keywords: [
      'salary', 'payroll', 'stipend', 'bonus', 'incentive', 'freelance', 'consulting', 
      'client payout', 'dividend', 'honorarium'
    ]
  },
  // 9. SIP / Investment
  {
    category: 'SIP / Investment',
    keywords: [
      'zerodha', 'groww', 'angelone', 'upstox', 'coin', 'kite', 'mutual fund', 'sip', 
      'stock', 'stocks', 'shares', 'equity', 'gold', 'sovereign gold', 'ppf', 'nps', 
      'epf', 'fixed deposit', 'fd', 'rd'
    ]
  },
  // 10. Lending & Debts
  {
    category: 'Lending',
    keywords: [
      'lent', 'borrow', 'loan to', 'udhar', 'splitwise', 'settled', 'returned by', 
      'given to'
    ]
  }
];

/**
 * Automatically inspects a transaction description and infers the category
 * @param {string} text - Transaction description or merchant name
 * @param {Array<string>} availableCategories - List of user categories to match against
 * @returns {{ category: string, matchedKeyword: string } | null}
 */
export function detectCategory(text, availableCategories = []) {
  if (!text || typeof text !== 'string') return null;
  
  const clean = text.toLowerCase().trim();
  if (clean.length < 2) return null;

  for (const group of KEYWORD_MAP) {
    for (const kw of group.keywords) {
      // Word boundary match or substring for longer distinct keywords
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(clean) || (kw.length >= 4 && clean.includes(kw))) {
        // Find if this category exists in user's available categories (case-insensitive)
        const matchedCategory = availableCategories.find(
          c => c.toLowerCase() === group.category.toLowerCase()
        ) || group.category;

        return {
          category: matchedCategory,
          matchedKeyword: kw
        };
      }
    }
  }

  return null;
}
