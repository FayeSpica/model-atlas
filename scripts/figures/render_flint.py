#!/usr/bin/env python3
"""Render a shared explicit layout to editable draw.io XML and embedded SVG."""
import argparse
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ET.register_namespace("", "http://www.w3.org/2000/svg")


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"Expected finite number: {value!r}")
    return value


def color(value):
    if not isinstance(value, str) or not re.fullmatch(r"none|#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?", value):
        raise ValueError(f"Invalid color: {value!r}")
    return value


def validate(data):
    width, height = number(data['width']), number(data['height'])
    if min(width, height) <= 0:
        raise ValueError('Canvas dimensions must be positive')
    color(data.get('background', '#f5f7fa'))
    font = data.get('font', 'Arial, Helvetica, sans-serif')
    if not isinstance(font, str) or any(c in font for c in ';=<>'):
        raise ValueError('Invalid font family')
    ids = {}
    for node in data['nodes']:
        nid = node['id']
        if not isinstance(nid, str) or not nid or nid in ids or nid in ('0', '1') or nid.startswith('__'):
            raise ValueError(f'Duplicate or reserved node id: {nid}')
        ids[nid] = node
        if node.get('shape', 'rect') not in ('rect', 'ellipse'):
            raise ValueError(f'Unknown node shape: {nid}')
        if node['kind'] not in ('group', 'card', 'text'):
            raise ValueError(f'Unknown node kind: {node["kind"]}')
        x, y, w, h = (number(node[k]) for k in ('x', 'y', 'w', 'h'))
        if min(w, h) <= 0 or min(x, y) < 0 or x+w > width or y+h > height:
            raise ValueError(f'Node outside canvas or empty: {nid}')
        for key in ('fill', 'stroke', 'color'):
            if key in node:
                color(node[key])
        if number(node.get('size', 16)) <= 0 or number(node.get('radius', 10)) < 0:
            raise ValueError(f'Invalid font size or radius: {nid}')
        if node.get('weight', 700) not in (400, 700) or not isinstance(node.get('label', ''), str):
            raise ValueError(f'Invalid weight or label: {nid}')
    for edge in data.get('edges', []):
        for key in ('source', 'target'):
            if edge[key] not in ids:
                raise ValueError(f'Unknown endpoint: {edge[key]}')
        points = edge['points']
        if len(points) < 2:
            raise ValueError('An edge needs at least two points')
        for p in points:
            if len(p) != 2 or not (0 <= number(p[0]) <= width and 0 <= number(p[1]) <= height):
                raise ValueError(f'Edge point outside canvas: {p}')
        for key, p in (('source', points[0]), ('target', points[-1])):
            n = ids[edge[key]]
            x, y = p
            on_border = ((abs(x-n['x']) < 0.01 or abs(x-n['x']-n['w']) < 0.01) and n['y'] <= y <= n['y']+n['h']) or ((abs(y-n['y']) < 0.01 or abs(y-n['y']-n['h']) < 0.01) and n['x'] <= x <= n['x']+n['w'])
            if not on_border:
                raise ValueError(f'Edge endpoint must touch {key} boundary: {edge[key]}')
        color(edge.get('color', '#5d6978'))
        if edge.get('label'):
            if not isinstance(edge['label'], str):
                raise ValueError('Edge label must be a string')
            if not (0 <= number(edge['label_x']) <= width and 0 <= number(edge['label_y']) <= height):
                raise ValueError('Edge label outside canvas')
    return ids


def element(container, tag, **attrs):
    return ET.SubElement(container, tag, {k: str(v) for k, v in attrs.items()})


def styles(n):
    group, text = n['kind'] == 'group', n['kind'] == 'text'
    return dict(fill=n.get('fill', 'none' if text else '#ffffff' if group else '#eaf3ff'),
                stroke=n.get('stroke', 'none' if text else '#d8dee8' if group else '#91b6e5'),
                color=n.get('color', '#172033'), size=n.get('size', 23 if group else 16),
                weight=n.get('weight', 700), radius=n.get('radius', 18 if group else 10),
                shadow=n.get('shadow', n['kind'] == 'card'))


