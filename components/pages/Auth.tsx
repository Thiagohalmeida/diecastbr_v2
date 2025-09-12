"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError("")
    const supabase = createClient()
    if (!supabase) { setError("Configuração do Supabase ausente."); setLoading(false); return }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message) } else { router.replace("/dashboard") }
    setLoading(false)
  }

  return (
    <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
      <form onSubmit={handleSubmit} style={{width:360, maxWidth:"100%", display:"grid", gap:12}}>
        <h1>Entrar</h1>
        <label>E‑mail</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required style={{padding:8, border:"1px solid #ccc", borderRadius:8}}/>
        <label>Senha</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={{padding:8, border:"1px solid #ccc", borderRadius:8}}/>
        <button disabled={loading} type="submit" style={{padding:10, borderRadius:8, background:"black", color:"white"}}>{loading?"Entrando...":"Entrar"}</button>
        {error && <p style={{color:"crimson"}}>{error}</p>}
      </form>
    </div>
  )
}
