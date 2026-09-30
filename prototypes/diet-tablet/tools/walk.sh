#!/bin/zsh
# Prototype tooling: the regression walk. Needs a static server on 8789 at the repo root, and agent-browser. Usage: tools/walk.sh
B() { agent-browser --session dietwalk "$@"; }
B set viewport 900 1400 >/dev/null
B open "http://localhost:8789/prototypes/diet-tablet/index.html?v=$RANDOM#/diets" >/dev/null; B eval "sessionStorage.clear();1" >/dev/null
B open "http://localhost:8789/prototypes/diet-tablet/index.html?v=$RANDOM#/diets" >/dev/null; B wait 400 >/dev/null
r=$(B eval "$(cat "${0:h}/walk.js")"); r=${r//\\/}; echo "$r"
B eval "sessionStorage.clear();1" >/dev/null
[[ "$r" == *'"nbad":0'* && "$r" == *'"errs":[]'* ]] && echo "WALK PASS" || { echo "WALK FAIL"; exit 1; }
