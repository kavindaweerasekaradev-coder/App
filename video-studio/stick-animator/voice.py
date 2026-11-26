import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
import os
M=os.environ.get("KOKORO_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")) + "/"
k=Kokoro(M+"kokoro-v1.0.int8.onnx", M+"voices-v1.0.bin")
lines=json.load(open("script.json"))
out=[]; t=0.35; sr=24000; timing=[]
out.append(np.zeros(int(sr*t),dtype=np.float32))
for ln in lines:
    a,sr=k.create(ln["say"], voice=os.environ.get("VOICE", "am_michael"), speed=1.0, lang="en-us")
    # trim leading/trailing near-silence
    idx=np.where(np.abs(a)>0.01)[0]; a=a[max(idx[0]-200,0):idx[-1]+400]
    d=len(a)/sr; timing.append({"text":ln["say"],"start":round(t,3),"end":round(t+d,3)})
    out.append(a.astype(np.float32)); gap=ln.get("gap",0.35)
    out.append(np.zeros(int(sr*gap),dtype=np.float32)); t+=d+gap
sf.write("vo.wav", np.concatenate(out), sr)
json.dump(timing, open("timing.json","w"), indent=1); print(json.dumps(timing,indent=1)); print("total",round(t,2))
