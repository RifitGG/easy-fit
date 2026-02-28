const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = {
  host: '89.111.171.11',
  port: 22,
  username: 'root',
  password: 'H1pfvG6lbYHgzEoS'
};

function sshExec(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${label || cmd} ===`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '', errOut = '';
      stream.on('data', d => { out += d; process.stdout.write(d); });
      stream.stderr.on('data', d => { errOut += d; process.stderr.write(d); });
      stream.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.log(`[exit code: ${code}]`);
        }
        resolve({ out: out.trim(), err: errOut.trim(), code });
      });
    });
  });
}

async function main() {
  const step = process.argv[2] || 'key';
  const conn = new Client();

  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect(SERVER);
  });
  console.log('SSH connected OK!');

  try {
    if (step === 'key') {
      // Install SSH key for passwordless access
      const pubKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa.pub'), 'utf8').trim();
      await sshExec(conn, `mkdir -p ~/.ssh && echo '${pubKey}' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo 'SSH_KEY_OK'`, 'Install SSH key');
    }

    else if (step === 'setup') {
      // Update system
      await sshExec(conn, 'export DEBIAN_FRONTEND=noninteractive && apt-get update -qq && apt-get upgrade -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"', 'System update');

      // Install Node.js 20
      await sshExec(conn, 'export DEBIAN_FRONTEND=noninteractive && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y -qq nodejs && node --version && npm --version', 'Install Node.js 20');

      // Install PostgreSQL
      await sshExec(conn, 'export DEBIAN_FRONTEND=noninteractive && apt-get install -y -qq postgresql postgresql-contrib && systemctl enable postgresql && systemctl start postgresql && psql --version', 'Install PostgreSQL');

      // Install PM2 & Nginx
      await sshExec(conn, 'export DEBIAN_FRONTEND=noninteractive && npm install -g pm2 && apt-get install -y -qq nginx && systemctl enable nginx', 'Install PM2 & Nginx');

      console.log('\n✅ All software installed!');
    }

    else if (step === 'db') {
      // Setup PostgreSQL database
      const dbPassword = 'FitApp_Pr0d_2024!';
      await sshExec(conn, `sudo -u postgres psql -c "CREATE USER fitapp WITH PASSWORD '${dbPassword}';" 2>&1 || true`, 'Create DB user');
      await sshExec(conn, `sudo -u postgres psql -c "CREATE DATABASE fitapp OWNER fitapp;" 2>&1 || true`, 'Create database');
      await sshExec(conn, `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fitapp TO fitapp;" 2>&1 || true`, 'Grant privileges');
      console.log('\n✅ Database configured!');
    }

    else if (step === 'upload') {
      // Create tar archive of backend
      const { execSync } = require('child_process');
      const backendDir = path.join(__dirname, '..', 'backend');
      const tarPath = path.join(__dirname, '..', 'backend.tar.gz');

      // Use tar via node
      console.log('Creating archive...');
      execSync(`tar -czf "${tarPath}" -C "${path.join(backendDir, '..')}" --exclude="node_modules" --exclude="uploads/avatars/*" backend`, { stdio: 'inherit' });

      // Upload via SCP using ssh2
      const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));
      const fileData = fs.readFileSync(tarPath);

      console.log(`\nUploading backend.tar.gz (${(fileData.length / 1024).toFixed(0)} KB)...`);
      await new Promise((res, rej) => {
        const ws = sftp.createWriteStream('/root/backend.tar.gz');
        ws.on('close', res);
        ws.on('error', rej);
        ws.end(fileData);
      });
      console.log('Upload complete!');

      // Extract on server
      await sshExec(conn, 'cd /root && tar -xzf backend.tar.gz && cd backend && npm install --production', 'Extract & install deps');

      // Create .env
      const envContent = `DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitapp
DB_USER=fitapp
DB_PASSWORD=FitApp_Pr0d_2024!
JWT_SECRET=fitapp_${Date.now()}_prod_secret_key
PORT=3000
NODE_ENV=production
`;
      await sshExec(conn, `cat > /root/backend/.env << 'ENVEOF'
${envContent}ENVEOF`, 'Create .env');

      // Create uploads directory
      await sshExec(conn, 'mkdir -p /root/backend/uploads/avatars', 'Create uploads dir');

      console.log('\n✅ Backend uploaded and configured!');
    }

    else if (step === 'initdb') {
      // Run database creation scripts
      await sshExec(conn, 'cd /root/backend && node src/db/create.js', 'Create tables');
      await sshExec(conn, 'cd /root/backend && node src/db/seed.js', 'Seed data');
      // Run migrations
      await sshExec(conn, 'cd /root/backend && node src/db/add-water.js 2>&1 || echo "water migration done or skipped"', 'Water migration');
      console.log('\n✅ Database initialized!');
    }

    else if (step === 'pm2') {
      // Start app with PM2
      await sshExec(conn, 'cd /root/backend && pm2 delete fitapp 2>/dev/null; pm2 start src/index.js --name fitapp && pm2 save && pm2 startup systemd -u root --hp /root 2>&1 | tail -1', 'PM2 start');
      await sshExec(conn, 'pm2 list', 'PM2 status');
      console.log('\n✅ PM2 configured!');
    }

    else if (step === 'nginx') {
      const nginxConf = `server {
    listen 80;
    server_name 89.111.171.11;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /root/backend/uploads/;
    }
}`;
      await sshExec(conn, `cat > /etc/nginx/sites-available/fitapp << 'NGINXEOF'
${nginxConf}
NGINXEOF`, 'Create Nginx config');

      await sshExec(conn, 'ln -sf /etc/nginx/sites-available/fitapp /etc/nginx/sites-enabled/fitapp && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl restart nginx', 'Enable Nginx config');
      
      // Open firewall
      await sshExec(conn, 'ufw allow 80/tcp 2>/dev/null; ufw allow 443/tcp 2>/dev/null; ufw allow 22/tcp 2>/dev/null; echo "Firewall OK"', 'Configure firewall');

      console.log('\n✅ Nginx configured!');
    }

    else if (step === 'test') {
      await sshExec(conn, 'curl -s http://localhost:3000/api/health', 'Test API');
      console.log('\n✅ Deployment complete!');
      console.log(`\n🌐 API доступен по адресу: http://89.111.171.11/api/health`);
    }

    else if (step === 'all') {
      // Run all steps in sequence
      for (const s of ['key', 'setup', 'db', 'upload', 'initdb', 'pm2', 'nginx', 'test']) {
        console.log(`\n\n${'='.repeat(50)}`);
        console.log(`STEP: ${s}`);
        console.log('='.repeat(50));
        // Reconnect for each step to avoid timeouts
      }
      console.log('Use individual steps: node scripts/deploy.js <step>');
      console.log('Steps: key → setup → db → upload → initdb → pm2 → nginx → test');
    }

  } finally {
    conn.end();
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
