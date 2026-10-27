# Deploy Monevo API on AWS trial (EC2)

Cost target: one small instance, Postgres on the same machine. No RDS, no load balancer.

## 1. Create the instance (Sydney `ap-southeast-2`)

1. EC2 → Launch instance
2. Name: `monevo-api`
3. AMI: Ubuntu 24.04 LTS
4. Type: `t3.micro` (or `t4g.micro` if ARM is available)
5. Key pair: create and download `.pem`
6. Network: default VPC
7. Security group inbound:
   - SSH `22` from your IP
   - HTTP `80` from `0.0.0.0/0` (Let's Encrypt + redirect to HTTPS)
   - HTTPS `443` from `0.0.0.0/0` (Caddy)
   - `3000` only for temporary debugging; remove it once HTTPS works
8. Storage: 20 GB gp3
9. Launch, copy the public IPv4

## 2. Install Docker on the instance

```bash
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP
sudo dnf update -y
sudo dnf install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
exit
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP
```

## 3. Run the API + HTTPS

Point a DNS `A` record (for example `api.example.com`) at the instance public
IP, then:

```bash
git clone https://github.com/Vileyy/monevo.git
cd monevo
cp deploy/.env.example deploy/.env
nano deploy/.env   # set POSTGRES_PASSWORD, JWT_SECRET, API_DOMAIN, ACME_EMAIL
docker compose -f deploy/docker-compose.yml up -d --build
curl https://YOUR_DOMAIN/health
```

Expect `{"status":"ok"}`. Caddy gets and renews the Let's Encrypt certificate
automatically. Certificates live in the `caddy_data` volume.

If Caddy logs ACME errors, check that DNS points at this instance and that the
security group allows inbound `80` and `443`.

## 4. Point the app at the API

Set the HTTPS URL in the local env and in EAS:

```bash
# frontend/.env
EXPO_PUBLIC_API_URL=https://YOUR_DOMAIN

# EAS production environment
eas env:set production \
  --name EXPO_PUBLIC_API_URL \
  --value https://YOUR_DOMAIN \
  --visibility plaintext
```

Restart Expo after editing `frontend/.env`. Android emulator cannot use
`localhost` for the EC2 host; use the public domain.

## Notes

- This trial account stops when credits run out. Export Postgres before that date.
- Keep port `3000` closed to the public once HTTPS works; Caddy reaches the API
  over the internal Docker network.
- Set a billing alarm at $5 and $20 in Billing → Budgets.
- Google Play Data safety requires encryption in transit, so release builds must
  use the `https://` URL, never the EC2 IP over HTTP.
