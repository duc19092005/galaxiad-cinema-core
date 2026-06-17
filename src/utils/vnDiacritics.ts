/**
 * vnDiacritics.ts - Tự động thêm dấu tiếng Việt dựa trên từ điển và ngữ cảnh
 * 
 * Công cụ này giúp phục hồi dấu tiếng Việt cho các từ bị mất dấu.
 * Sử dụng từ điển mapping + context hints để chọn dấu phù hợp.
 */

// ==================== TỪ ĐIỂN MAPPING KHÔNG DẤU → CÓ DẤU ====================

type DiacriticMap = Record<string, string[]>;

/**
 * Từ điển tra cứu cho các từ thông dụng
 * Key: từ không dấu (lowercase)
 * Value: mảng các từ có dấu (ưu tiên từ phổ biến nhất ở đầu)
 */
const VN_DIACRITICS_MAP: DiacriticMap = {
  // === Từ 2 ký tự ===
  "to": ["tổ", "tô", "tờ", "tó", "tỏ", "tọ", "tố", "tộ", "tơ", "tợ"],
  "co": ["có", "cô", "cỏ", "cọ", "cò", "cố", "cộ", "cơ", "cớ", "cỡ"],
  "no": ["nô", "nỏ", "nó", "nọ", "nò", "nố", "nộ", "nơ", "nỡ"],
  "ho": ["hồ", "họ", "hò", "hô", "hỏ", "hố", "hộ", "hơ", "hỡ", "hợ"],
  "mo": ["mô", "mỏ", "mó", "mọ", "mò", "mố", "mộ", "mơ", "mỡ", "mớ"],
  "lo": ["lô", "lọ", "lò", "lỏ", "ló", "lố", "lộ", "lơ", "lỡ", "lớ", "lợ"],
  "so": ["sô", "sò", "sọ", "sỏ", "số", "sộ", "sơ", "sỡ", "sờ", "sớ"],
  "bo": ["bô", "bò", "bỏ", "bó", "bọ", "bố", "bộ", "bơ", "bờ", "bỡ"],
  "do": ["đô", "đò", "đỏ", "đó", "đọ", "đố", "độ", "đơ", "đờ", "đỡ"],
  "ro": ["rô", "rọ", "rò", "rỏ", "ró", "rố", "rộ", "rơ", "rờ", "rỡ"],
  "vo": ["vô", "vò", "vỏ", "vó", "vọ", "vố", "vộ", "vơ", "vờ", "vỡ"],
  "xo": ["xô", "xò", "xỏ", "xó", "xọ", "xố", "xộ", "xơ", "xờ", "xỡ"],
  
  "ta": ["tá", "tà", "tả", "tã", "tạ", "tá"],
  "ca": ["cá", "cà", "cả", "cã", "cạ"],
  "ha": ["há", "hà", "hả", "hã", "hạ"],
  "la": ["lá", "là", "lả", "lã", "lạ"],
  "sa": ["sá", "sà", "sả", "sã", "sạ"],
  "ba": ["bá", "bà", "bả", "bã", "bạ"],
  "da": ["đá", "đà", "đả", "đã", "đạ"],
  "ga": ["gá", "gà", "gả", "gã", "gạ"],
  "ma": ["má", "mà", "mả", "mã", "mạ"],
  "na": ["ná", "nà", "nả", "nã", "nạ"],
  "ra": ["rá", "rà", "rả", "rã", "rạ"],
  "va": ["vá", "và", "vả", "vã", "vạ"],
  "xa": ["xá", "xà", "xả", "xã", "xạ"],

  "te": ["té", "tè", "tẻ", "tẽ", "tẹ"],
  "ke": ["ké", "kè", "kẻ", "kẽ", "kẹ"],
  "he": ["hé", "hè", "hẻ", "hẽ", "hẹ"],
  "le": ["lé", "lè", "lẻ", "lẽ", "lẹ"],
  "be": ["bé", "bè", "bẻ", "bẽ", "bẹ"],
  "de": ["đé", "đè", "đẻ", "đẽ", "đẹ"],
  "me": ["mé", "mè", "mẻ", "mẽ", "mẹ"],
  "ne": ["né", "nè", "nẻ", "nẽ", "nẹ"],
  "re": ["ré", "rè", "rẻ", "rẽ", "rẹ"],
  "ve": ["vé", "vè", "vẻ", "vẽ", "vẹ"],
  "xe": ["xé", "xè", "xẻ", "xẽ", "xẹ"],
  "che": ["ché", "chè", "chẻ", "chẽ", "chẹ"],

  "ti": ["tí", "tì", "tỉ", "tĩ", "tị"],
  "hi": ["hí", "hì", "hỉ", "hĩ", "hị"],
  "li": ["lí", "lì", "lỉ", "lĩ", "lị"],
  "si": ["sí", "sì", "sỉ", "sĩ", "sị"],
  "bi": ["bí", "bì", "bỉ", "bĩ", "bị"],
  "di": ["đí", "đì", "đỉ", "đĩ", "đị"],
  "mi": ["mí", "mì", "mỉ", "mĩ", "mị"],
  "ni": ["ní", "nì", "nỉ", "nĩ", "nị"],
  "ri": ["rí", "rì", "rỉ", "rĩ", "rị"],
  "vi": ["ví", "vì", "vỉ", "vĩ", "vị"],
  "xi": ["xí", "xì", "xỉ", "xĩ", "xị"],

  "tu": ["tú", "tù", "tủ", "tũ", "tụ", "tư", "tứ", "từ", "tử", "tữ", "tự"],
  "cu": ["cú", "cù", "củ", "cũ", "cụ", "cư", "cứ", "cừ", "cử", "cữ", "cự"],
  "hu": ["hú", "hù", "hủ", "hũ", "hụ", "hư", "hứ", "hừ", "hử", "hữ", "hự"],
  "lu": ["lú", "lù", "lủ", "lũ", "lụ", "lư", "lứ", "lừ", "lử", "lữ", "lự"],
  "su": ["sú", "sù", "sủ", "sũ", "sụ", "sư", "sứ", "sừ", "sử", "sữ", "sự"],
  "bu": ["bú", "bù", "bủ", "bũ", "bụ", "bư", "bứ", "bừ", "bử", "bữ", "bự"],
  "du": ["đú", "đù", "đủ", "đũ", "đụ", "đư", "đứ", "đừ", "đử", "đữ", "đự"],
  "mu": ["mú", "mù", "mủ", "mũ", "mụ", "mư", "mứ", "mừ", "mử", "mữ", "mự"],
  "nu": ["nú", "nù", "nủ", "nũ", "nụ", "nư", "nứ", "nừ", "nử", "nữ", "nự"],
  "ru": ["rú", "rù", "rủ", "rũ", "rụ", "rư", "rứ", "rừ", "rử", "rữ", "rự"],
  "vu": ["vú", "vù", "vủ", "vũ", "vụ", "vư", "vứ", "vừ", "vử", "vữ", "vự"],
  "xu": ["xú", "xù", "xủ", "xũ", "xụ", "xư", "xứ", "xừ", "xử", "xữ", "xự"],

  // === Từ 3 ký tự phổ biến ===
  "toi": ["tôi", "tới", "tội", "tơi", "tởi"],
  "noi": ["nói", "nơi", "nòi", "nỗi", "nổi", "nội", "nới"],
  "hoi": ["hỏi", "hồi", "hội", "hơi", "hợi", "hới"],
  "cho": ["chơ", "chó", "chò", "chỏ", "chỗ", "chợ", "chờ"],
  "nguoi": ["người"],
  "ngay": ["ngay", "ngày", "ngáy", "ngây"],
  "lam": ["làm", "lắm", "lảm", "lạm", "lầm", "lẫm"],
  "den": ["đến", "đen", "đền", "đẹn", "đèn"],
  "qua": ["quá", "quà", "quả", "quã", "quạ", "quắ"],
  "xin": ["xin", "xín", "xịn", "xỉn"],
  "yeu": ["yêu", "yểu"],
  "dep": ["đẹp", "đếp"],
  "tot": ["tốt", "tọt", "tột"],
  "manh": ["mạnh", "mảnh", "mành"],
  "nho": ["nhỏ", "nhờ", "nhỡ", "nhợ", "nhó", "nhô", "nhổ", "nhộ"],
  "khong": ["không"],
  "duoc": ["được"],
  "phai": ["phải", "phái", "phải"],
  "dung": ["đúng", "đùng", "đũng", "đụng", "dũng", "dừng"],
  "muon": ["muốn", "muộn", "mườn"],
  "them": ["thêm", "thèm", "thẹm", "thềm"],
  "thue": ["thuê", "thuế"],
  "tien": ["tiền", "tiến", "tiện", "tiên", "tiễn"],
  "thoi": ["thời", "thổi", "thói", "thôi", "thợi", "thòi"],
  "gio": ["giờ", "gió", "giò", "giỏ", "giỗ", "giộ", "giơ"],
  "ban": ["bạn", "bàn", "bán", "bản", "bãn", "bận", "bẩn", "bần"],
  "can": ["cần", "cận", "cản", "cán", "cạn", "căn", "cắn", "cằn"],
  "tan": ["tận", "tàn", "tản", "tán", "tắn", "tằn", "tần"],
  "lan": ["lần", "làn", "lán", "lản", "lận", "lặn", "lằn", "lăn"],
  "sang": ["sáng", "sang", "sảng", "sằng", "sẵng"],
  "cao": ["cao", "cáo", "cảo", "cào"],
  "thap": ["thấp", "thắp", "tháp"],
  "xoa": ["xóa", "xòa", "xõa", "xoa"],
  "huy": ["hủy", "húy", "hùy"],
  "nhung": ["những", "nhung", "nhùng", "nhũng"],
  "trong": ["trong", "trống", "trọng", "trông", "trỏng"],
  "cung": ["cùng", "cúng", "cung", "cũng", "củng", "cứng"],
  "giup": ["giúp"],
  "gui": ["gửi", "gùi", "gui"],
  "luu": ["lưu", "lũy"],
};

