import React, { useState, useCallback, useRef } from 'react';
import ReactMapGL, { NavigationControl, MapRef, ViewState } from 'react-map-gl';
import { Marker } from 'react-map-gl';
import { useRouter } from 'next/router';
import { SearchBox } from './SearchBox';
import { Service, ServiceId, Coordinate } from '../types/services';
import { Notification } from '../types/notifications';
import { ThemeMode } from '../types/theme';
import { THEME_STYLES } from '../types/theme';
import { ServicePanel, ExtendedService, ExtendedSearchResult } from './ServicePanel';
import { QuickLocations } from './QuickLocations';
import { ServiceCluster } from './ServiceCluster';
import { NotificationCenter } from './NotificationCenter';
import { TrendingWidget } from './TrendingWidget';
import VoiceConcierge from './VoiceConcierge';
import { AppDownload } from './AppDownload';
import { LandingHero } from './LandingHero';
import { ThemeSelector } from './ThemeSelector';
import { OnboardingModal } from './OnboardingModal';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceLocation, SearchResult, convertSearchResultToCoordinate, convertCoordinateToViewport, isSearchResult, isVoiceLocation, Location, convertLocationToCoordinate } from '../types/location';
import { SearchResult as GeocodingSearchResult } from '../types/geocoding';

// Define service bounds for Morocco
const SERVICE_BOUNDS: [number, number, number, number] = [-10, 28, 0, 36]; // Morocco bounds

interface MapNotification {
  id: string;
  service: Service;
  type: 'new' | 'update' | 'alert';
  message: string;
  timestamp: Date;
}

type MapStyle = typeof THEME_STYLES[keyof typeof THEME_STYLES]['mapStyle'];

interface MapOptions {
  maxBounds?: [number, number, number, number];
  interactive?: boolean;
  touchZoomRotate?: boolean;
  dragPan?: boolean;
  doubleClickZoom?: boolean;
  scrollZoom?: boolean;
}

interface MapProps {
  services: Service[];
  onServiceSelect: (service: Service | null) => void;
  selectedService: Service | null;
  showServicePanel: boolean;
  onServiceDeselect: () => void;
  activeFilters: ServiceId[];
  onFilterChange: (filters: ServiceId[]) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  notifications: MapNotification[];
  onNotificationClick: (service: Service) => void;
  onNotificationDismiss: (id: string) => void;
  mapboxToken: string;
  onLocationSelect?: (location: VoiceLocation | SearchResult) => void;
}

