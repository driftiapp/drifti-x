import { serviceIcons } from './serviceIcons';

describe('serviceIcons', () => {
  it('should have all required service types', () => {
    const expectedTypes = ['ride', 'food', 'vape', 'liquor'];
    expect(Object.keys(serviceIcons)).toEqual(expect.arrayContaining(expectedTypes));
  });

  it('should have correct structure for each service type', () => {
    Object.entries(serviceIcons).forEach(([type, icon]) => {
      expect(icon).toHaveProperty('emoji');
      expect(icon).toHaveProperty('color');
      expect(icon).toHaveProperty('hoverColor');
      expect(typeof icon.emoji).toBe('string');
      expect(typeof icon.color).toBe('string');
      expect(typeof icon.hoverColor).toBe('string');
    });
  });

  it('should have unique emojis for each service type', () => {
    const emojis = Object.values(serviceIcons).map(icon => icon.emoji);
    const uniqueEmojis = new Set(emojis);
    expect(emojis.length).toBe(uniqueEmojis.size);
  });
}); 