def render(data):
    ids = validate(data)
    w, h = data['width'], data['height']
    bg = data.get('background', '#f5f7fa')
    font = data.get('font', 'Arial, Helvetica, sans-serif')
    mx = ET.Element('mxfile', host='app.diagrams.net')
    diagram = element(mx, 'diagram', id='architecture', name='Architecture')
    model = element(diagram, 'mxGraphModel', page='1', pageScale='1', pageWidth=w, pageHeight=h, background=bg, grid='1', gridSize='10')
    root = element(model, 'root')
    element(root, 'mxCell', id='0')
    element(root, 'mxCell', id='1', parent='0')
    svg = ET.Element('svg', xmlns='http://www.w3.org/2000/svg', width=str(w), height=str(h), viewBox=f'0 0 {w} {h}')
    defs = element(svg, 'defs')
    filt = element(defs, 'filter', id='shadow', x='-30%', y='-50%', width='160%', height='200%')
    element(filt, 'feDropShadow', dx=0, dy=3, stdDeviation=5, **{'flood-color': '#172033', 'flood-opacity': '0.10'})
    element(svg, 'rect', x=0, y=0, width=w, height=h, fill=bg)

    def add_node(n):
        s = styles(n)
        is_text = n['kind'] == 'text'
        style = f"rounded=1;absoluteArcSize=1;arcSize={s['radius']*2};whiteSpace=wrap;html=0;fillColor={s['fill']};strokeColor={s['stroke']};strokeWidth=1.5;fontColor={s['color']};fontSize={s['size']};fontStyle={1 if s['weight']==700 else 0};fontFamily={font};align={n.get('align', 'center')};verticalAlign=middle;shadow={int(s['shadow'])};"
        if n.get('shape') == 'ellipse':
            style = 'shape=ellipse;perimeter=ellipsePerimeter;' + style
        # Separate group header cells keep text geometry shared across formats.
        cell = element(root, 'mxCell', id=n['id'], value='' if n['kind']=='group' else n.get('label', ''), style=style, vertex='1', parent='1')
        element(cell, 'mxGeometry', x=n['x'], y=n['y'], width=n['w'], height=n['h'], **{'as': 'geometry'})
        if not is_text:
            attrs = dict(x=n['x'], y=n['y'], width=n['w'], height=n['h'], rx=s['radius'], fill=s['fill'], stroke=s['stroke'], **{'stroke-width': 1.5})
            if s['shadow']:
                attrs['filter'] = 'url(#shadow)'
            if n.get('shape') == 'ellipse':
                attrs = dict(cx=n['x']+n['w']/2, cy=n['y']+n['h']/2, rx=n['w']/2, ry=n['h']/2, fill=s['fill'], stroke=s['stroke'], **{'stroke-width': 1.5})
                element(svg, 'ellipse', **attrs)
            else:
                element(svg, 'rect', **attrs)
        label = n.get('label', '')
        if label:
            lines = label.split('\n')
            cy = n['y']+30 if n['kind']=='group' else n['y']+n['h']/2
            if n['kind']=='group':
                header = element(root, 'mxCell', id='__header_'+n['id'], value=label, style=f'text;html=0;align=center;verticalAlign=middle;fontFamily={font};fontSize={s["size"]};fontStyle={1 if s["weight"]==700 else 0};fontColor={s["color"]};', vertex='1', parent='1')
                element(header, 'mxGeometry', x=n['x'], y=cy-20, width=n['w'], height=40, **{'as':'geometry'})
            for i, line in enumerate(lines):
                text = element(svg, 'text', x=n['x'] if n.get('align') == 'left' else n['x']+n['w']/2, y=cy+(i-(len(lines)-1)/2)*s['size']*1.25, fill=s['color'], **{'font-family':font, 'font-size':s['size'], 'font-weight':s['weight'], 'text-anchor':'start' if n.get('align') == 'left' else 'middle', 'dominant-baseline':'central'})
                text.text = line

    for n in data['nodes']:
        if n['kind']=='group':
            add_node(n)
    for i, e in enumerate(data.get('edges', [])):
        ec = e.get('color', '#5d6978')
        pts = e['points']
        arrow = e.get('arrow', True)
        if arrow:
            marker = element(defs, 'marker', id=f'arrow{i}', viewBox='0 0 10 10', refX=10, refY=5, markerWidth=7, markerHeight=7, orient='auto-start-reverse')
            element(marker, 'path', d='M 0 0 L 10 5 L 0 10 z', fill=ec)
        poly = element(svg, 'polyline', points=' '.join(f'{x},{y}' for x,y in pts), fill='none', stroke=ec, **{'stroke-width':1.5})
        if arrow:
            poly.set('marker-end', f'url(#arrow{i})')
        a, b = ids[e['source']], ids[e['target']]
        style = f"edgeStyle=none;rounded=0;strokeColor={ec};strokeWidth=1.5;endArrow={'block' if arrow else 'none'};endFill=1;exitX={(pts[0][0]-a['x'])/a['w']};exitY={(pts[0][1]-a['y'])/a['h']};exitPerimeter=0;entryX={(pts[-1][0]-b['x'])/b['w']};entryY={(pts[-1][1]-b['y'])/b['h']};entryPerimeter=0;"
        cell = element(root, 'mxCell', id=f'__edge{i}', style=style, edge='1', parent='1', source=e['source'], target=e['target'])
        geom = element(cell, 'mxGeometry', relative='1', **{'as':'geometry'})
        arr = element(geom, 'Array', **{'as':'points'})
        for x,y in pts[1:-1]:
            element(arr, 'mxPoint', x=x, y=y)
        if e.get('label'):
            label = e['label']
            # Editable explicit label node; width is approximate, requiring visual QA.
            lw = max(48, len(label)*9+20)
            add_node(dict(id=f'__label{i}', kind='text', x=e['label_x']-lw/2, y=e['label_y']-14, w=lw, h=28, label=label, fill=bg, size=14, weight=400))
            # SVG text nodes have no rectangle by default; insert a mask below it.
            mask = ET.Element('rect', x=str(e['label_x']-lw/2), y=str(e['label_y']-14), width=str(lw), height='28', fill=bg)
            svg.insert(len(svg)-1, mask)
    for n in data['nodes']:
        if n['kind']!='group':
            add_node(n)
    xml = ET.tostring(mx, encoding='unicode')
    svg.set('content', xml)
    return xml, ET.tostring(svg, encoding='unicode')


