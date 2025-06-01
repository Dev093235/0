const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const login = require("fca-unofficial");

const app = express();
const PORT = 10000;

const upload = multer({ dest: "uploads/" });

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/send", upload.single("npFile"), async (req, res) => {
  const { password, appState, uid, haterName, time } = req.body;

  if (password !== "RUDRA") {
    return res.status(401).send("❌ Invalid password");
  }

  if (!appState || !uid || !time || !req.file) {
    return res.status(400).send("❌ Missing required fields");
  }

  const appStateParsed = (() => {
    try {
      return JSON.parse(appState);
    } catch (e) {
      return null;
    }
  })();

  if (!Array.isArray(appStateParsed)) return res.status(400).send("❌ Invalid appstate format");

  const filePath = path.join(__dirname, req.file.path);
  let messages;

  try {
    const content = await fs.readFile(filePath, "utf8");
    messages = content.split("\n").filter(Boolean);
  } catch {
    return res.status(500).send("❌ Couldn't read the uploaded file");
  }

  login({ appState: appStateParsed }, async (err, api) => {
    if (err) return res.status(500).send("❌ Login failed");

    let index = 0;
    const interval = setInterval(() => {
      if (index >= messages.length) {
        clearInterval(interval);
        console.log("✅ All messages sent.");
        return;
      }

      let msg = messages[index];
      if (haterName) msg = msg.replace("{name}", haterName);

      api.sendMessage(msg, uid, (e) => {
        if (e) console.error("❌ Failed:", msg);
        else console.log("✅ Sent:", msg);
      });

      index++;
    }, parseInt(time) * 1000);
  });

  res.send("✅ Message sending started!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
