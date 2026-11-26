#!/usr/bin/env python3
"""Generate episode illustrations with the free Pollinations image API (no key).
Usage: python3 gen_images.py episodes/<ep>/prompts.json [only=03,07] [seed=N]
prompts.json: {"style": "...", "chars": {"QUEEN": "..."}, "images": {"01": "prompt with [QUEEN]", ...}}"""
import json, os, sys, time, urllib.parse, urllib.request

def fetch(prompt, out, seed, w=720, h=1280, tries=8):
    url = "https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt) + f"?width={w}&height={h}&nologo=true&seed={seed}"
    for k in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=180) as r:
                data = r.read(); ct = r.headers.get("Content-Type", "")
            if ct.startswith("image") and len(data) > 20000:
                open(out, "wb").write(data); return True
        except Exception as e:
            print("   retry", k + 1, str(e)[:80], flush=True)
        time.sleep(12 + k * 6)
    return False

if __name__ == "__main__":
    spec = json.load(open(sys.argv[1])); d = os.path.join(os.path.dirname(sys.argv[1]), "img"); os.makedirs(d, exist_ok=True)
    opts = dict(a.split("=", 1) for a in sys.argv[2:] if "=" in a)
    only = set(opts["only"].split(",")) if "only" in opts else None; seed = int(opts.get("seed", 11))
    for key, p in spec["images"].items():
        if only and key not in only: continue
        for name, desc in spec.get("chars", {}).items(): p = p.replace(f"[{name}]", desc)
        full = p + ", " + spec["style"]
        ok = fetch(full, os.path.join(d, f"{key}.jpg"), seed + int(key))
        print(key, "ok" if ok else "FAILED", flush=True)
        time.sleep(6)
