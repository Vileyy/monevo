import { BankCode, BankMetadata, ParsedBankTransaction } from '../types';
import { suggestCategoryFromNote } from './bankCategorySuggester';

export const SUPPORTED_BANKS: Record<BankCode, BankMetadata> = {
  TCB: {
    code: 'TCB',
    name: 'Techcombank',
    shortName: 'Techcombank',
    packageNames: ['vn.com.techcombank.bb.app', 'com.techcombank.mobile'],
    brandColor: '#E11B22',
    badgeBg: '#FEE2E2',
  },
  VCB: {
    code: 'VCB',
    name: 'Vietcombank',
    shortName: 'VCB Digibank',
    packageNames: ['com.VCB', 'com.vcb.digibank'],
    brandColor: '#005F37',
    badgeBg: '#DCFCE7',
  },
  MB: {
    code: 'MB',
    name: 'MB Bank',
    shortName: 'MB Bank',
    packageNames: ['com.mbmobile'],
    brandColor: '#0033A0',
    badgeBg: '#DBEAFE',
  },
  VPB: {
    code: 'VPB',
    name: 'VPBank NEO',
    shortName: 'VPBank',
    packageNames: ['com.vpb.mbanking', 'com.vpbank.neo'],
    brandColor: '#009A44',
    badgeBg: '#D1FAE5',
  },
  ACB: {
    code: 'ACB',
    name: 'ACB ONE',
    shortName: 'ACB',
    packageNames: ['mobile.acb.com.vn'],
    brandColor: '#005BAA',
    badgeBg: '#E0F2FE',
  },
  TPB: {
    code: 'TPB',
    name: 'TPBank Mobile',
    shortName: 'TPBank',
    packageNames: ['com.tpb.mb.gprsandroid'],
    brandColor: '#8B2188',
    badgeBg: '#F3E8FF',
  },
  BIDV: {
    code: 'BIDV',
    name: 'BIDV SmartBanking',
    shortName: 'BIDV',
    packageNames: ['com.vnpay.bidv'],
    brandColor: '#006A72',
    badgeBg: '#CCFBF1',
  },
  CTG: {
    code: 'CTG',
    name: 'VietinBank iPay',
    shortName: 'VietinBank',
    packageNames: ['com.vietinbank.ipay'],
    brandColor: '#0072CE',
    badgeBg: '#E0F2FE',
  },
  MOMO: {
    code: 'MOMO',
    name: 'MoMo',
    shortName: 'MoMo',
    packageNames: ['com.mservice.momotransfer'],
    brandColor: '#A50064',
    badgeBg: '#FCE7F3',
  },
  ZALOPAY: {
    code: 'ZALOPAY',
    name: 'ZaloPay',
    shortName: 'ZaloPay',
    packageNames: ['vn.com.vng.zalopay'],
    brandColor: '#0068FF',
    badgeBg: '#DBEAFE',
  },
  GENERIC: {
    code: 'GENERIC',
    name: 'Ngân hàng khác',
    shortName: 'Ngân hàng',
    packageNames: [],
    brandColor: '#0D9488',
    badgeBg: '#E6F7F5',
  },
};

/**
 * Clean numeric string from thousands separators (e.g. "1,500,000" or "1.500.000")
 */
export function parseRawAmount(rawAmountStr: string): number {
  if (!rawAmountStr) return 0;
  const cleaned = rawAmountStr.trim().replace(/\s+/g, '');

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  let normalized = cleaned;
  if (hasComma && hasDot) {
    const lastCommaIndex = cleaned.lastIndexOf(',');
    const lastDotIndex = cleaned.lastIndexOf('.');
    if (lastDotIndex > lastCommaIndex) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasDot) {
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      normalized = cleaned.replace(/\./g, '');
    }
  } else if (hasComma) {
    const parts = cleaned.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      normalized = cleaned.replace(',', '.');
    }
  }

  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : Math.abs(result);
}

/**
 * Detect bank from package name or title
 */
export function detectBankCode(
  packageName?: string,
  title?: string,
  content?: string,
): BankCode {
  if (packageName) {
    const pkgLower = packageName.toLowerCase();
    for (const [code, meta] of Object.entries(SUPPORTED_BANKS)) {
      if (
        meta.packageNames.some((pkg) => pkgLower.includes(pkg.toLowerCase()))
      ) {
        return code as BankCode;
      }
    }
  }

  const combined = `${title || ''} ${content || ''}`.toLowerCase();
  if (combined.includes('techcombank') || combined.includes('tcb'))
    return 'TCB';
  if (combined.includes('vietcombank') || combined.includes('vcb'))
    return 'VCB';
  if (combined.includes('mbbank') || combined.includes('mb bank')) return 'MB';
  if (combined.includes('vpbank') || combined.includes('vpb')) return 'VPB';
  if (combined.includes('acb')) return 'ACB';
  if (combined.includes('tpbank') || combined.includes('tpb')) return 'TPB';
  if (combined.includes('bidv')) return 'BIDV';
  if (combined.includes('vietinbank') || combined.includes('ipay'))
    return 'CTG';
  if (combined.includes('momo')) return 'MOMO';
  if (combined.includes('zalopay')) return 'ZALOPAY';

  return 'GENERIC';
}

