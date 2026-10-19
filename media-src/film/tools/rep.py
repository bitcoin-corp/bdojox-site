#!/usr/bin/env python3
# Replicate runner (token from env only). usage: rep.py jobs.json  -> each job {model|version, input, out}
import os,json,sys,time,urllib.request,concurrent.futures as cf
tok=os.environ['REPLICATE_API_TOKEN']; H={'Authorization':'Bearer '+tok,'Content-Type':'application/json','User-Agent':'bdojox-film/1.0'}
def req(url,data=None):
    return json.load(urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(data).encode() if data else None,headers=H),timeout=180))
def run(j):
    if os.path.exists(j['out']): return 'skip '+j['out']
    if 'version' in j: d=req('https://api.replicate.com/v1/predictions',{'version':j['version'],'input':j['input']})
    else: d=req(f"https://api.replicate.com/v1/models/{j['model']}/predictions",{'input':j['input']})
    while d['status'] in('starting','processing'):
        time.sleep(3); d=req(d['urls']['get'])
    if d['status']!='succeeded': return f"FAIL {j['out']} {d.get('error')}"
    u=d['output']; u=u[0] if isinstance(u,list) else u
    r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'bdojox-film/1.0'})); open(j['out'],'wb').write(r.read())
    return f"ok {j['out']} {d.get('metrics',{}).get('predict_time')}"
jobs=json.load(open(sys.argv[1]))
with cf.ThreadPoolExecutor(6) as ex:
    for r in ex.map(run,jobs): print(r,flush=True)
