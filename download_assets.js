const fs = require('fs');
const path = require('path');
const https = require('https');

const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const assets = [
  'logo-dark.png',
  'logo-white.png',
  'favicon.png',
  'portfolio-1.jpg',
  'portfolio-2.jpg',
  'portfolio-3.jpg',
  'client-1.jpg',
  'image-1.jpg',
  'image-2.jpg',
  'image-3.jpg',
  'image-4.jpg',
  'image-5.jpg',
  'image-6.jpg',
  'image-7.jpg',
  'image-8.jpg'
];

const baseUrl = 'https://gbgouveia.github.io/GbGouveia-Fotografia/assets/';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Iniciando download dos assets de Gabriel Gouveia Fotografia...');
  for (const asset of assets) {
    const url = baseUrl + asset;
    const dest = path.join(assetsDir, asset);
    try {
      console.log(`Baixando: ${url} -> ${dest}`);
      await downloadFile(url, dest);
      console.log(`Sucesso: ${asset}`);
    } catch (err) {
      console.error(`Erro ao baixar ${asset}:`, err.message);
    }
  }
  console.log('Fim do download dos assets!');
}

run();
