#!/bin/bash
# Universal Blue - Gaming Environment Setup Script

set -euo pipefail

echo "Setting up gaming environment..."

# Install gaming-specific system optimizations
echo "Applying gaming system optimizations..."

# Configure sysctl for gaming
cat > /etc/sysctl.d/99-gaming.conf << 'EOF'
# Gaming optimizations
vm.max_map_count = 2147483642
vm.swappiness = 10
kernel.sched_autogroup_enabled = 0
kernel.sched_child_runs_first = 0
kernel.sched_latency_ns = 4000000
kernel.sched_migration_cost_ns = 500000
kernel.sched_min_granularity_ns = 500000
kernel.sched_nr_migrate = 8
kernel.sched_rr_timeslice_ms = 25
kernel.sched_rt_period_us = 1000000
kernel.sched_rt_runtime_us = 980000
kernel.sched_tunable_scaling = 0
kernel.sched_wakeup_granularity_ns = 750000
net.core.default_qdisc = fq_codel
EOF

# Configure memory limits for games
cat > /etc/security/limits.d/99-gaming.conf << 'EOF'
# Gaming memory limits
@games soft memlock unlimited
@games hard memlock unlimited
@games soft nofile 1048576
@games hard nofile 1048576
EOF

# Create games group and add user
groupadd -f games
usermod -a -G games $USER

# Configure systemd for gaming
echo "Configuring systemd for gaming..."
mkdir -p /etc/systemd/user.conf.d
cat > /etc/systemd/user.conf.d/99-gaming.conf << 'EOF'
[Manager]
DefaultLimitNOFILE=1048576
DefaultLimitMEMLOCK=infinity
EOF

# Install Lutris wine dependencies
echo "Setting up Wine environment..."
mkdir -p ~/.local/share/lutris/runners/wine
mkdir -p ~/.wine

# Configure Wine for gaming
export WINEARCH=win64
export WINEPREFIX=~/.wine
winecfg /v win10

# Install essential Wine components
winetricks corefonts vcrun2019 d3dcompiler_47 dxvk

# Configure Steam
echo "Configuring Steam..."
mkdir -p ~/.steam/steam/config
cat > ~/.steam/steam/config/config.vdf << 'EOF'
"InstallConfigStore"
{
    "Software"
    {
        "Valve"
        {
            "Steam"
            {
                "CompatToolMapping"
                {
                    "0"
                    {
                        "name"        "proton_experimental"
                        "mappings"
                        {
                            "1"        "proton_experimental"
                        }
                    }
                }
            }
        }
    }
}
EOF

# Install gaming utilities
echo "Installing gaming utilities..."

# Install GameMode
systemctl --user enable gamemoded
systemctl --user start gamemoded

# Configure MangoHud
mkdir -p ~/.config/MangoHud
cat > ~/.config/MangoHud/MangoHud.conf << 'EOF'
fps
frametime
cpu_temp
gpu_temp
ram
vram
position=top-left
font_size=24
EOF

# Install gaming-specific Flatpaks
echo "Installing gaming Flatpaks..."
flatpak install -y flathub com.valvesoftware.Steam
flatpak install -y flathub net.lutris.Lutris
flatpak install -y flathub com.heroicgameslauncher.hgl
flatpak install -y flathub org.prismlauncher.PrismLauncher
flatpak install -y flathub org.ryujinx.Ryujinx
flatpak install -y flathub org.DolphinEmu.dolphin-emu
flatpak install -y flathub net.pcsx2.PCSX2
flatpak install -y flathub org.ppsspp.PPSSPP

# Configure Discord for gaming
flatpak install -y flathub com.discordapp.Discord

# Set up controller support
echo "Setting up controller support..."
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/controller-setup.service << 'EOF'
[Unit]
Description=Controller Setup
After=graphical-session.target

[Service]
Type=oneshot
ExecStart=/usr/bin/systemctl --user start steam
RemainAfterExit=yes

[Install]
WantedBy=default.target
EOF

systemctl --user enable controller-setup.service

# Configure audio for gaming
echo "Configuring audio for gaming..."
mkdir -p ~/.config/pulse
cat > ~/.config/pulse/daemon.conf << 'EOF'
# Gaming audio configuration
default-sample-format = float32le
default-sample-rate = 48000
alternate-sample-rate = 44100
default-sample-channels = 2
default-channel-map = front-left,front-right
default-fragments = 2
default-fragment-size-msec = 25
enable-lfe-remixing = no
high-priority = yes
nice-level = -11
realtime-scheduling = yes
realtime-priority = 5
resample-method = speex-float-1
avoid-resampling = yes
EOF

# Install gaming-specific fonts
echo "Installing gaming fonts..."
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts

# Download common gaming fonts
curl -O https://github.com/microsoft/cascadia-code/releases/latest/download/CascadiaCode.zip
unzip -o CascadiaCode.zip
rm CascadiaCode.zip

fc-cache -fv

# Configure environment variables for gaming
echo "Configuring gaming environment variables..."
cat >> ~/.bashrc << 'EOF'

# Gaming environment variables
export MANGOHUD=1
export DXVK_HUD=fps
export RADV_PERFTEST=aco
export WINE_CPU_TOPOLOGY=4:2
export __GL_THREADED_OPTIMIZATIONS=1
export __GL_SYNC_TO_VBLANK=0
export STEAM_RUNTIME_HEAVY=1

# Gaming aliases
alias steam-native='steam -no-cef-sandbox'
alias steam-big='steam -tenfoot'
alias lutris-debug='lutris -d'
alias mangohud-config='mangohud --dlsym'

# Performance monitoring
alias gpu-temp='watch -n 1 nvidia-smi'
alias cpu-temp='watch -n 1 sensors'
alias fps-counter='mangohud glxgears'
EOF

# Install additional gaming tools
echo "Installing additional gaming tools..."

# Install itch.io games
flatpak install -y flathub io.itch.itch

# Install retro gaming tools
flatpak install -y flathub org.libretro.RetroArch

# Set up ROMs directory structure
mkdir -p ~/Games/{ROMs,Saves,Screenshots,Tools}
mkdir -p ~/Games/ROMs/{Nintendo/{NES,SNES,N64,GameCube,Wii,Switch},Sony/{PS1,PS2,PS3,PSP},Sega/{Genesis,Saturn,Dreamcast},Arcade}

# Configure firewall for gaming
echo "Configuring firewall for gaming..."
firewall-cmd --permanent --add-service=steam
firewall-cmd --permanent --add-port=27015/tcp
firewall-cmd --permanent --add-port=27015/udp
firewall-cmd --reload

# Create gaming desktop shortcuts
echo "Creating desktop shortcuts..."
mkdir -p ~/.local/share/applications

cat > ~/.local/share/applications/gaming-mode.desktop << 'EOF'
[Desktop Entry]
Name=Gaming Mode
Comment=Start optimized gaming session
Exec=gamemoderun %F
Icon=applications-games
Terminal=false
Type=Application
Categories=Game;
EOF

echo "Gaming environment setup complete!"
echo ""
echo "Reboot recommended to apply all optimizations."
echo ""
echo "Post-setup steps:"
echo "1. Log into Steam and enable Proton in Settings > Steam Play"
echo "2. Configure GPU drivers if using NVIDIA or AMD"
echo "3. Test audio and video settings in games"
echo "4. Configure controller in Steam Big Picture mode"
echo "5. Install additional games and launchers as needed"