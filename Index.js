import express from "express";
import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";

// ====== ENV VARIABLES ======
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ====== EXPRESS SERVER (Render يحتاجه) ======
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running 🤖");
});

// ====== TELEGRAM BOT ======
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// ====== GEMINI FUNCTION ======
async function askGemini(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await res.json();

    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "❌ No response from Gemini"
    );
  } catch (err) {
    console.error("Gemini error:", err);
    return "⚠️ Error contacting Gemini";
  }
}

// ====== TELEGRAM MESSAGE HANDLER ======
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  try {
    const reply = await askGemini(text);
    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error("Telegram error:", err);
    bot.sendMessage(chatId, "⚠️ Sorry, something went wrong.");
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
