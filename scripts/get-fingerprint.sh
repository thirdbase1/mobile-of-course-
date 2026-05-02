#!/bin/bash
# Run this ONCE after generating your keystore to get the SHA-256 fingerprint
# needed for deep link verification (assetlinks.json)
#
# Usage: bash scripts/get-fingerprint.sh

KEYSTORE_FILE="${1:-release.keystore}"
KEY_ALIAS="${2:-mozosubz}"

if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "Keystore not found at: $KEYSTORE_FILE"
  echo "Usage: bash scripts/get-fingerprint.sh <keystore-file> <key-alias>"
  exit 1
fi

echo "Getting SHA-256 fingerprint from: $KEYSTORE_FILE"
keytool -list -v -keystore "$KEYSTORE_FILE" -alias "$KEY_ALIAS" 2>/dev/null \
  | grep "SHA256:" \
  | awk '{print $2}'

echo ""
echo "Copy the fingerprint above and paste it into:"
echo "  public/.well-known/assetlinks.json"
echo "  (replace REPLACE_WITH_YOUR_SHA256_FINGERPRINT)"
echo ""
echo "Then redeploy to Vercel so the file is live at:"
echo "  https://mozosubz.xyz/.well-known/assetlinks.json"
