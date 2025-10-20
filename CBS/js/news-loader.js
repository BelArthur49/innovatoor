document.addEventListener("DOMContentLoaded", function() {
    const newsList = document.getElementById("news-list");
    const postContainer = document.getElementById("post-content");

    fetch("data/news.json")
        .then((response) => response.json())
        .then((newsItems) => {
            const params = new URLSearchParams(window.location.search);
            const newsId = parseInt(params.get("id"));

            if (newsList) {
                // Display all news on news.html
                newsList.innerHTML = newsItems
                    .map(
                        (item, index) => `
          <div class="news-item">
            <a href="news-post.html?id=${index}">
              <img src="${item.image}" alt="${item.title}" class="news-thumb" />
              <div class="news-info">
                <h3>${item.title}</h3>
                <p>${item.excerpt}</p>
                <span>${item.date} • ${item.category}</span>
              </div>
            </a>
          </div>`
                    )
                    .join("");
            }

            if (postContainer && !isNaN(newsId)) {
                const news = newsItems[newsId];

                if (!news) {
                    postContainer.innerHTML = "<p>News not found.</p>";
                    return;
                }

                let contentHTML = "";
                news.content.forEach((section) => {
                    if (section.type === "text") {
                        contentHTML += `<p>${section.value}</p>`;
                    } else if (section.type === "image") {
                        contentHTML += `
              <div class="news-image">
                <img src="${section.src}" alt="${section.alt || ""}" />
              </div>`;
                    }
                });

                postContainer.innerHTML = `
          <article class="news-post">
            <h1>${news.title}</h1>
            <div class="news-meta">${news.date} • ${news.category} • By ${news.author}</div>
            ${contentHTML}
            <div class="share-buttons">
              <h4>Share this news:</h4>
              <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank">Facebook</a>
              <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(news.title)}" target="_blank">Twitter</a>
              <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}" target="_blank">LinkedIn</a>
            </div>
          </article>`;
            }
        })
        .catch((error) => {
            console.error("Error loading news:", error);
        });
});