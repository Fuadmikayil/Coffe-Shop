//route.js
import supabase from '../../../lib/supabase'

 export async function GET() {
  const { data, error } = await supabase
    .from('coffees')
    .select('*')
    .order('name', { ascending: true })

  return new Response(JSON.stringify(data), {
    status: error ? 500 : 200
  })
 }

 export async function POST(request) {
  const { name, price, image_url, description } = await request.json()
  const { data, error } = await supabase
    .from('coffees')
    .insert([{ name, price, image_url, description }])

   return new Response(JSON.stringify(data), {
     status: error ? 500 : 201
   })
 }