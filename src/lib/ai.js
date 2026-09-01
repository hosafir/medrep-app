/* ─── Providers ─── */
export const PROVIDERS={gemini:{id:"gemini",name:"Google Gemini",icon:"✦",color:"#4285f4",models:["gemini-2.5-flash","gemini-1.5-flash"],defaultModel:"gemini-2.5-flash",detect:k=>k.startsWith("AIza")},openai:{id:"openai",name:"OpenAI",icon:"◐",color:"#10a37f",models:["gpt-4o-mini","gpt-4o","gpt-3.5-turbo"],defaultModel:"gpt-4o-mini",detect:k=>k.startsWith("sk-")&&!k.startsWith("sk-ant-")},anthropic:{id:"anthropic",name:"Anthropic",icon:"◈",color:"#d97706",models:["claude-3-5-sonnet-20241022","claude-3-haiku-20240307"],defaultModel:"claude-3-5-sonnet-20241022",detect:k=>k.startsWith("sk-ant-")},groq:{id:"groq",name:"Groq",icon:"⚡",color:"#f55036",models:["llama-3.3-70b-versatile","llama-3.1-8b-instant"],defaultModel:"llama-3.3-70b-versatile",detect:k=>k.startsWith("gsk_")},openrouter:{id:"openrouter",name:"OpenRouter",icon:"🔀",color:"#6366f1",models:["google/gemini-1.5-flash","openai/gpt-4o-mini"],defaultModel:"google/gemini-1.5-flash",detect:k=>k.startsWith("sk-or-")}};
export function detectProvider(apiKey){if(!apiKey)return null;const key=apiKey.trim();for(const id of["anthropic","groq","openrouter","gemini","openai"])if(PROVIDERS[id]?.detect?.(key))return PROVIDERS[id];if(key.startsWith("sk-"))return PROVIDERS.openai;return null;}
export const SYS_PROMPT = `Tu es un assistant personnel IA expert pour un Délégué Médical (Visiteur Médical). Ton rôle est polyvalent :
1. **Expertise Terrain** : Aide à la préparation de visites, l'argumentation produit, la gestion des objections et la négociation.
2. **Gestion Administrative** : Aide à la rédaction de comptes-rendus, d'emails professionnels, de rapports d'activité et au suivi des objectifs.
3. **Stratégie Commerciale** : Analyse de territoire, segmentation de clientèle, priorisation des visites.
4. **Support Scientifique** : Simplification d'études cliniques, explication de mécanismes d'action (adapté au produit du délégué).
5. **Soft Skills** : Coaching en communication, gestion du stress, confiance en soi.

Tu réponds toujours en français, de manière structurée, professionnelle et opérationnelle. Tu t'adaptes à la spécialité médicale et au produit du délégué (configurés par l'utilisateur).`;

export async function callGemini(prompt, apiKey, model, sys, imageData){
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${model||"gemini-2.5-flash"}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const parts = [{text: prompt}];
  if(imageData?.image){
    parts.push({ inlineData: { mimeType: imageData.image.mimeType || "image/jpeg", data: imageData.image.base64 } });
  }
  const body = {
    system_instruction:{parts:[{text:sys}]},
    contents:[{role:"user", parts}],
    generationConfig:{temperature:0.6,maxOutputTokens:2048}
  };
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok){ let msg=`Erreur Gemini ${r.status}`; try{const e=await r.json(); msg=e?.error?.message||msg; }catch{ /* corps d'erreur non JSON */ } throw new Error(msg); }
  const d=await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text||"Pas de réponse.";
}

export async function callOpenAILike(url, prompt, apiKey, model, sys, imageData, extraHeaders={}){
  const content = [];
  content.push({ type: "text", text: prompt });
  if(imageData?.image){
    content.push({ type: "image_url", image_url: { url: `data:${imageData.image.mimeType};base64,${imageData.image.base64}` } });
  }
  const body = {
    model,
    messages:[{role:"system",content:sys},{role:"user", content}],
    temperature:0.6, max_tokens:1400
  };
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`,...extraHeaders},body:JSON.stringify(body)});
  if(!r.ok){ let msg=`Erreur HTTP ${r.status}`; try{const e=await r.json(); msg=e?.error?.message||msg; }catch{ /* corps d'erreur non JSON */ } throw new Error(msg); }
  const d=await r.json();
  return d?.choices?.[0]?.message?.content||"Pas de réponse.";
}

export async function callAnthropic(prompt, apiKey, model, sys, imageData){
  const content = [];
  content.push({ type: "text", text: prompt });
  if(imageData?.image){
    content.push({ type: "image", source: { type: "base64", media_type: imageData.image.mimeType, data: imageData.image.base64 } });
  }
  const body = {
    model, max_tokens:1400, temperature:0.6, system:sys,
    messages:[{role:"user", content}]
  };
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify(body)});
  if(!r.ok){ let msg=`Erreur Anthropic ${r.status}`; try{const e=await r.json(); msg=e?.error?.message||msg; }catch{ /* corps d'erreur non JSON */ } throw new Error(msg); }
  const d=await r.json();
  return d?.content?.map(x=>x?.text||"").join("\n").trim()||"Pas de réponse.";
}

export async function callLLM(prompt, apiKey, provider, model, sys=SYS_PROMPT, imageData=null){
  const p=provider||detectProvider(apiKey);
  if(!p)throw new Error("Provider non reconnu.");
  const m=model||p.defaultModel;
  
  if(p.id==="gemini") return callGemini(prompt, apiKey, m, sys, imageData);
  if(p.id==="anthropic") return callAnthropic(prompt, apiKey, m, sys, imageData);
  
  const urls={openai:"https://api.openai.com/v1/chat/completions", groq:"https://api.groq.com/openai/v1/chat/completions", openrouter:"https://openrouter.ai/api/v1/chat/completions"};
  if(!urls[p.id])throw new Error(`Provider ${p.name} non supporté.`);
  const extra=p.id==="openrouter"?{"HTTP-Referer":window?.location?.origin||"","X-Title":"MedRep AI"}:{};
  return callOpenAILike(urls[p.id], prompt, apiKey, m, sys, imageData, extra);
}
