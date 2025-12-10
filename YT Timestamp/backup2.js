const video = document.querySelector('video');

if (video) {
  const controlBar = document.querySelector('.ytp-right-controls');
  if (controlBar) {
    // Create the timestamp button
    const tsButton = document.createElement('button');
    tsButton.innerHTML = '<img src="' + chrome.runtime.getURL("time.png") + '" alt="TS" style="width:20px; height:20px;">';
    tsButton.className = 'ytp-button';
    tsButton.id = 'add-timestamp-btn';
    
    tsButton.style.display = 'flex';
    tsButton.style.alignItems = 'center';
    tsButton.style.justifyContent = 'center';
    tsButton.style.textAlign = 'center';
    
    controlBar.appendChild(tsButton);

    // Wait for YouTube engagement panel container
    const waitForEngagementPanel = setInterval(() => {
      const engagementContainer = document.querySelector('ytd-engagement-panel-section-list-renderer');
      if (engagementContainer) {
        clearInterval(waitForEngagementPanel);

        if (!document.getElementById('yt-stamper-panel')) {
          // Create custom engagement panel
          const customPanel = document.createElement('ytd-engagement-panel-section-list-renderer');
          customPanel.id = 'yt-stamper-panel';
          customPanel.className = 'style-scope ytd-watch-flexy';
          customPanel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN');

          // Inner container
          const inner = document.createElement('div');
          inner.className = 'style-scope ytd-engagement-panel-section-list-renderer';
          inner.style.background = 'var(--yt-spec-base-background)';
          inner.style.color = 'var(--yt-spec-text-primary)';
          inner.style.padding = '16px';
          inner.style.overflowY = 'auto';
          inner.style.maxHeight = '400px';
          inner.style.borderRadius = '8px';
          inner.style.fontSize = '14px';
          inner.style.lineHeight = '1.4';
          inner.style.cursor = 'pointer';

          // Add header
          const header = document.createElement('h3');
          header.textContent = 'AI-Generated Timestamps';
          header.style.marginBottom = '10px';
          header.style.fontWeight = '500';
          inner.appendChild(header);

          // Initial sample timestamp
          const sampleTexts = ["00:00 - Introduction"];

          // Helper: convert "mm:ss" or "hh:mm:ss" → seconds
          function timeToSeconds(t) {
            const parts = t.split(':').map(Number);
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            return 0;
          }

          // Initial rendering of sampleTexts
          function renderTimestamps() {
            // Clear previous entries
            inner.querySelectorAll('p').forEach(p => p.remove());

            sampleTexts.forEach(text => {
              const p = document.createElement('p');
              p.textContent = text;
              p.style.margin = '6px 0';
              p.style.padding = '4px 8px';
              p.style.borderRadius = '4px';

              // Hover effect
              p.addEventListener('mouseenter', () => p.style.background = 'rgba(255,255,255,0.1)');
              p.addEventListener('mouseleave', () => p.style.background = 'transparent');

              // Click → seek video
              p.addEventListener('click', () => {
                const match = text.match(/^(\d{1,2}:\d{2}(?::\d{2})?)/);
                if (match) {
                  const parts = match[1].split(':').map(Number);
                  let seconds = 0;
                  if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                  else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
                  video.currentTime = seconds;
                  video.play();
                }
              });

              inner.appendChild(p);
            });
          }

          renderTimestamps(); // initial render

          // Add inner container to panel
          customPanel.appendChild(inner);
          engagementContainer.parentNode.insertBefore(customPanel, engagementContainer.nextSibling);

          // Button click → fetch transcript and update panel
          tsButton.addEventListener('click', () => {
            const currentUrl = window.location.href;
            fetch("http://localhost:5000/echo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: currentUrl })
            })
              .then(res => res.json())
              .then(data => {
                const raw = data.transcript;
                const lines = raw.split("\n");

                // Clear and fill new sampleTexts
                sampleTexts.length = 0;
                for (let i = 0; i < lines.length; i += 2) {
                  const timeLine = lines[i];
                  const textLine = lines[i + 1];
                  if (!timeLine || !textLine) continue;

                  const seconds = parseFloat(timeLine.replace("Start: ", "").replace("s", ""));
                  const minutes = Math.floor(seconds / 60);
                  const secs = Math.floor(seconds % 60);
                  const timestamp = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                  const text = textLine.replace("Text: ", "");

                  sampleTexts.push(`${timestamp} - ${text}`);
                }

                // Re-render panel
                renderTimestamps();

                // Show panel
                customPanel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_VISIBLE');
              })
              .catch(err => alert("Request failed: " + err));
          });

        }
      }
    }, 1000);
  }
}
