import json
I=lambda n:f"img/{n}.jpg"
C=lambda t,text,y,style="serif",end=None,**o: dict(t=t,text=text,pos=[0.5,y],style=style,end=end,**o)
G="gold"
S=[
(0.0, dict(bg=I("01"),grade="bw_accent",move="frame_pull",transition="cut"),
  [C(0.05,"The man behind",.15,end=0.75),C(0.75,"*LOUIS VUITTON*",.15,"bebas",size=62,accent=G)]),
(1.79, dict(bg=I("02"),grade="warm",cutout=dict(src="img/arn2.png",grade="bw",h=0.62,y=1.02,outline=True)),
  [C(1.8,"built his *empire*",.14,"serif_big",accent=G,end=3.0),
   C(3.02,"by buying brands people|already *dreamed* of owning.",.14,"type",accent=G,
     hl={"type":"underline","word":"dreamed","color":"gold","t":1.6})]),
(6.26, dict(bg=I("03"),grade="warm",cutout=dict(src="img/arn1.png",grade="bw",h=0.5,y=1.02,outline=True)),
  [C(6.28,"His name is",.14,"sans"),C(6.9,"BERNARD ARNAULT",.22,"sticker",size=50,bg="gold",tilt=-3)]),
(8.74, dict(bg=I("04"),grade="bw"),
  [C(8.76,"He started in his family's",.12,end=9.8),C(9.8,"CONSTRUCTION BUSINESS",.13,"condensed",size=52)]),
(11.50, dict(bg="dark",move="static",transition="flash",year={"t":.05,"text":"1984","size":120}),
  [C(11.52,"But in",.22,"serif")]),
(12.87, dict(bg=I("05"),grade="bw_accent"),
  [C(12.9,"he moved into *luxury,*",.1,accent=G,end=14.4),
   C(14.42,"taking control of a struggling business",.1,"sans",end=16.3),
   C(16.3,"that owned|*Christian Dior*",.1,"serif_big",accent=G,
     hl={"type":"circle","word":"Christian Dior","color":"gold","t":.5})]),
(18.47, dict(bg=I("06"),grade="warm"),
  [C(18.5,"*DIOR* became the foundation",.15,"heavy",size=40,accent=G,end=19.9),
   C(19.9,"of something|*much bigger.*",.15,"stack",accent=G)]),
(22.09, dict(bg="dark",move="static",transition="flash",year={"t":.05,"text":"1989","size":120}),
  [C(22.1,"In",.22)]),
(23.47, dict(bg=I("07"),grade="warm",cutout=dict(src="img/arn2.png",grade="bw",h=0.5,y=1.02)),
  [C(23.5,"Arnault became the|leading shareholder of",.13,"sans",end=25.4),
   C(25.4,"*LVMH*",.16,"heavy",size=84,accent=G,hl={"type":"box","word":"LVMH","color":"gold","t":.3}),
   C(26.96,"the group behind Louis Vuitton",.27,end=28.7),
   C(28.78,"and took *charge.*",.27,"serif_big",accent=G)]),
(30.16, dict(bg="paper",move="static",transition="flash"),
  [C(30.18,"Over the following|*decades,*",.45,"stack",accent=G)]),
(31.58, dict(bg=I("08"),grade="bw_accent"),
  [C(31.6,"the group expanded across",.12,"sans"),C(32.6,"FASHION",.19,"bebas",size=70,accent=G)]),
(33.40, dict(bg=I("09"),grade="warm",transition="cut"), [C(33.42,"CHAMPAGNE",.15,"bebas",size=70)]),
(34.53, dict(bg="dark",move="static",transition="cut"), [C(34.55,"*JEWELRY*",.48,"glow",size=64,accent="gold")]),
(35.20, dict(bg=I("11"),grade="color",transition="cut"), [C(35.22,"& *BEAUTY.*",.15,"bebas",size=70,accent="pink")]),
(36.38, dict(bg=I("12"),grade="warm",transition="cut"), [C(36.4,"LOUIS VUITTON.",.15,"heavy",size=52,accent=G)]),
(37.60, dict(bg=I("13"),grade="bw",transition="cut"), [C(37.62,"DIOR.",.15,"heavy",size=72)]),
(38.63, dict(bg=I("14"),grade="bw",transition="cut"), [C(38.65,"SEPHORA.",.15,"heavy",size=64)]),
(39.82, dict(bg=I("15"),grade="color",transition="cut"), [C(39.84,"TIFFANY.",.15,"heavy",size=64,ink="dark")]),
(41.04, dict(bg=I("16"),grade="bw_accent"),
  [C(41.05,"Different products,",.12,end=42.0),C(42.01,"connected by one|*powerful idea:*",.12,"serif_big",accent=G)]),
(44.59, dict(bg="paper",move="static",transition="flash"),
  [C(44.6,"*desirability.*",.47,"serif_big",size=58,accent="red",hl={"type":"underline","word":"desirability.","color":"gold","t":.4})]),
(46.17, dict(bg=I("17"),grade="warm"),
  [C(46.2,"A luxury purchase offers",.1,"sans",end=47.2),C(47.2,"*CRAFTSMANSHIP,*",.1,"bebas",size=62,accent=G)]),
(48.50, dict(bg=I("12"),grade="warm",move="pull_out",transition="cut"), [C(48.52,"*history,*",.15,"serif_big",accent=G)]),
(49.25, dict(bg=I("18"),grade="warm"),
  [C(49.28,"and a feeling of belonging",.1,end=50.4),
   C(50.4,"to something|exclusive.",.1,"serif_big",ink="dark",hl={"type":"marker","word":"exclusive.","color":"gold","alpha":230,"t":.3})]),
(52.23, dict(bg=I("19"),grade="color",cutout=dict(src="img/arn1.png",grade="bw",h=0.45,y=1.02)),
  [C(52.25,"Arnault helped turn that appeal",.12,"glow",end=53.6),
   C(53.6,"into a *global*|business empire",.12,"glow",accent="gold",hl={"type":"circle","word":"global","color":"gold","t":.6})]),
(56.16, dict(bg=I("20"),grade="warm"),
  [C(56.18,"The name on the handbag is",.12,end=57.2),C(57.2,"*LOUIS VUITTON.*",.18,"bebas",size=66,accent=G)]),
(58.75, dict(bg="dark",move="static",transition="flash",cutout=dict(src="img/arn2.png",grade="bw",h=0.55,y=1.02)),
  [C(58.77,"The businessman behind the group",.1,"sans"),
   C(60.33,"BERNARD|*ARNAULT.*",.2,"heavy",size=70,accent=G)]),
]
END=61.65; shots=[]
for i,(st,d,caps) in enumerate(S):
  nxt=S[i+1][0] if i+1<len(S) else END
  d["dur"]=round(nxt-st,3); cl=[]
  for c in caps:
    c=dict(c); c["t"]=round(c["t"]-st,2)
    if c["end"] is None: del c["end"]
    else: c["end"]=round(c["end"]-st,2)
    cl.append(c)
  d["caption"]=cl; shots.append(d)
json.dump({"shots":shots},open("lv.json","w"))
