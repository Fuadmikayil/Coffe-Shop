//admin
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  // Coffees
  const [coffees, setCoffees] = useState([])
  const [coffeeForm, setCoffeeForm] = useState({
    id: null,
    name: '',
    category: '',
    price: '',
    calories: '',
    description: '',
    image_url: ''
  })
  const [coffeeFile, setCoffeeFile] = useState(null)
  const [removeCoffeeImage, setRemoveCoffeeImage] = useState(false)

  // Sizes
  const [sizes, setSizes] = useState([])
  const [sizeForm, setSizeForm] = useState({
    key: '',
    label: '',
    factor: 1,
    sort_order: 0,
    isEdit: false
  })

  // Extras
  const [extras, setExtras] = useState([])
  const [extraForm, setExtraForm] = useState({
    name: '',
    price: 0,
    sort_order: 0,
    isEdit: false
  })

  // — Protect route & initial load
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.replace('/login')

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()
      if (!profile?.is_admin) return router.replace('/login')

      await loadAll()
      setLoading(false)
    }

    init()

    // watch for token expiration
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!session) router.replace('/login')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  // — Load all three tables
  async function loadAll() {
    const [cRes, sRes, eRes] = await Promise.all([
      supabase.from('coffees').select('*').order('name', { ascending: true }),
      supabase.from('sizes').select('*').order('sort_order', { ascending: true }),
      supabase.from('extras').select('*').order('sort_order', { ascending: true }),
    ])
    if (!cRes.error) setCoffees(cRes.data)
    if (!sRes.error) setSizes(sRes.data)
    if (!eRes.error) setExtras(eRes.data)
  }


  // — Helpers: re-check session on every action
  async function requireSession() {
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sessiya vaxtı keçib, lütfən yenidən daxil olun.')
  }

  // ---------- Coffee CRUD ----------

  const handleCoffeeFile = e => {
    setCoffeeFile(e.target.files?.[0] || null)
    if (e.target.files?.[0]) setRemoveCoffeeImage(false)
  }

  function resetCoffeeForm() {
    setCoffeeForm({
      id: null, name: '', category: '', price: '',
      calories: '', description: '', image_url: ''
    })
    setCoffeeFile(null)
    setRemoveCoffeeImage(false)
    setMsg('')
  }

  async function submitCoffee(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      await requireSession()

      let image_url = coffeeForm.image_url
      if (removeCoffeeImage && !coffeeFile) image_url = ''

      if (coffeeFile) {
        const fileName = `${Date.now()}_${coffeeFile.name}`
        const { data: up, error: upErr } = await supabase
          .storage.from('coffee-images').upload(fileName, coffeeFile)
        if (upErr) throw upErr
        const { data: url } = supabase
          .storage.from('coffee-images').getPublicUrl(up.path)
        image_url = url.publicUrl
      }
      
      // Capitalize the category
      const categoryRaw = coffeeForm.category.trim()
      const categoryFormatted = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1).toLowerCase()

      const payload = {
        name: coffeeForm.name.trim(),
        category: categoryFormatted, // Use the formatted category
        price: parseFloat(coffeeForm.price),
        calories: parseInt(coffeeForm.calories, 10),
        description: coffeeForm.description.trim(),
        image_url
      }

      if (coffeeForm.id) {
        await supabase.from('coffees').update(payload).eq('id', coffeeForm.id)
        setMsg('Coffee güncəlləndi!')
      } else {
        await supabase.from('coffees').insert([payload])
        setMsg('Coffee əlavə olundu!')
      }

      await loadAll()
      resetCoffeeForm()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  function editCoffee(c) {
    setCoffeeForm({
      ...c,
      price: c.price.toString(),
      calories: c.calories.toString(),
      image_url: c.image_url || ''
    })
    setCoffeeFile(null)
    setRemoveCoffeeImage(false)
  }

  async function deleteCoffee(id) {
    if (!confirm('Coffee silinsin?')) return
    setLoading(true)
    try {
      await requireSession()
      await supabase.from('coffees').delete().eq('id', id)
      setMsg('Coffee silindi.')
      await loadAll()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---------- Size CRUD ----------

  async function submitSize(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      await requireSession()

      if (sizeForm.isEdit) {
        await supabase.from('sizes')
          .update({
            label: sizeForm.label,
            factor: parseFloat(sizeForm.factor),
            sort_order: parseInt(sizeForm.sort_order, 10)
          })
          .eq('key', sizeForm.key)
        setMsg('Size güncəlləndi!')
      } else {
        await supabase.from('sizes').insert([{
          key: sizeForm.key.trim(),
          label: sizeForm.label.trim(),
          factor: parseFloat(sizeForm.factor),
          sort_order: parseInt(sizeForm.sort_order, 10)
        }])
        setMsg('Size əlavə olundu!')
      }

      await loadAll()
      setSizeForm({ key:'', label:'', factor:1, sort_order:0, isEdit:false })
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  function editSize(s) {
    setSizeForm({ ...s, isEdit: true })
  }

  async function deleteSize(key) {
    if (!confirm('Size silinsin?')) return
    setLoading(true)
    try {
      await requireSession()
      await supabase.from('sizes').delete().eq('key', key)
      setMsg('Size silindi.')
      await loadAll()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---------- Extra CRUD ----------

  async function submitExtra(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      await requireSession()

      if (extraForm.isEdit) {
        await supabase.from('extras')
          .update({
            price: parseFloat(extraForm.price),
            sort_order: parseInt(extraForm.sort_order, 10)
          })
          .eq('name', extraForm.name)
        setMsg('Extra güncəlləndi!')
      } else {
        await supabase.from('extras').insert([{
          name: extraForm.name.trim(),
          price: parseFloat(extraForm.price),
          sort_order: parseInt(extraForm.sort_order, 10)
        }])
        setMsg('Extra əlavə olundu!')
      }

      await loadAll()
      setExtraForm({ name:'', price:0, sort_order:0, isEdit:false })
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  function editExtra(x) {
    setExtraForm({ ...x, isEdit: true })
  }

  async function deleteExtra(name) {
    if (!confirm('Extra silinsin?')) return
    setLoading(true)
    try {
      await requireSession()
      await supabase.from('extras').delete().eq('name', name)
      setMsg('Extra silindi.')
      await loadAll()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const inputStyles = "block w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm";
  
  if (loading) return (
      <div className="bg-[#F4F1ED] min-h-screen flex items-center justify-center">
          <p className="text-center text-lg text-gray-700">Yüklənir…</p>
      </div>
  )

  // Get unique categories for the datalist
  const uniqueCategories = [...new Set(coffees.map(c => c.category))].sort();

  return (
    <div className="bg-[#F4F1ED] min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 tracking-wider">Admin Panel</h1>
            <p className="text-gray-500 mt-1">Manage your coffee shop items</p>
        </header>

        {msg && <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg">{msg}</p>}

        {/* — Coffee Management Section */}
        <section className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-700">
                    {coffeeForm.id ? 'Edit Coffee' : 'Add New Coffee'}
                </h2>
                <button
                    className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                    onClick={async () => {
                        await supabase.auth.signOut()
                        router.replace('/login')
                    }}
                >
                    Çıxış
                </button>
            </div>

            <form onSubmit={submitCoffee} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input placeholder="Name" value={coffeeForm.name} onChange={e => setCoffeeForm(f => ({ ...f, name: e.target.value }))} className={inputStyles} required/>
                
                {/* MODIFIED: Category input with datalist */}
                <div>
                  <input
                    list="category-options"
                    placeholder="Category (e.g., Hot, Cold)"
                    value={coffeeForm.category}
                    onChange={e => setCoffeeForm(f => ({ ...f, category: e.target.value }))}
                    className={inputStyles}
                    required
                  />
                  <datalist id="category-options">
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                
                <input type="number" step="0.01" placeholder="Price" value={coffeeForm.price} onChange={e => setCoffeeForm(f => ({ ...f, price: e.target.value }))} className={inputStyles} required/>
                <input type="number" placeholder="Calories" value={coffeeForm.calories} onChange={e => setCoffeeForm(f => ({ ...f, calories: e.target.value }))} className={inputStyles} required/>
                
                <div className="md:col-span-2">
                    <textarea placeholder="Description" value={coffeeForm.description} onChange={e => setCoffeeForm(f => ({ ...f, description: e.target.value }))} className={`${inputStyles} h-24`} />
                </div>

                <div className="md:col-span-2">
                     <label className="block mb-2 text-sm font-medium text-gray-900">Coffee Image</label>
                     <input type="file" accept="image/*" onChange={handleCoffeeFile} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-700"/>
                </div>

                {coffeeForm.image_url && (
                    <div className="md:col-span-2 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <img src={coffeeForm.image_url} alt="Current" className="w-16 h-16 rounded-lg object-cover" />
                        <label className="flex items-center space-x-2 text-sm text-red-600">
                            <input type="checkbox" checked={removeCoffeeImage} onChange={e => setRemoveCoffeeImage(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"/>
                            <span>Şəkli sil</span>
                        </label>
                    </div>
                )}

                <div className="md:col-span-2 flex gap-4 mt-2">
                    <button type="submit" disabled={loading} className="flex-1 bg-gray-800 text-white p-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50">
                        {coffeeForm.id ? 'Yenilə' : 'Əlavə et'}
                    </button>
                    {coffeeForm.id && (
                        <button type="button" onClick={resetCoffeeForm} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                            Ləğv et
                        </button>
                    )}
                </div>
            </form>
        </section>

        {/* — Coffee List */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coffees.map(c => (
                <li key={c.id} className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                    {c.image_url
                        ? <img src={c.image_url} alt={c.name} className="w-full h-48 object-cover" />
                        : <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                    }
                    <div className="p-4 text-center">
                        <p className="font-bold text-lg text-gray-800">{c.name}</p>
                        <p className="text-gray-500 text-sm">
                            {c.category} &middot; ${c.price} &middot; {c.calories} cal
                        </p>
                        <div className="mt-4 flex justify-center gap-2">
                            <button onClick={() => editCoffee(c)} className="text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 px-4 py-1 rounded-full">Edit</button>
                            <button onClick={() => deleteCoffee(c.id)} className="text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 px-4 py-1 rounded-full">Delete</button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>

        <div className="grid md:grid-cols-2 gap-8">
            {/* — Sizes Section */}
            <section className="bg-white p-6 rounded-2xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Manage Sizes</h2>
                <form onSubmit={submitSize} className="flex flex-wrap items-end gap-2 mb-4">
                    <div className="flex-1 min-w-[80px]"><label className="text-xs text-gray-500">Key</label><input placeholder="sm" value={sizeForm.key} onChange={e => setSizeForm(f => ({ ...f, key: e.target.value }))} className={inputStyles} disabled={sizeForm.isEdit} /></div>
                    <div className="flex-1 min-w-[80px]"><label className="text-xs text-gray-500">Label</label><input placeholder="Small" value={sizeForm.label} onChange={e => setSizeForm(f => ({ ...f, label: e.target.value }))} className={inputStyles} /></div>
                    <div className="w-20"><label className="text-xs text-gray-500">Factor</label><input type="number" step="0.1" value={sizeForm.factor} onChange={e => setSizeForm(f => ({ ...f, factor: e.target.value }))} className={inputStyles} /></div>
                    <div className="w-20"><label className="text-xs text-gray-500">Order</label><input type="number" value={sizeForm.sort_order} onChange={e => setSizeForm(f => ({ ...f, sort_order: e.target.value }))} className={inputStyles} /></div>
                    <button className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 h-[46px]">
                        {sizeForm.isEdit ? 'Save' : '+'}
                    </button>
                </form>
                <ul className="space-y-2">
                    {sizes.map(s => (
                        <li key={s.key} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                            <span className="text-gray-700">{s.key} &mdash; {s.label} (&times;{s.factor}) | Order: {s.sort_order}</span>
                            <div className="space-x-2">
                                <button onClick={() => editSize(s)} className="text-sm text-blue-600 font-medium">Edit</button>
                                <button onClick={() => deleteSize(s.key)} className="text-sm text-red-600 font-medium">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {/* — Extras Section */}
            <section className="bg-white p-6 rounded-2xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Manage Extras</h2>
                <form onSubmit={submitExtra} className="flex flex-wrap items-end gap-2 mb-4">
                    <div className="flex-1 min-w-[100px]"><label className="text-xs text-gray-500">Name</label><input placeholder="Extra Shot" value={extraForm.name} onChange={e => setExtraForm(f => ({ ...f, name: e.target.value }))} className={inputStyles} disabled={extraForm.isEdit} /></div>
                    <div className="w-24"><label className="text-xs text-gray-500">Price</label><input type="number" step="0.01" value={extraForm.price} onChange={e => setExtraForm(f => ({ ...f, price: e.target.value }))} className={inputStyles} /></div>
                    <div className="w-20"><label className="text-xs text-gray-500">Order</label><input type="number" value={extraForm.sort_order} onChange={e => setExtraForm(f => ({ ...f, sort_order: e.target.value }))} className={inputStyles} /></div>
                    <button className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 h-[46px]">
                        {extraForm.isEdit ? 'Save' : '+'}
                    </button>
                </form>
                <ul className="space-y-2">
                    {extras.map(x => (
                        <li key={x.name} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                            <span className="text-gray-700">{x.name} &mdash; ${x.price} | Order: {x.sort_order}</span>
                            <div className="space-x-2">
                                <button onClick={() => editExtra(x)} className="text-sm text-blue-600 font-medium">Edit</button>
                                <button onClick={() => deleteExtra(x.name)} className="text-sm text-red-600 font-medium">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
      </div>
    </div>
  )
}