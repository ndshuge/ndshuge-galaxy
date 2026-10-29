# Art direction and actual 3-slide image-based PowerPoint, exported from PowerPoint.
# The slides are intentionally rasterized: visuals are primary; photographic sources stay credited.
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageEnhance
import math,os,sys
ROOT=Path(__file__).parent
A=ROOT/'assets'
W,H=1920,1080
serif='C:/Windows/Fonts/simsun.ttc'
sans='C:/Windows/Fonts/msyh.ttc'
eng='C:/Windows/Fonts/georgia.ttf'
def font(path,size): return ImageFont.truetype(path,size)
def txt(draw,xy,string,size,color,face=serif,spacing=0):
    draw.text(xy,string,font=font(face,size),fill=color,spacing=spacing)
def fit(img,box,focus=(.5,.5)):
    if len(box)==2: w,h=box
    else: _,_,w,h=box
    ratio=max(w/img.width,h/img.height)
    im=img.resize((round(img.width*ratio),round(img.height*ratio)),Image.Resampling.LANCZOS)
    sx=int((im.width-w)*focus[0]);sy=int((im.height-h)*focus[1])
    return im.crop((sx,sy,sx+w,sy+h))
def crop_photo(path,box,focus=(.5,.5),sat=.72):
    im=Image.open(A/path).convert('RGB');im=ImageEnhance.Color(im).enhance(sat)
    return fit(im,box,focus)
def save_slide(im,n):
    im.save(A/f'slide-{n}.png',optimize=True)
    im.save(A/f'slide-{n}.jpg',format='JPEG',quality=88,subsampling=0,optimize=True)
    im.save(A/f'slide-{n}.webp',format='WEBP',quality=86,method=6)
# 1 / Light: image as a luminous right-hand negative, typography in deep ink
im=Image.new('RGB',(W,H),'#1d2420');d=ImageDraw.Draw(im)
photo=crop_photo('glass-shadow.jpg',(960,1080),(.48,.41),sat=.35)
photo=ImageEnhance.Brightness(photo).enhance(.73);im.paste(photo,(960,0))
d.rectangle((0,0,970,H),fill='#202824')
d.line((110,120,1810,120),fill='#a3aa9a',width=2)
txt(d,(110,83),'折 光 档 案  /  L I G H T ,  P A P E R  &  T I M E',22,'#e4e3d7',sans)
txt(d,(108,245),'光',340,'#eee8dc')
txt(d,(121,710),'光让物体显影，',50,'#d7ded2')
txt(d,(121,800),'也让记忆有了边界。',50,'#d7ded2')
txt(d,(122,984),'01   /   LIGHT',22,'#a6ae9e',eng)
d.rectangle((960,0,969,H),fill='#4b5a4f')
save_slide(im,1)
# 2 / Paper: asymmetric editorial, real paper photo
im=Image.new('RGB',(W,H),'#efeae0');d=ImageDraw.Draw(im)
paper=crop_photo('paper-shadow.jpg',(1040,900),(.5,.5))
im.paste(paper,(80,90));d=ImageDraw.Draw(im)
d.rectangle((1160,90,1828,990),fill='#e6e0d4')
txt(d,(1245,145),'纸',300,'#292b27')
d.line((1240,605,1500,605),fill='#926d58',width=3)
txt(d,(1245,674),'一张纸有两面。',52,'#34312c')
txt(d,(1245,755),'一面被光照亮，',45,'#6c6358')
txt(d,(1245,831),'另一面收藏时间。',45,'#6c6358')
txt(d,(81,1020),'02 / PAPER       PHOTOGRAPHY & LANGUAGE',21,'#5b544b',eng)
save_slide(im,2)
# 3 / Time: abstract ink, a ribbon of remembered trajectories
im=Image.new('RGB',(W,H),'#bfae92');d=ImageDraw.Draw(im)
d.rectangle((0,0,1920,1080),fill='#bfae92')
d.rectangle((90,90,1830,990),outline='#7a6c57',width=2)
for i in range(58):
    a=i/58*math.pi*2
    pts=[]
    for k in range(180):
        t=(k/179)*math.pi*1.65
        rr=225+i*6.7
        x=1290+rr*math.cos(t+a*.18)*.8
        y=520+rr*math.sin(t+a*.21)*.52
        pts.append((x,y))
    c=(round(100+i*.9),round(84+i*.75),round(65+i*.5))
    d.line(pts,fill=c,width=2 if i%6 else 4,joint='curve')
d.ellipse((1130,360,1440,670),outline='#ede0c7',width=5)
d.rectangle((91,90,875,990),fill='#c9b99f')
txt(d,(165,170),'时间',210,'#302c27')
txt(d,(178,590),'有些事没有消失，',50,'#41392f')
txt(d,(178,680),'只是换了一种形状。',50,'#41392f')
d.line((178,804,558,804),fill='#856e56',width=3)
txt(d,(180,889),'03 / TIME   ·   MEMORY IN MOTION',21,'#625545',eng)
save_slide(im,3)
# cover: photographic typographic collage, 16:9
im=Image.new('RGB',(1200,675),'#eae5db')
bg=crop_photo('glass-shadow.jpg',(560,675),(.5,.49),sat=.5)
im.paste(bg,(640,0));d=ImageDraw.Draw(im)
txt(d,(72,118),'折光',160,'#252722')
txt(d,(175,294),'档案',160,'#252722')
d.line((79,520,240,520),fill='#87634d',width=3)
txt(d,(78,558),'LIGHT, PAPER & TIME',23,'#52473c',eng)
im.save(A/'cover.webp',format='WEBP',quality=90,method=6)
# native PowerPoint creation, each full-bleed slide is a validated image-based slide.
try:
    import win32com.client
    app=win32com.client.DispatchEx('PowerPoint.Application')
    # Visibility is not required for image assembly; no GUI mouse or keyboard used.
    pres=app.Presentations.Add(False)
    pres.PageSetup.SlideWidth=960
    pres.PageSetup.SlideHeight=540
    for n in (1,2,3):
        slide=pres.Slides.Add(n,12)  # ppLayoutBlank
        slide.Shapes.AddPicture(str((A/f'slide-{n}.jpg').resolve()),False,True,0,0,960,540)
    output=str((ROOT/'Light-Paper-Time.pptx').resolve())
    pres.SaveAs(output,24) # ppSaveAsOpenXMLPresentation
    count=pres.Slides.Count
    pres.Close()
    app.Quit()
    assert count==3
    assert Path(output).stat().st_size>30000
    print('PPTX_VALIDATED',output,'slides',count,'bytes',Path(output).stat().st_size,'kind IMAGE_BASED')
except Exception as exc:
    print('PPTX_GENERATION_FAILED',repr(exc),file=sys.stderr)
    raise
