import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Clock, Search, Mic, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ServiceId } from '../types/services';

interface OnboardingModalProps {
  serviceType: ServiceId;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onSearch: (query: string) => void;
  onSchedule: (time: Date) => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  serviceType,
  onClose,
  onLocationSelect,
  onSearch,
  onSchedule
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Request user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title'),
      description: t('onboarding.welcome.description'),
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      id: 'location',
      title: t('onboarding.location.title'),
      description: t('onboarding.location.description'),
      icon: <MapPin className="w-6 h-6" />,
      action: () => {
        if (userLocation) {
          onLocationSelect(userLocation);
          setCurrentStep(prev => prev + 1);
        }
      }
    },
    {
      id: 'search',
      title: t('onboarding.search.title'),
      description: t('onboarding.search.description'),
      icon: <Search className="w-6 h-6" />,
      action: () => {
        onSearch('');
        setCurrentStep(prev => prev + 1);
      }
    },
    {
      id: 'schedule',
      title: t('onboarding.schedule.title'),
      description: t('onboarding.schedule.description'),
      icon: <Clock className="w-6 h-6" />,
      action: () => {
        onSchedule(new Date());
        setCurrentStep(prev => prev + 1);
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {steps[currentStep].icon}
              <h2 id="onboarding-title" className="text-lg font-semibold">
                {steps[currentStep].title}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close onboarding"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="p-6">
              <p className="text-gray-600 mb-6">
                {steps[currentStep].description}
              </p>

              <div className="flex flex-col gap-4">
                {steps[currentStep].action && (
                  <Button
                    onClick={steps[currentStep].action}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t('onboarding.continue')
                    )}
                  </Button>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    {t('onboarding.back')}
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleNext}
                  >
                    {currentStep === steps.length - 1
                      ? t('onboarding.finish')
                      : t('onboarding.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 