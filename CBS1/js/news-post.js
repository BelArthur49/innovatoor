const postContainer = document.getElementById("post-container");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch("data/news.json")
    .then(response => response.json())
    .then(newsList => {
        if (id !== null && newsList[id]) {
            const news = newsList[id];
            postContainer.innerHTML = `
                <h1>${news.title}</h1>
                <p class="text-3 font-weight-semibold mb-3"><time>${news.date}</time> | ${news.comments} Comments | ${news.author}</p>
                <img src="${news.image}" alt="${news.title}" class="img-fluid mb-4">
                ${news.content}
            `;
        } else {
            postContainer.innerHTML = "No news selected.";
        }
    })
    .catch(err => {
        postContainer.innerHTML = "Failed to load news.";
        console.error(err);
    });