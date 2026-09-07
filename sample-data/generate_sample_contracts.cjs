const fs = require('fs');
const path = require('path');
const { jsPDF } = require(path.join(__dirname, '../apps/frontend/node_modules/jspdf'));

function createContractPdf(outputPath, data) {
  const doc = new jsPDF();

  const fontPath = process.env.CONTRACT_FONT || 'C:/Windows/Fonts/arial.ttf';
  if (!fs.existsSync(fontPath)) throw new Error('Set CONTRACT_FONT to a Unicode TTF font; do not generate Vietnamese with a fallback font.');
  if (fs.existsSync(fontPath)) {
    const fontBase64 = fs.readFileSync(fontPath).toString('base64');
    doc.addFileToVFS('Arial.ttf', fontBase64);
    doc.addFont('Arial.ttf', 'Arial', 'normal');
    doc.setFont('Arial');
  }

  doc.setFontSize(14);
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Doc lap - Tu do - Hanh phuc', 105, 25, { align: 'center' });
  doc.text('-------------------------------', 105, 30, { align: 'center' });

  doc.setFontSize(15);
  doc.text('HỢP ĐỒNG CẤP QUYỀN CHIẾU PHIM RẠP', 105, 42, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`So hop dong: ${data.contractCode}`, 105, 49, { align: 'center' });

  let y = 62;
  const lines = [
    'DỮ LIỆU MÔ PHỎNG - không phải hợp đồng hoặc chữ ký đã xác minh.',
    `BEN A (BEN CAP QUYEN / NHA PHAT HANH):`,
    `  Ten don vi: ${data.distributorName}`,
    `  Dai dien: ${data.distributorRepresentative} - Chuc vu: Giam doc`,
    ``,
    `BEN B (BEN DUOC CAP QUYEN / RAP CHIEU):`,
    `  Ten don vi: ${data.cinemaName}`,
    `  Dai dien: ${data.cinemaRepresentative} - Chuc vu: Tong Giam doc`,
    ``,
    `Hai ben thong nhat ky ket hop dong cap ban quyen pho bien phim chieu rap voi cac dieu khoan:`,
    ``,
    `DIEU 1: DANH MUC PHIM VA THONG TIN PHO BIEN`,
    `  - Ten tieng Viet: ${data.vietnameseTitle}`,
    `  - Ten tieng Anh: ${data.englishTitle}`,
    `  - Thoi luong phim: ${data.durationMinutes} phut`,
    `  - Phan loai do tuoi: ${data.ageRating}`,
    `  - Dao dien: ${data.director}`,
    `  - Dien vien chinh: ${data.actors}`,
    `  - Mô tả phim: ${data.description}`,
    `  - Poster URL: ${data.posterUrl}`,
    ``,
    `DIEU 2: THOI HAN VA PHAM VI CAP QUYEN`,
    `  - Thoi han cap quyen: Tu ngay ${data.licenseStartAt} den het ngay ${data.licenseEndAt}`,
    `  - Pham vi rap ap dung: ${data.cinemaScope}`,
    `  - Dinh dang chieu duoc phep: ${data.formats}`,
    ``,
    `DIEU 3: CHINH SACH TY LE CHIA DOANH THU VA DOI SOAT`,
    `  - Ty le phan chia doanh thu: Cum rap huong ${data.cinemaSharePercent}%, Nha phat hanh huong ${data.distributorSharePercent}%`,
    `  - Can cu tinh doanh thu: ${data.revenueBasis}`,
    `  - Chu ky thanh toan doi soat: ${data.settlementCycle}`,
    ``,
    `DIEU 4: DIEU KHOAN THI HANH VA TRACH NHIEM`,
    `  - Ben A cam ket so huu day du quyen phat hanh hop phap tac pham tai Viet Nam.`,
    `  - Ben B cam ket pho bien phim dung dinh dang, bao mat ban quyen tac pham ky thuat so.`,
    `  - Hop dong nay duoc lap thanh 02 ban co gia tri phap ly nhu nhau.`
  ];

  for (const line of lines) {
    if (line.startsWith('DIEU 3')) { doc.addPage(); y = 25; }
    if (line.startsWith('DIEU')) {
      doc.setFontSize(11);
    } else {
      doc.setFontSize(10);
    }
    for (const wrapped of doc.splitTextToSize(line, 170)) {
      if (y > 270) { doc.addPage(); y = 22; }
      doc.text(wrapped, 20, y);
      y += 5.8;
    }
  }

  y += 10;
  if (y > 260) { doc.addPage(); y = 22; }
  doc.setFontSize(11);
  doc.text('DAI DIEN BEN A', 50, y, { align: 'center' });
  doc.text('DAI DIEN BEN B', 160, y, { align: 'center' });
  doc.setFontSize(9);
  doc.text('(Ky, dong dau va ghi ro ho ten)', 50, y + 6, { align: 'center' });
  doc.text('(Ky, dong dau va ghi ro ho ten)', 160, y + 6, { align: 'center' });
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(`${data.contractCode} | MÔ PHỎNG | Trang ${page}/${doc.getNumberOfPages()}`, 105, 286, { align: 'center' });
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath} (${buffer.length} bytes)`);
}

const samples = [
  {
    file: 'sample-contracts/hop_dong_chieu_phim_dune_2.pdf',
    contractCode: 'HDCP/2026/GLX-001',
    distributorName: 'Cong ty TNHH Phat Hanh Phim Galaxiad Pictures',
    distributorRepresentative: 'Nguyen Van Phat',
    cinemaName: 'Cong ty Co phan Cum Rap Chieu Phim Galaxiad Cinema',
    cinemaRepresentative: 'Tran Thi Thu Thao',
    vietnameseTitle: 'DUNE: HÀNH TINH CÁT - PHẦN HAI',
    description: 'Dune: Phần Hai tiếp tục cuộc hành trình của Paul Atreides khi anh hợp nhất với Chani và người Fremen trên con đường trả thù những kẻ đã hủy diệt gia tộc mình.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    englishTitle: 'Dune: Part Two',
    durationMinutes: 166,
    ageRating: 'T18',
    director: 'Denis Villeneuve',
    actors: 'Timothee Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
    licenseStartAt: '2026-10-01',
    licenseEndAt: '2026-11-30',
    cinemaScope: 'Toàn bộ hệ thống Galaxiad Cinema tại Việt Nam; không giới hạn rạp cụ thể trong hệ thống.',
    formats: '2D, 3D, IMAX',
    cinemaSharePercent: 50,
    distributorSharePercent: 50,
    revenueBasis: 'TICKET_FINAL_PRICE_AFTER_REFUND',
    settlementCycle: 'MONTHLY'
  },
  {
    file: 'sample-contracts/hop_dong_chieu_phim_mai.pdf',
    contractCode: 'HDCP/2026/GLX-002',
    distributorName: 'Cong ty TNHH CJ HK Entertainment',
    distributorRepresentative: 'Le Hoang Long',
    cinemaName: 'Cong ty Co phan Cum Rap Chieu Phim Galaxiad Cinema',
    cinemaRepresentative: 'Tran Thi Thu Thao',
    vietnameseTitle: 'MAI',
    description: 'Mai là câu chuyện về một người phụ nữ mang nhiều tổn thương, tìm kiếm tình yêu và cơ hội bắt đầu lại cuộc sống. Mô tả dùng cho hợp đồng mô phỏng.',
    posterUrl: 'https://placehold.co/600x900/png?text=MAI-DEMO',
    englishTitle: 'Mai',
    durationMinutes: 131,
    ageRating: 'T18',
    director: 'Tran Thanh',
    actors: 'Phuong Anh Dao, Tuan Tran, Tran Thanh, Hong Dao, Uyen An',
    licenseStartAt: '2026-02-10',
    licenseEndAt: '2026-04-15',
    cinemaScope: 'Chỉ rạp Galaxy Cinema Nguyễn Du; các rạp khác không được cấp quyền.',
    formats: '2D',
    cinemaSharePercent: 45,
    distributorSharePercent: 55,
    revenueBasis: 'TICKET_FINAL_PRICE_AFTER_REFUND',
    settlementCycle: 'WEEKLY'
  }
];

for (const sample of samples) {
  createContractPdf(path.join(__dirname, '..', sample.file), sample);
}
