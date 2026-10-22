"""Compare head-to-KV relationships with the same eight query heads."""
import json
import subprocess
import sys
from pathlib import Path

root=Path(__file__).resolve().parents[2]
nodes,edges=[],[]
def node(name,x,y,w,h,label,fill='#f7f5f2',stroke='#aaa49c',kind='card',size=12):
 nodes.append(dict(id=name,kind=kind,x=x,y=y,w=w,h=h,label=label,fill=fill if kind=='card' else 'none',stroke=stroke if kind=='card' else 'none',color='#23201e',size=size,weight=400,radius=0,shadow=False))
node('title',20,10,960,34,'MHA / GQA / MQA · SAME 8 QUERY HEADS',kind='text',size=16)
for col,(name,count) in enumerate([('MHA',8),('GQA',2),('MQA',1)]):
 x=20+col*328
 node(f'title-{col}',x,65,300,28,name,kind='text',size=16)
 node(f'query-label-{col}',x,105,300,20,'Query heads',kind='text')
 for q in range(8):node(f'q-{col}-{q}',x+12+q*35,142,29,36,f'Q{q+1}','#e7eff6','#799ab8',size=10)
 node(f'kv-label-{col}',x,295,300,20,'Key / value heads',kind='text')
 for kv in range(count):
  width=29 if count==8 else 92
  kx=x+12+kv*35 if count==8 else x+35+kv*138 if count==2 else x+104
  node(f'kv-{col}-{kv}',kx,244,width,36,f'KV{kv+1}','#f4e7cb','#b5873a',size=10)
  for q in range(kv*(8//count),(kv+1)*(8//count)):
   edges.append(dict(source=f'kv-{col}-{kv}',target=f'q-{col}-{q}',points=[[kx+width/2,244],[x+12+q*35+14.5,178]],color='#8f8a84',arrow=False))
 description={'MHA':'8 Q heads · 8 KV groups\nOne Q head per KV group','GQA':'8 Q heads · 2 KV groups\nFour Q heads per KV group','MQA':'8 Q heads · 1 KV group\nAll Q heads share one K/V'}[name]
 node(f'desc-{col}',x,340,300,60,description,kind='text')
node('legend',20,430,960,42,'Blue: Q head · gold: one K head and one V head. Lines show pairing / sharing.\nEach Q head still computes its own attention weights.',kind='text')
node('scope',20,490,960,44,'Schematic head counts, not model layer counts. Llama 2 7B uses 32Q / 32KV; Qwen2-7B uses 28Q / 4KV.',kind='text',size=11)
output=root/'public/figures/attention-head-sharing';path=Path(str(output)+'.layout.json')
path.write_text(json.dumps(dict(width=1000,height=550,background='#ffffff',font='Inter, Arial, sans-serif',nodes=nodes,edges=edges),indent=2)+'\n')
subprocess.run([sys.executable,str(Path(__file__).with_name('render_flint.py')),str(path),'--output',str(output)],check=True)
