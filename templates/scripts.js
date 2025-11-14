function toggleResult(index) {
  // Don't toggle if user is selecting text
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    return;
  }
  
  const item = document.getElementById('result-' + index);
  item.classList.toggle('expanded');
}

function toggleConfigSection(section) {
  const content = document.getElementById(section + '-section');
  const toggle = document.getElementById(section + '-toggle');
  
  content.classList.toggle('collapsed');
  toggle.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
}

function filterResults(filter) {
  const items = document.querySelectorAll('.result-item');
  const tabs = document.querySelectorAll('.filter-tab');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Find the correct tab button by filter attribute
  const activeTab = document.querySelector(`.filter-tab[data-filter="${filter}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  items.forEach(item => {
    if (filter === 'all') {
      item.style.display = 'block';
    } else if (filter === 'passed') {
      item.style.display = item.classList.contains('passed') ? 'block' : 'none';
    } else if (filter === 'passed-with-errors') {
      item.style.display = item.classList.contains('passed-with-errors') ? 'block' : 'none';
    } else if (filter === 'failed') {
      item.style.display = item.classList.contains('failed') ? 'block' : 'none';
    }
  });
}

function copyCommandLine(event) {
  const commandText = document.getElementById('command-line-text').textContent;
  
  navigator.clipboard.writeText(commandText).then(() => {
    console.log('✅ Copy successful!');
    const button = event.target.closest('.copy-button');
    const originalHTML = button.innerHTML;
    
    // Show checkmark
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    button.style.background = '#10b981';
    
    // Reset after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '#667eea';
    }, 2000);
  }).catch(err => {
    console.error('❌ Error:', err);
  });
}

function copyCurlCommand(event, curlId) {
  const curlText = document.getElementById('curl-' + curlId).value;
  
  navigator.clipboard.writeText(curlText).then(() => {
    const button = event.target.closest('.copy-curl-btn');
    const originalHTML = button.innerHTML;
    
    // Show checkmark
    button.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!';
    button.style.background = '#10b981';
    
    // Reset after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '#667eea';
    }, 2000);
  }).catch(err => {
    console.error('❌ Error:', err);
  });
}

function copyHttpRequest(event, httpId) {
  const httpText = document.getElementById('http-' + httpId).value;
  
  navigator.clipboard.writeText(httpText).then(() => {
    const button = event.target.closest('.copy-button');
    const originalHTML = button.innerHTML;
    
    // Show checkmark
    button.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    button.style.background = '#10b981';
    
    // Reset after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '#667eea';
    }, 2000);
  }).catch(err => {
    console.error('❌ Error:', err);
  });
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
}

// Initialize theme on page load based on system preference
(function() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
})();

// Embedded JSON report data
const reportData = <%~ JSON.stringify(it.report) %>;

function downloadJson() {
  const dataStr = JSON.stringify(reportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (reportData.reportBaseName || 'comparison-report') + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadInputJson() {
  const dataStr = JSON.stringify(reportData.inputRequests, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (reportData.inputFileName || 'input-requests') + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadHttpFile() {
  // Build .http file content
  let httpContent = '';
  
  // Add variables at the top
  if (reportData.options.referenceBaseUrl) {
    httpContent += `@referenceBaseUrl = ${reportData.options.referenceBaseUrl}\n`;
  }
  if (reportData.options.targetBaseUrl) {
    httpContent += `@targetBaseUrl = ${reportData.options.targetBaseUrl}\n`;
  }
  
  // Set default baseUrl to target (can be changed by user)
  if (reportData.options.referenceBaseUrl && reportData.options.targetBaseUrl) {
    httpContent += `# @baseUrl = {{referenceBaseUrl}}\n`;
    httpContent += `@baseUrl = {{targetBaseUrl}}\n`;
  } else if (reportData.options.targetBaseUrl) {
    httpContent += `@baseUrl = {{targetBaseUrl}}\n`;
  } else if (reportData.options.referenceBaseUrl) {
    httpContent += `@baseUrl = {{referenceBaseUrl}}\n`;
  }
  
  if (httpContent) {
    httpContent += '\n###\n\n';
  }
  
  reportData.results.forEach((result, index) => {
    if (index > 0) {
      httpContent += '\n###\n\n';
    }
    
    // Add comment with request name
    httpContent += `# ${result.name}\n`;
    
    // Build URL using {{baseUrl}} variable
    let path = result.url;
    // Remove {{baseUrl}} placeholder if present in the path
    path = path.replace('{{baseUrl}}', '');
    
    // Add method and URL with variable
    httpContent += `${result.method} {{baseUrl}}${path}\n`;
    
    // Add headers
    if (result.referenceRequestHeaders && Object.keys(result.referenceRequestHeaders).length > 0) {
      for (const [key, value] of Object.entries(result.referenceRequestHeaders)) {
        httpContent += `${key}: ${value}\n`;
      }
    }
    
    // Add body if present
    if (result.requestBody && result.method !== 'GET' && result.method !== 'HEAD') {
      httpContent += '\n';
      const bodyStr = typeof result.requestBody === 'object' 
        ? JSON.stringify(result.requestBody, null, 2) 
        : String(result.requestBody);
      httpContent += bodyStr;
      httpContent += '\n';
    }
  });
  
  const dataBlob = new Blob([httpContent], { type: 'text/plain' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (reportData.inputFileName || 'requests') + '.http';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
