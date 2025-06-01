const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const login = require("fca-unofficial");
const bodyParser = require("body-parser");

const app = express();
const PORT = 10000;
const upload = multer({ dest: "uploads/" });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/send", upload.single("npFile"), async (req, res) => {
  const { password, appstate, uid, time, haterName } = req.body;

  if (password !== "RUDRA") return res.send("❌ Invalid password");

  if (!appstate || !uid || !time || !req.file) {
    return res.send("❌ Missing required fields");
  }

  let appState;
  try {
    appState = JSON.parse(appstate);
  } catch {
    return res.send("❌ Invalid appstate.json");
  }

  let messages;
  try {
    const fileData = await fs.readFile(req.file.path, "utf8");
    messages = fileData.split("\n").filter(Boolean);
  } catch {
    return res.send("❌ Error reading np.txt file");
  }

  login({ appState }, (err, api) => {
    if (err) return res.send("❌ Facebook login failed");

    let index = 0;
    const interval = setInterval(() => {
      if (index >= messages.length) {
        clearInterval(interval);
        console.log("✅ All messages sent.");
        return;
      }

      let msg = messages[index];
      if (haterName) msg = msg.replace(/{name}/g, haterName);

      api.sendMessage(msg, uid, (err) => {
        if (err) console.error("❌ Failed:", msg);
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
