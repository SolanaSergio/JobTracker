/**
 * Extracts job info from a URL by fetching the page and parsing meta tags.
 * Uses multiple strategies: direct fetch, allorigins proxy, and URL parsing fallback.
 */

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

/**
 * Try to extract job posting info from a URL.
 * Returns { title, company, location, description, salary, employmentType, sourceSite }
 */
export async function scrapeJobUrl(url) {
  if (!url || !url.startsWith('http')) throw new Error('Please enter a valid URL');

  let html = null;

  // Try direct fetch first (some sites allow it)
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'text/html' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) html = await res.text();
  } catch { /* fall through to proxy */ }

  // Try CORS proxies
  if (!html) {
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy(url), {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          html = await res.text();
          break;
        }
      } catch { /* try next proxy */ }
    }
  }

  // If we got HTML, parse it
  if (html) {
    return parseJobHtml(html, url);
  }

  // Final fallback: extract what we can from the URL itself
  return parseJobUrl(url);
}

function parseJobHtml(html, url) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const result = {};

  // Helper to get meta content
  const meta = (name) => {
    const el =
      doc.querySelector(`meta[property="${name}"]`) ||
      doc.querySelector(`meta[name="${name}"]`) ||
      doc.querySelector(`meta[property="og:${name}"]`);
    return el?.getAttribute('content')?.trim() || '';
  };

  // Title extraction
  result.title = meta('og:title') ||
    meta('twitter:title') ||
    doc.querySelector('h1')?.textContent?.trim() ||
    doc.querySelector('title')?.textContent?.trim() || '';

  // Description
  result.description = meta('og:description') ||
    meta('description') ||
    meta('twitter:description') || '';

  // Site name (company or source site)
  const siteName = meta('og:site_name') || '';
  result.sourceSite = siteName;

  // Try to extract company from title patterns like "Job Title at Company" or "Job Title - Company"
  const { jobTitle, company } = parseJobTitle(result.title, siteName);
  if (jobTitle) result.title = jobTitle;
  if (company) result.company = company;

  // Try structured data (JSON-LD)
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const jobPosting = findJobPosting(data);
      if (jobPosting) {
        result.title = jobPosting.title || result.title;
        result.company = jobPosting.hiringOrganization?.name || result.company;
        result.location = formatJobLocation(jobPosting.jobLocation) || result.location;
        result.description = jobPosting.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || result.description;
        result.employmentType = jobPosting.employmentType || '';
        if (jobPosting.baseSalary) {
          const salary = jobPosting.baseSalary;
          result.salaryMin = salary.value?.minValue || salary.minValue || null;
          result.salaryMax = salary.value?.maxValue || salary.maxValue || null;
        }
        break;
      }
    } catch { /* ignore bad JSON-LD */ }
  }

  // Try to detect location from page content if not found
  if (!result.location) {
    result.location = tryExtractLocation(doc) || '';
  }

  // Detect source site from URL
  if (!result.sourceSite) {
    result.sourceSite = extractDomainName(url);
  }

  // Detect work mode
  const fullText = (result.title + ' ' + result.description + ' ' + result.location).toLowerCase();
  if (fullText.includes('remote')) result.workMode = 'remote';
  else if (fullText.includes('hybrid')) result.workMode = 'hybrid';
  else result.workMode = 'on-site';

  return result;
}

function parseJobUrl(url) {
  // Basic fallback: extract whatever we can from the URL
  const result = {
    title: '',
    company: '',
    location: '',
    description: '',
    sourceSite: extractDomainName(url),
    workMode: '',
  };

  try {
    const u = new URL(url);
    const hostname = u.hostname.replace('www.', '');

    // Try to extract info from common URL patterns
    const pathParts = u.pathname.split('/').filter(Boolean);
    if (hostname.includes('linkedin')) {
      result.sourceSite = 'LinkedIn';
    } else if (hostname.includes('indeed')) {
      result.sourceSite = 'Indeed';
      // Indeed URLs often have job title in the path
      const titlePart = pathParts.find(p => p.startsWith('rc/') || p.includes('-'));
      if (titlePart) result.title = titlePart.replace(/-/g, ' ').replace(/^rc\/clk/, '');
    } else if (hostname.includes('glassdoor')) {
      result.sourceSite = 'Glassdoor';
    } else if (hostname.includes('ziprecruiter')) {
      result.sourceSite = 'ZipRecruiter';
    }

    // Extract from search params
    const q = u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('keywords') || '';
    if (q && !result.title) result.title = q;
    const loc = u.searchParams.get('l') || u.searchParams.get('location') || '';
    if (loc) result.location = loc;
  } catch { /* ignore URL parse errors */ }

  return result;
}

function parseJobTitle(title, siteName) {
  if (!title) return {};

  // Common patterns: "Job Title at Company | Site", "Job Title - Company", "Company - Job Title"
  // Remove site name suffix
  let cleaned = title;
  if (siteName) {
    cleaned = cleaned.replace(new RegExp(`\\s*[\\|\\-–—]\\s*${escapeRegex(siteName)}\\s*$`, 'i'), '');
    cleaned = cleaned.replace(new RegExp(`^\\s*${escapeRegex(siteName)}\\s*[\\|\\-–—]\\s*`, 'i'), '');
  }

  // Try " at " pattern (LinkedIn style)
  const atMatch = cleaned.match(/^(.+?)\s+at\s+(.+?)$/i);
  if (atMatch) return { jobTitle: atMatch[1].trim(), company: atMatch[2].trim() };

  // Try " - " or " | " pattern
  const sepMatch = cleaned.match(/^(.+?)\s*[\|–—]\s*(.+?)$/);
  if (sepMatch) {
    // Heuristic: the shorter one is usually the company
    const [_, a, b] = sepMatch;
    if (a.length > b.length) return { jobTitle: a.trim(), company: b.trim() };
    return { jobTitle: b.trim(), company: a.trim() };
  }

  return { jobTitle: cleaned.trim() };
}

function findJobPosting(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  if (data['@type'] === 'JobPosting') return data;
  if (data['@graph']) return findJobPosting(data['@graph']);
  return null;
}

function formatJobLocation(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (Array.isArray(loc)) loc = loc[0];
  const address = loc.address;
  if (!address) return loc.name || '';
  if (typeof address === 'string') return address;
  return [address.addressLocality, address.addressRegion, address.addressCountry].filter(Boolean).join(', ');
}

function tryExtractLocation(doc) {
  // Check for common location-related meta tags or elements
  const locationEl = doc.querySelector('[class*="location"], [data-testid*="location"]');
  if (locationEl) return locationEl.textContent.trim().slice(0, 80);
  return '';
}

function extractDomainName(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const parts = hostname.split('.');
    return parts.length > 1 ? parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1) : hostname;
  } catch { return ''; }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
