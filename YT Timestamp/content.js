const video = document.querySelector('video');

if (video) {
  const controlBar = document.querySelector('.ytp-right-controls');
  if (controlBar) {

    // ---- Timestamp formatting function (FIXED) ----
    function formatTimestamp(seconds) {
      seconds = Math.floor(seconds);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;

      if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`;
      } else {
        return `${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`;
      }
    }

    // -------------------------------------------------------
    // Create the timestamp button
    // -------------------------------------------------------
    const tsButton = document.createElement('button');
    tsButton.innerHTML =
      '<img src="' +
      chrome.runtime.getURL("time.png") +
      '" alt="TS" style="width:20px; height:20px;">';
    tsButton.className = 'ytp-button';
    tsButton.id = 'add-timestamp-btn';

    tsButton.style.display = 'flex';
    tsButton.style.alignItems = 'center';
    tsButton.style.justifyContent = 'center';
    tsButton.style.textAlign = 'center';

    controlBar.appendChild(tsButton);

    let currentUrl = window.location.href;

    // -------------------------------------------------------
    // CSS WITH GLOW ANIMATION (UNCHANGED)
    // -------------------------------------------------------
    const style = document.createElement('style');
    style.textContent = `
    @keyframes pulseGlow {
      0% {
        box-shadow: 0 0 8px rgba(0, 0, 255, 0.4), 0 0 16px rgba(0, 0, 255, 0.2);
        border-color: rgba(0, 0, 255, 0.4);
      }
      50% {
        box-shadow: 0 0 20px rgba(0, 0, 255, 1), 0 0 40px rgba(0, 0, 255, 0.7);
        border-color: rgba(0, 0, 255, 1);
      }
      100% {
        box-shadow: 0 0 8px rgba(0, 0, 255, 0.4), 0 0 16px rgba(0, 0, 255, 0.2);
        border-color: rgba(0, 0, 255, 0.4);
      }
    }
    .pulse-border {
      animation: pulseGlow 1.2s infinite ease-in-out;
      border-width: 2px;
      border-style: solid;
      border-radius: 8px;
    }
    `;
    document.head.appendChild(style);

    // -------------------------------------------------------
    // Wait for YouTube engagement panel
    // -------------------------------------------------------
    const waitForEngagementPanel = setInterval(() => {
      const engagementContainer = document.querySelector('ytd-engagement-panel-section-list-renderer');

      if (engagementContainer) {
        clearInterval(waitForEngagementPanel);

        let customPanel = document.getElementById('yt-stamper-panel');
        if (!customPanel) {

          // -------- PANEL CREATION --------
          customPanel = document.createElement('ytd-engagement-panel-section-list-renderer');
          customPanel.id = 'yt-stamper-panel';
          customPanel.className = 'style-scope ytd-watch-flexy';
          customPanel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN');

          const inner = document.createElement('div');
          inner.className = 'style-scope ytd-engagement-panel-section-list-renderer';
          inner.style.background = 'var(--yt-spec-base-background)';
          inner.style.color = 'var(--yt-spec-text-primary)';
          inner.style.padding = '24px';
          inner.style.overflowY = 'auto';
          inner.style.height = '600px';
          inner.style.maxHeight = '80vh';
          inner.style.borderRadius = '8px';
          inner.style.fontSize = '14px';
          inner.style.lineHeight = '1.4';
          inner.style.cursor = 'pointer';
          inner.style.border = '2px solid transparent';
          inner.style.transition = 'border 0.3s ease, box-shadow 0.3s ease';

          const header = document.createElement('h3');
          header.textContent = 'AI-Generated Timestamps';
          header.style.marginBottom = '10px';
          header.style.fontWeight = '500';
          inner.appendChild(header);

          const sampleTexts = ["00:00 - Introduction"];

          // -------------------------------------------------------
          // Render timestamps (CLICK HANDLER FIXED)
          // -------------------------------------------------------
          function renderTimestamps() {
            inner.querySelectorAll('p').forEach(p => p.remove());

            sampleTexts.forEach(text => {
              const p = document.createElement('p');
              p.style.margin = '6px 0';
              p.style.padding = '4px 8px';
              p.style.borderRadius = '4px';
              p.style.cursor = 'pointer';

              const [timePart, descPart] = text.split(' - ');

              const timeSpan = document.createElement('span');
              timeSpan.textContent = timePart + ' - ';
              timeSpan.style.color = 'blue';

              const descSpan = document.createElement('span');
              descSpan.textContent = descPart;

              p.appendChild(timeSpan);
              p.appendChild(descSpan);

              p.addEventListener('mouseenter', () => p.style.background = 'rgba(255,255,255,0.1)');
              p.addEventListener('mouseleave', () => p.style.background = 'transparent');

              // ---- FIXED CLICKING FOR H:MM:SS Timestamps ----
              p.addEventListener('click', () => {
                const parts = timePart.split(':').map(Number);
                let seconds = 0;

                if (parts.length === 3) {
                  seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else {
                  seconds = parts[0] * 60 + parts[1];
                }

                video.currentTime = seconds;
                video.play();
              });

              inner.appendChild(p);
            });
          }

          renderTimestamps();
          customPanel.appendChild(inner);
          engagementContainer.parentNode.insertBefore(customPanel, engagementContainer.nextSibling);

          // -------------------------------------------------------
          // Click → fetch timestamps with glowing animation
          // -------------------------------------------------------
          tsButton.addEventListener('click', () => {
            const currentVideoUrl = window.location.href;

            customPanel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_VISIBLE');

            inner.querySelectorAll('p').forEach(p => p.remove());

            // ⭐ YOUR ORIGINAL GLOW ANIMATION (kept)
            inner.classList.add('pulse-border');

            fetch("http://localhost:5000/echo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: currentVideoUrl })
            })
              .then(res => res.json())
              .then(data => {

                inner.classList.remove('pulse-border'); // glow off

                const raw = data.transcript;
                const lines = raw.split("\n");

                sampleTexts.length = 0;

                for (let i = 0; i < lines.length; i += 2) {
                  const timeLine = lines[i];
                  const textLine = lines[i + 1];
                  if (!timeLine || !textLine) continue;

                  const seconds = parseFloat(
                    timeLine.replace("Start: ", "").replace("s", "")
                  );

                  // ⭐ FIXED: convert properly to H:MM:SS
                  const timestamp = formatTimestamp(seconds);

                  const text = textLine.replace("Text: ", "");

                  sampleTexts.push(`${timestamp} - ${text}`);
                }

                renderTimestamps();
              })
              .catch(err => {
                inner.classList.remove('pulse-border');
                inner.style.borderColor = 'red';
                inner.querySelectorAll('p').forEach(p => p.remove());
                const errorP = document.createElement('p');
                errorP.textContent = "Failed to load timestamps.";
                errorP.style.color = 'red';
                inner.appendChild(errorP);
                console.error(err);
              });
          });
        }

        // -------------------------------------------------------
        // Detect URL change → hide panel
        // -------------------------------------------------------
        setInterval(() => {
          if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            const panel = document.getElementById('yt-stamper-panel');
            if (panel) {
              panel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN');
            }
          }
        }, 500);
      }
    }, 1000);
  }
}
