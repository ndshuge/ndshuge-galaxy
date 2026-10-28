from pathlib import Path
import random, math, html, json, shutil

ROOT=Path(__file__).parent
OUT=ROOT/'art'
OUT.mkdir(parents=True,exist_ok=True)
DATA={
'lumen-siege':('#081223','#132d62','#ffbf4d','#73eafa'),
'still':('#07101e','#123f68','#7ae8ff','#ed6a8e'),
'gravity-garden':('#081f25','#164b56','#abf8bd','#fdd691'),
'vocalon-chaos':('#1b0d33','#6c246a','#ff77e3','#6fdaff'),
'pulse-breaker':('#140824','#4a153f','#f062b5','#ffc06b'),
'belfry':('#101228','#2d3360','#eadcaa','#9d9ad9'),
'motu':('#e3e2da','#b9baaf','#263b3a','#cc5540'),
'ghostslash':('#0e0b17','#3b1533','#ff587a','#f3dfce'),
'rewinder':('#0f172f','#273c66','#75c6ef','#d2d6ff'),
'echo-trail':('#071625','#155168','#63e9e3','#acd0fa'),
'lightlag':('#050e25','#124168','#ffe17e','#66d9ef'),
'shise':('#102d2e','#185c50','#e0fa7e','#ff9b7b'),
'issen':('#241017','#a84548','#f6d2b6','#ff836b'),
'beat-paddle':('#14273b','#316576','#fee991','#ff7a79'),
'pixel-pong':('#121d38','#293c66','#70f5e4','#ffc2ae'),
'ww2-frontline':('#172225','#4d5e51','#e9c28d','#e2e2ce')
}
def ellipse(cx,cy,rx,ry,fill,attrs=''):return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" {attrs}/>'
def circle(x,y,r,fill,attrs=''):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" {attrs}/>'
def path(d,stroke,width=2,attrs=''):return f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{width}" {attrs}/>'
def line(x,y,x2,y2,c,w=2,attrs=''):return f'<line x1="{x}" y1="{y}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}" {attrs}/>'
def scene(slug,a,b):
  out=''
  if slug=='lumen-siege':
    out+=ellipse(650,315,360,260,a,'opacity=".17" filter="url(#glow)"')
    for r,op in [(205,.24),(148,.58),(94,.8)]:
      out+=circle(641,318,r,'none',f'stroke="{a}" stroke-width="{3 if r>150 else 5}" opacity="{op}"')
    out+=circle(641,318,65,'url(#orb)')+circle(616,281,16,'#fff6cf','filter="url(#glow)"')
    for i in range(13):
      angle=i*math.tau/13
      x=641+math.cos(angle)*240;y=318+math.sin(angle)*240
      out+=circle(round(x,1),round(y,1),3 if i%3 else 6,b,'opacity=".7"')
    for i in range(12):
      x=50+i*80
      out+=line(x,680,480+(x-480)*.08,470,a,1,'opacity=".13"')
    out+=path('M 0 498 Q 260 458 480 495 T 960 478',b,3,'opacity=".5"')
  elif slug=='still':
    for i in range(13):
      x=310+i*42
      out+=path(f'M {x} 20 L {x-170} 690',a,1.6,'opacity=".13"')
    out+=circle(585,292,208,'none',f'stroke="{a}" stroke-width="8" opacity=".5"')
    out+=circle(585,292,170,'none',f'stroke="{b}" stroke-width="2" opacity=".9" stroke-dasharray="22 14"')
    out+=path('M 375 285 Q 585 -35 755 265',a,16,'filter="url(#glow)" opacity=".6"')
    out+=path('M 588 292 L 737 118',b,13)+path('M 588 292 L 457 385',a,8)
    out+=circle(588,292,21,'#fff3ef')
    for x,y,s in [(200,160,1),(785,430,1.5),(380,470,.9),(120,490,1.2)]:
      out+=f'<path d="M {x} {y-44*s} l {26*s} {48*s} l {-33*s} {22*s} z" fill="{a}" opacity=".75"/>'
  elif slug=='gravity-garden':
    for r,op in [(250,.37),(191,.3),(112,.23)]:
      out+=ellipse(526,324,r,r*.48,'none',f'stroke="{a}" stroke-width="3" opacity="{op}" transform="rotate(-26 526 324)"')
    out+=circle(525,324,126,'url(#orb)')
    out+=circle(486,272,35,'#f5ffe1','opacity=".7" filter="url(#glow)"')
    out+=circle(745,186,42,b)+circle(705,188,18,'#fff1d2','opacity=".7"')
    out+=circle(310,444,32,a)+circle(348,440,11,'#fff7ce')
    out+=path('M 145 520 Q 480 650 854 495',a,2,'opacity=".45"')
  elif slug=='vocalon-chaos':
    out+=ellipse(630,300,340,210,a,'filter="url(#glow)" opacity=".25"')
    for i in range(34):
      x=100+i*26
      height=45+110*abs(math.sin(i*.8))+85*abs(math.sin(i*.24))
      out+=f'<rect x="{x}" y="{470-height:.1f}" width="12" height="{height:.1f}" rx="6" fill="{a if i%3 else b}" opacity="{.18+(i%7)*.1:.2f}"/>'
    for r in (115,180,255):out+=ellipse(535,300,r,r*.35,'none',f'stroke="{b}" stroke-width="2" opacity=".32" transform="rotate(-12 535 300)"')
    out+=path('M 100 505 C 230 295 280 540 404 335 S 632 140 800 380',b,6,'opacity=".9"')
    out+=circle(579,252,50,a,'filter="url(#glow)" opacity=".64"')
  elif slug=='pulse-breaker':
    for i in range(16):
      x=120+i*45;y=100+i*18
      out+=line(x,0,x-220,720,a if i%2 else b,2,'opacity=".18"')
    for r in (285,205,112):
      out+=circle(604,336,r,'none',f'stroke="{a}" stroke-width="{6 if r==112 else 3}" stroke-dasharray="60 25" opacity=".65"')
    out+=path('M 70 445 L 255 445 L 310 374 L 361 524 L 443 220 L 525 445 L 900 445',b,12,'stroke-linecap="round" filter="url(#glow)"')
    out+=circle(605,335,60,'url(#orb)')
  elif slug=='belfry':
    out+=circle(715,195,125,b,'opacity=".75" filter="url(#glow)"')
    out+=circle(715,195,98,'#d7d2b9','opacity=".68"')
    out+=f'<path d="M 330 720 L 335 275 L 475 152 L 615 275 L 620 720 Z" fill="#111729"/>'
    out+=f'<rect x="376" y="280" width="200" height="440" fill="#1d2136"/>'
    out+=f'<path d="M 320 280 L 475 142 L 635 280 Z" fill="#0b1125"/>'
    out+=circle(474,326,84,'#c4bc9d')+circle(474,326,70,'#171e34')
    for i in range(12):
      t=i*math.tau/12
      out+=circle(round(474+math.sin(t)*57),round(326-math.cos(t)*57),3,b)
    out+=path('M 474 326 L 474 278 M 474 326 L 510 354',b,6)
    out+=f'<rect x="447" y="495" width="55" height="150" rx="27" fill="#aa9979" opacity=".4"/>'
  elif slug=='motu':
    out+=circle(750,210,119,b,'opacity=".79"')
    for i in range(4):
      y=310+i*105
      out+=f'<path d="M -40 {y+120} Q 170 {y-120+i*21} 330 {y+40} Q 545 {y-140} 680 {y+30} Q 850 {y-44} 1000 {y-8} L 1000 800 L -40 800 Z" fill="{a if i%2 else "#576760"}" opacity="{.14+i*.14}"/>'
    out+=path('M 100 602 Q 400 540 680 592 T 970 562','#1c2b2b',3,'opacity=".45"')
    out+=f'<path d="M 475 534 l 13 -63 10 0 6 60 33 19 -29 10 0 81 -25 0 0 -82 -32 -10 Z" fill="#1b2223"/>'
  elif slug=='ghostslash':
    for i in range(18):
      y=60+i*34
      out+=path(f'M -100 {y+100} L 1000 {y-210}',a if i%3 else b,1.4,'opacity=".17"')
    out+=path('M 145 586 Q 470 180 862 125',a,22,'filter="url(#glow)" opacity=".8"')
    out+=path('M 145 586 Q 470 180 862 125','#fff0f0',5)
    out+=f'<path d="M 453 352 l 26 -83 38 -4 31 85 -34 49 -25 100 -60 0 -17 -91 Z" fill="#080b14"/>'
    out+=circle(487,258,35,'#0d1020')
  elif slug=='rewinder':
    out+=circle(544,316,247,'none',f'stroke="{a}" stroke-width="3" opacity=".32"')
    for r in [185,125,58]:out+=circle(544,316,r,'none',f'stroke="{b}" stroke-width="{18 if r==185 else 4}" opacity=".6" stroke-dasharray="90 26"')
    out+=circle(544,316,29,'#f7f8e6')
    out+=path('M 356 256 C 409 120 580 99 692 184',a,14,'stroke-linecap="round"')
    out+=f'<path d="M 689 147 L 715 202 L 647 211 Z" fill="{a}"/>'
    out+=path('M 730 398 C 664 553 440 590 344 430',b,12,'opacity=".8"')
    out+=f'<path d="M 354 477 L 322 411 L 396 414 Z" fill="{b}"/>'
  elif slug=='echo-trail':
    for i in range(8):
      x=230+i*45;y=100+i*22;w=510-i*62;h=470-i*42
      out+=f'<rect x="{x}" y="{y}" width="{max(w,48)}" height="{max(h,75)}" rx="5" fill="none" stroke="{a if i%2 else b}" stroke-width="{3 if i>4 else 2}" opacity="{.12+i*.065}"/>'
    out+=path('M 470 720 L 524 368 L 548 368 L 600 720',a,12,'opacity=".55"')
    out+=circle(535,352,53,b,'filter="url(#glow)" opacity=".7"')
  elif slug=='lightlag':
    out+=circle(725,192,140,a,'opacity=".7" filter="url(#glow)"')+circle(725,192,103,'#fff2ae','opacity=".77"')
    for i in range(7):
      out+=path(f'M {50+i*130} 720 Q {300+i*50} 400 {800+i*18} 100',b,1.5,'opacity=".2"')
    out+=f'<path d="M 400 290 L 635 395 L 435 430 L 385 380 Z" fill="#d4e9e8" opacity=".85"/>'
    out+=f'<path d="M 458 379 L 310 532 L 386 427 Z" fill="{b}" opacity=".65" filter="url(#glow)"/>'
  elif slug=='shise':
    random.seed(310)
    for i in range(43):
      x=random.randrange(100,900);y=random.randrange(80,610);r=random.randrange(5,66)
      out+=circle(x,y,r,a if i%3 else b,f'opacity="{.14+(i%5)*.095}"')
    out+=circle(610,300,130,'none',f'stroke="{a}" stroke-width="27" opacity=".6"')
    out+=circle(610,300,68,b)
    out+=path('M 140 540 Q 405 500 630 360 T 895 140',a,25,'stroke-linecap="round" opacity=".5"')
  elif slug=='issen':
    out+=ellipse(730,285,250,230,a,'opacity=".48" filter="url(#glow)"')+circle(732,277,177,'#f2c4a3','opacity=".8"')
    for i in range(5):
      out+=path(f'M 0 {520+i*40} Q 300 {488+i*18} 960 {535+i*8}',b,2,'opacity=".28"')
    out+=f'<path d="M 486 450 L 519 300 L 540 298 L 562 459 L 592 600 L 452 600 Z" fill="#1a1218"/>'
    out+=circle(529,266,28,'#19131a')
    out+=path('M 516 448 L 840 218','#fff5e5',8,'stroke-linecap="round"')
  elif slug=='beat-paddle':
    for i in range(8):
      out+=ellipse(510,330,100+i*48,30+i*19,'none',f'stroke="{b}" stroke-width="4" opacity="{.63-i*.06}" transform="rotate(-18 510 330)"')
    out+=circle(688,244,74,a,'opacity=".9" filter="url(#glow)"')+circle(686,244,32,'#fffce0')
    out+=f'<rect x="290" y="340" width="45" height="180" rx="20" transform="rotate(-32 290 340)" fill="{a}"/>'
    out+=f'<rect x="650" y="370" width="45" height="180" rx="20" transform="rotate(30 650 370)" fill="{b}"/>'
    out+=path('M 80 575 C 340 330 530 680 890 380',a,5)
  elif slug=='pixel-pong':
    for x in range(0,960,48):
      out+=line(x,0,x,720,a,1,'opacity=".07"')
    for y in range(0,720,48):
      out+=line(0,y,960,y,a,1,'opacity=".07"')
    out+=line(485,110,485,630,b,3,'stroke-dasharray="16 18" opacity=".6"')
    out+=f'<rect x="270" y="255" width="23" height="180" rx="5" fill="{a}" />'
    out+=f'<rect x="693" y="190" width="23" height="180" rx="5" fill="{b}" />'
    out+=circle(485,337,24,'#ffffff')+path('M 310 381 L 460 339',a,4,'stroke-dasharray="9 11"')
    out+=circle(485,337,61,'none',f'stroke="{b}" stroke-width="3" opacity=".5"')
  elif slug=='ww2-frontline':
    out+=circle(725,235,145,a,'opacity=".45" filter="url(#glow)"')
    for i in range(5):
      y=410+i*73
      out+=f'<path d="M 0 {y+70} Q 170 {y-40} 390 {y+25} T 960 {y-15} L 960 720 L 0 720Z" fill="{a}" opacity="{.055+i*.055}"/>'
    out+=f'<path d="M 300 474 l 42 -63 206 0 65 63 160 19 22 63 -517 0 Z" fill="#151d20"/>'
    out+=f'<rect x="400" y="368" width="168" height="79" rx="20" fill="#232f2f"/>'
    out+=f'<rect x="525" y="379" width="205" height="17" rx="8" fill="#0b1719"/>'
    for x in range(335,740,78):out+=circle(x,546,33,'#090f12')
    out+=path('M 0 555 Q 520 500 960 550',a,3,'opacity=".3"')
  return out

