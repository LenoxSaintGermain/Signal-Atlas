# ElevenLabs Dashboard Setup Guide — Ghost Agent

Manual steps to configure the Ghost (Donna) agent in the ElevenLabs dashboard.
These cannot be automated via API and must be performed in the browser.

---

## Step 1: Open Your Agent

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/agents)
2. Select your existing agent (or create a new one)
3. Note the **Agent ID** — this must match your `ELEVENLABS_AGENT_ID` env var

---

## Step 2: Set the System Prompt

1. Click **Agent** tab (left sidebar)
2. In the **First message** field, enter:
   ```
   Ghost uplink established. I have your briefing loaded. What do you need?
   ```
3. In the **System prompt** field, paste the full prompt from `api/config/ghostPrompt.js` — the `GHOST_SYSTEM_PROMPT` constant. Copy everything between the backticks.
4. Set **LLM**: Choose one of:
   - **GPT-4o mini** (recommended — good tool calling, low latency)
   - **Claude 3.5 Sonnet** (best reasoning, slightly higher latency)
   - Avoid Gemini Flash for ElevenLabs (their docs warn about tool calling reliability)

---

## Step 3: Add Client Tools

Go to **Tools** tab → **Add Tool** → **Client Tool**

Add each of these 6 client tools. The **Name** must match exactly:

### 3a. `navigate_module`
- **Name:** `navigate_module`
- **Description:** Open a suite module in the Signal Atlas UI
- **Parameters:**
  - `target` (string, required)
  - Description: "The module to navigate to"
  - Enum values: `intake`, `brief`, `suite_distilled`, `plan`, `profile`, `ai_profile`, `gaps`, `readiness`, `my_concierge`, `cjs_execution`, `resume_review`

### 3b. `close_module`
- **Name:** `close_module`
- **Description:** Dismiss the currently open module overlay
- **Parameters:** (none)

### 3c. `toggle_admin`
- **Name:** `toggle_admin`
- **Description:** Open or close the admin console panel
- **Parameters:** (none)

### 3d. `dispatch_agent`
- **Name:** `dispatch_agent`
- **Description:** Send a SWAT team agent on a new mission
- **Parameters:**
  - `codename` (string, required)
  - Description: "The agent to dispatch"
  - Enum values: `signal_strategist`, `gap_closer`, `intel_analyst`, `comms_officer`, `readiness_coach`

### 3e. `update_stance`
- **Name:** `update_stance`
- **Description:** Switch the operating stance between delegator and copilot
- **Parameters:**
  - `stance` (string, required)
  - Enum values: `delegator`, `copilot`

### 3f. `address_gap`
- **Name:** `address_gap`
- **Description:** Mark a gap as addressed in the Gap Stack
- **Parameters:**
  - `gap_id` (string, required)
  - Description: "The ID of the gap to mark as addressed"

---

## Step 4: Add Server Tools

Go to **Tools** tab → **Add Tool** → **Server Tool** (webhook)

Your server URL base: `https://signal-atlas-480846059254.europe-west1.run.app`

### 4a. `fetch_briefing`
- **Name:** `fetch_briefing`
- **URL:** `POST https://signal-atlas-480846059254.europe-west1.run.app/v1/ghost/briefing`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Ghost-Secret: <your GHOST_WEBHOOK_SECRET value>`
- **Body schema:**
  ```json
  {
    "uid": { "type": "string", "description": "The candidate's Firebase UID" }
  }
  ```
- **Description:** Get lightweight candidate context: name, readiness tier, top gaps, stance, mission count

### 4b. `fetch_artifact`
- **Name:** `fetch_artifact`
- **URL:** `POST https://signal-atlas-480846059254.europe-west1.run.app/v1/ghost/artifact`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Ghost-Secret: <your GHOST_WEBHOOK_SECRET value>`
- **Body schema:**
  ```json
  {
    "uid": { "type": "string", "description": "The candidate's Firebase UID" },
    "type": { "type": "string", "description": "Artifact type", "enum": ["brief", "profile", "plan", "gaps", "readiness", "ai_profile", "suite_distilled", "cjs_execution", "resume_review", "my_concierge"] }
  }
  ```
- **Description:** Retrieve a full career artifact for the current candidate

### 4c. `fetch_drive_documents`
- **Name:** `fetch_drive_documents`
- **URL:** `POST https://signal-atlas-480846059254.europe-west1.run.app/v1/ghost/drive`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Ghost-Secret: <your GHOST_WEBHOOK_SECRET value>`
- **Body schema:**
  ```json
  {
    "uid": { "type": "string", "description": "The candidate's Firebase UID" },
    "query": { "type": "string", "description": "Optional search query to filter documents" }
  }
  ```
- **Description:** List or search documents in the candidate's Google Drive folder

---

## Step 5: Configure Voice

1. Go to **Voice** tab
2. Select a voice that fits the executive advisor persona — recommended: a calm, authoritative female voice
3. Set **Model:** Eleven Flash v2.5 (lowest latency)
4. Enable **Tool Call Sounds** (ambient audio during server tool execution to mask latency)

---

## Step 6: Set Environment Variable

Add `GHOST_WEBHOOK_SECRET` to your Cloud Run deployment:

```bash
# Generate a secret
export GHOST_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Set in Cloud Run
gcloud run services update signal-atlas \
  --region=europe-west1 \
  --project=ssai-f6191 \
  --set-env-vars="GHOST_WEBHOOK_SECRET=$GHOST_WEBHOOK_SECRET"
```

Use the same value in the ElevenLabs dashboard server tool headers.

---

## Step 7: Verify

After completing all dashboard steps, run the verification script:

```bash
source .env  # or export ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID
node scripts/verify_elevenlabs_tools.mjs
```

Expected output:
```
=== Ghost Tool Verification ===

Agent: Donna (Chief of Staff)
Tools found: 9

CLIENT TOOLS:
  ✓ navigate_module
  ✓ close_module
  ✓ toggle_admin
  ✓ dispatch_agent
  ✓ update_stance
  ✓ address_gap

SERVER TOOLS:
  ✓ fetch_briefing
  ✓ fetch_artifact
  ✓ fetch_drive_documents

All tools registered. Ghost is armed.
```

---

## Step 8: Test

1. Open Signal Atlas in the browser
2. Navigate to the voice panel (ElevenLabs should be active)
3. Test each operation by voice:
   - "Show me my gaps" → should trigger `navigate_module(gaps)`
   - "What's my readiness score?" → should trigger `fetch_briefing` then speak the score
   - "Dispatch the gap closer" → should trigger `dispatch_agent(gap_closer)`
   - "Switch to delegator mode" → should trigger `update_stance(delegator)`
   - "What documents do I have in Drive?" → should trigger `fetch_drive_documents`
