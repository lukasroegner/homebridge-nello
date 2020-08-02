#!/bin/bash

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
