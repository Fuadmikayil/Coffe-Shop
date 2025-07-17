'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../lib/supabase'
import { Plus, Edit3, Trash2, LogOut, UploadCloud, XCircle, Image as ImageIcon } from 'lucide-react'

// Main Component
export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // State for all data
  const [coffees, setCoffees] = useState([])
  const [sizes, setSizes] = useState([])
  const [extras, setExtras] = useState([])

  // State for forms
  const [coffeeForm, setCoffeeForm] = useState({ id: null, name: '', category: '', price: '', calories: '', description: '', image_url: '' })
  const [coffeeFile, setCoffeeFile] = useState(null)
  const [removeCoffeeImage, setRemoveCoffeeImage] = useState(false)
  const [sizeForm, setSizeForm] = useState({ key: '', label: '', factor: 1, sort_order: 0, isEdit: false })
  const [extraForm, setExtraForm] = useState({ name: '', price: 0, sort_order: 0, isEdit: false })

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

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!session) router.replace('/login')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  // — Data Loading
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

  // — Helpers
  async function requireSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sessiya vaxtı keçib, lütfən yenidən daxil olun.')
  }

  function showMessage(text, type = 'success', duration = 3000) {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), duration);
  }

  // ---------- Coffee CRUD ----------
  const handleCoffeeFile = e => {
    setCoffeeFile(e.target.files?.[0] || null)
    if (e.target.files?.[0]) setRemoveCoffeeImage(false)
  }

  function resetCoffeeForm() {
    setCoffeeForm({ id: null, name: '', category: '', price: '', calories: '', description: '', image_url: '' })
    setCoffeeFile(null)
    setRemoveCoffeeImage(false)
  }

  async function submitCoffee(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await requireSession()
      let image_url = coffeeForm.image_url
      if (removeCoffeeImage && !coffeeFile) image_url = ''
      if (coffeeFile) {
        const fileName = `${Date.now()}_${coffeeFile.name}`
        const { data: up, error: upErr } = await supabase.storage.from('coffee-images').upload(fileName, coffeeFile)
        if (upErr) throw upErr
        const { data: url } = supabase.storage.from('coffee-images').getPublicUrl(up.path)
        image_url = url.publicUrl
      }
      const categoryRaw = coffeeForm.category.trim()
      const categoryFormatted = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1).toLowerCase()
      const payload = {
        name: coffeeForm.name.trim(), category: categoryFormatted, price: parseFloat(coffeeForm.price),
        calories: parseInt(coffeeForm.calories, 10), description: coffeeForm.description.trim(), image_url
      }
      if (coffeeForm.id) {
        await supabase.from('coffees').update(payload).eq('id', coffeeForm.id)
        showMessage('Coffee güncəlləndi!')
      } else {
        await supabase.from('coffees').insert([payload])
        showMessage('Coffee əlavə olundu!')
      }
      await loadAll()
      resetCoffeeForm()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function editCoffee(c) {
    setCoffeeForm({ ...c, price: c.price.toString(), calories: c.calories.toString(), image_url: c.image_url || '' })
    setCoffeeFile(null)
    setRemoveCoffeeImage(false)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteCoffee(id) {
    if (!confirm('Bu coffee məhsulunu silməyə əminsiniz?')) return
    setLoading(true)
    try {
      await requireSession()
      await supabase.from('coffees').delete().eq('id', id)
      showMessage('Coffee silindi.')
      await loadAll()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Size CRUD ----------
  async function submitSize(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await requireSession()
      const payload = {
          label: sizeForm.label.trim(),
          factor: parseFloat(sizeForm.factor),
          sort_order: parseInt(sizeForm.sort_order, 10)
      }
      if (sizeForm.isEdit) {
        await supabase.from('sizes').update(payload).eq('key', sizeForm.key)
        showMessage('Ölçü güncəlləndi!')
      } else {
        await supabase.from('sizes').insert([{ ...payload, key: sizeForm.key.trim() }])
        showMessage('Ölçü əlavə olundu!')
      }
      await loadAll()
      setSizeForm({ key: '', label: '', factor: 1, sort_order: 0, isEdit: false })
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function editSize(s) {
    setSizeForm({ ...s, isEdit: true })
  }

  async function deleteSize(key) {
    if (!confirm('Bu ölçünü silməyə əminsiniz?')) return
    setLoading(true)
    try {
      await requireSession()
      await supabase.from('sizes').delete().eq('key', key)
      showMessage('Ölçü silindi.')
      await loadAll()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Extra CRUD ----------
  async function submitExtra(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await requireSession()
       const payload = {
            price: parseFloat(extraForm.price),
            sort_order: parseInt(extraForm.sort_order, 10)
        }
      if (extraForm.isEdit) {
        await supabase.from('extras').update(payload).eq('name', extraForm.name)
        showMessage('Əlavə güncəlləndi!')
      } else {
        await supabase.from('extras').insert([{...payload, name: extraForm.name.trim() }])
        showMessage('Əlavə yaradıldı!')
      }
      await loadAll()
      setExtraForm({ name: '', price: 0, sort_order: 0, isEdit: false })
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function editExtra(x) {
    setExtraForm({ ...x, isEdit: true })
  }

  async function deleteExtra(name) {
    if (!confirm('Bu əlavəni silməyə əminsiniz?')) return
    setLoading(true)
    try {
      await requireSession()
      await supabase.from('extras').delete().eq('name', name)
      showMessage('Əlavə silindi.')
      await loadAll()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  // Style Definitions
  const inputStyles = "block w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-shadow duration-200";
  const buttonStyles = "flex items-center justify-center gap-2 bg-amber-800 text-white p-3 rounded-xl font-semibold hover:bg-amber-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
  
  // Loading Spinner
  if (loading) return (
    <div className="bg-amber-50 min-h-screen flex flex-col items-center justify-center text-amber-800">
        <svg className="animate-spin h-10 w-10 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-center text-lg font-semibold tracking-wide">Məlumatlar yüklənir...</p>
    </div>
  )

  const uniqueCategories = [...new Set(coffees.map(c => c.category))].sort();

  return (
    <div className="bg-amber-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <header className="flex justify-between items-center mb-8 border-b-2 border-amber-100 pb-4">
            <div>
              <h1 className="text-4xl font-bold text-amber-900">Admin Panel ☕</h1>
              <p className="text-amber-700 mt-1">Coffee Shop məhsullarını buradan idarə edin.</p>
            </div>
            <button
                className="flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                onClick={async () => {
                    await supabase.auth.signOut()
                    router.replace('/login')
                }}
            >
                <LogOut size={16} />
                Çıxış
            </button>
        </header>

        {msg.text && (
             <div className={`text-center p-3 rounded-lg text-white ${msg.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                {msg.text}
             </div>
        )}

        {/* — Coffee Management Section */}
        <section className="bg-white/70 backdrop-blur-sm p-6 lg:p-8 rounded-2xl shadow-lg border border-amber-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
                {coffeeForm.id ? 'Coffee Məhsulunu Dəyiş' : 'Yeni Coffee Əlavə Et'}
            </h2>
            
            <form onSubmit={submitCoffee} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <input placeholder="Adı" value={coffeeForm.name} onChange={e => setCoffeeForm(f => ({ ...f, name: e.target.value }))} className={inputStyles} required/>
                
                <div>
                  <input list="category-options" placeholder="Kateqoriya (məs. Hot, Cold)" value={coffeeForm.category} onChange={e => setCoffeeForm(f => ({ ...f, category: e.target.value }))} className={inputStyles} required />
                  <datalist id="category-options">
                    {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
                
                {/* === DƏYİŞİKLİK BURADADIR (QIYMƏT) === */}
                <input 
                    type="text" // type="number" əvəzinə "text" istifadə edirik ki, tam nəzarət bizdə olsun
                    inputMode="decimal" // Mobil cihazlarda rəqəm klaviaturasını göstərir
                    placeholder="Qiymət (AZN)" 
                    value={coffeeForm.price} 
                    onChange={e => {
                        const val = e.target.value;
                        // Yalnız rəqəmlərə və bir nöqtəyə icazə veririk
                        if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                           setCoffeeForm(f => ({ ...f, price: val }))
                        }
                    }} 
                    className={inputStyles} 
                    required
                />

                {/* === DƏYİŞİKLİK BURADADIR (KALORİ) === */}
                <input 
                    type="text" // type="number" əvəzinə "text" istifadə edirik ki, tam nəzarət bizdə olsun
                    inputMode="numeric" // Mobil cihazlarda rəqəm klaviaturasını göstərir
                    placeholder="Kalori" 
                    value={coffeeForm.calories} 
                    onChange={e => {
                        const val = e.target.value;
                        // Yalnız rəqəmlərə icazə veririk (nöqtəyə yox)
                        if (/^[0-9]*$/.test(val)) {
                           setCoffeeForm(f => ({ ...f, calories: val }))
                        }
                    }} 
                    className={inputStyles} 
                    required
                />
                
                <div className="md:col-span-2">
                    <textarea placeholder="Təsvir" value={coffeeForm.description} onChange={e => setCoffeeForm(f => ({ ...f, description: e.target.value }))} className={`${inputStyles} h-28`} />
                </div>

                <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Məhsulun Şəkli</label>
                    <div className="relative">
                        <input id="file-upload" type="file" accept="image/*" onChange={handleCoffeeFile} className="hidden"/>
                        <label htmlFor="file-upload" className="flex items-center gap-4 w-full p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition-all">
                           <UploadCloud className="text-gray-500" />
                           <span className="text-gray-600">{coffeeFile ? coffeeFile.name : 'Şəkil seçin və ya sürüşdürüb bura atın'}</span>
                        </label>
                    </div>
                </div>

                {coffeeForm.image_url && (
                    <div className="md:col-span-2 flex items-center gap-4 p-3 bg-gray-50 rounded-xl border">
                        <img src={coffeeForm.image_url} alt="Current" className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                        <label className="flex items-center space-x-2 text-sm text-red-600 cursor-pointer">
                            <input type="checkbox" checked={removeCoffeeImage} onChange={e => setRemoveCoffeeImage(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"/>
                            <span>Mövcud şəkli sil</span>
                        </label>
                    </div>
                )}

                <div className="md:col-span-2 flex gap-4 mt-4">
                    <button type="submit" disabled={loading || !coffeeForm.name || !coffeeForm.category || !coffeeForm.price} className={buttonStyles}>
                        {coffeeForm.id ? 'Dəyişiklikləri Yadda Saxla' : 'Əlavə Et'}
                    </button>
                    {coffeeForm.id && (
                        <button type="button" onClick={resetCoffeeForm} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                            Ləğv et
                        </button>
                    )}
                </div>
            </form>
        </section>

        {/* The rest of the component remains the same */}
        {/* — Coffee List */}
        <section>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Mövcud Məhsullar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coffees.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl">
                    <div className="h-48 w-full overflow-hidden">
                        {c.image_url
                            ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            : <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center text-gray-400"><ImageIcon size={40} /><span className="mt-2 text-sm">Şəkil yoxdur</span></div>
                        }
                    </div>
                    <div className="p-5 text-center">
                        <p className="font-bold text-lg text-amber-900 truncate">{c.name}</p>
                        <p className="text-gray-500 text-sm mt-1">
                            {c.category} &middot; {c.price} AZN &middot; {c.calories} kal
                        </p>
                        <div className="mt-4 flex justify-center gap-3">
                            <button onClick={() => editCoffee(c)} className="flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-full transition-colors"><Edit3 size={14}/> Redaktə et</button>
                            <button onClick={() => deleteCoffee(c.id)} className="flex items-center gap-1 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-full transition-colors"><Trash2 size={14} /> Sil</button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
            {/* — Sizes Section and Extras Section (no changes needed here) */}
             {/* — Sizes Section */}
            <section className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-amber-100">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Ölçüləri İdarə Et</h2>
                <form onSubmit={submitSize} className="grid grid-cols-2 md:grid-cols-4 items-end gap-3 mb-6">
                    <div className="col-span-2 md:col-span-1"><label className="text-xs font-semibold text-gray-500">Açar</label><input placeholder="sm" value={sizeForm.key} onChange={e => setSizeForm(f => ({ ...f, key: e.target.value }))} className={inputStyles} disabled={sizeForm.isEdit} required/></div>
                    <div className="col-span-2 md:col-span-1"><label className="text-xs font-semibold text-gray-500">Ad</label><input placeholder="Kiçik" value={sizeForm.label} onChange={e => setSizeForm(f => ({ ...f, label: e.target.value }))} className={inputStyles} required/></div>
                    <div><label className="text-xs font-semibold text-gray-500">Faktor</label><input type="number" step="0.1" value={sizeForm.factor} onChange={e => setSizeForm(f => ({ ...f, factor: e.target.value }))} className={inputStyles} required/></div>
                    <div><label className="text-xs font-semibold text-gray-500">Sıra</label><input type="number" value={sizeForm.sort_order} onChange={e => setSizeForm(f => ({ ...f, sort_order: e.target.value }))} className={inputStyles} required/></div>
                    <button className="col-span-full bg-teal-600 text-white p-3 mt-2 rounded-lg font-semibold hover:bg-teal-700 h-full flex items-center justify-center gap-2 transition-colors">
                        {sizeForm.isEdit ? 'Yadda Saxla' : <><Plus size={18}/> Yeni Ölçü</>}
                    </button>
                </form>
                <ul className="space-y-2">
                    {sizes.map(s => (
                        <li key={s.key} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-gray-700 font-medium">{s.label} ({s.key}) &mdash; <span className="text-sm text-gray-500">Faktor: {s.factor} | Sıra: {s.sort_order}</span></span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => editSize(s)} className="text-sm text-blue-600 hover:text-blue-800 font-medium"><Edit3 size={16}/></button>
                                <button onClick={() => deleteSize(s.key)} className="text-sm text-red-600 hover:text-red-800 font-medium"><Trash2 size={16}/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {/* — Extras Section */}
            <section className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-amber-100">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Əlavələri İdarə Et</h2>
                <form onSubmit={submitExtra} className="grid grid-cols-2 md:grid-cols-3 items-end gap-3 mb-6">
                    <div className="col-span-2 md:col-span-1"><label className="text-xs font-semibold text-gray-500">Ad</label><input placeholder="Süd" value={extraForm.name} onChange={e => setExtraForm(f => ({ ...f, name: e.target.value }))} className={inputStyles} disabled={extraForm.isEdit} required/></div>
                    <div><label className="text-xs font-semibold text-gray-500">Qiymət</label><input type="number" step="0.01" value={extraForm.price} onChange={e => setExtraForm(f => ({ ...f, price: e.target.value }))} className={inputStyles} required/></div>
                    <div><label className="text-xs font-semibold text-gray-500">Sıra</label><input type="number" value={extraForm.sort_order} onChange={e => setExtraForm(f => ({ ...f, sort_order: e.target.value }))} className={inputStyles} required/></div>
                    <button className="col-span-full bg-indigo-600 text-white p-3 mt-2 rounded-lg font-semibold hover:bg-indigo-700 h-full flex items-center justify-center gap-2 transition-colors">
                        {extraForm.isEdit ? 'Yadda Saxla' : <><Plus size={18}/> Yeni Əlavə</>}
                    </button>
                </form>
                <ul className="space-y-2">
                    {extras.map(x => (
                        <li key={x.name} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-gray-700 font-medium">{x.name} &mdash; <span className="text-sm text-gray-500">{x.price} AZN | Sıra: {x.sort_order}</span></span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => editExtra(x)} className="text-sm text-blue-600 hover:text-blue-800 font-medium"><Edit3 size={16}/></button>
                                <button onClick={() => deleteExtra(x.name)} className="text-sm text-red-600 hover:text-red-800 font-medium"><Trash2 size={16}/></button>
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