const Map: React.FC<MapProps> = ({
  services,
  onServiceSelect,
  selectedService,
  showServicePanel,
  onServiceDeselect,
  activeFilters,
  onFilterChange,
  theme,
  onThemeChange,
  notifications,
  onNotificationClick,
  onNotificationDismiss,
  mapboxToken,
  onLocationSelect
}) => {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const [viewport, setViewport] = useState<ViewState>({
    latitude: 31.7917,
    longitude: -7.0926,
    zoom: 6,
    bearing: 0,
    pitch: 0
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>(THEME_STYLES.clean.mapStyle);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceId | null>(null);

  const handleServiceSelect = useCallback((service: Service | null) => {
    if (service) {
      onServiceSelect(service);
      setViewport({
        ...viewport,
        latitude: service.location.lat,
        longitude: service.location.lng,
        zoom: 14
      });
    } else {
      onServiceSelect(null);
    }
  }, [onServiceSelect, viewport]);

  const handleServiceDeselect = useCallback(() => {
    onServiceDeselect();
  }, [onServiceDeselect]);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
    setMapVisible(true);
  }, []);

  const handleExplore = useCallback(() => {
    setShowHero(false);
    setMapVisible(true);
    setShowOnboarding(true);
  }, []);

  const handleThemeChange = useCallback((newTheme: 'clean' | 'luxe' | 'night') => {
    const themeMap = {
      clean: 'clean',
      luxe: 'luxe',
      night: 'dark'
    } as const;
    
    const mappedTheme = themeMap[newTheme] as ThemeMode;
    onThemeChange(mappedTheme);
    setMapStyle(THEME_STYLES[mappedTheme].mapStyle);
  }, [onThemeChange]);

  const handleNotificationClick = useCallback((service: Service) => {
    onNotificationClick(service);
  }, [onNotificationClick]);

  const handleNotificationDismiss = useCallback((id: string) => {
    onNotificationDismiss(id);
  }, [onNotificationDismiss]);

  const handleSearchResultSelect = (result: GeocodingSearchResult) => {
    if (!result) return;
    
    const searchResult: SearchResult = {
      id: result.id,
      name: result.name,
      location: result.location || '',
      coordinates: result.coordinates,
      type: 'search'
    };
    
    const coordinate = convertSearchResultToCoordinate(searchResult);
    const newViewport = convertCoordinateToViewport(coordinate);
    setViewport(prev => ({
      ...prev,
      ...newViewport,
      transitionDuration: 1000
    }));

    if (onLocationSelect) {
      onLocationSelect(searchResult);
    }
  };

  const handleVoiceLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    if (!location) return;

    const voiceLocation: VoiceLocation = {
      lat: location.lat,
      lng: location.lng,
      name: location.name,
      type: 'voice'
    };

    const coordinate: Coordinate = {
      lat: voiceLocation.lat,
      lng: voiceLocation.lng
    };
    
    const newViewport = convertCoordinateToViewport(coordinate);
    setViewport(prev => ({
      ...prev,
      ...newViewport,
      transitionDuration: 1000
    }));

    if (onLocationSelect) {
      onLocationSelect(voiceLocation);
    }
  };

  const handleVoiceFilterChange = useCallback((filters: string[]) => {
    onFilterChange(filters.map(filter => filter as ServiceId));
  }, [onFilterChange]);

  const handleOnboardingClose = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const handleOnboardingLocationSelect = useCallback((location: { lat: number; lng: number }) => {
    setViewport({
      ...viewport,
      latitude: location.lat,
      longitude: location.lng,
      zoom: 14
    });
  }, [viewport]);

  const handleOnboardingSearch = useCallback((query: string) => {
    console.log('Searching for:', query);
  }, []);

  const handleOnboardingSchedule = useCallback((time: Date) => {
    // Handle scheduling logic
  }, []);

  const handleQuickLocationSelect = useCallback((service: Service | Location | null) => {
    if (service) {
      if ('location' in service && service.location && typeof service.location === 'object') {
        // Handle Service type
        setViewport({
          ...viewport,
          latitude: service.location.lat,
          longitude: service.location.lng,
          zoom: 15
        });
      } else {
        // Handle Location type
        try {
          const coordinate = convertLocationToCoordinate(service as Location);
          setViewport({
            ...viewport,
            latitude: coordinate.lat,
            longitude: coordinate.lng,
            zoom: 15
          });
        } catch (error) {
          console.error('Failed to convert location:', error);
        }
      }
    }
  }, [viewport]);

  const mapOptions: MapOptions = {
    maxBounds: SERVICE_BOUNDS,
    interactive: mapVisible,
    touchZoomRotate: mapVisible,
    dragPan: mapVisible,
    doubleClickZoom: mapVisible,
    scrollZoom: mapVisible
  };

  return (
    <div className="relative w-full h-screen">
      <AnimatePresence>
        {showHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100]"
          >
            <LandingHero onExplore={handleExplore} mapRef={mapRef} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            serviceType={selectedServiceType || 'ride'}
            onClose={handleOnboardingClose}
            onLocationSelect={handleOnboardingLocationSelect}
            onSearch={handleOnboardingSearch}
            onSchedule={handleOnboardingSchedule}
          />
        )}
      </AnimatePresence>

      <div 
        id="map-section"
        className={`absolute inset-0 transition-opacity duration-500 ${mapVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <ReactMapGL
          ref={mapRef}
          {...viewport}
          width="100%"
          height="100%"
          mapStyle={mapStyle}
          onViewportChange={setViewport}
          mapboxApiAccessToken={mapboxToken}
          onLoad={handleMapLoad}
          {...mapOptions}
        >
          <NavigationControl 
            style={{ top: 10, right: 10 }} 
            showCompass={mapVisible}
            showZoom={mapVisible}
          />
          <ServiceCluster
            services={services}
            onServiceSelect={handleServiceSelect}
            activeFilters={activeFilters}
            selectedService={selectedService}
            viewport={viewport}
          />
          {services.map(service => (
            <Marker
              key={service.id}
              latitude={service.location.lat}
              longitude={service.location.lng}
            >
              <div
                className={`w-4 h-4 rounded-full ${THEME_STYLES[theme].accentColor} cursor-pointer`}
                onClick={() => handleServiceSelect(service)}
              />
            </Marker>
          ))}
        </ReactMapGL>

        <div className="absolute top-4 left-4 z-10">
          <SearchBox 
            onSelect={handleSearchResultSelect}
            onClear={() => handleServiceSelect(null)}
            mapboxToken={mapboxToken}
          />
        </div>

        <div className="absolute top-4 right-4 z-10">
          <ThemeSelector 
            currentTheme={theme === 'dark' ? 'night' : theme as 'clean' | 'luxe'}
            onThemeChange={handleThemeChange}
          />
        </div>

        <div className="absolute bottom-4 left-4 z-10">
          <QuickLocations 
            mapRef={mapRef}
            onSelect={handleQuickLocationSelect}
          />
        </div>

        <div className="absolute bottom-4 right-4 z-10">
          <VoiceConcierge 
            onLocationSelect={handleVoiceLocationSelect}
            onFilterChange={handleVoiceFilterChange}
          />
        </div>

        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <NotificationCenter
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onDismiss={handleNotificationDismiss}
          />
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <TrendingWidget 
            services={services}
            onServiceSelect={handleServiceSelect}
          />
        </div>

        <div className="absolute bottom-4 right-1/2 transform translate-x-1/2 z-10">
          <AppDownload />
        </div>
      </div>

      <AnimatePresence>
        {showServicePanel && selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-[90]"
          >
            <ServicePanel
              service={selectedService ? {
                ...selectedService,
                type: selectedService.id
              } as ExtendedService : null}
              onClose={handleServiceDeselect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Map;