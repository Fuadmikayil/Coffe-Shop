// app/page.jsx (or your user panel file)
'use client'

import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'
import Image from 'next/image'

export default function HomePage() {
  const [coffees, setCoffees] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [activeCat, setActiveCat] = useState('All')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const [selected, setSelected] = useState(null)
  const [size, setSize] = useState(null)
  const [extras, setExtras] = useState({})

  const [sizeOptions, setSizeOptions] = useState([])
  const [extraOptions, setExtraOptions] = useState([])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      // MODIFIED: Changed ordering to show oldest categories first, new ones last.
      const { data: coffeesData, error: cErr } = await supabase.from('coffees').select('*').order('created_at', { ascending: true })
      if (cErr) return setError('Coffees yüklənmədi.'), setLoading(false)
      
      setCoffees(coffeesData)
      setCategories(['All', ...new Set(coffeesData.map(c => c.category || 'Uncategorized'))])

      const { data: sizesData, error: sErr } = await supabase.from('sizes').select('key,label,factor').order('sort_order')
      if (sErr) return setError('Sizes yüklənmədi.'), setLoading(false)
      setSizeOptions(sizesData)

      const { data: extrasData, error: eErr } = await supabase.from('extras').select('name,price').order('sort_order')
      if (eErr) return setError('Extras yüklənmədi.'), setLoading(false)
      setExtraOptions(extrasData)

      const { data: logoData } = supabase.storage.from('coffee-images').getPublicUrl('LogoCoffe.svg')
      setLogoUrl(logoData.publicUrl)

      setLoading(false)
    }
    loadAll()
  }, [])

  const filtered = coffees.filter(c => {
    const okCat = activeCat === 'All' || (c.category || 'Uncategorized') === activeCat
    const okSearch = c.name.toLowerCase().includes(search.trim().toLowerCase())
    return okCat && okSearch
  })

  function getTotal() {
    if (!selected || size === null) return '0.00'
    const base = Number(selected.price) || 0
    const factor = sizeOptions.find(s => s.key === size)?.factor || 1
    const extraSum = extraOptions.reduce((sum, ex) => sum + (extras[ex.name] ? Number(ex.price) : 0), 0)
    return (base * factor + extraSum).toFixed(2)
  }

  if (loading) return <p className="p-6 text-center">Yüklənir…</p>
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-4">
      <header className="flex justify-between items-center max-w-5xl mx-auto mb-6">
        <div className="flex items-center space-x-3">
          {logoUrl && <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full shadow" />}
          <h1 className="text-3xl font-extrabold text-amber-900">MENU</h1>
        </div>
        <button onClick={() => setShowSearch(v => !v)} className="p-2 hover:bg-amber-100 rounded-full">
          <svg className="w-6 h-6 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </button>
      </header>

      {showSearch && (
        <div className="max-w-2xl mx-auto mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for coffee..."
            className="w-full px-5 py-3 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>
      )}

      <div className="flex justify-center space-x-3 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold shadow transition ${
              cat === activeCat ? 'bg-amber-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filtered.length > 0 ? filtered.map(c => (
          <div
            key={c.id}
            onClick={() => { setSelected(c); setSize(sizeOptions[0]?.key ?? null); setExtras({}) }}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden cursor-pointer"
          >
            <div className="relative h-52">
              {c.image_url && (
                <Image src={c.image_url} alt={c.name} fill className="object-cover" />
              )}
            </div>
            <div className="p-4 text-center">
              <h3 className="text-lg font-bold text-gray-800">{c.name}</h3>
              <p className="text-amber-600 font-semibold">£{c.price}</p>
              <button className="mt-3 px-4 py-2 text-sm rounded-full bg-white border border-amber-800 text-amber-800 hover:bg-amber-800 hover:text-white transition">
                SELECT OPTIONS
              </button>
            </div>
          </div>
        )) : (
          <p className="text-center col-span-full text-gray-500">Heç bir nəticə tapılmadı.</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-amber-800">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-2xl">×</button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Size:</h3>
              <div className="flex space-x-2">
                {sizeOptions.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSize(s.key)}
                    className={`px-3 py-1 rounded-full transition text-sm ${
                      size === s.key ? 'bg-amber-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Extras:</h3>
              <div className="space-y-2">
                {extraOptions.map(ex => (
                  <label key={ex.name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!extras[ex.name]}
                      onChange={() => setExtras(prev => ({ ...prev, [ex.name]: !prev[ex.name] }))}
                      className="accent-amber-700"
                    />
                    <span>{ex.name} (+£{Number(ex.price).toFixed(2)})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <p className="text-lg font-bold text-amber-800">Total: £{getTotal()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}