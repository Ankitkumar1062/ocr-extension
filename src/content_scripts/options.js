document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page DOMContentLoaded');

  // Elements
  const langSelect = document.getElementById('lang');
  const outputTextarea = document.getElementById('output');
  const copyButton = document.getElementById('copyButton');
  const historySelect = document.getElementById('historySelect');
  const imageUpload = document.getElementById('imageUpload');
  const darkThemeToggle = document.getElementById('darkThemeToggle');
  const markdownCodeBlock = document.getElementById('markdownCodeBlock');
  const htmlCodeBlock = document.getElementById('htmlCodeBlock');
  const statusMsg = document.getElementById('statusMsg');

  // Load saved language
  chrome.storage.sync.get('lang', (data) => {
    console.log('Loaded language from storage:', data.lang);
    if (data.lang) langSelect.value = data.lang;
  });
  langSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ lang: langSelect.value }, () => {
      console.log('Language saved to storage:', langSelect.value);
    });
  });

  // Listen for OCR text from background script
  chrome.runtime.onMessage.addListener((request) => {
    if (request.message === 'ocrText') {
      console.log('Received OCR text:', request.text.substring(0, 50) + '...');
      outputTextarea.value = request.text;
      showStatus('OCR complete! Text loaded.');
      updateHistoryDropdown();
    }
  });

  // Copy to clipboard functionality
  copyButton.addEventListener('click', () => {
    let textToCopy = outputTextarea.value;
    if (markdownCodeBlock.checked) {
      textToCopy = `\u0060\u0060\u0060javascript\n${textToCopy}\n\u0060\u0060\u0060`;
    } else if (htmlCodeBlock.checked) {
      textToCopy = `<pre><code>${textToCopy}</code></pre>`;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log('Text copied to clipboard.');
      showStatus('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text:', err);
      showStatus('Failed to copy!');
    });
  });

  // Load and display OCR history
  function updateHistoryDropdown() {
    chrome.storage.local.get({ ocrHistory: [] }, (result) => {
      console.log('Loaded OCR history:', result.ocrHistory.length, 'items');
      historySelect.innerHTML = '<option value="" disabled selected>Select from history</option>';
      result.ocrHistory.forEach((text, index) => {
        const option = document.createElement('option');
        option.value = text;
        option.textContent = `Entry ${index + 1}: ${text.substring(0, 50)}...`;
        historySelect.appendChild(option);
      });
    });
  }
  updateHistoryDropdown();
  historySelect.addEventListener('change', () => {
    outputTextarea.value = historySelect.value;
    console.log('Loaded from history:', historySelect.value.substring(0, 50) + '...');
    showStatus('Loaded from history.');
  });

  // Handle image file upload
  imageUpload.addEventListener('change', (event) => {
    console.log('Image upload initiated.');
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;
        chrome.storage.sync.get('lang', (data) => {
          console.log('Sending image for OCR with language:', data.lang || 'eng');
          showStatus('Processing image...');
          chrome.runtime.sendMessage({
            message: 'uploadImageForOcr',
            imageData: imageDataUrl,
            lang: data.lang || 'eng'
          });
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Dark Theme Toggle
  chrome.storage.sync.get('darkTheme', (data) => {
    console.log('Loaded dark theme setting:', data.darkTheme);
    if (data.darkTheme) {
      document.body.classList.add('dark-theme');
      darkThemeToggle.checked = true;
    }
  });
  darkThemeToggle.addEventListener('change', () => {
    if (darkThemeToggle.checked) {
      document.body.classList.add('dark-theme');
      chrome.storage.sync.set({ darkTheme: true }, () => {
        console.log('Dark theme enabled.');
      });
    } else {
      document.body.classList.remove('dark-theme');
      chrome.storage.sync.set({ darkTheme: false }, () => {
        console.log('Dark theme disabled.');
      });
    }
  });

  // Formatting Presets
  chrome.storage.sync.get(['markdownCodeBlock', 'htmlCodeBlock'], (data) => {
    console.log('Loaded formatting presets:', data);
    if (data.markdownCodeBlock) markdownCodeBlock.checked = true;
    if (data.htmlCodeBlock) htmlCodeBlock.checked = true;
  });
  markdownCodeBlock.addEventListener('change', () => {
    chrome.storage.sync.set({ markdownCodeBlock: markdownCodeBlock.checked }, () => {
      console.log('Markdown code block setting saved:', markdownCodeBlock.checked);
    });
  });
  htmlCodeBlock.addEventListener('change', () => {
    chrome.storage.sync.set({ htmlCodeBlock: htmlCodeBlock.checked }, () => {
      console.log('HTML code block setting saved:', htmlCodeBlock.checked);
    });
  });

  // Status message helper
  function showStatus(msg) {
    statusMsg.textContent = msg;
    statusMsg.style.opacity = 1;
    setTimeout(() => { statusMsg.style.opacity = 0; }, 2000);
  }
}); 