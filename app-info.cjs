/**
 * Helper script to show information about accessing the ScootMe app
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Add box drawing characters for a nicer display
const box = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
};

// Format text with a box around it
function boxedText(title, content) {
  const lines = content.split('\n');
  const width = Math.max(...lines.map(line => line.length), title.length + 4);
  
  // Title bar
  console.log(`${colors.cyan}${box.topLeft}${box.horizontal}${colors.bright} ${title} ${colors.reset}${colors.cyan}${box.horizontal.repeat(width - title.length - 3)}${box.topRight}${colors.reset}`);
  
  // Content
  lines.forEach(line => {
    const padding = ' '.repeat(width - line.length);
    console.log(`${colors.cyan}${box.vertical}${colors.reset} ${line}${padding} ${colors.cyan}${box.vertical}${colors.reset}`);
  });
  
  // Bottom border
  console.log(`${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(width)}${box.bottomRight}${colors.reset}`);
}

// Main function
function showInfo() {
  console.log('\n');

  // Show app access information
  boxedText('ScootMe App Access URLs', `${colors.bright}${colors.blue}Local Development:${colors.reset}
• App URL: ${colors.green}https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co${colors.reset}
• API: ${colors.green}https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co/api${colors.reset}

${colors.bright}${colors.blue}Production:${colors.reset}
• App URL: ${colors.green}https://scoot-me-ferransson.replit.app${colors.reset}
• Custom Domain: ${colors.green}https://scootme.ferransson.com${colors.reset}

${colors.bright}${colors.yellow}Test Credentials:${colors.reset}
• Email: ferransson@gmail.com
• Phone: +354 774 12 74`);

  // Development information
  boxedText('Development Information', `${colors.bright}${colors.blue}Starting the App:${colors.reset}
• Press the ${colors.bright}Run${colors.reset} button to start the application
• Alternatively, run ${colors.yellow}node run-simple.cjs${colors.reset} in the terminal

${colors.bright}${colors.blue}Available Servers:${colors.reset}
• Main App: Port 5000 (automatically started)

${colors.bright}${colors.blue}Authentication Methods:${colors.reset}
• Email/Password
• Phone (SMS via Twilio)
• Google OAuth`);

  console.log('\n');
}

// Run the main function
showInfo();