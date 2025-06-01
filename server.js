const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const login = require("fca-unofficial");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("."));
app.use(fileUpload());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/send", (req, res) => {
  console.log("📥 Form submitted");

  const { password, appstate, email, pass, uid, haterName, interval } = req.body;
  const npFile = req.files?.npFile;

  if (password !== "RUDRA") {
    console.log("❌ Wrong password attempt");
    return res.send("❌ Wrong password!");
  }

  if (!uid || !interval || (!appstate && (!email || !pass)) || !npFile) {
    console.log("❌ Missing required fields");
    return res.send("❌ Missing required fields");
  }

  const npContent = npFile.data.toString().split("\n").filter(Boolean);
  console.log(`📄 NP file loaded with ${npContent.length} lines`);

  const loginCallback = (err, api) => {
    if (err) {
      console.error("❌ Login failed:", err);
      return res.send("❌ Login failed: " + err.error || "Unknown error");
    }

    console.log("✅ Logged in successfully");
    let count = 0;
    const name = haterName || "Friend";

    console.log("📤 Starting message sending...");

    const sendNext = () => {
      if (count >= npContent.length) {
        console.log("✅ All messages sent!");
        return res.send("✅ All messages sent!");
      }

      const msg = npContent[count].replace(/{name}/gi, name);
      api.sendMessage(msg, uid, (err) => {
        if (err) {
          console.log(`❌ Error sending message ${count + 1}: ${err}`);
        } else {
          console.log(`✅ Sent message ${count + 1}: ${msg}`);
        }
        count++;
        setTimeout(sendNext, parseInt(interval));
      });
    };

    sendNext();
  };

  if (appstate) {
    console.log("🔐 Logging in with appstate.json...");
    try {
      const parsed = JSON.parse(appstate);
      login({ appState: parsed }, loginCallback);
    } catch (e) {
      console.error("❌ Invalid appstate JSON:", e);
      return res.send("❌ Invalid appstate.json format.");
    }
  } else {
    console.log("🔐 Logging in with email & password...");
    login({ email, password: pass }, loginCallback);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server live on http://localhost:${PORT}`);
});
