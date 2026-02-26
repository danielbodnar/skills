#!/bin/bash
# basic-pkgbuild.sh - Basic PKGBUILD template for infrastructure packages

cat > PKGBUILD << 'EOF'
# Maintainer: Your Name <your.email@example.com>
pkgname=custom-service
pkgver=1.0.0
pkgrel=1
pkgdesc="Custom service for infrastructure deployment"
arch=('any')
url="https://github.com/example/custom-service"
license=('MIT')
depends=('systemd' 'bash')
makedepends=('git')
backup=('etc/custom-service/config.conf')
source=("$pkgname-$pkgver.tar.gz"
        "custom-service.service"
        "config.conf")
sha256sums=('SKIP'
            'SKIP'
            'SKIP')

build() {
    cd "$pkgname-$pkgver"
    # Build steps if needed
}

package() {
    cd "$pkgname-$pkgver"
    
    # Install binary
    install -Dm755 custom-service "$pkgdir/usr/bin/custom-service"
    
    # Install systemd service
    install -Dm644 "$srcdir/custom-service.service" \
        "$pkgdir/usr/lib/systemd/system/custom-service.service"
    
    # Install configuration
    install -Dm644 "$srcdir/config.conf" \
        "$pkgdir/etc/custom-service/config.conf"
    
    # Install documentation
    install -Dm644 README.md "$pkgdir/usr/share/doc/$pkgname/README.md"
    install -Dm644 LICENSE "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
}
EOF

echo "Basic PKGBUILD created successfully"