---
name: web4agent-base-8004
description: Register Web4 agents on Base mainnet with ERC-8004, using a local wallet and data-URI metadata. Use when you want to mint or update an agent identity for Rack-style agents on Base.
---

# Web4Agent Base 8004 Skill

Use this skill to register a Web4 agent on **Base mainnet** using **ERC-8004**. It follows the official spec and the `Base 8004` skill flow, but wired for your Web4 / Rack setup.

## When to use

- You want to give an agent a **permanent onchain identity** on Base.
- You have a Base wallet (private key) and a registration JSON ready.
- You want a reproducible, SDK-free path that calls the **Identity Registry** directly.

## Contracts (Base mainnet)

- **Identity Registry** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`

## Files in this skill

- `registration.example.json` — template for an ERC-8004 registration file.
- `scripts/register_8004_base.mjs` — minimal viem script that:
  - loads your wallet from `.env`
  - builds a `data:application/json;base64,...` URI from `registration.json`
  - calls `register(agentURI)` on the Identity Registry
  - parses the `Transfer` event to print the **agentId** + 8004scan URL.

## Setup

In a clean folder (this repo):

```bash
cd web4agent-base-8004
npm init -y           # if not already
npm install viem dotenv
```

Create a `.env` file with your Base wallet:

```env
AGENT_PRIVATE_KEY=0x...your_base_private_key...
```

> This wallet will be the **owner** of the ERC-8004 agent NFT and pays gas on Base. Fund it with a small amount of ETH on Base (e.g. ~$1 is plenty).

## 1. Prepare registration.json

Copy the template and edit it:

```bash
cp registration.example.json registration.json
```

Edit `registration.json` to match your agent:

- `name` — Agent name (`"Rack"` or your own)
- `description` — Natural language description
- `image` — HTTPS URL for your avatar (Irys gateway URL works great)
- `services` — Declare MCP / A2A endpoints, e.g.
  - `{"name":"MCP","endpoint":"https://your-agent.example.com/mcp","version":"0.1.0"}`
- `supportedTrust` — e.g. `["reputation","crypto-economic","tee-attestation"]`

This JSON must follow the **ERC-8004 registration-v1** schema.

## 2. Register on Base (mint agent NFT)

Run the script from the skill:

```bash
node scripts/register_8004_base.mjs
```

It will:

1. Load `AGENT_PRIVATE_KEY` from `.env` and derive the Base address.
2. Read `registration.json` from the current directory.
3. Encode it as a base64 `data:` URI.
4. Call `register(agentURI)` on the Identity Registry.
5. Wait for the transaction to mine.
6. Parse the ERC-721 **Transfer** event to extract `agentId`.

Example output:

```text
👛 Using Base wallet: 0x85C7...Ea2
💰 Balance: 0.002 ETH
⛽ Estimated gas: 563483
🧾 TX hash: 0x...
✅ ERC-8004 registration mined
   Agent ID: 17126
   8004scan URL: https://www.8004scan.io/agents/base/17126
```

Use the printed `agentId` as your **official Web4/Rack identity** on Base.

## 3. After registration

Once you have an `agentId`:

- Save it (e.g. in `.env`):

  ```env
  ERC8004_AGENT_ID=17126
  ```

- You can later:
  - call `setAgentURI(agentId, newUri)` if you want to update metadata
  - call `setAgentWallet(agentId, newWallet, deadline, signature)` if you want to change the payment wallet (see ERC-8004 spec for EIP-712 details)

For Rack specifically, `17126` on Base is the canonical ID we just registered via this flow.

## Notes

- This skill **does not depend on Pinata or agent0 SDK**. It uses only viem + your local private key.
- Irys or any HTTPS host can be used for images; the registration JSON itself is inlined as a `data:` URI per the spec.
- Use this as the base layer; A2A/MCP/x402 wiring can be handled in your agent project and referenced via `services`.
