#!/bin/bash

# ===========================================
# DIGITALLZ KEYWORDS PLATFORM - MONITORING SETUP
# ===========================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Install Prometheus
install_prometheus() {
    log "📊 Installing Prometheus..."
    
    # Create prometheus user
    sudo useradd --no-create-home --shell /bin/false prometheus
    
    # Create directories
    sudo mkdir -p /etc/prometheus
    sudo mkdir -p /var/lib/prometheus
    sudo chown prometheus:prometheus /etc/prometheus
    sudo chown prometheus:prometheus /var/lib/prometheus
    
    # Download and install Prometheus
    cd /tmp
    wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
    tar xvf prometheus-2.45.0.linux-amd64.tar.gz
    cd prometheus-2.45.0.linux-amd64
    
    sudo cp prometheus /usr/local/bin/
    sudo cp promtool /usr/local/bin/
    sudo chown prometheus:prometheus /usr/local/bin/prometheus
    sudo chown prometheus:prometheus /usr/local/bin/promtool
    
    sudo cp -r consoles /etc/prometheus
    sudo cp -r console_libraries /etc/prometheus
    sudo chown -R prometheus:prometheus /etc/prometheus/consoles
    sudo chown -R prometheus:prometheus /etc/prometheus/console_libraries
    
    # Copy configuration
    sudo cp monitoring/prometheus.yml /etc/prometheus/prometheus.yml
    sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml
    
    # Create systemd service
    sudo tee /etc/systemd/system/prometheus.service > /dev/null <<EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \\
    --config.file /etc/prometheus/prometheus.yml \\
    --storage.tsdb.path /var/lib/prometheus/ \\
    --web.console.templates=/etc/prometheus/consoles \\
    --web.console.libraries=/etc/prometheus/console_libraries \\
    --web.listen-address=0.0.0.0:9090 \\
    --web.enable-lifecycle

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl start prometheus
    sudo systemctl enable prometheus
    
    log "✅ Prometheus installed and started"
}

# Install Grafana
install_grafana() {
    log "📈 Installing Grafana..."
    
    # Add Grafana repository
    wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
    echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
    
    # Update and install
    sudo apt-get update
    sudo apt-get install -y grafana
    
    # Copy configuration
    sudo cp monitoring/grafana/dashboards/digitallz-dashboard.json /var/lib/grafana/dashboards/
    sudo chown grafana:grafana /var/lib/grafana/dashboards/digitallz-dashboard.json
    
    # Start and enable
    sudo systemctl start grafana-server
    sudo systemctl enable grafana-server
    
    log "✅ Grafana installed and started"
}

# Install Node Exporter
install_node_exporter() {
    log "🖥️ Installing Node Exporter..."
    
    # Create node_exporter user
    sudo useradd --no-create-home --shell /bin/false node_exporter
    
    # Download and install
    cd /tmp
    wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
    tar xvf node_exporter-1.6.1.linux-amd64.tar.gz
    cd node_exporter-1.6.1.linux-amd64
    
    sudo cp node_exporter /usr/local/bin/
    sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
    
    # Create systemd service
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl start node_exporter
    sudo systemctl enable node_exporter
    
    log "✅ Node Exporter installed and started"
}

# Install Alertmanager
install_alertmanager() {
    log "🚨 Installing Alertmanager..."
    
    # Create alertmanager user
    sudo useradd --no-create-home --shell /bin/false alertmanager
    
    # Create directories
    sudo mkdir -p /etc/alertmanager
    sudo mkdir -p /var/lib/alertmanager
    sudo chown alertmanager:alertmanager /etc/alertmanager
    sudo chown alertmanager:alertmanager /var/lib/alertmanager
    
    # Download and install
    cd /tmp
    wget https://github.com/prometheus/alertmanager/releases/download/v0.25.0/alertmanager-0.25.0.linux-amd64.tar.gz
    tar xvf alertmanager-0.25.0.linux-amd64.tar.gz
    cd alertmanager-0.25.0.linux-amd64
    
    sudo cp alertmanager /usr/local/bin/
    sudo cp amtool /usr/local/bin/
    sudo chown alertmanager:alertmanager /usr/local/bin/alertmanager
    sudo chown alertmanager:alertmanager /usr/local/bin/amtool
    
    # Copy configuration
    sudo cp monitoring/alertmanager.yml /etc/alertmanager/alertmanager.yml
    sudo chown alertmanager:alertmanager /etc/alertmanager/alertmanager.yml
    
    # Create systemd service
    sudo tee /etc/systemd/system/alertmanager.service > /dev/null <<EOF
[Unit]
Description=Alertmanager
Wants=network-online.target
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
ExecStart=/usr/local/bin/alertmanager \\
    --config.file /etc/alertmanager/alertmanager.yml \\
    --storage.path /var/lib/alertmanager/ \\
    --web.listen-address=0.0.0.0:9093

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl start alertmanager
    sudo systemctl enable alertmanager
    
    log "✅ Alertmanager installed and started"
}

# Setup CloudWatch agent
setup_cloudwatch() {
    log "☁️ Setting up CloudWatch agent..."
    
    # Download CloudWatch agent
    cd /tmp
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    sudo rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Copy configuration
    sudo cp monitoring/cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
    
    # Start CloudWatch agent
    sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
        -a fetch-config \
        -m ec2 \
        -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
        -s
    
    log "✅ CloudWatch agent configured"
}

# Setup log rotation
setup_log_rotation() {
    log "📝 Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/digitallz > /dev/null <<EOF
/var/log/digitallz/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload digitallz-backend
    endscript
}
EOF

    log "✅ Log rotation configured"
}

# Main setup function
main() {
    log "🚀 Setting up monitoring for Digitallz Keywords Platform"
    
    # Update system
    sudo apt-get update
    
    # Install dependencies
    sudo apt-get install -y wget curl unzip
    
    # Install monitoring stack
    install_prometheus
    install_grafana
    install_node_exporter
    install_alertmanager
    setup_cloudwatch
    setup_log_rotation
    
    log "🎉 Monitoring setup completed!"
    log "📊 Prometheus: http://localhost:9090"
    log "📈 Grafana: http://localhost:3000 (admin/admin)"
    log "🚨 Alertmanager: http://localhost:9093"
}

main "$@"
