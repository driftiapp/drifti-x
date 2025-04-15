import { useRef } from 'react';

export const useSound = (src: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.play();
    }
  };

  return play;
}; 