// ==================== NGỮ CẢNH HELPERS ====================

interface ContextRule {
  key: string;                  // từ không dấu
  contextPattern: string;       // pattern trong context
  expectedTone: string;         // từ có dấu kỳ vọng
}

/**
 * Các luật ngữ cảnh để phân biệt từ đồng âm khác nghĩa
 */
const CONTEXT_RULES: ContextRule[] = [
  // "toi" vs "tôi" vs "tội"
  { key: "toi", contextPattern: "cua|toi la", expectedTone: "tôi" },
  { key: "toi", contextPattern: "toi den|pham toi", expectedTone: "tội" },
  { key: "toi", contextPattern: "di toi|chay toi", expectedTone: "tới" },
  
  // "to" vs "tô" vs "tổ"
  { key: "to", contextPattern: "to chuc|to dan|to thom|to mau", expectedTone: "tổ" },
  { key: "to", contextPattern: "an to|to pho|bu to", expectedTone: "tô" },
  { key: "to", contextPattern: "to ra|to lon|rat to", expectedTone: "to" },
  
  // "luu" vs "lưu"
  { key: "luu", contextPattern: "luu lai|bao luu|cuu luu", expectedTone: "lưu" },
  
  // "xoa" vs "xóa"
  { key: "xoa", contextPattern: "xoa bo|xoa ten|xoa di", expectedTone: "xóa" },
  
  // "huy" vs "hủy"
  { key: "huy", contextPattern: "huy bo|huy don|xoa huy", expectedTone: "hủy" },
  
  // "thoi" vs "thời"
  { key: "thoi", contextPattern: "thoi gian|thoi dai|thoi tiet|thoi diem", expectedTone: "thời" },
  { key: "thoi", contextPattern: "thoi coi|thoi keu", expectedTone: "thổi" },
  
  // "biet" vs "biết"
  { key: "biet", contextPattern: "biet roi|da biet|khong biet|co biet", expectedTone: "biết" },
  
  // "can" vs "cần" vs "cản"
  { key: "can", contextPattern: "can thiet|can co|can phai|chi can|neu can", expectedTone: "cần" },
  { key: "can", contextPattern: "can tro|can lai|can ngang", expectedTone: "cản" },
  { key: "can", contextPattern: "can cau|su can|thang can", expectedTone: "cân" },
  
  // "den" vs "đến" vs "đen"
  { key: "den", contextPattern: "den truong|den nha|den khi|toi den", expectedTone: "đến" },
  { key: "den", contextPattern: "mau den|den toi|long den", expectedTone: "đen" },
  
  // "qua" vs "quá" vs "quả"
  { key: "qua", contextPattern: "rat qua|the qua|qua hon|qua la", expectedTone: "quá" },
  { key: "qua", contextPattern: "trai qua|hoa qua|qua ngo", expectedTone: "quả" },
  { key: "qua", contextPattern: "di qua|qua dem|qua song", expectedTone: "qua" },
  
  // "lam" vs "làm"
  { key: "lam", contextPattern: "lam viec|lam gi|dang lam|da lam|toi lam", expectedTone: "làm" },
  
  // "trong" vs "trống"
  { key: "trong", contextPattern: "trong nha|o trong|trong do|nam trong", expectedTone: "trong" },
  { key: "trong", contextPattern: "cai trong|danh trong|trong dong", expectedTone: "trống" },
  
  // "co" vs "có"
  { key: "co", contextPattern: "co the|co rat|da co|co gi|co the la", expectedTone: "có" },
  { key: "co", contextPattern: "co giao|me co|bac co|co ay", expectedTone: "cô" },
  
  // "giup" vs "giúp"
  { key: "giup", contextPattern: "giup do|de giup|giup viec|giup toi", expectedTone: "giúp" },
];

