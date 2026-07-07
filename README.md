# Study Chat - setup guide (for beginners)

This is a small website that gives your research participants a shared AI chat
(powered by **Claude**), using **one** Claude account, and **automatically saves
every conversation** so you can review them all in one place.

There are **two parts** to getting this working:

1. **A Claude (Anthropic) API key** - this is what actually powers the chat (and what you pay for). You already have this and $20 loaded. 
2. **Somewhere to run the site** - so participants can open it in their browser.

You have two paths for part 2. Pick ONE:

- **Path A - Online (recommended):** put it on a free website host so participants
  anywhere can use a normal web link. No installing anything on your computer.
- **Path B - On your own computer:** good for testing, or if all participants are
  in the same room on the same Wi-Fi.

---

## STEP 1 - Get your Claude API key (you may already have this)

You said you're logged into the Anthropic console with ~$20 loaded, so you may
be done here. To get the key itself:

1. Go to **https://console.anthropic.com/settings/keys**
2. Click **Create Key**, give it a name (e.g. "study-chat"), and **copy the key**.
   It starts with `sk-ant-...`. **Save it somewhere safe now** - the console only
   shows the full key once.
3. (Optional but smart) Under **Settings -> Limits**, set a monthly spend limit so
   you can never be surprised.

> This one key powers all participants. Never share it or put it in the
> participant link - it stays hidden on the server. That's the whole point.

**A note on cost:** the site defaults to **Claude Haiku 4.5**, the cheapest and
fastest model - a good fit for a study on a $20 budget. A typical short
conversation costs well under a cent. If you want smarter (but pricier) answers,
you can switch the `MODEL` setting to `claude-sonnet-4-6` or `claude-opus-4-8`
(see the model note in Step 2 / the Render table).

---

## PATH A - Put it online for free (recommended)

We'll use **Render.com** (free plan). This gives participants a real web link.

### A1. Put the code online (GitHub)
1. Make a free account at **https://github.com**.
2. Click the **+** (top right) -> **New repository**. Name it `study-chat`,
   choose **Public** or **Private**, click **Create repository**.
3. On the new page, click **"uploading an existing file"**.
4. Open the `study-chat` folder on your computer, select **all the files**
   (`server.js`, `package.json`, the `public` folder, etc.) and drag them into
   the browser. **Do NOT upload your `.env` file** (it must stay secret). Click
   **Commit changes**.

### A2. Deploy on Render
1. Make a free account at **https://render.com** (sign in with GitHub - easiest).
2. Click **New +** -> **Web Service** -> connect your `study-chat` repository.
3. Render usually fills these in automatically. If not, set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Scroll to **Environment Variables** and add these (this replaces the `.env`
   file - same settings, entered in Render's boxes):
   | Key | Value |
   |-----|-------|
   | `ANTHROPIC_API_KEY` | your `sk-ant-...` key |
   | `ADMIN_PASSWORD` | a password only you know |
   | `MODEL` | `claude-haiku-4-5` (or `claude-sonnet-4-6` / `claude-opus-4-8`) |
   | `MAX_TOKENS` | `2048` |
   | `SYSTEM_PROMPT` | (optional) how Claude should behave |
5. Click **Create Web Service**. Wait ~2 minutes for it to build.
6. You'll get a link like `https://study-chat-xxxx.onrender.com`.

**Done!**
- **Send participants:** `https://study-chat-xxxx.onrender.com`
- **Your private log viewer:** `https://study-chat-xxxx.onrender.com/admin.html`
  (log in with your `ADMIN_PASSWORD`)

> Render's free plan "sleeps" after inactivity, so the very first visit after
> a quiet period can take ~30 seconds to wake up. That's normal. Also, the free
> plan can lose the saved log file on restart - so **download your CSV regularly**
> from the admin page. (If the study is important, ask me to switch logging to a
> database so nothing is ever lost.)

---

## PATH B - Run it on your own computer (for testing / same-room use)

### B1. Install Node.js
1. Go to **https://nodejs.org** and download the **LTS** version.
2. Run the installer, click Next through it, finish.

### B2. Create your settings file
1. In the `study-chat` folder, find **`.env.example`**.
2. Make a copy of it and rename the copy to exactly **`.env`**.
3. Open `.env` in Notepad and fill in your `ANTHROPIC_API_KEY` and a password.

### B3. Start the site
1. Open the `study-chat` folder.
2. Click the address bar at the top of the folder window, type `powershell`,
   and press Enter (this opens a command window in that folder).
3. Type this and press Enter (only needed the first time):
   ```
   npm install
   ```
4. Then type this and press Enter:
   ```
   npm start
   ```
5. You'll see "Study Chat is running!". Open your browser to:
   - Participants: **http://localhost:3000/**
   - Your logs:    **http://localhost:3000/admin.html**

To stop it, click the command window and press `Ctrl + C`.

> On your own computer, only **you** can open `localhost`. For others in the same
> room, they'd use your computer's local IP (ask me and I'll help), but for
> remote participants use **Path A** instead.

---

## Everyday use

- **Participants:** open the link, type a Participant ID (e.g. `P001`), chat.
- **You:** open `/admin.html`, log in, and see every message. Filter by
  participant, or click **Download CSV** to open all logs in Excel.

## Changing how Claude behaves
Set the `SYSTEM_PROMPT` (in Render's environment variables, or in your `.env`).
Example: `You are a calm study tutor. Do not give medical advice.`

## Common questions
- **Is it safe?** Your key stays on the server; participants never see it.
- **Cost?** You pay Anthropic per message from your $20. Set a spend limit
  (Step 1) to stay safe. Haiku is very cheap; Opus is much pricier.
- **Can I see who said what?** Yes - every log line has the Participant ID, time,
  who sent it, and the text.

Need help with any step, or want extra features (consent screen, a fixed list of
valid Participant IDs, saving logs to a real database)? Just ask.