/**
 * Main parser: takes notification title and text, returns parsed transaction or null
 */
export function parseBankNotification(
  title?: string,
  text?: string,
  packageName?: string,
): ParsedBankTransaction | null {
  const fullText = `${title ? title + '. ' : ''}${text || ''}`.trim();
  if (!fullText) return null;

  const bankCode = detectBankCode(packageName, title, text);
  const bankMeta = SUPPORTED_BANKS[bankCode];

  let result: Partial<ParsedBankTransaction> | null = null;

  switch (bankCode) {
    case 'VCB':
      result = parseVietcombank(fullText);
      break;
    case 'TCB':
      result = parseTechcombank(fullText);
      break;
    case 'MB':
      result = parseMBBank(fullText);
      break;
    case 'VPB':
      result = parseVPBank(fullText);
      break;
    case 'ACB':
      result = parseACB(fullText);
      break;
    case 'TPB':
      result = parseTPBank(fullText);
      break;
    case 'BIDV':
      result = parseBIDV(fullText);
      break;
    case 'CTG':
      result = parseVietinBank(fullText);
      break;
    case 'MOMO':
      result = parseMoMo(fullText);
      break;
    case 'ZALOPAY':
      result = parseZaloPay(fullText);
      break;
    default:
      result = parseGenericBankNotification(fullText);
      break;
  }

  // If specific parser did not extract an amount, try generic fallback
  if (!result || !result.amount || result.amount <= 0) {
    result = parseGenericBankNotification(fullText);
  }

  if (!result || !result.amount || result.amount <= 0) {
    return null;
  }

  const transactionType = result.type || 'EXPENSE';
  const cleanNote = cleanTransactionNote(result.note || 'Giao dịch ngân hàng');
  const suggestedCategory = suggestCategoryFromNote(
    cleanNote,
    transactionType,
    fullText,
  ).name;

  return {
    id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bankCode,
    bankName: bankMeta.name,
    amount: result.amount,
    type: transactionType,
    note: cleanNote,
    accountNumber: result.accountNumber || null,
    balance: result.balance || null,
    suggestedCategoryName: suggestedCategory,
    timestamp: new Date().toISOString(),
    rawText: fullText,
  };
}

/**
 * 1. Vietcombank Parser
 * Format: TK 0011001234567 | GD: +500,000VND 16/11/26 09:30 | SD: 12,500,000VND | ND: Luong thang 11
 */
