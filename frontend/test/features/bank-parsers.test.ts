import {
  cleanTransactionNote,
  parseBankNotification,
  parseGenericBankNotification,
  parseRawAmount,
} from '../../src/features/bank-sync/utils/bankParsers';
import { suggestCategoryFromNote } from '../../src/features/bank-sync/utils/bankCategorySuggester';

describe('Bank Notification Parsers', () => {
  describe('parseRawAmount', () => {
    it('parses standard thousands with dot', () => {
      expect(parseRawAmount('50.000')).toBe(50000);
      expect(parseRawAmount('1.500.000')).toBe(1500000);
    });

    it('parses standard thousands with comma', () => {
      expect(parseRawAmount('50,000')).toBe(50000);
      expect(parseRawAmount('1,500,000')).toBe(1500000);
    });

    it('handles decimal formats', () => {
      expect(parseRawAmount('1,500.50')).toBe(1500.5);
      expect(parseRawAmount('1.500,50')).toBe(1500.5);
    });

    it('handles empty or zero', () => {
      expect(parseRawAmount('')).toBe(0);
      expect(parseRawAmount('abc')).toBe(0);
    });
  });

  describe('Vietcombank parser', () => {
    it('correctly parses expense notification', () => {
      const text =
        'TK 0011001234567 | GD: -65,000VND 16/11/26 12:15 | SD: 12,435,000VND | ND: Mua cafe Highlands';
      const parsed = parseBankNotification('Vietcombank', text, 'com.VCB');
      expect(parsed).not.toBeNull();
      expect(parsed?.bankCode).toBe('VCB');
      expect(parsed?.amount).toBe(65000);
      expect(parsed?.type).toBe('EXPENSE');
      expect(parsed?.note).toContain('Highlands');
      expect(parsed?.accountNumber).toBe('0011001234567');
      expect(parsed?.balance).toBe(12435000);
      expect(parsed?.suggestedCategoryName).toBe('Ăn uống');
    });

    it('correctly parses income notification', () => {
      const text =
        'TK 0011001234567 | GD: +15,000,000VND 16/11/26 09:30 | SD: 27,435,000VND | ND: Luong thang 11 Cty ABC';
      const parsed = parseBankNotification('Vietcombank', text, 'com.VCB');
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(15000000);
      expect(parsed?.type).toBe('INCOME');
      expect(parsed?.suggestedCategoryName).toBe('Lương & Thưởng');
    });
  });

  describe('Techcombank parser', () => {
    it('parses Techcombank balance change expense', () => {
      const text =
        'Biến động số dư: TK 19038291823... GD: -45,000 VND lúc 16/11/2026 08:30. Số dư: 4,500,000 VND. ND: Cafe sang Highlands';
      const parsed = parseBankNotification(
        'Techcombank',
        text,
        'vn.com.techcombank.bb.app',
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.bankCode).toBe('TCB');
      expect(parsed?.amount).toBe(45000);
      expect(parsed?.type).toBe('EXPENSE');
      expect(parsed?.balance).toBe(4500000);
      expect(parsed?.suggestedCategoryName).toBe('Ăn uống');
    });

    it('parses Techcombank income', () => {
      const text =
        'Giao dịch thành công: +2,000,000 VND từ NGUYEN VAN A. ND: Hoan tien mua hang';
      const parsed = parseBankNotification('Techcombank', text);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(2000000);
      expect(parsed?.type).toBe('INCOME');
      expect(parsed?.suggestedCategoryName).toBe('Thu nhập khác');
    });
  });

  describe('MB Bank parser', () => {
    it('parses MB Bank expense and category', () => {
      const text =
        'TK 0381029381 GD: -80,000VND vao 16/11/26 18:30. So du: 8,220,000VND. Noi dung: Do xang xe may Petrolimex';
      const parsed = parseBankNotification('MB Bank', text, 'com.mbmobile');
      expect(parsed).not.toBeNull();
      expect(parsed?.bankCode).toBe('MB');
      expect(parsed?.amount).toBe(80000);
      expect(parsed?.type).toBe('EXPENSE');
      expect(parsed?.suggestedCategoryName).toBe('Di chuyển');
    });
  });

  describe('MoMo parser', () => {
    it('parses MoMo payment to convenience store', () => {
      const text =
        'Thanh toán thành công 42.000đ cho Circle K. Mã GD: 12345678';
      const parsed = parseBankNotification(
        'MoMo',
        text,
        'com.mservice.momotransfer',
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.bankCode).toBe('MOMO');
      expect(parsed?.amount).toBe(42000);
      expect(parsed?.type).toBe('EXPENSE');
      expect(parsed?.suggestedCategoryName).toBe('Ăn uống');
    });

    it('parses MoMo receiving money', () => {
      const text =
        'Bạn vừa nhận được 250.000đ từ Tran Van B. Lời nhắn: Tien com trua';
      const parsed = parseBankNotification('MoMo', text);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(250000);
      expect(parsed?.type).toBe('INCOME');
    });
  });

  describe('Generic Fallback & cleaning', () => {
    it('parses generic SMS with minus sign and amount', () => {
      const text = 'Thong bao: -120.000 VND tai Shopee Mall. ND: Mua ao phong';
      const parsed = parseBankNotification('Thong bao ngan hang', text);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(120000);
      expect(parsed?.type).toBe('EXPENSE');
      expect(parsed?.suggestedCategoryName).toBe('Mua sắm');
    });

    it('returns null for unrelated notification', () => {
      const text = 'Thời tiết hôm nay nắng ráo, nhiệt độ 28 độ C.';
      const parsed = parseBankNotification('Báo mới', text);
      expect(parsed).toBeNull();
    });

    it('cleans ref codes and dates from note', () => {
      const rawNote = 'Cafe Highlands Ma GD: 98127391 16/11/2026 12:30';
      const cleaned = cleanTransactionNote(rawNote);
      expect(cleaned).toBe('Cafe Highlands');
    });
  });

  describe('Category Suggester', () => {
    it('maps food & drink correctly', () => {
      expect(suggestCategoryFromNote('Tra sua Phuc Long', 'EXPENSE').name).toBe(
        'Ăn uống',
      );
      expect(
        suggestCategoryFromNote('Starbucks Landmark', 'EXPENSE').name,
      ).toBe('Ăn uống');
    });

    it('maps utility bills correctly', () => {
      expect(
        suggestCategoryFromNote('Tien dien EVN thang 11', 'EXPENSE').name,
      ).toBe('Hóa đơn & Tiện ích');
      expect(
        suggestCategoryFromNote('Internet FPT Telecom', 'EXPENSE').name,
      ).toBe('Hóa đơn & Tiện ích');
    });

    it('maps salary correctly', () => {
      expect(
        suggestCategoryFromNote('Luong ky 1 thang 11', 'INCOME').name,
      ).toBe('Lương & Thưởng');
    });
  });
});
