import test from 'node:test';
import assert from 'node:assert/strict';
import { explorerModels,makeBlockGraph,makeExpertGraph,makeComponentGraph } from '../src/data/model-explorer.mjs';
function validate(graph){
  const ids=graph.nodes.map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
  for(const edge of graph.edges){assert(ids.includes(edge.from),edge.from);assert(ids.includes(edge.to),edge.to);}
  const indegree=new Map(ids.map(id=>[id,0]));for(const e of graph.edges)indegree.set(e.to,indegree.get(e.to)+1);
  const queue=ids.filter(id=>indegree.get(id)===0);let seen=0;
  while(queue.length){const id=queue.shift();seen++;for(const e of graph.edges.filter(e=>e.from===id)){indegree.set(e.to,indegree.get(e.to)-1);if(indegree.get(e.to)===0)queue.push(e.to);}}
  assert.equal(seen,ids.length,'operator graph must be acyclic');
}
test('five source-linked models have complete component edges and expandable operator graphs',()=>{
 assert.deepEqual(explorerModels.map(m=>m.id),['qwen2','qwen2-5-vl','qwen3-tts','qwen3-omni','minimax-h3']);
 for(const model of explorerModels){assert(model.model?.sources.length);const ids=model.modules.map(m=>m.id);assert.equal(new Set(ids).size,ids.length);for(const [from,to] of model.edges){assert(ids.includes(from));assert(ids.includes(to));}for(const module of model.modules){validate(module.layers?makeBlockGraph(module):makeComponentGraph(module,model.id));if(module.experts){validate(makeExpertGraph(module));if(module.shared)validate(makeExpertGraph(module,true));}}}
});
test('attention and modality variants preserve checkpoint differences',()=>{
 const get=(model,id)=>explorerModels.find(m=>m.id===model).modules.find(m=>m.id===id);
 const qwen=makeBlockGraph(get('qwen2','decoder'));assert(!qwen.nodes.some(n=>n.id==='qnorm'));assert.equal(qwen.nodes.find(n=>n.id==='k').shape,'[N, 512]');assert(qwen.nodes.some(n=>n.name==='GQA'));
 const vision=get('qwen2-5-vl','vision');assert.equal(makeBlockGraph(vision,7).nodes.find(n=>n.id==='attention').name,'Full spatial MHA');assert.equal(makeBlockGraph(vision,6).nodes.find(n=>n.id==='attention').name,'Window MHA');
 const thinker=makeBlockGraph(get('qwen3-omni','thinker')),talker=makeBlockGraph(get('qwen3-omni','talker'));assert(!thinker.nodes.some(n=>n.id==='shared'));assert(talker.nodes.some(n=>n.id==='shared'));assert(thinker.nodes.some(n=>n.name==='Top-8'));assert(talker.nodes.some(n=>n.name==='Top-6'));
 const h3=makeBlockGraph(get('minimax-h3','dit'));assert(h3.nodes.some(n=>n.name==='MHA'));assert(h3.nodes.some(n=>n.id==='attnmul'));assert(h3.nodes.some(n=>n.id==='ffmul'));assert.equal(get('qwen3-tts','predictor').layers,5);
});

import { readFileSync } from 'node:fs';
test('repeated modules match the recorded checkpoint configs',()=>{
 const read=file=>JSON.parse(readFileSync(new URL(`../src/data/checkpoints/${file}`,import.meta.url)));
 const tts=read('tts.json').config.talker_config,omni=read('omni.json').config,h3=read('minimax-h3-FL2VA_transformer_config.json');
 const specs=[['qwen3-tts','talker',tts],['qwen3-tts','predictor',tts.code_predictor_config],['qwen3-omni','thinker',omni.thinker_config.text_config],['qwen3-omni','talker',omni.talker_config.text_config],['qwen3-omni','predictor',omni.talker_config.code_predictor_config],['minimax-h3','dit',h3]];
 for(const [model,id,config] of specs){const module=explorerModels.find(m=>m.id===model).modules.find(m=>m.id===id);assert.equal(module.layers,config.num_hidden_layers||config.num_layers);assert.equal(module.d,config.hidden_size);assert.equal(module.h,config.num_attention_heads);assert.equal(module.hd,config.head_dim||config.attention_head_dim);if(config.num_key_value_heads)assert.equal(module.kv,config.num_key_value_heads);if(config.num_experts){assert.equal(module.experts,config.num_experts);assert.equal(module.topk,config.num_experts_per_tok);}}
});