// ==================== MAIN FUNCTION ====================

/**
 * Tự động thêm dấu tiếng Việt cho một từ dựa trên ngữ cảnh
 * 
 * @param word - Từ cần thêm dấu (không dấu)
 * @param context - Ngữ cảnh xung quanh (câu hoặc đoạn văn)
 * @returns Từ đã được thêm dấu (hoặc giữ nguyên nếu không tìm thấy)
 */
export function addVietnameseDiacritics(word: string, context?: string): string {
  if (!word || word.trim().length === 0) return word;
  
  const lowerWord = word.toLowerCase().trim();
  
  // Bước 1: Kiểm tra luật ngữ cảnh trước
  if (context) {
    const lowerContext = context.toLowerCase();
    for (const rule of CONTEXT_RULES) {
      if (rule.key === lowerWord) {
        const patterns = rule.contextPattern.split('|');
        for (const pattern of patterns) {
          if (lowerContext.includes(pattern.trim())) {
            return preserveCase(word, rule.expectedTone);
          }
        }
      }
    }
  }
  
  // Bước 2: Tra từ điển (lấy từ phổ biến nhất = đầu mảng)
  if (VN_DIACRITICS_MAP[lowerWord]) {
    return preserveCase(word, VN_DIACRITICS_MAP[lowerWord][0]);
  }
  
  // Bước 3: Không tìm thấy, giữ nguyên
  return word;
}

