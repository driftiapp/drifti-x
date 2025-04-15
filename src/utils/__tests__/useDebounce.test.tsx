import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should not have changed yet
    expect(result.current).toBe('initial');

    // Fast-forward time by 250ms
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    // Fast-forward time to 500ms
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle multiple rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Multiple rapid updates
    rerender({ value: 'update1', delay: 500 });
    rerender({ value: 'update2', delay: 500 });
    rerender({ value: 'update3', delay: 500 });

    // No change yet
    expect(result.current).toBe('initial');

    // Fast-forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should have the latest value
    expect(result.current).toBe('update3');
  });
}); 