import os,json,sys,time,urllib.request
tok=os.environ['REPLICATE_API_TOKEN']
def run(model,inp,out):
    req=urllib.request.Request(f'https://api.replicate.com/v1/models/{model}/predictions',data=json.dumps({'input':inp}).encode(),headers={'Authorization':'Bearer '+tok,'Content-Type':'application/json','Prefer':'wait=60'})
    d=json.load(urllib.request.urlopen(req,timeout=120))
    while d['status'] in('starting','processing'):
        time.sleep(2);d=json.load(urllib.request.urlopen(urllib.request.Request(d['urls']['get'],headers={'Authorization':'Bearer '+tok})))
    if d['status']!='succeeded': print('FAIL',out,d.get('error'));return
    u=d['output'];u=u[0] if isinstance(u,list) else u
    urllib.request.urlretrieve(u,out);print('ok',out)
S="no text, no letters, no people, no faces, no logos, cinematic, premium editorial photography, deep navy night palette with vermilion red and cobalt blue accents, shallow depth of field, fine film grain"
P={
'hero':"A lone vermilion-red torii gate with a cobalt-blue crossbeam standing in shallow still water in a quiet dojo courtyard at night, soft rain, neon red and blue reflections on wet dark stone, a single large white ink enso brush circle glowing faintly in the mist behind the gate, torii placed right of centre, wide composition with calm empty dark space on the left, "+S,
'doors':"Close view of a dark wooden dojo sliding door with paper screens lit from within, rain dripping from the eaves, red and blue neon light reflecting on wet timber floor, minimal Japanese architecture, "+S,
'enso':"A bold white sumi-ink enso, an open hollow ring brush stroke with an empty dark centre, on near-black textured paper, a thin red line and a thin blue line crossing beneath it like a belt, vast negative space, abstract minimal, high contrast, "+S,
'path':"A long line of red torii gates receding into blue misty night, wet stone path with neon reflections, symmetrical depth, rain, quiet and monumental, "+S,
}
mode=sys.argv[1]
for k,p in P.items():
    if mode=='draft':
        for i in range(2): run('black-forest-labs/flux-schnell',{'prompt':p,'aspect_ratio':'16:9','num_outputs':1,'output_format':'webp','output_quality':90,'seed':i+1},f'img/draft-{k}-{i}.webp')
    else:
        run('black-forest-labs/flux-1.1-pro',{'prompt':p,'aspect_ratio':'16:9','output_format':'webp','output_quality':90,'safety_tolerance':2},f'img/final-{k}.webp')
