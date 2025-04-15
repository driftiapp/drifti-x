import { useCallback } from 'react';
import useSound from 'use-sound';

// Sound effect paths
const SOUND_EFFECTS = {
  ride: '/sfx/car-start.mp3',
  food: '/sfx/sizzle.mp3',
  vape: '/sfx/puff.mp3',
  liquor: '/sfx/bottle-pop.mp3'
} as const;

type ServiceType = keyof typeof SOUND_EFFECTS;

export const useServiceSounds = () => {
  // Initialize all sound effects
  const [playRideSound] = useSound(SOUND_EFFECTS.ride, { volume: 0.5 });
  const [playFoodSound] = useSound(SOUND_EFFECTS.food, { volume: 0.4 });
  const [playVapeSound] = useSound(SOUND_EFFECTS.vape, { volume: 0.3 });
  const [playLiquorSound] = useSound(SOUND_EFFECTS.liquor, { volume: 0.4 });

  const playServiceSound = useCallback((serviceType: ServiceType) => {
    switch (serviceType) {
      case 'ride':
        playRideSound();
        break;
      case 'food':
        playFoodSound();
        break;
      case 'vape':
        playVapeSound();
        break;
      case 'liquor':
        playLiquorSound();
        break;
    }
  }, [playRideSound, playFoodSound, playVapeSound, playLiquorSound]);

  return { playServiceSound };
}; 