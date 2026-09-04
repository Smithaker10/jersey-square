import fs from 'fs';
import path from 'path';
import https from 'https';

const targetDir = path.resolve('app/public/logos/clubs');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Map each team to its crests.football-data.org ID or SVG URL
const clubCrests = {
  barcelona: 'https://crests.football-data.org/81.svg',
  realmadrid: 'https://crests.football-data.org/86.svg',
  manunited: 'https://crests.football-data.org/66.svg',
  acmilan: 'https://crests.football-data.org/98.svg',
  mancity: 'https://crests.football-data.org/65.svg',
  liverpool: 'https://crests.football-data.org/64.svg',
  bayern: 'https://crests.football-data.org/5.svg',
  arsenal: 'https://crests.football-data.org/57.svg',
  napoli: 'https://crests.football-data.org/113.svg',
  intermiami: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg',
  chelsea: 'https://crests.football-data.org/61.svg',
  juventus: 'https://crests.football-data.org/109.svg',
  dortmund: 'https://crests.football-data.org/4.svg',
  india: 'https://raw.githubusercontent.com/johann/football-logos/master/Asia/India.png'
};

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

function downloadFile(key, url) {
  return new Promise((resolve) => {
    const ext = url.endsWith('.png') ? '.png' : '.svg';
    const dest = path.join(targetDir, `${key}${ext}`);
    https.get(url, { headers: { 'User-Agent': userAgent } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(key, res.headers.location).then(resolve);
      }
      if (res.statusCode !== 200) {
        console.log(`Failed [${res.statusCode}]: ${key}`);
        return resolve(false);
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        console.log(`Saved: ${key}${ext} (${fs.statSync(dest).size} bytes)`);
        resolve(true);
      });
    }).on('error', (err) => {
      console.log(`Error ${key}: ${err.message}`);
      resolve(false);
    });
  });
}

for (const [key, url] of Object.entries(clubCrests)) {
  await downloadFile(key, url);
  await new Promise(r => setTimeout(r, 200));
}
console.log('Finished downloading all crests.');
