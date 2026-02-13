import 'dotenv/config';
import { createPublicClient, createWalletClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import fs from 'fs';
import path from 'path';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

const registerAbi = [
  {
    inputs: [{ name: 'agentURI', type: 'string' }],
    name: 'register',
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function main() {
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) throw new Error('AGENT_PRIVATE_KEY missing in .env');

  const registrationPath = path.resolve(process.cwd(), 'registration.json');
  if (!fs.existsSync(registrationPath)) {
    throw new Error('registration.json not found. Copy registration.example.json and edit it.');
  }

  const registration = JSON.parse(fs.readFileSync(registrationPath, 'utf8'));

  const account = privateKeyToAccount(pk);
  const publicClient = createPublicClient({ chain: base, transport: http() });
  const walletClient = createWalletClient({ account, chain: base, transport: http() });

  const uri =
    'data:application/json;base64,' +
    Buffer.from(JSON.stringify(registration)).toString('base64');

  console.log('👛 Using Base wallet:', account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('💰 Balance:', Number(balance) / 1e18, 'ETH');

  const data = encodeFunctionData({
    abi: registerAbi,
    functionName: 'register',
    args: [uri],
  });

  const gas = await publicClient.estimateGas({
    account: account.address,
    to: IDENTITY_REGISTRY,
    data,
  });
  console.log('⛽ Estimated gas:', gas.toString());

  const hash = await walletClient.sendTransaction({
    account,
    to: IDENTITY_REGISTRY,
    data,
    gas,
  });

  console.log('🧾 TX hash:', hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const transferLog = receipt.logs.find(
    (log) =>
      log.topics[0] === TRANSFER_TOPIC &&
      log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase(),
  );

  let agentId;
  if (transferLog?.topics[3]) {
    agentId = BigInt(transferLog.topics[3]).toString();
  }

  console.log('✅ ERC-8004 registration mined');
  console.log('   Agent ID:', agentId ?? '(could not parse)');
  if (agentId) {
    console.log('   8004scan URL: https://www.8004scan.io/agents/base/' + agentId);
  }
}

main().catch((err) => {
  console.error('❌ register_8004_base error:', err?.message || err);
  process.exit(1);
});
