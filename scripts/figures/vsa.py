"""FastVideo H3 VSA: shared scores, sparse fine path, gated compression."""
import json
import subprocess
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
nodes,edges=[],[]
def n(id,x,y,w,h,label,tone='gray',kind='card',shape=None):
 colors={'blue':('#e7eff6','#799ab8'),'gold':('#f4e7cb','#b5873a'),'green':('#edf2e9','#8fa580'),'gray':('#f7f5f2','#aaa49c')};fill,stroke=colors[tone]
 item=dict(id=id,kind=kind,x=x,y=y,w=w,h=h,label=label,fill=fill if kind=='card' else 'none',stroke=stroke if kind=='card' else 'none',color='#23201e',size=12,weight=400,radius=0,shadow=False)
 if shape:item['shape']=shape
 nodes.append(item)
def e(a,b,pts):edges.append(dict(source=a,target=b,points=pts,color='#8f8a84',arrow=True))
n('title',20,10,960,30,'VSA-H3 · TILE SELECTION + TOKEN ATTENTION',kind='text')
n('qkv',340,60,300,42,'Q / K / V after QK norm and RoPE','blue')
for id,x,title in [('selection',20,'TILE SELECTION'),('fine',350,'FINE ATTENTION'),('compress',680,'COMPRESSION')]:n(id,x,127,300,24,title,kind='text')
n('poolqk',20,170,300,42,'Pool Q / K per tile','blue')
n('score',20,242,300,42,'Tile scores\nQ̄ K̄ᵀ / √d','blue')
n('topk',20,330,300,48,'Top-k per video region\nper query tile and head','gold')
n('mask',20,418,300,48,'Block mask\n+ non-video visibility rules','gold')
n('raw',350,170,300,42,'Original Q / K / V','blue')
n('sparse',350,500,300,48,'Block-sparse attention\nselected original tokens','blue')
n('poolv',680,170,300,42,'Pool V per tile','green')
n('softmax',680,242,300,42,'Softmax over tile scores','green')
n('coarse',680,330,300,48,'Matrix multiply\nsoftmax(S) × V̄','green')
n('broadcast',680,418,300,48,'Broadcast to tokens','green')
n('hidden',20,540,180,42,'Input hidden states','gold')
n('gate',20,610,180,42,'to_gate_compress','gold')
n('mul',815,610,30,30,'×','green',shape='ellipse')
n('sum',485,690,30,30,'+','gray',shape='ellipse')
n('out',350,755,300,42,'Restore packed token order','blue')
e('qkv','poolqk',[[340,81],[170,81],[170,170]])
e('qkv','raw',[[490,102],[490,170]])
e('qkv','poolv',[[640,81],[830,81],[830,170]])
e('poolqk','score',[[170,212],[170,242]])
e('score','topk',[[170,284],[170,330]])
e('topk','mask',[[170,378],[170,418]])
e('mask','sparse',[[320,442],[338,442],[338,524],[350,524]])
e('raw','sparse',[[500,212],[500,500]])
e('score','softmax',[[320,263],[680,263]])
e('poolv','coarse',[[980,191],[992,191],[992,354],[980,354]])
e('softmax','coarse',[[830,284],[830,330]])
e('coarse','broadcast',[[830,378],[830,418]])
e('broadcast','mul',[[830,466],[830,610]])
e('hidden','gate',[[110,582],[110,610]])
e('gate','mul',[[200,631],[815,631]])
e('mul','sum',[[830,640],[830,705],[515,705]])
e('sparse','sum',[[500,548],[500,690]])
e('sum','out',[[500,720],[500,755]])
n('caption',20,825,960,60,'H3 implementation: O = O_sparse + gate ⊙ Broadcast(O_compressed).\nVideo queries select tiles; non-video queries stay dense. No sigmoid is added to this gate.',kind='text')
out=root/'public/figures/vsa-mechanism';path=Path(str(out)+'.layout.json');path.write_text(json.dumps(dict(width=1010,height=905,background='#ffffff',font='Inter, Arial, sans-serif',nodes=nodes,edges=edges),indent=2)+'\n')
subprocess.run([sys.executable,str(Path(__file__).with_name('render_flint.py')),str(path),'--output',str(out)],check=True)
