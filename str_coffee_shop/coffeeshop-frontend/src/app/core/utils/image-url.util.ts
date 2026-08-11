import { environment } from '../../../environments/environment';

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';

  let trimmed = url.trim();
  if (!trimmed) return '';

  // If it starts with http://localhost:8080, replace with environment.apiUrl
  if (trimmed.startsWith('http://localhost:8080')) {
    trimmed = environment.apiUrl + trimmed.substring('http://localhost:8080'.length);
  }
  // If it starts with relative path /uploads, prepend environment.apiUrl
  else if (trimmed.startsWith('/uploads')) {
    trimmed = environment.apiUrl + trimmed;
  }
  // Upgrade any http:// onrender.com links to https:// to avoid Mixed Content
  else if (trimmed.startsWith('http://') && (trimmed.includes('onrender.com') || environment.apiUrl.startsWith('https://'))) {
    trimmed = trimmed.replace('http://', 'https://');
  }

  return trimmed;
}
