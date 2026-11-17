import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
for (const [t,cols] of [['treinos','id,ordem'],['dieta_planos','id'],['dieta_refeicoes','id'],['dieta_checks','id'],['cardio_prescricoes','id'],['cardio_registros','id'],['progressao_exercicios','id'],['anamneses','id']]) {
  const { error } = await sb.from(t).select(cols).limit(1)
  console.log(t.padEnd(22), error ? 'ERRO: '+error.code+' '+error.message : 'ok')
}
