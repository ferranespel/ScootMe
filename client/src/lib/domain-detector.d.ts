/**
 * Domain information interface
 */
export interface DomainInfo {
  domain?: string;
  fullUrl?: string;
  protocol?: string;
  origin?: string;
  pathname?: string;
  error?: string;
}

/**
 * Detects and logs information about the current domain
 * Used for debugging authentication issues
 * 
 * @returns Domain information including hostname, URL, protocol, etc.
 */
export function detectCurrentDomain(): DomainInfo;