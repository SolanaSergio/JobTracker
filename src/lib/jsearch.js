const JSEARCH_BASE = 'https://jsearch.p.rapidapi.com';

function getApiKey() {
  return localStorage.getItem('jobtracker_rapidapi_key') || import.meta.env.VITE_RAPIDAPI_KEY || '';
}

async function fetchJSearch(endpoint, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('RapidAPI key not configured. Go to Settings to add it.');

  const url = new URL(`${JSEARCH_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit reached. Try again later.');
    if (res.status === 403) throw new Error('Invalid API key. Check your RapidAPI key in Settings.');
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.status === 'ERROR') throw new Error(json.error?.message || 'Search failed');
  return json;
}

export async function searchJobs({ query, location, datePosted, remoteOnly, employmentType, page = 1, numPages = 1 }) {
  let q = query || '';
  if (location) q += ` in ${location}`;

  const params = {
    query: q,
    page: String(page),
    num_pages: String(numPages),
  };

  if (datePosted && datePosted !== 'all') params.date_posted = datePosted;
  if (remoteOnly) params.remote_jobs_only = 'true';
  if (employmentType) params.employment_types = employmentType;

  const result = await fetchJSearch('/search', params);
  return {
    jobs: (result.data || []).map(normalizeJob),
    totalResults: result.parameters?.total || result.data?.length || 0,
  };
}

export async function getJobDetails(jobId) {
  const result = await fetchJSearch('/job-details', { job_id: jobId });
  return result.data?.[0] ? normalizeJob(result.data[0]) : null;
}

export async function getEstimatedSalary(jobTitle, location) {
  const result = await fetchJSearch('/estimated-salary', {
    job_title: jobTitle,
    location: location || 'United States',
    radius: '100',
  });
  return result.data || [];
}

function normalizeJob(raw) {
  return {
    id: raw.job_id,
    title: raw.job_title || '',
    company: raw.employer_name || '',
    companyLogo: raw.employer_logo || null,
    location: raw.job_city
      ? `${raw.job_city}${raw.job_state ? ', ' + raw.job_state : ''}${raw.job_country ? ', ' + raw.job_country : ''}`
      : raw.job_country || 'Unknown',
    city: raw.job_city || '',
    state: raw.job_state || '',
    country: raw.job_country || '',
    description: raw.job_description || '',
    salaryMin: raw.job_min_salary || null,
    salaryMax: raw.job_max_salary || null,
    salaryPeriod: raw.job_salary_period || null,
    employmentType: raw.job_employment_type || '',
    isRemote: raw.job_is_remote || false,
    applyLink: raw.job_apply_link || '',
    sourceUrl: raw.job_google_link || raw.job_apply_link || '',
    sourceSite: raw.job_publisher || '',
    postedDate: raw.job_posted_at_datetime_utc || '',
    expirationDate: raw.job_offer_expiration_datetime_utc || '',
    qualifications: raw.job_highlights?.Qualifications || [],
    responsibilities: raw.job_highlights?.Responsibilities || [],
    benefits: raw.job_highlights?.Benefits || [],
  };
}

export function isJSearchConfigured() {
  return !!getApiKey();
}
