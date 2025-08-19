// unique7_bitmap.js
const fs = require("fs");
const BITMAP_FILE = "bitmap_used.bin";
const N = 10_000_000;
const BYTES = Math.ceil(N / 8); // 1.25MB

let bitmap = Buffer.alloc(BYTES);

// Load bitmap nếu đã tồn tại
if (fs.existsSync(BITMAP_FILE)) {
  const buf = fs.readFileSync(BITMAP_FILE);
  if (buf.length === BYTES) {
    bitmap = buf;
  } else {
    console.warn("⚠️ bitmap_used.bin sai kích thước, khởi tạo lại.");
  }
}

let usedCount = 0;
for (let i = 0; i < BYTES; i++) {
  let b = bitmap[i];
  while (b) {
    b &= b - 1;
    usedCount++;
  }
}

function isUsed(index) {
  const byteIndex = index >> 3;
  const bitIndex = index & 7;
  return (bitmap[byteIndex] & (1 << bitIndex)) !== 0;
}

function markUsed(index) {
  const byteIndex = index >> 3;
  const bitIndex = index & 7;
  bitmap[byteIndex] |= 1 << bitIndex;
  usedCount++;
}

function nextUnique() {
  if (usedCount >= N) throw new Error("✅ Đã dùng hết 10 triệu mã");
  let index;
  do {
    index = Math.floor(Math.random() * N);
  } while (isUsed(index));
  markUsed(index);
  return index.toString().padStart(7, "0");
}

function saveBitmap() {
  fs.writeFileSync(BITMAP_FILE, bitmap);
}

module.exports = {
  nextUnique,
  saveBitmap,
  getUsedCount: () => usedCount,
};
