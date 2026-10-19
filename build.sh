#!/bin/sh
# Packages the game folder into dist/orbit-hop.zip (index.html at the zip root).
set -e
cd "$(dirname "$0")"
node --check game/game.js
rm -rf dist && mkdir -p dist
(cd game && zip -q -r -X ../dist/orbit-hop.zip . -x '.*')
echo "Built dist/orbit-hop.zip"
unzip -l dist/orbit-hop.zip
