import React from 'react';
import ServiceCard from './ServiceCard';

const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: '🚗',
      title: 'Rides',
      description: 'Get anywhere in the city with our reliable ride service.',
      color: 'blue' as const,
      price: 'From $5',
      features: [
        '24/7 Availability',
        'Professional Drivers',
        'Real-time Tracking',
        'Multiple Vehicle Options'
      ]
    },
    {
      icon: '🍔',
      title: 'Food',
      description: 'Order from your favorite restaurants and get it delivered fast.',
      color: 'red' as const,
      price: 'Free Delivery*',
      features: [
        '100+ Restaurants',
        '30-min Delivery',
        'Live Order Tracking',
        'Exclusive Deals'
      ]
    },
    {
      icon: '🚬',
      title: 'Smoke',
      description: 'Premium tobacco products delivered to your doorstep.',
      color: 'purple' as const,
      price: 'Age 18+ Only',
      features: [
        'Wide Selection',
        'Discreet Packaging',
        'Age Verification',
        'Premium Brands'
      ]
    },
    {
      icon: '🍷',
      title: 'Liquor',
      description: 'Wide selection of alcoholic beverages available for delivery.',
      color: 'yellow' as const,
      price: 'Age 21+ Only',
      features: [
        'Premium Selection',
        'Cold Delivery',
        'Age Verification',
        'Special Offers'
      ]
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
          Our Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              color={service.color}
              price={service.price}
              features={service.features}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection; 