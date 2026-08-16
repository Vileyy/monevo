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
   - Custom TCP `3000` from `0.0.0.0/0` (HTTP API; trial, no domain yet)
8. Storage: 20 GB gp3
9. Launch, copy the public IPv4

## 2. Install Docker on the instance

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
sudo apt-get update
sudo apt-get install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
```

## 3. Run the API

```bash
git clone https://github.com/Vileyy/monevo.git
cd monevo
cp deploy/.env.example deploy/.env
nano deploy/.env   # set POSTGRES_PASSWORD and JWT_SECRET
docker compose -f deploy/docker-compose.yml up -d --build
curl http://YOUR_PUBLIC_IP:3000/health
```

Expect `{"status":"ok"}`. Swagger: `http://YOUR_PUBLIC_IP:3000/api`

## 4. Point the app at the API

In the Expo project, set:

```
EXPO_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:3000
```

Restart Expo. Android emulator cannot use `localhost` for the EC2 host; use the public IP.

## Notes

- This trial account stops when credits run out. Export Postgres before that date.
- HTTP on port 3000 is enough to learn deploy. Add a domain + Caddy later for HTTPS.
- Set a billing alarm at $5 and $20 in Billing → Budgets.
