# Safe GitHub API publication when Git HTTPS transport fails.
# Full content publication occurs as one fast-forward-only commit, based on fresh remote main.
# User explicitly authorized publishing 折光档案 to 鼠哥星系 → 小东西.
from __future__ import annotations
import base64, json, subprocess, sys, hashlib, time
from pathlib import Path
ROOT=Path(__file__).resolve().parent
REPO_ROOT=ROOT.parents[1]
REPO='ndshuge/ndshuge-galaxy'
PREFIX='little-works/light-paper-time/'
BRANCH='feature/light-paper-time-20261029'
ART={
  'slug':'light-paper-time',
  'title':'折光档案｜Light, Paper & Time',
  'date':'2026.10.29',
  'type':'INTERACTIVE ART / EXHIBITION',
  'description':'走进纸、光与时间的三间展厅。读一页摄影，拖动真正折射文字的透镜，让记忆沿时间缓缓变化，并带走三页艺术展册。',
  'url':'./light-paper-time/',
  'cover':'./light-paper-time/assets/cover.webp',
  'tags':['交互艺术','光学折射','艺术展册 PPT'],
}
def gh(endpoint,method='GET',payload=None,quiet=False,may_fail=False):
    cmd=['gh','api','-X',method,'repos/'+REPO+'/'+endpoint]
    if payload is not None:cmd += ['--input','-']
    raw=json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8') if payload is not None else None
    proc=subprocess.run(cmd,input=raw,capture_output=True,check=False)
    if proc.returncode:
        if may_fail:return None
        msg=proc.stderr.decode('utf-8','replace')[:700]
        raise RuntimeError(f'GH_API {endpoint} {proc.returncode}: {msg}')
    s=proc.stdout.decode('utf-8','replace')
    return json.loads(s) if s.strip() else {}
def main():
    print('PUBLISH_GATE start: latest remote main, no force, only intended paths',flush=True)
    head=gh('git/ref/heads/main')['object']['sha']
    parent=gh('git/commits/'+head)
    base_tree=parent['tree']['sha']
    print('PARENT',head,'TREE',base_tree,flush=True)
    check=gh('contents/'+PREFIX+'index.html?ref=main',may_fail=True)
    if check is not None:raise RuntimeError('This work already exists on production, refusing silent overwrite')
    c=gh('contents/little-works/catalog.json?ref=main')
    entries=json.loads(base64.b64decode(c['content'].replace('\n','')).decode('utf-8'))
    if any(x.get('slug')==ART['slug'] for x in entries):raise RuntimeError('Catalog slug already registered; do not create duplicate')
    next_catalog=json.dumps([ART]+entries,ensure_ascii=False,indent=2)+'\n'
    binary={'.jpg','.jpeg','.webp','.png','.pptx','.gif'}
    workpaths=[p for p in sorted(ROOT.rglob('*')) if p.is_file() and p.relative_to(ROOT).as_posix() not in
      {'.gitignore'} and not p.relative_to(ROOT).as_posix().startswith(('dist/','__pycache__/','qa/cdp-art-profile/','qa/round1-','qa/round2-')) and
      not p.relative_to(ROOT).as_posix().endswith(('.pyc','.b64')) and
      not (p.parent.name=='assets' and p.suffix in ('.png',) or p.parent.name=='assets' and p.name.startswith('slide-') and p.suffix=='.jpg')]
    # Source .gitignore is published too; this is a whitelist by git's staged file list instead of globbing.
    g=subprocess.run(['git','-C',str(REPO_ROOT),'ls-files','--cached','--',PREFIX],capture_output=True,check=True,text=True)
    selected=[]
    for line in g.stdout.splitlines():
        if not line.startswith(PREFIX):raise ValueError('Unexpected staged path')
        p=ROOT/line.removeprefix(PREFIX)
        if not p.is_file():raise FileNotFoundError(str(p))
        selected.append((line,p))
    if len(selected)<20:raise ValueError('Missing staged release files: '+str(len(selected)))
    # If source files change after staging, stop rather than publishing an unreviewed version.
    dirty=subprocess.run(['git','-C',str(REPO_ROOT),'diff','--name-only','--',PREFIX],capture_output=True,text=True,check=True).stdout.strip()
    if dirty:raise RuntimeError('Unstaged edits in release files: '+dirty[:300])
    print('CONTENT_FILES',len(selected),'CATALOG_NEW_TOTAL',len(entries)+1,flush=True)
    tree=[]
    for i,(remote,p) in enumerate(selected,1):
        if p.suffix.lower() in binary:
            data={'content':base64.b64encode(p.read_bytes()).decode('ascii'),'encoding':'base64'}
        else:
            data={'content':p.read_text(encoding='utf-8'),'encoding':'utf-8'}
        blob=gh('git/blobs',method='POST',payload=data)
        tree.append({'path':remote,'mode':'100644','type':'blob','sha':blob['sha']})
        print('BLOB',i,'/',len(selected),remote,p.stat().st_size,flush=True)
    catblob=gh('git/blobs',method='POST',payload={'content':next_catalog,'encoding':'utf-8'})
    tree.append({'path':'little-works/catalog.json','mode':'100644','type':'blob','sha':catblob['sha']})
    print('UPLOADED_BLOBS',len(tree),flush=True)
    result=gh('git/trees',method='POST',payload={'base_tree':base_tree,'tree':tree})
    newtree=result['sha']
    commit=gh('git/commits',method='POST',payload={'message':'feat(little-works): publish Light, Paper & Time interactive exhibition','tree':newtree,'parents':[head]})
    newsha=commit['sha']
    print('NEW_COMMIT',newsha,'PARENT',head,flush=True)
    # Create isolated remote branch first, then update main only after a race/permission check.
    branch_ref=gh('git/ref/heads/'+BRANCH,may_fail=True)
    if branch_ref is None:
        gh('git/refs',method='POST',payload={'ref':'refs/heads/'+BRANCH,'sha':newsha})
    else:
        if branch_ref['object']['sha']!=newsha:raise RuntimeError('Remote feature branch name already in use, preserving it')
    print('REMOTE_BRANCH_READY',BRANCH,flush=True)
    current=gh('git/ref/heads/main')['object']['sha']
    if current!=head:
        raise RuntimeError(f'REMOTE_HEAD_CHANGED from {head} to {current}; safe branch preserved, main unchanged')
    updated=gh('git/refs/heads/main',method='PATCH',payload={'sha':newsha,'force':False})
    assert updated['object']['sha']==newsha
    print('REMOTE_MAIN_UPDATED',newsha,flush=True)
    now=gh('git/ref/heads/main')['object']['sha']
    assert now==newsha
    live_catalog=gh('contents/little-works/catalog.json?ref=main')
    actual=json.loads(base64.b64decode(live_catalog['content'].replace('\n','')).decode('utf-8'))
    assert actual[0]['slug']==ART['slug']
    print('GITHUB_RELEASE_VERIFIED',newsha,'count',len(actual),flush=True)
    (ROOT/'qa'/'release-github.json').write_text(json.dumps({'parent':head,'commit':newsha,'branch':BRANCH,'catalogCount':len(actual),'files':[i[0] for i in selected],'publishedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())},ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':
    try:main()
    except Exception as e:print('PUBLISH_ABORTED',str(e),file=sys.stderr,flush=True);sys.exit(1)
