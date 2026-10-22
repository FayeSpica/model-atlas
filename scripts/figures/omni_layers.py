"""Render source-grounded multimodal model layer maps and operator details.

Regenerate: python3 scripts/figures/omni_layers.py
Each figure uses the same geometry for SVG and draw.io.
"""
import json
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
colors = {'blue': ('#e7eff6', '#799ab8'), 'full': ('#cbdde9', '#527b9c'), 'green': ('#edf2e9', '#8fa580'), 'gold': ('#f4e7cb', '#b5873a'), 'gray': ('#f7f5f2', '#aaa49c')}
for spec in json.loads((Path(__file__).with_name('omni_models.json')).read_text()):
    if len(sys.argv) > 1 and spec['slug'] not in sys.argv[1:]:
        continue
    nodes, edges = [], []
    def node(name,x,y,w,h,label,color='gray',kind='card',size=12,align='center'):
        fill,stroke=colors[color]
        nodes.append(dict(id=name,kind=kind,x=x,y=y,w=w,h=h,label=label,fill=fill if kind=='card' else 'none',stroke=stroke if kind!='text' else 'none',color='#23201e',size=size,weight=400,radius=0,shadow=False,align=align))
    def edge(a,b,pts):
        edges.append(dict(source=a,target=b,points=pts,color='#8f8a84',arrow=True))
    canvas_width=max(1000,40+len(spec['lanes'])*328-20)
    node('title',20,12,canvas_width-40,26,spec['title'].upper(),kind='text',size=15,align='left')
    y=54
    for row,stack in enumerate(spec['stacks']):
        node(f'stack-label-{row}',20,y,340,22,stack['title'],kind='text',size=11,align='left')
        step=min(22,600/stack['count'])
        for i in range(stack['count']):
            x=370+i*step
            node(f'stack-{row}-{i}',x,y,max(5,step-2),20,'',stack['special'].get(str(i),stack['color']))
            if i==0 or i==stack['count']-1 or (stack['count']>15 and i%8==7):
                node(f'tick-{row}-{i}',x-3,y+22,step+4,16,str(i),kind='text',size=9)
        y+=48
    node('path-label',20,y,960,20,'COMPONENT PATH · STAGE BOUNDARIES MAY DIFFER',kind='text',size=11,align='left')
    y+=30
    for i,label in enumerate(spec['pipeline']):
        x=20+i*196
        node(f'path-{i}',x,y,176,44,label,'blue',size=11)
        if i and not (spec['slug']=='qwen-image-2-1' and i==1):
            edge(f'path-{i-1}',f'path-{i}',[[x-20,y+22],[x,y+22]])
    if spec['slug']=='qwen-image-2-1':
        edge('path-0','path-2',[[108,y+44],[108,y+56],[500,y+56],[500,y+44]])
    y+=72
    top=y+33
    def connect(previous, target, cx, target_y, diameter=None):
        for name, px, py in previous:
            if diameter and len(previous) > 1 and px != cx:
                cy = target_y+diameter/2
                tx = cx-diameter/2 if px < cx else cx+diameter/2
                points = [[px,py],[px,cy],[tx,cy]]
            else:
                points = [[px, py], [cx, target_y]] if px == cx else [[px, py], [px, target_y-8], [cx, target_y-8], [cx, target_y]]
            edge(name, target, points)

    def sequence(steps, x, start_y, width, prefix, previous=None, color='gray'):
        import textwrap
        cursor = start_y
        previous = previous or []
        residual_anchor = None
        for index, step in enumerate(steps):
            name = f'{prefix}-{index}'
            if isinstance(step, dict):
                branches = step['branches']
                gap = 12
                weights = step.get('weights', [1]*len(branches))
                available = width-gap*(len(branches)-1)
                branch_x = x
                ends, bottom_y = [], cursor
                for branch_index, branch in enumerate(branches):
                    branch_width = available*weights[branch_index]/sum(weights)
                    end, branch_y = sequence(branch, branch_x, cursor, branch_width, f'{name}-branch-{branch_index}', previous, color)
                    branch_x += branch_width+gap
                    ends.extend(end)
                    bottom_y = max(bottom_y, branch_y)
                previous, cursor = ends, bottom_y+8
                continue
            is_residual = step == 'Add residual'
            is_add = step.startswith('Add ')
            is_multiply = step == 'Elementwise multiply'
            if is_add or is_multiply:
                diameter = 28
                cx = x+width/2
                node(name,cx-diameter/2,cursor,diameter,diameter,'+' if is_add else '×',size=20)
                nodes[-1].update(shape='ellipse',fill='#ffffff',stroke='#8f8a84')
                connect(previous,name,cx,cursor,diameter)
                if is_residual and residual_anchor:
                    anchor_name, ax, ay = residual_anchor
                    rail=x+width+7
                    edge(anchor_name,name,[[ax,ay],[rail,ay],[rail,cursor+diameter/2],[cx+diameter/2,cursor+diameter/2]])
                if is_add:
                    caption = step[4:]
                    caption_width=max(30,width/2-38)
                    node(name+'-caption',x,cursor+diameter/2-9,caption_width,18,caption,kind='text',size=9,align='left')
                    if not is_residual and len(previous)==1:
                        edge(name+'-caption',name,[[x+caption_width,cursor+diameter/2],[cx-diameter/2,cursor+diameter/2]])
                previous=[(name,cx,cursor+diameter)]
                cursor+=diameter+18
                continue
            if step in ('RMSNorm','Input RMSNorm','Post-attention RMSNorm','Pre-MLP RMSNorm','LayerNorm'):
                if not previous:
                    node(name+'-input',x+width/2-12,cursor,24,18,'x',kind='text',size=12)
                    previous=[(name+'-input',x+width/2,cursor+18)]
                    cursor+=36
                if len(previous)==1:
                    anchor=next(n for n in nodes if n['id']==previous[0][0])
                    residual_anchor=(anchor['id'],anchor['x']+anchor['w'],anchor['y']+anchor['h']/2)
            # Wrap descriptions to the available branch width, never combine operations.
            line_width = max(7, int((width-12)/6.0))
            label = '\n'.join(line for paragraph in step.split('\n') for line in textwrap.wrap(paragraph, line_width, break_long_words=False, break_on_hyphens=False))
            height = max(36, 14*len(label.split('\n'))+12)
            node(name,x,cursor,width,height,label,color,size=10 if width < 100 else 11)
            connect(previous,name,x+width/2,cursor)
            previous=[(name,x+width/2,cursor+height)]
            cursor+=height+18
        return previous,cursor

    bottom = top
    lane_ends = []
    for lane_index,lane in enumerate(spec['lanes']):
        x=20+lane_index*328
        color=['blue','green','gold','blue'][lane_index]
        node(f'heading-{lane_index}',x,y,308,25,lane['title'],kind='text',size=11,align='left')
        _, end_y = sequence(lane['ops'],x+14,top+12,280,f'op-{lane_index}',color=color)
        lane_ends.append(end_y+8)
        bottom=max(bottom,end_y+8)
    for lane_index in range(len(spec['lanes'])):
        node(f'frame-{lane_index}',20+lane_index*328,top,308,lane_ends[lane_index]-top,'',kind='group')
        nodes[-1]['stroke']='#e6e1da'
    foot=bottom+22
    # A caption can wrap deliberately at component boundaries instead of overflowing.
    import textwrap
    note='\n'.join(textwrap.wrap(spec['note'],width=135,break_long_words=False))
    node('caption',20,foot,canvas_width-40,50,note,kind='text',size=11,align='left')
    node('operator-legend',20,foot+54,canvas_width-40,18,'+  addition     ×  elementwise multiplication',kind='text',size=11,align='left')
    layout=dict(width=canvas_width,height=foot+92,background='#ffffff',font='Inter, Arial, sans-serif',nodes=nodes,edges=edges)
    output=root/'public/figures'/spec.get('figure', spec['slug']+'-layers')
    path=Path(str(output)+'.layout.json')
    path.write_text(json.dumps(layout,indent=2)+'\n')
    subprocess.run([sys.executable,str(Path(__file__).with_name('render_flint.py')),str(path),'--output',str(output)],check=True)
