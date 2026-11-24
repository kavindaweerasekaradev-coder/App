import json
I=lambda n:f"img/{n}.jpg"
M=lambda **k: dict(src="img/musk.png", grade="bw", **k)
C=lambda t,text,y,style="serif",end=None,**o: dict(t=t,text=text,pos=[0.5,y],style=style,end=end,**o)
S=[
(0.0, dict(bg=I("01"),grade="bw_accent",cutout=M(h=.62,y=1.02,outline=True),transition="cut"),
  [C(0.05,"ELON MUSK",.15,"sticker",size=50,tilt=-3),
   C(0.9,"made a fortune from *PayPal*",.25,hl={"type":"circle","word":"PayPal","color":"yellow","t":.5})]),
(2.82, dict(bg=I("02"),grade="bw_accent"),
  [C(2.84,"THEN HE PUT IT",.16,"condensed",end=3.7,size=56),
   C(3.7,"*ON THE LINE* AGAIN.",.16,"condensed",accent="red",size=56)]),
(5.14, dict(bg="dark",move="static",transition="flash",year={"t":.05,"text":"1999","size":120}), []),
(6.54, dict(bg=I("03"),grade="bw"),
  [C(6.56,"he co-founded",.15,end=7.3),
   C(7.3,"*X.com*",.17,"heavy",size=72,accent="cyan",hl={"type":"box","word":"X.com","color":"cyan","t":.3}),
   C(7.9,"an online bank",.28,"sticker",size=46)]),
(8.57, dict(bg=I("04"),grade="bw"),
  [C(8.6,"betting that people|would move their money|onto the *internet*",.15,"type",accent="cyan",
     hl={"type":"underline","word":"internet","color":"cyan","t":2.4})]),
(12.82, dict(bg="paper",move="static",transition="flash"), [C(12.84,"A year|*later,*",.45,"stack",accent="gold")]),
(13.79, dict(bg=I("05"),grade="bw"),
  [C(13.8,"X.com merged with",.1,"sans"),
   C(14.6,"*CONFINITY*",.17,"bebas",size=62,accent="yellow")]),
(16.20, dict(bg=I("06"),grade="color"),
  [C(16.22,"the company behind",.1,end=17.2),
   C(17.2,"a payment service called",.1),
   C(17.9,"*PAYPAL*",.18,"heavy",size=70,accent="cyan")]),
(19.07, dict(bg=I("07"),grade="color"),
  [C(19.1,"That service became the focus,",.1,end=20.9),
   C(20.94,"and the business|took its *name.*",.12,"serif_big",accent="yellow")]),
(22.68, dict(bg="dark",move="static",cutout=M(h=.56,y=1.02)),
  [C(22.7,"But Musk lost the",.13,"sans"),
   C(23.5,"CEO JOB",.21,"heavy",size=66,hl={"type":"strike","word":"CEO job","color":"red","t":.9}),
   C(24.6,"before the biggest payday.",.31,"sticker",size=40)]),
(26.50, dict(bg="dark",move="static",transition="flash",year={"t":.05,"text":"2002","size":120}), []),
(27.85, dict(bg="dark",move="static"),
  [C(27.9,"EBAY BOUGHT PAYPAL",.38,"condensed",size=54),
   C(29.2,"for *$1.5 billion*",.5,"heavy",size=60,accent="yellow",
     hl={"type":"circle","word":"$1.5 billion","color":"yellow","t":.6})]),
(31.78, dict(bg=I("10"),grade="bw_accent",cutout=M(h=.55,y=1.02,outline=True)),
  [C(31.8,"its *largest*|shareholder",.36,"serif_big",accent="gold")]),
(33.91, dict(bg=I("11"),grade="bw_accent"),
  [C(33.95,"reportedly walked away with",.12,end=35.3),
   C(35.3,"ROUGHLY *$180 MILLION*",.14,"bebas",size=58,accent="yellow",
     hl={"type":"box","word":"$180 million","color":"yellow","t":.5})]),
(37.79, dict(bg="grid",move="static",transition="flash"),
  [C(37.8,"He could have *retired.*",.48,"serif_big",accent="red",hl={"type":"strike","word":"retired.","color":"red","t":.75})]),
(39.16, dict(bg="paper",move="static",transition="cut"), [C(39.17,"*Instead,*",.47,"serif_big",size=60,accent="red")]),
(39.98, dict(bg=I("13"),grade="color"),
  [C(40.0,"he used that fortune|to fund *new ventures*",.08,"type",accent="yellow")]),
(42.87, dict(bg=I("14"),grade="color"),
  [C(42.9,"He founded",.12,"sans",end=43.6),
   C(43.6,"*SPACEX*",.13,"heavy",size=76,accent="orange"),
   C(44.2,"to build rockets",.21)]),
(45.20, dict(bg=I("15"),grade="bw_accent"),
  [C(45.22,"then became an early investor in",.1,"sans",end=46.6),
   C(46.6,"*TESLA*",.12,"bebas",size=76,accent="red",hl={"type":"underline","word":"tesla","color":"red","t":.3}),
   C(47.65,"backing electric cars",.22,"sticker",size=40,bg="green")]),
(48.78, dict(bg=I("16"),grade="color",cutout=M(h=.5,y=1.02)),
  [C(49.3,"Money from moving|payments online",.12,"glow",end=51.0),
   C(51.0,"helped finance two much|*bigger ambitions*",.12,"glow",accent="orange",
     hl={"type":"circle","word":"bigger ambitions","color":"orange","t":1.2})]),
(53.93, dict(bg=I("17"),grade="color"),
  [C(53.95,"changing transportation",.12),
   C(54.8,"on *Earth*",.19,"serif_big",accent="cyan")]),
(56.45, dict(bg=I("16"),grade="color",move="drift_up",transition="flash"),
  [C(56.47,"AND REACHING|BEYOND *IT.*",.3,"heavy",size=60,accent="red")]),
]
END=57.81; shots=[]
for i,(st,d,caps) in enumerate(S):
  nxt=S[i+1][0] if i+1<len(S) else END
  d["dur"]=round(nxt-st,3); cl=[]
  for c in caps:
    c=dict(c); c["t"]=round(c["t"]-st,2)
    if c["end"] is None: del c["end"]
    else: c["end"]=round(c["end"]-st,2)
    cl.append(c)
  d["caption"]=cl; shots.append(d)
json.dump({"shots":shots},open("musk.json","w"),indent=1)
print(len(shots))
