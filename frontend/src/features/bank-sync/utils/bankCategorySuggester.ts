export interface CategorySuggestion {
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
}

interface CategoryRule {
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    name: 'Ăn uống',
    icon: 'restaurant',
    type: 'EXPENSE',
    keywords: [
      'cafe',
      'ca phe',
      'coffee',
      'highlands',
      'phuc long',
      'phúc long',
      'starbucks',
      'tra sua',
      'trà sữa',
      'the coffee house',
      'an sang',
      'an trua',
      'an toi',
      'pho',
      'phở',
      'bun',
      'bún',
      'banh mi',
      'bánh mì',
      'circle k',
      'ministop',
      '7-eleven',
      'gs25',
      'family mart',
      'grabfood',
      'shopeefood',
      'befood',
      'gofood',
      'baemin',
      'kfc',
      'lotteria',
      'mcdonald',
      'pizza',
      'nha hang',
      'nhà hàng',
      'quan an',
      'quán ăn',
      'quan nuoc',
      'quán nước',
      'buffet',
      'haidilao',
      'bbq',
    ],
  },
  {
    name: 'Mua sắm',
    icon: 'cart',
    type: 'EXPENSE',
    keywords: [
      'shopee',
      'lazada',
      'tiki',
      'tiktok shop',
      'sendo',
      'sieu thi',
      'siêu thị',
      'winmart',
      'co.op',
      'coopmart',
      'bach hoa xanh',
      'bách hóa xanh',
      'emart',
      'lottemart',
      'big c',
      'tops market',
      'zara',
      'uniqlo',
      'h&m',
      'quan ao',
      'quần áo',
      'thoi trang',
      'thời trang',
      'thegioididong',
      'tgdd',
      'fpt shop',
      'cellphones',
      'dien may',
      'điện máy',
      'mua hang',
      'mua hàng',
      'mua sam',
      'mua sắm',
    ],
  },
  {
    name: 'Di chuyển',
    icon: 'car',
    type: 'EXPENSE',
    keywords: [
      'grab',
      'be',
      'xanh sm',
      'gojek',
      'taxi',
      'mai linh',
      'vinasun',
      'xang',
      'xăng',
      'petrolimex',
      'pvoil',
      'gui xe',
      'gửi xe',
      've xe',
      'vé xe',
      've tau',
      'vé tàu',
      've may bay',
      'vé máy bay',
      'vietjet',
      'vietnam airlines',
      'bamboo',
      'epass',
      'vetc',
      'thu phi',
    ],
  },
  {
    name: 'Hóa đơn & Tiện ích',
    icon: 'receipt',
    type: 'EXPENSE',
    keywords: [
      'tien dien',
      'tiền điện',
      'evn',
      'tien nuoc',
      'tiền nước',
      'internet',
      'fpt',
      'vnpt',
      'viettel',
      'truyen hinh',
      'truyền hình',
      'hoc phi',
      'học phí',
      'tien nha',
      'tiền nhà',
      'tien phong',
      'tiền phòng',
      'phi chung cu',
      'phí chung cư',
      'phi quan ly',
      'napas',
      'dien luc',
      'điện lực',
    ],
  },
  {
    name: 'Sức khỏe',
    icon: 'medkit',
    type: 'EXPENSE',
    keywords: [
      'nha thuoc',
      'nhà thuốc',
      'pharmacy',
      'long chau',
      'long châu',
      'an khang',
      'pharmacity',
      'benh vien',
      'bệnh viện',
      'phong kham',
      'phòng khám',
      'kham benh',
      'khám bệnh',
      'thuoc',
      'nha khoa',
    ],
  },
  {
    name: 'Giải trí',
    icon: 'film',
    type: 'EXPENSE',
    keywords: [
      'netflix',
      'spotify',
      'youtube',
      'cgv',
      'lotte cinema',
      'bhd',
      'galaxy cinema',
      'rap chieu phim',
      'rạp chiếu phim',
      'steam',
      'playstation',
      'nintendo',
      'karaoke',
      'bida',
    ],
  },
  {
    name: 'Lương & Thưởng',
    icon: 'cash',
    type: 'INCOME',
    keywords: [
      'luong',
      'lương',
      'salary',
      'payroll',
      'thuong',
      'thưởng',
      'bonus',
      'hoa hong',
      'hoa hồng',
      'thù lao',
      'thu lao',
      'freelance',
      'thanh toan hop dong',
      'tam ung',
      'tạm ứng',
    ],
  },
  {
    name: 'Thu nhập khác',
    icon: 'trending-up',
    type: 'INCOME',
    keywords: [
      'nhan tien',
      'nhận tiền',
      'chuyen tien den',
      'hoan tien',
      'hoàn tiền',
      'cashback',
      'lai tiet kiem',
      'lãi tiết kiệm',
      'tra no',
      'trả nợ',
      'li xi',
      'lì xì',
    ],
  },
];

/**
 * Remove Vietnamese accents and convert to lower-case for matching
 */
export function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

/**
 * Checks whether text matches a keyword, respecting word boundaries for short words
 */
function matchesKeyword(text: string, keyword: string): boolean {
  const normText = normalizeVietnamese(text);
  const normKeyword = normalizeVietnamese(keyword);

  if (normKeyword.length <= 4) {
    // For short words (e.g. "com", "pho", "bun", "fpt", "evn"), enforce word boundaries
    const regex = new RegExp(
      `(^|\\s|[^a-z0-9])${normKeyword}($|\\s|[^a-z0-9])`,
      'i',
    );
    return regex.test(normText);
  }

  return normText.includes(normKeyword);
}

/**
 * Suggests an appropriate category name based on transaction note/text and type
 */
export function suggestCategoryFromNote(
  note: string,
  type: 'INCOME' | 'EXPENSE',
  fullContext?: string,
): CategorySuggestion {
  const relevantRules = CATEGORY_RULES.filter((rule) => rule.type === type);

  // Check specific note first
  for (const rule of relevantRules) {
    for (const keyword of rule.keywords) {
      if (matchesKeyword(note || '', keyword)) {
        return {
          name: rule.name,
          icon: rule.icon,
          type: rule.type,
        };
      }
    }
  }

  // If no match in note, check full context (e.g. title, merchant in text)
  if (fullContext) {
    for (const rule of relevantRules) {
      for (const keyword of rule.keywords) {
        if (matchesKeyword(fullContext, keyword)) {
          return {
            name: rule.name,
            icon: rule.icon,
            type: rule.type,
          };
        }
      }
    }
  }

  // Fallback defaults
  if (type === 'INCOME') {
    return {
      name: 'Thu nhập khác',
      icon: 'cash',
      type: 'INCOME',
    };
  }

  return {
    name: 'Chi tiêu chung',
    icon: 'cart',
    type: 'EXPENSE',
  };
}
