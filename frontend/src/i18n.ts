import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Hero Section
      'hero.title': 'Delivering Rides, Food, Smoke, Liquor & Groceries — Anytime. Anywhere.',
      'hero.subtitle': 'From your city streets to the world\'s busiest capitals — DriftiX brings it all to your door.',
      'hero.download': '📲 Download App',
      'hero.enterCity': '🌍 Enter Your City',
      'hero.startOrder': '🚀 Start Your Order',

      // AI Section
      'ai.title': 'AI-Powered Suggestions',
      'ai.suggestions': {
        'ride': 'Need a ride to the beach?',
        'food': 'Hungry? Try our trending pizza place!',
        'grocery': 'Stock up on groceries with 20% off!',
        'smoke': 'New vape flavors just arrived!'
      },

      // Services Section
      'services.title': 'What We Deliver',
      'services.rideShare': 'Ride Share',
      'services.rideShareDesc': 'Global rides with local pricing',
      'services.foodDelivery': 'Food Delivery',
      'services.foodDeliveryDesc': 'Favorite meals, delivered fast',
      'services.groceryDelivery': 'Grocery Delivery',
      'services.groceryDeliveryDesc': 'Essentials from global/local stores',
      'services.smokeShop': 'Smoke Shop',
      'services.smokeShopDesc': 'Vapes, accessories, and more',
      'services.liquorDelivery': 'Liquor Delivery',
      'services.liquorDeliveryDesc': 'Drinks delivered — 24/7 (where legal)',

      // Cities Section
      'cities.title': 'Now Serving Over 250+ Cities Worldwide',

      // Deals Section
      'deals.title': '🔥 What\'s Hot Near You',
      'deals.rideDeals': '🚗 Ride Deals',
      'deals.rideDealsDesc': 'Get 20% off your first 5 rides',
      'deals.mealOffers': '🥡 Meal Offers',
      'deals.mealOffersDesc': 'Free delivery on orders over $20',
      'deals.cashback': '💸 Cashback',
      'deals.cashbackDesc': '5% cashback at local stores',

      // Features Section
      'features.title': 'Why People Love DriftiX',
      'features.globalCoverage': 'Global coverage',
      'features.fastDelivery': 'Fast delivery',
      'features.noHiddenFees': 'No hidden fees',
      'features.smartAI': 'Smart AI matching',
      'features.securePayments': 'Secure payments',

      // Partner Section
      'partner.vendor.title': '👔 Own a Store? Sell worldwide.',
      'partner.vendor.desc': 'Join our network of vendors and reach customers across the globe.',
      'partner.vendor.cta': 'Become a Vendor',
      'partner.driver.title': '🚗 Want to Drive? Get paid your way.',
      'partner.driver.desc': 'Flexible hours, competitive rates, and the freedom to work when you want.',
      'partner.driver.cta': 'Join as a Driver',

      // Footer
      'footer.languages': 'Languages',
      'footer.support': 'Support',
      'footer.quickLinks': 'Quick Links',
      'footer.followUs': 'Follow Us',
      'footer.copyright': '© 2024 DriftiX. All rights reserved.',

      welcome: 'Welcome to DriftiX',
      description: 'Your All-in-One Delivery Platform',
      login: 'Login',
      register: 'Register',
      rideShare: 'Ride Share',
      foodDelivery: 'Food Delivery',
      smokeShop: 'Smoke Shop',
      liquorDelivery: 'Liquor Delivery'
    }
  },
  fr: {
    translation: {
      // Add French translations here
    }
  },
  ar: {
    translation: {
      // Add Arabic translations here
    }
  },
  es: {
    translation: {
      // Add Spanish translations here
    }
  },
  pt: {
    translation: {
      // Add Portuguese translations here
    }
  },
  hi: {
    translation: {
      // Add Hindi translations here
    }
  },
  zh: {
    translation: {
      // Add Chinese translations here
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n; 