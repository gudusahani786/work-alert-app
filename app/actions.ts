'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { composeLocation, validateLocation } from '@/lib/locations'
import { isLocale } from '@/lib/i18n/dictionaries'
import {
  CATEGORIES,
  GENDERS,
  JOB_TYPES,
  decimalOrNull,
  friendlyDbError,
  intOrNull,
  isEmail,
  isPhone,
  safeUrl,
  str,
} from '@/lib/validate'

type ActionResult = { ok: boolean; error?: string; id?: string }

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function submitApplication(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: 'You must be logged in to apply.' }

  const jobId = str(formData.get('job_id'), 100)
  const fullName = str(formData.get('full_name'), 200)
  const email = str(formData.get('email'), 200)
  const phone = str(formData.get('phone'), 40)
  const coverLetter = str(formData.get('cover_letter'), 5000)

  if (!jobId) return { ok: false, error: 'Missing job.' }
  if (!fullName) return { ok: false, error: 'Please enter your full name.' }
  if (!isEmail(email)) return { ok: false, error: 'Please enter a valid email.' }
  if (phone && !isPhone(phone)) return { ok: false, error: 'Please enter a valid phone number.' }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, status, employer_id')
    .eq('id', jobId)
    .maybeSingle()
  if (!job) return { ok: false, error: 'This job no longer exists.' }
  if (job.status !== 'open') return { ok: false, error: 'This job is closed.' }
  if (job.employer_id === user.id) return { ok: false, error: 'You cannot apply to your own job.' }

  const { error } = await supabase.from('applications').insert({
    job_id: jobId,
    user_id: user.id,
    full_name: fullName,
    email,
    phone: phone || null,
    cover_letter: coverLetter || null,
  })

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'You have already applied to this job.' }
    console.error('submitApplication error:', error.message)
    return { ok: false, error: friendlyDbError(error.message, 'Could not submit your application. Please try again.') }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/jobs/${jobId}`)
  return { ok: true }
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: 'You must be logged in.' }

  const phone = str(formData.get('phone'), 40)
  if (phone && !isPhone(phone)) return { ok: false, error: 'Please enter a valid phone number.' }

  const websiteRaw = str(formData.get('website'), 300)
  const website = safeUrl(websiteRaw)
  if (websiteRaw && !website) return { ok: false, error: 'Please enter a valid website URL.' }

  const portfolioRaw = str(formData.get('portfolio_url'), 300)
  const portfolio = safeUrl(portfolioRaw)
  if (portfolioRaw && !portfolio) return { ok: false, error: 'Please enter a valid portfolio link.' }

  const country = str(formData.get('country'), 60)
  const region = str(formData.get('region'), 80)
  const city = str(formData.get('city'), 80)
  const locErr = validateLocation({ country, region, city }, { required: false, allowRemote: false })
  if (locErr) return { ok: false, error: locErr }

  const genderRaw = str(formData.get('gender'), 20)
  const gender = (GENDERS as readonly string[]).includes(genderRaw) ? genderRaw : null

  const curRaw = str(formData.get('desired_currency'), 5)
  const desiredCurrency = curRaw === 'USD' ? 'USD' : 'KRW'

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email ?? null,
      full_name: str(formData.get('full_name'), 200) || null,
      phone: phone || null,
      gender,
      country: country || null,
      region: region || null,
      city: city || null,
      address: str(formData.get('address'), 300) || null,
      location: composeLocation({ country, region, city }) || null,
      headline: str(formData.get('headline'), 200) || null,
      bio: str(formData.get('bio'), 3000) || null,
      skills: str(formData.get('skills'), 1000) || null,
      languages: str(formData.get('languages'), 300) || null,
      desired_hourly_rate: decimalOrNull(str(formData.get('desired_hourly_rate'), 12), 0, 100000000),
      desired_currency: desiredCurrency,
      portfolio_url: portfolio,
      experience_years: intOrNull(str(formData.get('experience_years'), 10), 0, 60),
      education: str(formData.get('education'), 1000) || null,
      current_company: str(formData.get('current_company'), 200) || null,
      company_name: str(formData.get('company_name'), 200) || null,
      website,
      company_description: str(formData.get('company_description'), 3000) || null,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('updateProfile error:', error.message)
    return { ok: false, error: 'Could not save your profile. Please try again.' }
  }

  revalidatePath('/profile')
  revalidatePath('/settings')
  revalidatePath('/employer')
  return { ok: true }
}

// Language cookie (English / Korean / Nepali)
export async function setLanguage(lang: string): Promise<ActionResult> {
  if (!isLocale(lang)) return { ok: false, error: 'Invalid language.' }
  ;(await cookies()).set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ---------------- Employer: jobs ----------------

export async function createJob(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: 'You must be logged in.' }

  const title = str(formData.get('title'), 150)
  const company = str(formData.get('company'), 150)
  const country = str(formData.get('country'), 60)
  const region = str(formData.get('region'), 80)
  const city = str(formData.get('city'), 80)
  const address = str(formData.get('address'), 300)
  const jobType = str(formData.get('job_type'), 30)
  const category = str(formData.get('category'), 40)
  const description = str(formData.get('description'), 5000)
  const requirements = str(formData.get('requirements'), 3000)
  const payCurrency = str(formData.get('pay_currency'), 5) === 'USD' ? 'USD' : 'KRW'
  const hourlyMin = decimalOrNull(str(formData.get('hourly_min'), 12), 0, 100000000)
  const hourlyMax = decimalOrNull(str(formData.get('hourly_max'), 12), 0, 100000000)

  if (!title) return { ok: false, error: 'Please enter a job title.' }
  if (!company) return { ok: false, error: 'Please enter the company name.' }
  const locErr = validateLocation({ country, region, city }, { required: true, allowRemote: true })
  if (locErr) return { ok: false, error: locErr }
  if (!(JOB_TYPES as readonly string[]).includes(jobType)) return { ok: false, error: 'Please choose a job type.' }
  if (category && !(CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: 'Invalid category.' }
  if (description.length < 20) return { ok: false, error: 'Description should be at least 20 characters.' }
  if (hourlyMin !== null && hourlyMax !== null && hourlyMin > hourlyMax) {
    return { ok: false, error: 'Minimum pay cannot be more than maximum pay.' }
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      employer_id: user.id,
      title,
      company,
      location: composeLocation({ country, region, city }),
      country,
      region: region || null,
      city: city || null,
      address: address || null,
      job_type: jobType,
      category: category || null,
      pay_currency: payCurrency,
      hourly_min: hourlyMin,
      hourly_max: hourlyMax,
      description,
      requirements: requirements || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createJob error:', error.message)
    return { ok: false, error: friendlyDbError(error.message, 'Could not post the job. Please try again.') }
  }

  revalidatePath('/')
  revalidatePath('/employer')
  return { ok: true, id: data.id }
}

// Edit a job. Allowed for the owner and for an admin (the database rules decide).
export async function updateJob(jobId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: 'You must be logged in.' }
  if (!jobId) return { ok: false, error: 'Missing job.' }

  const title = str(formData.get('title'), 150)
  const company = str(formData.get('company'), 150)
  const country = str(formData.get('country'), 60)
  const region = str(formData.get('region'), 80)
  const city = str(formData.get('city'), 80)
  const address = str(formData.get('address'), 300)
  const jobType = str(formData.get('job_type'), 30)
  const category = str(formData.get('category'), 40)
  const description = str(formData.get('description'), 5000)
  const requirements = str(formData.get('requirements'), 3000)
  const payCurrency = str(formData.get('pay_currency'), 5) === 'USD' ? 'USD' : 'KRW'
  const hourlyMin = decimalOrNull(str(formData.get('hourly_min'), 12), 0, 100000000)
  const hourlyMax = decimalOrNull(str(formData.get('hourly_max'), 12), 0, 100000000)

  if (!title) return { ok: false, error: 'Please enter a job title.' }
  if (!company) return { ok: false, error: 'Please enter the company name.' }
  const locErr = validateLocation({ country, region, city }, { required: true, allowRemote: true })
  if (locErr) return { ok: false, error: locErr }
  if (!(JOB_TYPES as readonly string[]).includes(jobType)) return { ok: false, error: 'Please choose a job type.' }
  if (category && !(CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: 'Invalid category.' }
  if (description.length < 20) return { ok: false, error: 'Description should be at least 20 characters.' }
  if (hourlyMin !== null && hourlyMax !== null && hourlyMin > hourlyMax) {
    return { ok: false, error: 'Minimum pay cannot be more than maximum pay.' }
  }

  const { data, error } = await supabase
    .from('jobs')
    .update({
      title,
      company,
      location: composeLocation({ country, region, city }),
      country,
      region: region || null,
      city: city || null,
      address: address || null,
      job_type: jobType,
      category: category || null,
      pay_currency: payCurrency,
      hourly_min: hourlyMin,
      hourly_max: hourlyMax,
      description,
      requirements: requirements || null,
    })
    .eq('id', jobId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('updateJob error:', error.message)
    return { ok: false, error: friendlyDbError(error.message, 'Could not save the job. Please try again.') }
  }
  if (!data) return { ok: false, error: 'You are not allowed to edit this job.' }

  revalidatePath('/')
  revalidatePath('/jobs')
  revalidatePath('/employer')
  revalidatePath('/admin/jobs')
  revalidatePath(`/jobs/${jobId}`)
  return { ok: true, id: data.id }
}

export async function setJobStatus(jobId: string, status: 'open' | 'closed'): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: 'You must be logged in.' }
  if (status !== 'open' && status !== 'closed') return { ok: false, error: 'Invalid status.' }

  const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId).eq('employer_id', user.id)
  if (error) return { ok: false, error: 'Could not update the job.' }

  revalidatePath('/')
  revalidatePath('/employer')
  revalidatePath(`/jobs/${jobId}`)
  return { ok: true }
}

export async function deleteJob(jobId: string): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: 'You must be logged in.' }

  const { error } = await supabase.from('jobs').delete().eq('id', jobId).eq('employer_id', user.id)
  if (error) return { ok: false, error: 'Could not delete the job.' }

  revalidatePath('/')
  revalidatePath('/employer')
  return { ok: true }
}

// ---------------- Employer: applicants ----------------

export async function setApplicationStatus(
  applicationId: string,
  status: 'Under Review' | 'Approved' | 'Rejected',
): Promise<ActionResult> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: 'You must be logged in.' }
  if (!['Under Review', 'Approved', 'Rejected'].includes(status)) return { ok: false, error: 'Invalid status.' }

  const { data, error } = await supabase.rpc('set_application_status', {
    p_application_id: applicationId,
    p_status: status,
  })
  if (error) {
    console.error('setApplicationStatus error:', error.message)
    return { ok: false, error: 'Could not update the application.' }
  }

  revalidatePath('/employer')
  revalidatePath('/dashboard')
  revalidatePath('/chat')
  return { ok: true, id: (data as string | null) ?? undefined }
}
