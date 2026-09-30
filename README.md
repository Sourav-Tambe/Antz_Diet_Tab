# Diet Requests — tablet prototype

A self-contained HTML/CSS/JS prototype of the diet module for tablet. No build step, no dependencies.

## Run it

Open `index.html` in a browser (it forwards to the prototype), or serve the folder and browse to it:

```
python3 -m http.server 8000
# → http://localhost:8000/
```

## Layout

- `prototypes/diet-tablet/` — the prototype: entry `index.html`, views, data, styles, docs.
- `app/` — shared design assets the prototype reads: `tokens.css`, `type.css`, `components.css`, `icons/`.

See `prototypes/diet-tablet/README.md` and `prototypes/diet-tablet/docs/` for the brief, plan and decisions.
