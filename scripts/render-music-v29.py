"""V29 original instrument bank: independently synthesized, no recordings/soundfonts."""
from pathlib import Path
import json,wave
import numpy as np
RATE=32000
OUT=Path(__file__).resolve().parents[1]/'apps/player/public/audio/v29'
OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(2907);manifest=[]
def save(name,samples,root):
 s=np.asarray(samples,dtype=np.float64);s-=s.mean();fade=min(150,len(s)//8);s[:fade]*=np.linspace(0,1,fade);s[-600:]*=np.linspace(1,0,min(600,len(s)))
 s=np.tanh(s*.9);s*=.8/max(1e-6,np.max(np.abs(s)))
 with wave.open(str(OUT/f'{name}.wav'),'wb') as f:f.setparams((1,2,RATE,0,'NONE','not compressed'));f.writeframes(np.round(s*32767).astype('<i2').tobytes())
 manifest.append({'id':name,'root':root,'seconds':round(len(s)/RATE,3),'peak':round(float(np.max(np.abs(s))),3),'rms':round(float(np.sqrt(np.mean(s*s))),4)})
def tone(name,root,kind):
 t=np.arange(RATE*5)/RATE;f=440*2**((root-69)/12);p=2*np.pi*f*t;v=.004*np.sin(2*np.pi*5.1*t)*np.minimum(t*3,1)
 if kind=='piano':s=sum(np.sin(p*n*np.sqrt(1+.00018*n*n))*np.exp(-t*(.8+n*.35))/(n**1.9) for n in range(1,16))+.18*np.sin(p*1.001)*np.exp(-t*1.2)
 elif kind=='electric':s=np.sin(p+2.4*np.sin(p*2)*np.exp(-t*3))*np.exp(-t*1.1)+.18*np.sin(p*3)*np.exp(-t*4)
 elif kind=='organ':s=(np.sin(p)+.45*np.sin(p*2)+.35*np.sin(p*3)+.15*np.sin(p*4))*(1-np.exp(-t*40))*np.exp(-t*.35)*(1+.035*np.sin(2*np.pi*6*t))
 elif kind in ['guitar','muteguitar','koto','sitar']:
  decay={'guitar':1.4,'muteguitar':6,'koto':1.7,'sitar':1.1}[kind];s=sum(np.sin(p*n+.3*np.sin(2*np.pi*3*t))/(n**1.2)*np.exp(-t*(decay+n*.25))*(np.sin(n*np.pi*.23)**2) for n in range(1,18))
  if kind=='sitar':s+=.24*np.sin(p*1.006+2*np.sin(p*2))*np.exp(-t*2)
 elif kind in ['sax','trumpet','accordion']:
  power={'sax':1.65,'trumpet':1.2,'accordion':1.5}[kind];s=sum(np.sin(p*n*(1+v)+.1*n)*np.exp(-t*n*.12)/n**power for n in range(1,13))*(1-np.exp(-t*25))*np.exp(-t*.45)
  if kind=='accordion':s+=sum(np.sin(p*n*1.005)/n**1.5 for n in range(1,9))*.6*np.exp(-t*.5)
 elif kind in ['strings','choir']:
  s=sum((np.sin(p*n*(1+v))+np.sin(p*n*.997)+np.sin(p*n*1.003))/(n**1.65) for n in range(1,12))*(1-np.exp(-t*5))*np.exp(-t*.22)
  if kind=='choir':s=sum(np.sin(p*n)*(np.exp(-((n*f-800)/300)**2)+.45*np.exp(-((n*f-1300)/260)**2)+.2)/n for n in range(1,15))*(1-np.exp(-t*4))*np.exp(-t*.25)
 elif kind=='flute':s=(np.sin(p*(1+v))+.15*np.sin(p*2)+.04*np.sin(p*3))*(1-np.exp(-t*16))*np.exp(-t*.35)
 elif kind in ['marimba','steelpan','celeste','bell']:
  partials={'marimba':[(1,1,2.8),(4,.3,8),(10,.12,12)],'steelpan':[(1,1,1.8),(2,.6,3),(3,.35,5),(5.1,.12,8)],'celeste':[(1,1,1.1),(2,.3,3),(5.4,.4,5)],'bell':[(1,1,.6),(2.76,.45,1.8),(5.4,.22,3),(8.9,.12,5)]}[kind];s=sum(np.sin(p*n)*a*np.exp(-t*d) for n,a,d in partials)
 elif kind in ['synth','arp']:s=(np.sin(p+1.8*np.sin(p)*np.exp(-t*2))+.3*np.sin(p*1.004))*(1-np.exp(-t*30))*np.exp(-t*(1.7 if kind=='arp' else .55))
 elif kind in ['bass','upright','sub']:
  s=(np.sin(p)+(.55 if kind=='upright' else .22)*np.sin(p*2)*np.exp(-t*3)+.1*np.sin(p*3))*np.exp(-t*(2 if kind=='upright' else 1.1))
  if kind=='upright':s+=rng.normal(0,.06,len(t))*np.exp(-t*55)
 save(name,s,root)
for name in ['piano','electric','organ','guitar','muteguitar','sax','trumpet','strings','choir','flute','koto','sitar','marimba','steelpan','celeste','bell','accordion','synth','arp','bass','upright','sub']:tone(name,36 if name in ['bass','upright','sub'] else 60,name)
for name in ['kick','snare','rim','clap','hat','ride','shaker','conga','taiko','tambourine']:
 t=np.arange(int(RATE*(1.5 if name in ['ride','taiko'] else .6)))/RATE;n=rng.normal(0,1,len(t));hi=n-np.roll(n,1)
 if name=='kick':s=np.sin(2*np.pi*(43*t+2.4*(1-np.exp(-t*45))))*np.exp(-t*9)+hi*.025*np.exp(-t*100)
 elif name=='snare':s=(n*.35+np.sin(2*np.pi*190*t)*.7)*np.exp(-t*18)
 elif name=='rim':s=(np.sin(2*np.pi*790*t)+.6*np.sin(2*np.pi*1250*t))*np.exp(-t*65)
 elif name=='clap':s=hi*(np.exp(-t*35)+.7*np.exp(-np.maximum(0,t-.012)*50)*(t>.012)+.5*np.exp(-np.maximum(0,t-.025)*28)*(t>.025))
 elif name=='conga':s=(np.sin(2*np.pi*170*t)+.35*np.sin(2*np.pi*280*t))*np.exp(-t*17)+n*.03*np.exp(-t*80)
 elif name=='taiko':s=(np.sin(2*np.pi*75*t)+.6*np.sin(2*np.pi*123*t)+.3*np.sin(2*np.pi*168*t))*np.exp(-t*5)+n*.12*np.exp(-t*30)
 else:
  decay={'hat':65,'ride':5,'shaker':36,'tambourine':18}[name];s=(hi*.5+sum(np.sin(2*np.pi*f*t) for f in [3311,4799,6127,8093])*.14)*np.exp(-t*decay)
 save(name,s,36 if name=='kick' else 60)
(OUT/'manifest.json').write_text(json.dumps({'version':'original-ensembles-v29','sampleRate':RATE,'provenance':'Original additive/FM/noise synthesis in scripts/render-music-v29.py, seed 2907. No third-party recordings.','samples':manifest},indent=2)+'\n')
print(json.dumps({'instruments':len(manifest),'bytes':sum(p.stat().st_size for p in OUT.glob('*.wav'))}))
