'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../lib/supabase'
import { Coffee, KeyRound, LogIn, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    // 1) Email/Parol ilə daxil ol
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg(error.message)
      setLoading(false)
      return
    }

    // 2) "profiles" cədvəlindən admin yoxla
    const uid = data.user.id
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', uid)
      .single()

    if (pErr || !profile?.is_admin) {
      setMsg('Bu hesab admin deyil və ya girişdə xəta baş verdi.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // 3) Hər şey yaxşıdırsa admin panelə keç
    router.replace('/admin')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-amber-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-amber-100">
        
        {/* Başlıq */}
        <div className="text-center">
          <Coffee className="mx-auto h-12 w-12 text-amber-800" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Admin Panelə Giriş
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Davam etmək üçün hesab məlumatlarınızı daxil edin.
          </p>
        </div>

        {/* Xəta mesajı */}
        {msg && (
          <div className="flex items-center gap-3 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <AlertTriangle size={20} />
            <span className="text-sm">{msg}</span>
          </div>
        )}

        {/* Forma */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="peer w-full border border-gray-300 p-4 rounded-xl placeholder-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <label 
              htmlFor="email" 
              className="absolute left-4 -top-3.5 text-gray-600 text-sm bg-white px-1 transition-all 
                         peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 
                         peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
            >
              Email Adresiniz
            </label>
          </div>

          {/* Parol Input */}
          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="Parol"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="peer w-full border border-gray-300 p-4 rounded-xl placeholder-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <label 
              htmlFor="password" 
              className="absolute left-4 -top-3.5 text-gray-600 text-sm bg-white px-1 transition-all 
                         peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 
                         peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
            >
              Parol
            </label>
          </div>

          {/* Daxil ol düyməsi */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-amber-800 text-white p-3 rounded-xl font-semibold hover:bg-amber-900 transition-all duration-300 disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yoxlanılır...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Daxil ol
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}