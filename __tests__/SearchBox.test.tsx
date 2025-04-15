import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBox from '../src/components/SearchBox';

describe('SearchBox', () => {
  it('renders the search box', () => {
    render(<SearchBox />);
    expect(screen.getByPlaceholderText('Search for services, locations...')).toBeInTheDocument();
  });

  it('updates the search query when typing', () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText('Search for services, locations...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('test');
  });

  it('shows suggestions when typing', async () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText('Search for services, locations...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    await waitFor(() => {
      expect(screen.getByText('Trending Now')).toBeInTheDocument();
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('Nearby Locations')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText('Search for services, locations...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    await waitFor(() => {
      expect(screen.getByText('Best test')).toBeInTheDocument();
    });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const suggestion = screen.getByRole('option', { selected: true });
    expect(suggestion).toHaveClass('bg-gray-100');
  });

  it('handles suggestion selection', async () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText('Search for services, locations...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    await waitFor(() => {
      expect(screen.getByText('Best test')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Best test'));
    expect(input).toHaveValue('Best test');
  });
}); 