function toggleResult(index) {
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

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Initialize theme on page load
(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

// Embedded JSON report data
const reportData = <%~ JSON.stringify(it.report) %>;

function downloadJson() {
  const dataStr = JSON.stringify(reportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'comparison-report-' + new Date(reportData.timestamp).toISOString().split('T')[0] + '.json';
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
  link.download = 'input-requests-' + new Date(reportData.timestamp).toISOString().split('T')[0] + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
