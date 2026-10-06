"""Original additive/FM/noise instrument bank. No recordings or soundfonts."""
from pathlib import Path
import json, wave
import numpy as np
RATE=32000
OUT=Path(__file__).resolve().parents[1]/'apps/player/public/audio/v23'
OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(2307)
manifest=[]
def save(name,samples,root=None):
    samples=np.asarray(samples,dtype=np.float64); samples-=samples.mean()
    fade=min(500,len(samples)//10)
    samples[:fade]*=np.linspace(0,1,fade); samples[-fade:]*=np.linspace(1,0,fade)
    samples*=.86/max(1e-6,np.max(np.abs(samples)))
    with wave.open(str(OUT/f'{name}.wav'),'wb') as f:
        f.setparams((1,2,RATE,0,'NONE','not compressed')); f.writeframes(np.round(samples*32767).astype('<i2').tobytes())
    manifest.append({'id':name,'root':root,'seconds':round(len(samples)/RATE,3),'peak':round(float(np.max(np.abs(samples))),4),'rms':round(float(np.sqrt(np.mean(samples*samples))),4)})
def pitched(name,duration,root,render):
    t=np.arange(int(duration*RATE))/RATE; f=440*2**((root-69)/12); save(name,render(t,f),root)
pitched('keys',3,60,lambda t,f:(np.sin(2*np.pi*f*t+2.1*np.exp(-t*4)*np.sin(2*np.pi*f*2*t))*.66+.24*np.sin(2*np.pi*f*1.002*t)+.1*np.sin(2*np.pi*f*3*t)*np.exp(-t*6))*np.exp(-t*1.7))
pitched('brass',2,60,lambda t,f:(1-np.exp(-t*36))*np.exp(-t*1.6)*sum((np.sin(2*np.pi*f*n*t+.015*np.sin(2*np.pi*5*t))+.6*np.sin(2*np.pi*f*1.004*n*t))/(n**1.3) for n in range(1,11)))
pitched('pluck',2.4,60,lambda t,f:sum(np.sin(2*np.pi*f*n*t)*np.exp(-t*(2+n*.75))/(n**1.45) for n in range(1,15)))
pitched('strings',4,60,lambda t,f:(1-np.exp(-t*8))*np.exp(-t*.9)*sum((np.sin(2*np.pi*f*n*t)+np.sin(2*np.pi*f*.997*n*t)+np.sin(2*np.pi*f*1.003*n*t))/(3*n**1.65) for n in range(1,10)))
pitched('bass',2,36,lambda t,f:(np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*f*2*t)*np.exp(-t*4)+.12*np.sin(2*np.pi*f*3*t))*np.exp(-t*2.8))
pitched('mallet',2.5,72,lambda t,f:np.sin(2*np.pi*f*t)*np.exp(-t*3)+.45*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*7)+.2*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*13))
for name,duration in [('kick',.65),('snare',.38),('clap',.32),('hat',.12),('openhat',.42),('shaker',.16),('conga',.3),('crash',1.6)]:
    t=np.arange(int(duration*RATE))/RATE; noise=rng.normal(0,1,len(t)); high=noise-np.roll(noise,1)
    if name=='kick': s=np.sin(2*np.pi*(46*t+65*.03*(1-np.exp(-t/.03))))*np.exp(-t*9)+high*.04*np.exp(-t*140)
    elif name=='snare': s=(noise*.62+np.sin(2*np.pi*185*t)*.42)*np.exp(-t*15)
    elif name=='clap': s=high*(np.exp(-t*23)+.8*np.exp(-np.maximum(t-.012,0)*45)*(t>.012)+.65*np.exp(-np.maximum(t-.024,0)*35)*(t>.024))
    elif name=='conga': s=np.sin(2*np.pi*(170*t+12*.012*(1-np.exp(-t/.012))))*np.exp(-t*15)+high*.1*np.exp(-t*85)
    elif name=='crash': s=(high*.5+sum(np.sin(2*np.pi*f*t) for f in [3071,4213,5737,6983,8639])*.14)*np.exp(-t*3.4)
    else: s=high*np.exp(-t*{'hat':55,'openhat':12,'shaker':36}[name])
    save(name,s)
(OUT/'manifest.json').write_text(json.dumps({'version':'original-bank-v23','sampleRate':RATE,'provenance':'Original additive/FM/noise synthesis; render-music-bank.py; seed 2307','samples':manifest},indent=2)+'\n')
print(json.dumps({'samples':len(manifest),'bytes':sum(p.stat().st_size for p in OUT.glob('*.wav'))}))
