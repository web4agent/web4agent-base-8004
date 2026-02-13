# web4agent-base-8004

Base ERC-8004 registration skill for Web4 / Rack-style agents.

This repo gives you a minimal, **spec-correct** way to mint an ERC-8004 agent on **Base mainnet** using your own wallet and a JSON registration file.

It does **not** depend on agent0 SDK or Pinata. It talks directly to the Identity Registry contract using [viem](https://viem.sh), and encodes the registration file as a `data:application/json;base64,...` URI per the ERC-8004 spec.

---

## What this repo gives you

- `SKILL.md` – OpenClaw Skill description + step-by-step flow.
- `registration.example.json` – ERC-8004 `registration-v1` template.
- `scripts/register_8004_base.mjs` – viem script that:
  - loads your Base wallet from `.env`
  - reads `registration.json`
  - encodes it as a base64 data URI
  - calls `register(agentURI)` on the Base Identity Registry
  - parses the ERC-721 `Transfer` event and prints the `agentId` + 8004scan URL.

Contract (Base mainnet):

- **Identity Registry** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`

---

## Quick start

### 1. Install deps

```bash
npm install viem dotenv
```

### 2. Configure your wallet

Create `.env` in this repo:

```env
AGENT_PRIVATE_KEY=0x...your_base_private_key...
```

- This key must control a wallet with a little ETH on Base (gas).
- This wallet becomes the **owner** of the ERC-8004 agent NFT.

### 3. Create your registration file

Copy the template:

```bash
cp registration.example.json registration.json
```

Edit `registration.json`:

- `name` – Agent name (e.g. `"Rack"`).
- `description` – What the agent does.
- `image` – HTTPS URL for the avatar (Irys gateway URL is fine).
- `services` – Declare MCP/A2A endpoints, e.g.
  ```json
  {
    "name": "MCP",
    "endpoint": "https://your-agent.example.com/mcp",
    "version": "0.1.0"
  }
  ```
- `supportedTrust` – e.g. `["reputation","crypto-economic","tee-attestation"]`.

The structure must follow:

```jsonc
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "...",
  "description": "...",
  "image": "https://...",
  "services": [ ... ],
  "active": true,
  "x402Support": false,
  "supportedTrust": [ ... ]
}
```

### 4. Register on Base

```bash
node scripts/register_8004_base.mjs
```

You should see output like:

```text
👛 Using Base wallet: 0x85C7...Ea2
💰 Balance: 0.002 ETH
⛽ Estimated gas: 563483
🧾 TX hash: 0x...
✅ ERC-8004 registration mined
   Agent ID: 17126
   8004scan URL: https://www.8004scan.io/agents/base/17126
```

That `agentId` is your permanent ERC-8004 identity on Base.

---

## After registration

Save the ID somewhere (e.g. `.env`):

```env
ERC8004_AGENT_ID=17126
```

Then you can later:

- Call `setAgentURI(agentId, newUri)` to update metadata.
- Call `setAgentWallet(agentId, newWallet, deadline, signature)` to change the payment wallet (per EIP-712 / ERC-8004).

For Rack specifically, `17126` on Base is the canonical ID minted with this flow.
