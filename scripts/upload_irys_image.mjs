import Irys from '@irys/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const CONFIG = {
  gateway: 'https://uploader.irys.xyz',
};

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/upload_irys_image.mjs <image-path>');
    process.exit(1);
  }

  const key = process.env.AGENT_PRIVATE_KEY;
  if (!key) {
    console.error('AGENT_PRIVATE_KEY missing in .env');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const irys = new Irys({
    url: CONFIG.gateway,
    token: 'ethereum',
    key,
  });

  const data = fs.readFileSync(filePath);

  const tags = [
    { name: 'Content-Type', value: 'image/jpeg' },
    { name: 'App-Name', value: 'web4agent-base-8004' },
    { name: 'Object-Type', value: 'avatar' },
  ];

  console.log('📤 Uploading to Irys:', filePath);
  const receipt = await irys.upload(data, { tags });

  const url = `https://gateway.irys.xyz/${receipt.id}`;
  console.log('✅ Irys upload success');
  console.log('   TX ID:', receipt.id);
  console.log('   URL  :', url);
}

main().catch((err) => {
  console.error('❌ upload_irys_image error:', err?.message || err);
  process.exit(1);
});
