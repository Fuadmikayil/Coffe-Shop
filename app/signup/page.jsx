//SignUp
'use client'
import { useState } from 'react'
import supabase from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function handleSignUp(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) {
      setMsg(error.message)
    } else {
      setMsg('Uğurla qeydiyyat olundu! İndi login edə bilərsiniz.')
      // İstəsən avtomatik /login-ə yönləndir
      router.push('/login')
    }
  }

  return (
    <form onSubmit={handleSignUp} className="max-w-sm mx-auto p-4">
      {msg && <p className="mb-2 text-red-600">{msg}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full border p-2 rounded mb-2"
        required
      />
      <input
        type="password"
        placeholder="Parol"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full border p-2 rounded mb-4"
        required
      />
      <button type="submit" className="w-full cursor-pointer bg-blue-600 text-white p-2 rounded">
        Qeydiyyatdan keç
      </button>
    </form>
  )
}