# Match semantic node roles in light and dark palettes; keep draw.io editable.
DARK_COLORS = {
    '#ffffff': '#171819', '#f7f5f2': '#242424', '#e7eff6': '#27333e',
    '#cbdde9': '#35485b', '#edf2e9': '#29332a', '#f4e7cb': '#51452e',
    '#23201e': '#ece9e4', '#8f8a84': '#aaa49c', '#799ab8': '#7f9db7',
    '#527b9c': '#a2b8ce', '#8fa580': '#91a786', '#b5873a': '#bf9c55',
    '#aaa49c': '#77716a', '#e6e1da': '#383838',
    '#f7f8f9': '#242424', '#edf3f8': '#27333e', '#eef3eb': '#29332a',
    '#f7f0e4': '#51452e', '#c8cdd1': '#696d71', '#a0b797': '#91a786',
    '#bfa878': '#bf9c55', '#9cb6cd': '#7f9db7', '#667079': '#b3b8bf',
    '#232b31': '#ece9e4',
}


def themed_svg(source, theme=None):
    svg = ET.fromstring(source)
    if theme:
        svg.set('data-theme', theme)
    colors = {}
    for item in svg.iter():
        for key in ('fill', 'stroke'):
            color = item.get(key, '')
            if color.startswith('#'):
                name = colors.setdefault(color, f'--paint-{len(colors)}')
                item.set(key, f'var({name}, {color})')
    light = ';'.join(f'{name}:{color}' for color,name in colors.items())
    dark = ';'.join(f'{name}:{DARK_COLORS.get(color, color)}' for color,name in colors.items())
    style = ET.Element('{http://www.w3.org/2000/svg}style')
    style.text = (':root{color-scheme:light dark;' + light + '}'
                  '@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){' + dark + '}}'
                  ':root[data-theme="dark"]{' + dark + '}')
    svg.insert(0, style)
    return ET.tostring(svg, encoding='unicode')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('layout', type=Path)
    parser.add_argument('--output', required=True, type=Path, help='Output prefix, without extension')
    args = parser.parse_args()
    try:
        xml, svg = render(json.loads(args.layout.read_text()))
    except (ValueError, KeyError, TypeError) as exc:
        parser.error(str(exc))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    for suffix, content in (('.drawio', xml), ('.svg', themed_svg(svg)), ('.light.svg', themed_svg(svg, 'light')), ('.dark.svg', themed_svg(svg, 'dark'))):
        path = Path(str(args.output)+suffix)
        path.write_text('<?xml version="1.0" encoding="UTF-8"?>\n'+content+'\n')
        print(path)
    print('PASS: structural validation. Visual inspection still required.')


if __name__ == '__main__':
    main()
