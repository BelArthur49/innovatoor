// side bar start  
function openNav() {
    "use strict";
    const sidepanel = document.getElementById("mySidepanel");
    if (sidepanel) {
        sidepanel.style.left = "0";
    } else {
        console.error("Error: Side panel element not found!");
    }
}

function closeNav() {
    "use strict";
    const sidepanel = document.getElementById("mySidepanel");
    if (sidepanel) {
        sidepanel.style.left = "-320px";
    } else {
        console.error("Error: Side panel element not found!");
    }
}


function toggleCollapse(elementId) {
    var element = document.getElementById(elementId);
    var button = document.querySelector('.collapse_btn a');

    // Toggle the 'show' class
    element.classList.toggle('show');

    // Toggle aria-expanded attribute
    var isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
}


// Function to toggle the sidebar visibility
function toggleSidebar() {
    const sidebar = document.querySelector('.sidepanel');
    const currentLeft = window.getComputedStyle(sidebar).left;

    if (currentLeft === "0px") {
        // If sidebar is already open, close it
        sidebar.style.left = "-320px"; // Move sidebar off-screen
    } else {
        // Otherwise, open the sidebar
        sidebar.style.left = "0"; // Set sidebar position to visible
    }
}

// Add event listener to the button to toggle sidebar
document.querySelector('.sidebar button').addEventListener('click', toggleSidebar);

// Close the sidebar when clicking any link inside the sidebar
document.querySelectorAll('.sidebar a').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.sidepanel').style.left = "-320px"; // Close sidebar
    });
});


// search-bar
function open_search_bar() {
    "use strict";
    const sidepanel = document.getElementById("search-bar");
    if (sidepanel) {
        sidepanel.style.height = "100vh";
        sidepanel.style.borderRadius = "0";
    } else {
        console.error("Error: Side panel element not found!");
    }
}

function close_search_bar() {
    "use strict";
    const sidepanel = document.getElementById("search-bar");
    if (sidepanel) {
        sidepanel.style.height = "0";
        sidepanel.style.borderTopLeftRadius = "100%";
        sidepanel.style.borderTopRightRadius = "100%";
    } else {
        console.error("Error: Side panel element not found!");
    }
}

// right-sidebar
function open_right_side() {
    "use strict";
    const sidepanel = document.getElementById("right_side");
    if (sidepanel) {
        sidepanel.style.right = "0";
    } else {
        console.error("Error: Side panel element not found!");
    }
}

function close_right_sade() {
    "use strict";
    const sidepanel = document.getElementById("right_side");
    if (sidepanel) {
        sidepanel.style.right = "-355px";
    } else {
        console.error("Error: Side panel element not found!");
    }
}


function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("backToTopBtn").style.display = "block";
    } else {
        document.getElementById("backToTopBtn").style.display = "none";
    }
}

function scrollToTop() {
    const scrollToTopBtn = document.documentElement || document.body;
    scrollToTopBtn.scrollIntoView({
        behavior: "smooth"
    });
}



// portfolio gallary tab
function open_img(evt, cityName) {
    var i, tabcontent, tablinks;

    // Hide all tab content
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove active class from all tab links
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the selected tab content and mark the corresponding tab link as active
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.classList.add("active");
}






// button back to top 
window.onscroll = function() {
    scrollFunction()
};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("backToTopBtn").style.display = "block";
    } else {
        document.getElementById("backToTopBtn").style.display = "none";
    }
}

function scrollToTop() {
    const scrollToTopBtn = document.documentElement || document.body;
    scrollToTopBtn.scrollIntoView({
        behavior: "smooth"
    });
}


// faq section
document.addEventListener("DOMContentLoaded", function() {
    let accordionButtons = document.querySelectorAll('.accordion-button');
    let acoimg = document.querySelectorAll('.accordion-button img');

    accordionButtons.forEach(function(button, index) {
        button.addEventListener('click', function() {
            let collapse = this.parentElement.nextElementSibling;

            // Close all other accordion items
            accordionButtons.forEach(function(otherButton, otherIndex) {
                if (otherButton !== button) {
                    var otherCollapse = otherButton.parentElement.nextElementSibling;
                    otherCollapse.style.maxHeight = null;
                    // Reset the image source and rotation for other accordion items
                    acoimg[otherIndex].src = 'Images/icon/plus.png';
                    acoimg[otherIndex].style.transform = 'rotate(0deg)';
                    otherButton.style.backgroundColor = '#fff';
                }
            });

            // Toggle the clicked accordion item
            if (collapse.style.maxHeight) {
                collapse.style.maxHeight = null;
                // Reset the image source, rotation, and background color when collapsing
                acoimg[index].src = 'Images/icon/plus.png';
                acoimg[index].style.transform = 'rotate(90deg)';
                button.style.backgroundColor = '';
            } else {
                collapse.style.maxHeight = collapse.scrollHeight + "px";
                // Change the image source, set rotation, and background color when expanding
                acoimg[index].src = 'Images/icon/menus.png';
                acoimg[index].style.transform = 'rotate(180deg)';
                button.style.backgroundColor = '#c1b0d5';
            }
        });
    });
});





// footer validation start
const fom = document.getElementById('footer-form');
const footerMessage = document.getElementById('footer-message');

fom.addEventListener('submit', (event) => {
    event.preventDefault();
    footerMessage.innerHTML = '~ Form submitted success fully!';
    footerMessage.style.display = 'flex';
    fom.reset();
    setTimeout(() => {
        footerMessage.style.display = 'none';
    }, 3000);
});
// footer validation end





// responsive Logoipsum Slider
$('.sliderlogo').slick({
    arrows: false,
    dots: false,
    infinite: false,
    autoplay: false,
    speed: 300,
    slidesToShow: 5,
    slidesToScroll: 1,
    responsive: [{
            breakpoint: 1024,
            settings: {
                slidesToShow: 4,
                slidesToScroll: 1,
                infinite: true,
                dots: false,
            }
        },
        {
            breakpoint: 600,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 1
            }
        },
    ]
});


// responsive team Slider
$('.team-slider').slick({
    arrows: false,
    dots: true,
    infinite: false,
    autoplay: true,
    speed: 300,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [{
            breakpoint: 1024,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 1,
                infinite: true,
                dots: true,
            }
        },
        {
            breakpoint: 600,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 1
            }
        },
        {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }
    ]
});

document.addEventListener("DOMContentLoaded", () => {
    // Sidebar logic
    const sidebar = document.querySelector(".sidepanel");
    const sidebarItems = sidebar.querySelectorAll("li");

    sidebarItems.forEach((item) => {
        item.addEventListener("click", () => {
            sidebar.style.left = "-320px"; // Hides sidebar
        });
    });

    // Rightbar logic (if applicable)
    const rightbar = document.querySelector(".nav-right");
    if (rightbar) {
        const rightbarItems = rightbar.querySelectorAll("p, i");
        rightbarItems.forEach((item) => {
            item.addEventListener("click", () => {
                rightbar.style.display = "none"; // Hides rightbar
            });
        });
    }
});