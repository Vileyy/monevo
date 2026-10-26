import {
  formatAmountInput,
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
  parseVndInput,
  walletTypeLabel,
} from '@/lib/format';
import { useSettingsStore } from '@/store/settings.store';
import { useCurrencyStore } from '@/store/currency.store';

describe('format utilities', () => {
  beforeEach(() => {
    useSettingsStore.setState({ currency: 'VND' });
    useCurrencyStore.setState({ rates: {} });
  });

  describe('formatCurrency', () => {
    it('should format VND correctly', () => {
      const formatted = formatCurrency(150000, 'VND');
      expect(formatted).toBe('150.000 ₫');
    });

    it('should format USD correctly', () => {
      const formatted = formatCurrency(1234.56, 'USD');
      expect(formatted).toBe('$1,234.56');
    });

    it('should format EUR correctly', () => {
      const formatted = formatCurrency(50.5, 'EUR');
      expect(formatted).toBe('€50,50');
    });

    it('should format JPY correctly', () => {
      const formatted = formatCurrency(2500, 'JPY');
      expect(formatted).toBe('¥2,500');
    });

    it('should convert a stored VND amount into the display currency', () => {
      useSettingsStore.setState({ currency: 'USD' });
      useCurrencyStore.setState({ rates: { USD: 0.00004 } });

      expect(formatCurrency(1500000)).toBe('$60.00');
    });

    it('should fall back to VND when the display rate is missing', () => {
      useSettingsStore.setState({ currency: 'USD' });

      expect(formatCurrency(1500000)).toBe('1.500.000 ₫');
    });

    it('should not convert when an explicit currency is passed', () => {
      useSettingsStore.setState({ currency: 'USD' });
      useCurrencyStore.setState({ rates: { USD: 0.00004 } });

      expect(formatCurrency(1500000, 'VND')).toBe('1.500.000 ₫');
    });
  });

  describe('parseVndInput', () => {
    it('should convert a display-currency amount back into VND', () => {
      useSettingsStore.setState({ currency: 'USD' });
      useCurrencyStore.setState({ rates: { USD: 0.00004 } });

      expect(parseVndInput('10')).toBe(250000);
      expect(parseVndInput('5.50')).toBe(137500);
    });

    it('should return zero for blank or invalid input', () => {
      expect(parseVndInput('')).toBe(0);
      expect(parseVndInput('abc')).toBe(0);
    });

    it('should keep raw input when no rate is available', () => {
      useSettingsStore.setState({ currency: 'USD' });

      expect(parseVndInput('10')).toBe(10);
    });
  });

  describe('formatAmountInput', () => {
    it('should prefill a converted amount for the display currency', () => {
      useSettingsStore.setState({ currency: 'USD' });
      useCurrencyStore.setState({ rates: { USD: 0.00004 } });

      expect(formatAmountInput(250000)).toBe('10');
      expect(formatAmountInput(251250)).toBe('10.05');
    });

    it('should prefill VND amounts unchanged', () => {
      expect(formatAmountInput(150000)).toBe('150.000');
    });
  });

  describe('parseCurrencyInput', () => {
    it('should parse integer amounts for VND', () => {
      expect(parseCurrencyInput('150.000', 'VND')).toBe(150000);
      expect(parseCurrencyInput('', 'VND')).toBe(0);
    });

    it('should parse float amounts for USD', () => {
      expect(parseCurrencyInput('123.45', 'USD')).toBe(123.45);
      expect(parseCurrencyInput('', 'USD')).toBe(0);
    });
  });

  describe('formatCurrencyInput', () => {
    it('should format integer inputs for VND', () => {
      expect(formatCurrencyInput('100000', 'VND')).toBe('100.000');
    });

    it('should clean float inputs for USD', () => {
      expect(formatCurrencyInput('123.45', 'USD')).toBe('123.45');
    });
  });

  describe('walletTypeLabel', () => {
    it('should return human readable labels', () => {
      expect(walletTypeLabel('CASH')).toBe('Cash');
      expect(walletTypeLabel('BANK')).toBe('Bank');
      expect(walletTypeLabel('CREDIT_CARD')).toBe('Card');
      expect(walletTypeLabel('OTHER')).toBe('OTHER');
    });
  });
});