function parseVietcombank(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const gdMatch = text.match(/GD:\s*([+-])\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const sdMatch = text.match(/SD:\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const ndMatch = text.match(/(?:\bND|\bNội dung|\bNoi dung):\s*([^|.\n]+)/i);

  if (gdMatch) {
    const sign = gdMatch[1];
    const amount = parseRawAmount(gdMatch[2]);
    return {
      amount,
      type: sign === '+' ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: sdMatch ? parseRawAmount(sdMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch Vietcombank',
    };
  }

  return null;
}

/**
 * 2. Techcombank Parser
 * Format: Biến động số dư: TK 1903... GD: -45,000 VND lúc 16/11/2026 08:30. Số dư: 4,500,000 VND. ND: Cafe sang Highlands
 */
function parseTechcombank(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const amountMatch = text.match(
    /(?:GD:|thành công:?)\s*([+-])?\s*([0-9,.]+)\s*(?:VND|đ)/i,
  );
  const balanceMatch = text.match(/Số dư:?\s*([0-9,.]+)\s*(?:VND|đ)/i);
  const ndMatch = text.match(
    /(?:\bND\b|\bNội dung\b|\bNoi dung\b|\bLời nhắn\b|\bLoi nhan\b):?\s*([^.\n|]+)/i,
  );

  if (amountMatch) {
    const sign = amountMatch[1];
    const amount = parseRawAmount(amountMatch[2]);
    const isIncome =
      sign === '+' ||
      text.toLowerCase().includes('nhận được') ||
      text.toLowerCase().includes('cộng tiền');

    return {
      amount,
      type: isIncome ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: balanceMatch ? parseRawAmount(balanceMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch Techcombank',
    };
  }

  return null;
}

/**
 * 3. MB Bank Parser
 * Format: TK 0381029381 GD: +1,500,000VND vao 16/11/26 10:15. So du: 8,300,000VND. Noi dung: KH chuyen khoan
 */
function parseMBBank(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const gdMatch = text.match(/GD:\s*([+-])\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const sdMatch = text.match(/(?:So du|SD):?\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const ndMatch = text.match(
    /(?:\bNoi dung\b|\bNội dung\b|\bND\b):?\s*([^.\n]+)/i,
  );

  if (gdMatch) {
    const sign = gdMatch[1];
    const amount = parseRawAmount(gdMatch[2]);
    return {
      amount,
      type: sign === '+' ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: sdMatch ? parseRawAmount(sdMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch MB Bank',
    };
  }

  return null;
}

/**
 * 4. VPBank Parser
 * Format: VPBank NEO: TK 123456789 GD: -35,000 VND luc 16/11/26 07:15. So du: 1,850,000 VND. ND: Phuc Long Tea
 */
function parseVPBank(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const gdMatch = text.match(/GD:\s*([+-])\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const sdMatch = text.match(/(?:So du|SD):?\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const ndMatch = text.match(
    /(?:\bND\b|\bNoi dung\b|\bNội dung\b):?\s*([^.\n]+)/i,
  );

  if (gdMatch) {
    const sign = gdMatch[1];
    const amount = parseRawAmount(gdMatch[2]);
    return {
      amount,
      type: sign === '+' ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: sdMatch ? parseRawAmount(sdMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch VPBank',
    };
  }

  return null;
}

/**
 * 5. ACB Parser
 * Format: ACB: TK 987654321 GD: -120,000 VND 16/11/26. So du: 3,450,000 VND. ND: Mua sam Bach Hoa Xanh
 */
function parseACB(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const gdMatch = text.match(/GD:\s*([+-])\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const sdMatch = text.match(/(?:So du|SD):?\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const ndMatch = text.match(
    /(?:\bND\b|\bNoi dung\b|\bNội dung\b):?\s*([^.\n]+)/i,
  );

  if (gdMatch) {
    const sign = gdMatch[1];
    const amount = parseRawAmount(gdMatch[2]);
    return {
      amount,
      type: sign === '+' ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: sdMatch ? parseRawAmount(sdMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch ACB',
    };
  }

  return null;
}

/**
 * 6. TPBank Parser
 * Format: TPBank: TK 01928374 GD: -55,000 VND 16/11 09:00. SD: 945,000 VND. ND: GrabFood
 */
function parseTPBank(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const gdMatch = text.match(/GD:\s*([+-])\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const sdMatch = text.match(/SD:\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const ndMatch = text.match(
    /(?:\bND\b|\bNoi dung\b|\bNội dung\b):?\s*([^.\n]+)/i,
  );

  if (gdMatch) {
    const sign = gdMatch[1];
    const amount = parseRawAmount(gdMatch[2]);
    return {
      amount,
      type: sign === '+' ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: sdMatch ? parseRawAmount(sdMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch TPBank',
    };
  }

  return null;
}

/**
 * 7. BIDV Parser
 * Format: BIDV: TK 1201000... GD: +3,000,000 VND ngay 16/11. So du: 15,000,000 VND. ND: Thanh toan hop dong
 */
function parseBIDV(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const gdMatch = text.match(/GD:\s*([+-])\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const sdMatch = text.match(/(?:So du|SD):?\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const ndMatch = text.match(
    /(?:\bND\b|\bNoi dung\b|\bNội dung\b):?\s*([^.\n]+)/i,
  );

  if (gdMatch) {
    const sign = gdMatch[1];
    const amount = parseRawAmount(gdMatch[2]);
    return {
      amount,
      type: sign === '+' ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: sdMatch ? parseRawAmount(sdMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch BIDV',
    };
  }

  return null;
}

/**
 * 8. VietinBank Parser
 * Format: VietinBank: TK 1018273... GD: -50,000 VND. SD: 2,100,000 VND. ND: Circle K
 */
function parseVietinBank(text: string): Partial<ParsedBankTransaction> | null {
  const accountMatch = text.match(/TK\s*([0-9xX*]+)/i);
  const gdMatch = text.match(/GD:\s*([+-])\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const sdMatch = text.match(/SD:\s*([0-9,.]+)\s*(?:VND|đ)?/i);
  const ndMatch = text.match(
    /(?:\bND\b|\bNoi dung\b|\bNội dung\b):?\s*([^.\n]+)/i,
  );

  if (gdMatch) {
    const sign = gdMatch[1];
    const amount = parseRawAmount(gdMatch[2]);
    return {
      amount,
      type: sign === '+' ? 'INCOME' : 'EXPENSE',
      accountNumber: accountMatch ? accountMatch[1] : null,
      balance: sdMatch ? parseRawAmount(sdMatch[1]) : null,
      note: ndMatch ? ndMatch[1].trim() : 'Giao dịch VietinBank',
    };
  }

  return null;
}

/**
 * 9. MoMo Parser
 * Format: Thanh toán thành công 42.000đ cho Circle K. Mã GD: 123456
 * Or: Bạn vừa nhận được 200.000đ từ Nguyễn Văn A. Lời nhắn: Tiền ăn trưa
 */
function parseMoMo(text: string): Partial<ParsedBankTransaction> | null {
  const isIncome =
    text.toLowerCase().includes('nhận được') ||
    text.toLowerCase().includes('được hoàn');

  const amountMatch = text.match(
    /(?:thành công|nhận được|chuyển tiền|hoàn lại)\s*([0-9,.]+)\s*(?:đ|VND)/i,
  );
  const noteMatch = text.match(
    /(?:cho|tại|đến|từ|Lời nhắn:?)\s*([^.\n|]+?)(?:\.\s*Mã GD|Mã giao dịch|$)/i,
  );

  if (amountMatch) {
    const amount = parseRawAmount(amountMatch[1]);
    return {
      amount,
      type: isIncome ? 'INCOME' : 'EXPENSE',
      note: noteMatch ? noteMatch[1].trim() : 'Thanh toán MoMo',
    };
  }

  return null;
}

/**
 * 10. ZaloPay Parser
 * Format: Thanh toán 60.000đ thành công tại Phúc Long
 */
function parseZaloPay(text: string): Partial<ParsedBankTransaction> | null {
  const isIncome =
    text.toLowerCase().includes('nhận') ||
    text.toLowerCase().includes('hoàn tiền');
  const amountMatch = text.match(
    /(?:Thanh toán|Nhận|Chuyển)\s*([0-9,.]+)\s*(?:đ|VND)/i,
  );
  const noteMatch = text.match(/(?:tại|từ|cho|đến)\s*([^.\n|]+)/i);

  if (amountMatch) {
    const amount = parseRawAmount(amountMatch[1]);
    return {
      amount,
      type: isIncome ? 'INCOME' : 'EXPENSE',
      note: noteMatch ? noteMatch[1].trim() : 'Giao dịch ZaloPay',
    };
  }

  return null;
}

/**
 * 11. Generic Bank & SMS Fallback Parser
 * Catches any format with +/- amount or keywords
 */
export function parseGenericBankNotification(
  text: string,
): Partial<ParsedBankTransaction> | null {
  const explicitSignMatch = text.match(
    /([+-])\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+)?)\s*(?:VND|VNĐ|đ|Vnd|USD|\$)?/i,
  );

  if (explicitSignMatch) {
    const sign = explicitSignMatch[1];
    const amount = parseRawAmount(explicitSignMatch[2]);
    if (amount > 0) {
      const isIncome = sign === '+';
      const noteMatch = text.match(
        /(?:\bND\b|\bNội dung\b|\btại\b|\bcho\b|\btừ\b|\blời nhắn\b):?\s*([^.\n|]+)/i,
      );
      return {
        amount,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        note: noteMatch ? noteMatch[1].trim() : 'Giao dịch tự động',
      };
    }
  }

  const actionMatch = text.match(
    /(thanh toán|chuyển khoản|chuyển tiền|trừ tiền|chi tiêu|nhận được|cộng tiền|nạp tiền)\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+)?)\s*(?:VND|VNĐ|đ|Vnd)?/i,
  );

  if (actionMatch) {
    const action = actionMatch[1].toLowerCase();
    const amount = parseRawAmount(actionMatch[2]);
    if (amount > 0) {
      const isIncome =
        action.includes('nhận') ||
        action.includes('cộng') ||
        action.includes('nạp');
      const noteMatch = text.match(
        /(?:tại|cho|từ|đến|nội dung):?\s*([^.\n|]+)/i,
      );
      return {
        amount,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        note: noteMatch ? noteMatch[1].trim() : actionMatch[1],
      };
    }
  }

  return null;
}

/**
 * Remove clutter from bank notes (e.g., timestamps, transaction codes, ref numbers)
 */
export function cleanTransactionNote(note: string): string {
  return note
    .replace(
      /(?:Ref|Ma GD|Mã GD|Trace|FT|Trans ID|GD)[\s:]*[A-Za-z0-9_-]+/gi,
      '',
    )
    .replace(/\b\d{2}[/-]\d{2}[/-]\d{2,4}\b/g, '')
    .replace(/\b\d{2}:\d{2}(?::\d{2})?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
