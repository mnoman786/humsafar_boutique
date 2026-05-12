#!/usr/bin/env bash
# Hamsafar Boutique — one-shot setup script
# Run as root or with sudo: sudo bash setup.sh
# Tested on Ubuntu 22.04 / Debian 12

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV="$BACKEND_DIR/venv"
SERVICE_USER="${SUDO_USER:-$(whoami)}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }

# ── 1. System packages ────────────────────────────────────────────────────────
info "Installing system packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv nodejs npm

# ── 2. Backend ────────────────────────────────────────────────────────────────
info "Setting up Django backend..."
python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$BACKEND_DIR/requirements.txt"

# Create .env if it doesn't exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
  warn ".env not found — creating with defaults. Edit $BACKEND_DIR/.env before production use."
  cat > "$BACKEND_DIR/.env" <<EOF
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
DEBUG=True
DJANGO_SETTINGS_MODULE=config.settings.development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF
fi

# Run migrations and collect static
cd "$BACKEND_DIR"
"$VENV/bin/python" manage.py migrate --run-syncdb
"$VENV/bin/python" manage.py collectstatic --noinput
cd "$PROJECT_DIR"

# ── 3. Frontend ───────────────────────────────────────────────────────────────
info "Setting up Next.js frontend..."
cd "$FRONTEND_DIR"
npm install --legacy-peer-deps --silent

# Create .env.local if missing
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > "$FRONTEND_DIR/.env.local"
fi

npm run build
cd "$PROJECT_DIR"

# ── 4. Systemd — backend ──────────────────────────────────────────────────────
info "Creating systemd service: hamsafar-backend..."
cat > /etc/systemd/system/hamsafar-backend.service <<EOF
[Unit]
Description=Hamsafar Boutique — Django Backend
After=network.target

[Service]
User=$SERVICE_USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$VENV/bin/python manage.py runserver 0.0.0.0:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ── 5. Systemd — frontend ─────────────────────────────────────────────────────
info "Creating systemd service: hamsafar-frontend..."
NODE_BIN="$(which node)"
NPM_BIN="$(which npm)"

cat > /etc/systemd/system/hamsafar-frontend.service <<EOF
[Unit]
Description=Hamsafar Boutique — Next.js Frontend
After=network.target hamsafar-backend.service

[Service]
User=$SERVICE_USER
WorkingDirectory=$FRONTEND_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=$NPM_BIN start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ── 6. Enable and start ───────────────────────────────────────────────────────
info "Enabling and starting services..."
systemctl daemon-reload

systemctl enable hamsafar-backend
systemctl restart hamsafar-backend

systemctl enable hamsafar-frontend
systemctl restart hamsafar-frontend

# ── 7. Status ─────────────────────────────────────────────────────────────────
echo ""
info "Done! Services are running:"
systemctl is-active --quiet hamsafar-backend  && echo -e "  ${GREEN}✓${NC} hamsafar-backend  → http://localhost:8000" || warn "hamsafar-backend failed to start"
systemctl is-active --quiet hamsafar-frontend && echo -e "  ${GREEN}✓${NC} hamsafar-frontend → http://localhost:3000" || warn "hamsafar-frontend failed to start"

echo ""
echo "  Useful commands:"
echo "    sudo systemctl status hamsafar-backend"
echo "    sudo systemctl status hamsafar-frontend"
echo "    sudo journalctl -u hamsafar-backend -f"
echo "    sudo journalctl -u hamsafar-frontend -f"
echo ""
warn "First run? Create a superuser:"
echo "    cd $BACKEND_DIR && $VENV/bin/python manage.py createsuperuser"
