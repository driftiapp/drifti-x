import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ServiceMarker } from './ServiceMarker';
import { Service } from '@/types/services';
import { serviceIcons } from '@/types/serviceIcons';

// Mock the Audio constructor
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  currentTime: 0,
  volume: 0.5,
}));

// Mock fetch for Google Maps API
global.fetch = jest.fn();

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

// @ts-ignore - Mocking navigator.geolocation
global.navigator.geolocation = mockGeolocation;

describe('ServiceMarker', () => {
  const mockService: Service = {
    id: '1',
    name: 'Test Service',
    type: 'ride',
    description: 'Test description',
    coordinates: [-122.4194, 37.7749],
    location: { lat: 37.7749, lng: -122.4194 },
    price: 10,
    rating: 4.5,
    image: 'test.jpg',
    available: true,
    isActive: true,
  };

  const mockUserLocation = {
    lat: 37.7749,
    lng: -122.4194,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders marker with correct icon and color', () => {
    render(
      <ServiceMarker
        service={mockService}
        onClick={jest.fn()}
        userLocation={mockUserLocation}
      />
    );

    const marker = screen.getByText(serviceIcons[mockService.type].emoji);
    expect(marker).toBeInTheDocument();
  });

  it('shows hover popup with service details', async () => {
    render(
      <ServiceMarker
        service={mockService}
        onClick={jest.fn()}
        userLocation={mockUserLocation}
      />
    );

    const marker = screen.getByText(serviceIcons[mockService.type].emoji);
    fireEvent.mouseEnter(marker);

    expect(screen.getByText(mockService.name)).toBeInTheDocument();
    expect(screen.getByText('Live Now')).toBeInTheDocument();
    expect(screen.getByText('Get Directions')).toBeInTheDocument();
  });

  it('displays distance and ETA from Google Maps API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        status: 'OK',
        rows: [{
          elements: [{
            status: 'OK',
            distance: { text: '2.3 miles' },
            duration: { text: '8 mins' }
          }]
        }]
      })
    });

    render(
      <ServiceMarker
        service={mockService}
        onClick={jest.fn()}
        userLocation={mockUserLocation}
      />
    );

    const marker = screen.getByText(serviceIcons[mockService.type].emoji);
    fireEvent.mouseEnter(marker);

    await screen.findByText('2.3 miles');
    expect(screen.getByText('8 mins')).toBeInTheDocument();
  });

  it('falls back to haversine calculation when API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <ServiceMarker
        service={mockService}
        onClick={jest.fn()}
        userLocation={mockUserLocation}
      />
    );

    const marker = screen.getByText(serviceIcons[mockService.type].emoji);
    fireEvent.mouseEnter(marker);

    // Haversine calculation should show 0.0 miles for same location
    await screen.findByText('0.0 miles');
    expect(screen.getByText('0 min')).toBeInTheDocument();
  });

  it('handles audio playback on click', () => {
    const mockOnClick = jest.fn();
    render(
      <ServiceMarker
        service={mockService}
        onClick={mockOnClick}
        userLocation={mockUserLocation}
      />
    );

    const marker = screen.getByText(serviceIcons[mockService.type].emoji);
    fireEvent.click(marker);

    expect(mockOnClick).toHaveBeenCalledWith(mockService);
    expect(global.Audio).toHaveBeenCalled();
  });

  it('opens directions in new tab when Get Directions is clicked', () => {
    const mockOpen = jest.fn();
    // @ts-ignore - Mocking window.open
    global.open = mockOpen;

    render(
      <ServiceMarker
        service={mockService}
        onClick={jest.fn()}
        userLocation={mockUserLocation}
      />
    );

    const marker = screen.getByText(serviceIcons[mockService.type].emoji);
    fireEvent.mouseEnter(marker);

    const directionsButton = screen.getByText('Get Directions');
    fireEvent.click(directionsButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps/dir'),
      '_blank'
    );
  });

  it('shows new marker animation when isNew prop is true', () => {
    const { container } = render(
      <ServiceMarker
        service={mockService}
        onClick={jest.fn()}
        isNew={true}
        userLocation={mockUserLocation}
      />
    );

    const marker = container.querySelector('.relative');
    expect(marker).toHaveStyle({
      transform: 'scale(1)',
      opacity: '1',
    });
  });

  it('displays active status indicator when service is active', () => {
    render(
      <ServiceMarker
        service={mockService}
        onClick={jest.fn()}
        userLocation={mockUserLocation}
      />
    );

    const activeIndicator = screen.getByTestId('active-indicator');
    expect(activeIndicator).toBeInTheDocument();
    expect(activeIndicator).toHaveClass('bg-green-500');
  });
}); 