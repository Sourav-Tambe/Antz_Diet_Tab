#!/bin/zsh
# Prototype tooling: capture one screen of the Diet prototype. Needs a static server on 8789 at the repo root and agent-browser.
# Usage: tools/cap.sh <outdir> <name> <hash-without-#> [user] [frame tablet|web] [setup-js before render] [js after render, e.g. a scroll]
out=$1 name=$2 hash=$3 u=${4:-u-keer} fr=${5:-tablet} js=${6:-} post=${7:-}
mkdir -p "$out"
B() { agent-browser --session dietcap "$@"; }
if [[ $fr == web ]]; then B set viewport 1340 960 >/dev/null; else B set viewport 900 1400 >/dev/null; fi
B open "http://localhost:8789/prototypes/diet-tablet/index.html?v=$RANDOM#/diets" >/dev/null
B eval "sessionStorage.clear();1" >/dev/null
B open "http://localhost:8789/prototypes/diet-tablet/index.html?v=$RANDOM#/$hash" >/dev/null
B wait 250 >/dev/null
B eval "S.user='$u';S.frame='$fr';fit();$js;render();$post;1" >/dev/null
B wait 250 >/dev/null
e=$(B eval 'JSON.stringify([window.__errors,window.__notFound])')
B screenshot .device "$out/$name.png" >/dev/null
echo "$name $e"
