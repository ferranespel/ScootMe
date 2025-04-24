// Domain detection helper to debug Google Auth issues

/**
 * Detects and logs information about the current domain
 * Used for debugging authentication issues
 * 
 * @returns {Object} Domain information including hostname, URL, protocol, etc.
 */
export function detectCurrentDomain() {
  try {
    const domain = window.location.hostname;
    const fullUrl = window.location.href;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    console.log('==================== DOMAIN INFO ====================');
    console.log('Hostname:', domain);
    console.log('Full URL:', fullUrl);
    console.log('Protocol:', protocol);
    console.log('Port:', port);
    console.log('Origin:', origin);
    console.log('Pathname:', pathname);
    console.log('=====================================================');
    
    // Create a message to display on the page in development mode
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const infoDiv = document.createElement('div');
        infoDiv.style.position = 'fixed';
        infoDiv.style.bottom = '10px';
        infoDiv.style.right = '10px';
        infoDiv.style.padding = '10px';
        infoDiv.style.background = 'rgba(0,0,0,0.7)';
        infoDiv.style.color = 'white';
        infoDiv.style.borderRadius = '4px';
        infoDiv.style.fontSize = '12px';
        infoDiv.style.zIndex = '9999';
        infoDiv.style.maxWidth = '300px';
        infoDiv.innerHTML = `
          <p><strong>Current Domain:</strong> ${domain}</p>
          <p><strong>Add to Firebase:</strong> Add this domain to Firebase Console Auth > Settings > Authorized Domains</p>
        `;
        document.body.appendChild(infoDiv);
      }, 2000);
    }
    
    return {
      domain,
      fullUrl,
      protocol,
      origin,
      pathname
    };
  } catch (error) {
    console.error('Error detecting domain:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}