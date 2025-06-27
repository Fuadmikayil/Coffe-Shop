//login
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    // 1) Email/Parol ilə daxil ol
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg(error.message)
      return
    }

    // 2) “profiles” cədvəlindən admin yoxla
    const uid = data.user.id
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', uid)
      .single()

    if (pErr || !profile?.is_admin) {
      setMsg('Bu hesab admin deyil.')
      await supabase.auth.signOut()
      return
    }

    // 3) Hər şey yaxşıdırsa admin panelə keç
    router.replace('/admin')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl mb-4">Admin Girişi</h1>
      {msg && <p className="text-red-600 mb-2">{msg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Parol"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Daxil ol
        </button>
      </form>
    </div>
  )
}