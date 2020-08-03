#!/bin/bash

set -euxo pipefail

URL=https://evermeet.cx/ffmpeg/ffmpeg-4.3.1.zip
DIR="./homebridge-test-storage"
BINARY="$DIR/ffmpeg"
ZIP="$BINARY.zip"

mkdir -p $DIR

if [ -f "$BINARY" ]; then
  echo "ffmpeg exists, skipping"
else
  curl -o $ZIP $URL
  unzip -d $DIR $ZIP
fi

npm run build

if [ -f "$DIR/config.json" ]; then
  echo "config exists, skipping"
else
  npx ts-node --project tsconfig.bin.json bin/generateConfig.ts
fi
