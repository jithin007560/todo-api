import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Connect to Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SECRET_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxRequests = 10
  const record = rateLimit.get(ip)
  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  if (record.count >= maxRequests) return false
  record.count++
  return true
}

// GET - Get all todos
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests!' },
      { status: 429 }
    )
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, todos: data })
}

// POST - Add a new todo
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests!' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { title } = body

  if (!title || title.trim() === '') {
    return NextResponse.json(
      { error: 'Please provide a title!' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({ title, completed: false })
    .select()
    .single()

  if (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, todo: data })
}

// PATCH - Update todo
export async function PATCH(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests!' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { id, completed } = body

  if (!id) {
    return NextResponse.json(
      { error: 'Please provide an id!' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, todo: data })
}

// DELETE - Delete a todo
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests!' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json(
      { error: 'Please provide an id!' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Todo deleted!' })
}