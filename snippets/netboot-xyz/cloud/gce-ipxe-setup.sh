#!/bin/bash
# Google Compute Engine iPXE Setup for netboot.xyz

# Set variables
PROJECT_ID="your-project-id"
INSTANCE_NAME="netboot-test"
IMAGE_NAME="netboot-xyz-gce"
GS_BUCKET="your-bucket-name"
ZONE="us-central1-a"

# Create temporary directory
tmp=$(mktemp -d)

# Create main iPXE script for GCE metadata
cat > $tmp/main.ipxe << 'EOF'
#!ipxe
echo Google Compute Engine - iPXE boot via metadata
ifstat ||
dhcp ||
route ||
chain -ar http://metadata.google.internal/computeMetadata/v1/instance/attributes/ipxeboot
EOF

# Build custom iPXE image for GCE
echo "Building custom iPXE image..."
make bin/ipxe.usb CONFIG=cloud EMBED=$tmp/main.ipxe
cp -f bin/ipxe.usb $tmp/disk.raw

# Create GCE-compatible image archive
( cd $tmp; tar Sczvf $IMAGE_NAME.tar.gz disk.raw )

# Upload to Google Cloud Storage
echo "Uploading image to GCS..."
gsutil cp $tmp/$IMAGE_NAME.tar.gz gs://$GS_BUCKET

# Create GCE image from GCS
echo "Creating GCE image..."
gcloud compute images create $IMAGE_NAME \
    --source-uri gs://$GS_BUCKET/$IMAGE_NAME.tar.gz \
    --project $PROJECT_ID

# Create instance with custom iPXE script
echo "Creating GCE instance..."
gcloud compute instances create $INSTANCE_NAME \
    --image $IMAGE_NAME \
    --metadata serial-port-enable=1 \
    --metadata-from-file ipxeboot=boot.ipxe \
    --zone $ZONE \
    --project $PROJECT_ID

# Example boot.ipxe content
cat > boot.ipxe << 'EOF'
#!ipxe
# Custom boot script for GCE instance
dhcp
chain --autofree https://boot.netboot.xyz
EOF

echo "Instance created. Connect to serial console:"
echo "gcloud beta compute connect-to-serial-port $INSTANCE_NAME --zone $ZONE --project $PROJECT_ID"

# Clean up
rm -rf $tmp