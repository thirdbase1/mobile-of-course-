#!/usr/bin/env bash
# Generates a release keystore for signing the Mozosubz Android APK.
# Run this ONCE locally and then store the outputs as GitHub secrets.
#
# Requirements: Java JDK 17+ installed (keytool is bundled with the JDK)
#
# Usage:
#   chmod +x scripts/generate-keystore.sh
#   ./scripts/generate-keystore.sh

set -e

KEYSTORE_FILE="release.keystore"
KEY_ALIAS="mozosubz-key"
VALIDITY_DAYS=10000

echo "==================================================="
echo "  Mozosubz Android Release Keystore Generator"
echo "==================================================="
echo ""
echo "You will be prompted to enter a keystore password and key password."
echo "Save these passwords somewhere safe — you will need them every time"
echo "you build a new release."
echo ""

keytool \
  -genkey \
  -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity $VALIDITY_DAYS

echo ""
echo "Keystore generated: $KEYSTORE_FILE"
echo ""
echo "==================================================="
echo "  Next: Add these 4 GitHub Actions secrets"
echo "==================================================="
echo ""
echo "Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "1. KEYSTORE_BASE64"
echo "   Run this command and paste the output as the secret value:"
echo ""
echo "   base64 -w 0 $KEYSTORE_FILE"
echo ""
echo "2. KEYSTORE_PASSWORD"
echo "   The password you chose for the keystore."
echo ""
echo "3. KEY_ALIAS"
echo "   Value: $KEY_ALIAS"
echo ""
echo "4. KEY_PASSWORD"
echo "   The password you chose for the key (may be the same as KEYSTORE_PASSWORD)."
echo ""
echo "==================================================="
echo "  IMPORTANT: Keep release.keystore safe!"
echo "==================================================="
echo "  - Do NOT commit release.keystore to git."
echo "  - Back it up somewhere secure (cloud storage, password manager, etc.)."
echo "  - If you lose it you cannot update the app on the Play Store."
echo ""

# Remind user to gitignore the keystore
if ! grep -q "release.keystore" .gitignore 2>/dev/null; then
  echo "release.keystore" >> .gitignore
  echo "Added release.keystore to .gitignore automatically."
fi
