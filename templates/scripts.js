function toggleResult(index) {
  const item = document.getElementById('result-' + index);
  item.classList.toggle('expanded');
}

function filterResults(filter) {
  const items = document.querySelectorAll('.result-item');
  const tabs = document.querySelectorAll('.filter-tab');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  
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

function copyCommandLine() {
  const commandText = document.getElementById('command-line-text').textContent;
  navigator.clipboard.writeText(commandText).then(() => {
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
    console.error('Failed to copy:', err);
  });
}
