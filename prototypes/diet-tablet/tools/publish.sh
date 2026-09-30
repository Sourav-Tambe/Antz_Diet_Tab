#!/bin/zsh
# Prototype tooling: publish the Diet requests prototype to Cloudflare Pages → https://antz-diet.pages.dev (needs a one-time `npx wrangler login`).
# Builds a clean static bundle (the prototype + the app/ assets it loads) and deploys it. Usage: tools/publish.sh
set -e
HERE=${0:A:h:h}; ROOT=${HERE:h:h}; OUT=$(mktemp -d)/diet-site
for f in $HERE/*.js; do node --check $f || { echo "PUBLISH STOPPED: $f has a syntax error"; exit 1; }; done
mkdir -p $OUT/prototypes/diet-tablet $OUT/app/icons/new
cp $HERE/index.html $HERE/split.html $HERE/diet.css $HERE/*.js $OUT/prototypes/diet-tablet/
cp -R $HERE/icons $OUT/prototypes/diet-tablet/
cp $ROOT/app/tokens.css $ROOT/app/type.css $ROOT/app/components.css $OUT/app/
cp $ROOT/app/icons/icons.css $OUT/app/icons/
cp $ROOT/app/icons/new/*.svg $OUT/app/icons/new/
print '<!doctype html><meta charset="utf-8"><title>Diet requests · prototype</title><meta http-equiv="refresh" content="0; url=prototypes/diet-tablet/index.html"><a href="prototypes/diet-tablet/index.html">Open the Diet requests prototype</a>' > $OUT/index.html
npx wrangler pages project list 2>/dev/null | grep -q 'antz-diet' || npx wrangler pages project create antz-diet --production-branch main
npx wrangler pages deploy $OUT --project-name antz-diet --branch main --commit-dirty=true
echo "Live: https://antz-diet.pages.dev"
