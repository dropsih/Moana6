const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const crypto = require('crypto');
const tunnel = require('tunnel');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function generateRandomWallet() {
  const hex = crypto.randomBytes(20).toString('hex');
  return `0x${hex}`;
}

function generateRandomTwitter() {
  const length = Math.floor(Math.random() * 6) + 5; 
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '0x';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

let inviteCode;
try {
  inviteCode = fs.readFileSync('code.txt', 'utf8').trim();
  if (!inviteCode) {
    throw new Error('File code.txt is empty');
  }
} catch (error) {
  console.error('Error reading code.txt:', error.message);
  console.log('Using default code: z6sTvptS');
  inviteCode = 'z6sTvptS'; 
}

let proxies = [];
try {
  const proxyData = fs.readFileSync('proxies.txt', 'utf8').trim();
  if (proxyData) {
    proxies = proxyData.split('\n').map(line => line.trim()).filter(line => line);
  }
} catch (error) {
  console.log('No proxies found in proxies.txt or file not exists. Using direct connection.');
}

function getProxyAgent(proxy) {
  if (!proxy) return null;

  let protocol = 'http';
  let host, port, username, password;

  if (proxy.includes('://')) {
    const [proto, rest] = proxy.split('://');
    protocol = proto.toLowerCase();
    proxy = rest;
  }

  if (proxy.includes('@')) {
    const [auth, hostPort] = proxy.split('@');
    [username, password] = auth.split(':');
    [host, port] = hostPort.split(':');
  } else {
    [host, port] = proxy.split(':');
  }

  const proxyOptions = {
    host,
    port: parseInt(port),
    proxyAuth: username && password ? `${username}:${password}` : undefined
  };

  if (protocol === 'http' || protocol === 'https') {
    return tunnel.httpsOverHttp({ proxy: proxyOptions });
  } else if (protocol === 'socks4') {
    return tunnel.httpsOverSocks4({ proxy: proxyOptions });
  } else if (protocol === 'socks5') {
    return tunnel.httpsOverSocks5({ proxy: proxyOptions });
  } else {
    console.warn(`Unsupported proxy protocol: ${protocol}. Using direct connection.`);
    return null;
  }
}

function getRandomProxyAgent() {
  if (proxies.length === 0) return null;
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  console.log(`Using proxy: ${randomProxy}`);
  return getProxyAgent(randomProxy);
}

async function registerUser(wallet, twitter) {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': getRandomUserAgent(),
        'Origin': 'https://agentmoana.xyz',
        'Referer': `https://agentmoana.xyz/r/${inviteCode}`,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      },
      httpsAgent: getRandomProxyAgent(), 
      timeout: 10000 
    };

    const response = await axios.post('https://moana-y43h.onrender.com/user', {
      wallet: wallet,
      twitter: twitter,
      invite: inviteCode,
      referralLink: `https://agentmoana.xyz/r/${inviteCode}`
    }, config);
    
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error.message);
    if (error.response) {
      console.error('Response error:', error.response.data);
    }
    return null;
  }
}

async function main() {
  console.log('\n');
  console.log('=== Moana Registration Bot | AirdropInsiders ===');
  console.log(`Using referral code: ${inviteCode}`);
  console.log(`Loaded ${proxies.length} proxies from proxies.txt`);
  
  rl.question('How many accounts do you want to create? ', async (count) => {
    const numAccounts = parseInt(count);
    
    if (isNaN(numAccounts) || numAccounts <= 0) {
      console.log('The number of accounts must be a positive integer.');
      rl.close();
      return;
    }
    
    console.log(`\nStarting creation of ${numAccounts} accounts...`);
    
    const accounts = [];
    
    for (let i = 0; i < numAccounts; i++) {
      const wallet = generateRandomWallet();
      const twitter = generateRandomTwitter();
      
      console.log(`\nRegistering account ${i+1}/${numAccounts}:`);
      console.log(`Wallet: ${wallet}`);
      console.log(`Twitter: ${twitter}`);
      console.log(`Referral Link: https://agentmoana.xyz/r/${inviteCode}`);
      
      const result = await registerUser(wallet, twitter);
      
      if (result && result.success) {
        console.log('Status: SUCCESS ✅');
        accounts.push({
          wallet,
          twitter,
          referralCode: result.user.referralCode,
          referralLink: `https://agentmoana.xyz/r/${inviteCode}`,
          createdAt: result.user.createdAt
        });
      } else {
        console.log('Status: FAILED ❌');
      }
      
      const delay = Math.floor(Math.random() * 2000) + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const accountsData = accounts.map(acc => 
      `Wallet: ${acc.wallet}\nTwitter: ${acc.twitter}\nReferral Code: ${acc.referralCode}\nReferral Link: ${acc.referralLink}\nCreated At: ${acc.createdAt}\n-------------------`
    ).join('\n\n');
    
    fs.writeFileSync('users.txt', accountsData);
    
    console.log(`\n${accounts.length} accounts successfully created and saved to users.txt`);
    rl.close();
  });
}

main();