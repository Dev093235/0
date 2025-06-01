const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const fs = require("fs");
const login = require("fca-unofficial");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(__dirname));

app.post("/send", async (req, res) => {
  const { password, appstate, uid, name, interval } = req.body;
  if (password !== "RUDRA") return res.send("❌ Invalid password!");

  if (!req.files || !req.files.npFile) return res.send("❌ np.txt file missing!");

  const npContent = req.files.npFile.data.toString("utf8").split("\n").filter(Boolean);
  const appStateJson = JSON.parse(appstate);

  login({ appState: appStateJson }, (err, api) => {
    if (err) return res.send("❌ Login failed: " + err.error || err);

    let count = 0;
    const sendNext = () => {
      if (count >= npContent.length) return res.send("✅ All messages sent!");

      const msg = npContent[count].replace(/{name}/gi, name);
      api.sendMessage(msg, uid, () => {
        count++;
        setTimeout(sendNext, parseInt(interval));
      });
    };

    sendNext();
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
