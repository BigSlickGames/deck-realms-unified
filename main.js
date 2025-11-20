document.addEventListener("DOMContentLoaded", () => {
  console.log("Deck Realms - Intro Screen");

  const videoFrames = document.querySelectorAll(".video-glassmorphic-frame");
  const enterDeckRealmsBtn = document.getElementById("enterDeckRealmsBtn");
  const enterGameNowBtn = document.getElementById("enterGameNowBtn");
  const storyBtn = document.getElementById("storyBtn");
  const storyModal = document.getElementById("storyModal");
  const storyCloseBtn = document.querySelector(".story-close-btn");

  videoFrames.forEach((frame) => {
    const video = frame.querySelector(".featured-video");
    const closeBtn = frame.querySelector(".close-banner-btn");

    if (video) {
      frame.addEventListener("click", (e) => {
        if (e.target === closeBtn || closeBtn.contains(e.target)) {
          return;
        }

        if (
          !frame.classList.contains("generated") &&
          !frame.classList.contains("expanded")
        ) {
          videoFrames.forEach((f) => f.classList.remove("expanded"));
          frame.classList.add("expanded");
          video.muted = false;
          video.play().catch((err) => console.log("Video play error:", err));

          const faction = frame.getAttribute("data-faction");
          document.body.className = `faction-${faction.toLowerCase()}`;
        }
      });

      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          frame.classList.remove("expanded");
          video.pause();
          video.currentTime = 0;
          video.muted = true;

          document.body.className = "";
        });
      }

      frame.style.cursor = "pointer";
    }
  });

  if (storyBtn && storyModal) {
    storyBtn.addEventListener("click", () => {
      storyModal.classList.remove("hidden");
    });
  }

  if (storyCloseBtn && storyModal) {
    storyCloseBtn.addEventListener("click", () => {
      storyModal.classList.add("hidden");
    });
  }

  if (storyModal) {
    storyModal.addEventListener("click", (e) => {
      if (e.target === storyModal) {
        storyModal.classList.add("hidden");
      }
    });
  }
});
