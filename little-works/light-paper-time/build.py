# Reproducible static build and release integrity check.
from pathlib import Path
from shutil import copy2, rmtree
import hashlib, json, zipfile, sys, re
root=Path(__file__).resolve().parent
output=root/'dist'
parts=['index.html','style.css','experience.js','Light-Paper-Time.pptx','assets/glass-shadow.jpg','assets/paper-shadow.jpg','assets/book-light.jpg','assets/cover.webp','assets/slide-1.webp','assets/slide-2.webp','assets/slide-3.webp']
def validate():
    for rel in parts:
        p=root/rel
        if not p.is_file() or p.stat().st_size<100: raise ValueError('MISSING '+rel)
    content=(root/'index.html').read_text(encoding='utf-8')
    for link in ['#paper','#light','#time','#edition','./Light-Paper-Time.pptx']:
        if link not in content: raise ValueError('BAD_LINK '+link)
    with zipfile.ZipFile(root/'Light-Paper-Time.pptx') as z:
        errors=z.testzip()
        if errors: raise ValueError('ZIP_CORRUPTED '+errors)
        slides=[s for s in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',s)]
        if len(slides)!=3: raise ValueError('SLIDE_COUNT '+str(len(slides)))
        images=[s for s in z.namelist() if s.startswith('ppt/media/') and not s.endswith('/')]
        if len(images)!=3: raise ValueError('PPT_MEDIA_COUNT '+str(len(images)))
    return {'slides':len(slides),'ppt_images':len(images)}
def build():
    p=validate()
    if output.exists():rmtree(output)
    for rel in parts:
        dest=output/rel;dest.parent.mkdir(parents=True,exist_ok=True);copy2(root/rel,dest)
    hashes={x:hashlib.sha256((output/x).read_bytes()).hexdigest() for x in parts}
    (output/'manifest.json').write_text(json.dumps({'name':'折光档案｜Light, Paper & Time','files':hashes,'ppt':p},ensure_ascii=False,indent=2),encoding='utf-8')
    print('BUILD_OK',len(parts),'files',sum((output/p).stat().st_size for p in parts),'bytes','ppt_slides',p['slides'],'media',p['ppt_images'])
if __name__=='__main__':build()
