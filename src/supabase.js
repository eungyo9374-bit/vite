import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// 환경변수가 없으면 앱은 열리지만 로그인 기능만 안내 문구를 보여줍니다.
export const configured = Boolean(url && key)
export const supabase = configured ? createClient(url, key) : null