/**
 * Tự động thêm dấu cho toàn bộ câu hoặc đoạn văn
 * 
 * @param text - Văn bản cần thêm dấu
 * @returns Văn bản đã được thêm dấu
 */
export function addVietnameseDiacriticsToText(text: string): string {
  if (!text) return text;
  
  const words = text.split(' ');
  const result = words.map((word, index) => {
    // Bỏ qua từ đã có dấu
    if (hasVietnameseDiacritics(word)) return word;
    
    // Xây dựng context từ các từ xung quanh
    const start = Math.max(0, index - 3);
    const end = Math.min(words.length, index + 3);
    const context = words.slice(start, end).join(' ');
    
    return addVietnameseDiacritics(word, context);
  });
  
  return result.join(' ');
}

/**
 * Kiểm tra từ đã có dấu tiếng Việt chưa
 */
export function hasVietnameseDiacritics(word: string): boolean {
  const diacriticPattern = /[áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/i;
  return diacriticPattern.test(word);
}

/**
 * Kiểm tra văn bản có chứa từ không dấu nào không
 */
export function containsDiacriticlessVietnamese(text: string): boolean {
  if (!text) return false;
  const words = text.split(/\s+/);
  return words.some(word => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return cleanWord.length > 1 && VN_DIACRITICS_MAP[cleanWord] !== undefined;
  });
}

// ==================== HELPERS ====================

function preserveCase(original: string, corrected: string): string {
  if (original.length === 0) return corrected;
  
  // Giữ nguyên chữ hoa đầu tiên nếu từ gốc viết hoa
  if (original[0] === original[0].toUpperCase()) {
    return corrected.charAt(0).toUpperCase() + corrected.slice(1);
  }
  
  return corrected;
}

/**
 * Export từ điển để có thể tra cứu trực tiếp
 */
export const diacriticsDictionary = VN_DIACRITICS_MAP;

export default addVietnameseDiacritics;