for slug,(c1,c2,accent,extra) in DATA.items():
  random.seed(sum(map(ord,slug)))
  stars=''
  if slug not in ('motu','issen','ww2-frontline'):
    for i in range(54):
      x=random.randint(0,960);y=random.randint(0,720);r=round(random.uniform(.5,2),1)
      stars+=circle(x,y,r,'#ffffff',f'opacity="{random.uniform(.1,.55):.2f}"')
  defs=f'''<defs>
   <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset=".62" stop-color="{c2}"/><stop offset="1" stop-color="{c1}"/></linearGradient>
   <radialGradient id="flare"><stop stop-color="{accent}" stop-opacity=".38"/><stop offset="1" stop-color="{accent}" stop-opacity="0"/></radialGradient>
   <radialGradient id="orb" cx=".37" cy=".29" r=".76"><stop stop-color="#fff" stop-opacity=".96"/><stop offset=".14" stop-color="{extra}"/><stop offset=".58" stop-color="{accent}"/><stop offset="1" stop-color="{c2}"/></radialGradient>
   <radialGradient id="shade"><stop offset=".42" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".56"/></radialGradient>
   <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="23"/></filter>
   </defs>'''
  svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" width="960" height="720" preserveAspectRatio="xMidYMid slice">
  {defs}<rect width="960" height="720" fill="url(#base)"/>
  {ellipse(570,250,550,500,'url(#flare)')}
  {stars}{scene(slug,accent,extra)}
  <rect width="960" height="720" fill="url(#shade)" opacity=".7"/>
  </svg>'''
  (OUT/(slug+'.svg')).write_text(svg,encoding='utf-8')
(ROOT/'icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#17191e"/><path d="M24 14v36l30-18L24 14Z" fill="white"/></svg>',encoding='utf-8')
(ROOT/'cover.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#071223"/><stop offset="1" stop-color="#2b4766"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="585" cy="210" r="145" stroke="#6cbef7" stroke-width="2" fill="none" opacity=".5"/><circle cx="585" cy="210" r="91" fill="#f6d88b" opacity=".94"/><circle cx="580" cy="205" r="49" fill="#fffbdd"/><text x="60" y="260" font-size="74" font-weight="700" letter-spacing="-3" fill="#fff" font-family="Arial,sans-serif">ARCADE</text><text x="63" y="305" fill="#c6d5e8" font-size="22" font-family="Arial,sans-serif">SHUGE GAME LIBRARY</text></svg>''',encoding='utf-8')
print('CREATED',len(DATA),'artworks')
