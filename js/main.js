(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.navbar').addClass('sticky-top shadow-sm');
        } else {
            $('.navbar').removeClass('sticky-top shadow-sm');
        }
    });



window.onload = function () {
  const hasSeenPopup = localStorage.getItem("popupShown");

  if (!hasSeenPopup) {
    // Show popup only once
    document.getElementById("popup").style.display = "flex";
  }
};

document.getElementById("close1").onclick = function () {
  document.getElementById("popup1").style.display = "none";
  document.getElementById("popup2").style.display = "block";
};

document.getElementById("close2").onclick = function () {
  document.getElementById("popup").style.display = "none";
  localStorage.setItem("popupShown", "true");
};

//news ticker
const items = document.querySelectorAll('.news-ticker-item');
let currentIndex = 0;
let interval;
let paused = false;

function showNextItem() {
  if (paused) return;

  const currentItem = items[currentIndex];
  // Prepare slide-out for current item after visible time
  currentItem.classList.remove('active');
  currentItem.classList.add('slide-out');

  // Calculate next index
  currentIndex = (currentIndex + 1) % items.length;
  const nextItem = items[currentIndex];
  
  // Slide-in next item
  nextItem.classList.remove('slide-out');
  nextItem.classList.add('active');

  // After slide-out animation ends, reset current item
  setTimeout(() => {
    currentItem.classList.remove('slide-out');
  }, 800); // Must match CSS transition time
}

// Initial setup: show first item
items.forEach(item => item.classList.remove('active', 'slide-out'));
items[0].classList.add('active');

// Start the loop
interval = setInterval(showNextItem, 5000);

// Pause on mouse enter and touch start
const tickerWrapper = document.querySelector('.news-ticker-wrapper');
tickerWrapper.addEventListener('mouseenter', () => { paused = true; });
tickerWrapper.addEventListener('mouseleave', () => { paused = false; });
tickerWrapper.addEventListener('touchstart', () => { paused = true; });
tickerWrapper.addEventListener('touchend', () => { paused = false; });




//nav bar
const toggler = document.querySelector('.navbar-toggler');
    const icon = toggler.querySelector('.custom-toggler-icon');

    toggler.addEventListener('click', function () {
        icon.classList.toggle('open');
    });

document.addEventListener("DOMContentLoaded", function () {
    const dropdownToggles = document.querySelectorAll('.navbar .dropdown-toggle');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (e) {
            // Prevent link from navigating
            e.preventDefault();

            // Close other open dropdowns
            dropdownToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    otherToggle.parentElement.classList.remove('show');
                }
            });

            // Toggle this dropdown
            const parent = toggle.parentElement;
            parent.classList.toggle('show');
        });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.navbar')) {
            dropdownToggles.forEach(toggle => {
                toggle.parentElement.classList.remove('show');
            });
        }
    });
});

// Principal Message



    // facilites
  $(document).ready(function(){
    $(".facilities-carousel").owlCarousel({
        loop: true,
        margin: 20,
        nav: false,
        dots: false,
        autoplay: true,
        autoplayTimeout: 3000,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            1024: {
                items: 3
            },
            1200: {
                items: 4
            }
        }
    });

    // Custom navigation
    $(".carousel-prev").click(function(){
        $(".facilities-carousel").trigger("prev.owl.carousel");
    });

    $(".carousel-next").click(function(){
        $(".facilities-carousel").trigger("next.owl.carousel");
    });
});



    // packages carousel
    $(".packages-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: false,
        dots: false,
        loop: true,
        margin: 25,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:2
            },
            1200:{
                items:3
            }
        }
    });


    // testimonial carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        dots: true,
        loop: true,
        margin: 25,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:2
            },
            1200:{
                items:3
            }
        }
    });

    
   // Back to top button
   $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
    } else {
        $('.back-to-top').fadeOut('slow');
    }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    }); 

})(jQuery);


// latest news
let index = 0;
const track = document.getElementById("tickerTrack");
const items = document.querySelectorAll(".news-item");

function scrollTicker() {
  index = (index + 1) % items.length;
  track.style.transform = `translateX(-${index * 100}%)`;
}

setInterval(scrollTicker, 3000); // every 3 seconds

// Highlight news item on date click
document.querySelectorAll('.news-date').forEach(date => {
  date.addEventListener('click', () => {
    const item = date.closest('.news-item');
    item.classList.toggle('highlighted');
  });
});

// about us
// Auto play video in modal
const videoModal = document.getElementById('videoModal');
const localVideo = document.getElementById('localVideo');

videoModal.addEventListener('show.bs.modal', () => {
  localVideo.play();
});

videoModal.addEventListener('hide.bs.modal', () => {
  localVideo.pause();
  localVideo.currentTime = 0; // rewind video
});

// mission & vision
function showContent(id) {
  const sections = document.querySelectorAll('.content-box');
  const buttons = document.querySelectorAll('.fancy-btn-lg');

  // Remove active class from all sections and hide
  sections.forEach(section => {
    section.classList.remove('active');
    setTimeout(() => section.style.display = 'none', 400); // wait for fade-out
  });

  // Add active class to selected section
  setTimeout(() => {
    const target = document.getElementById(id);
    if (target) {
      target.style.display = 'block';
      setTimeout(() => target.classList.add('active'), 50);
    }
  }, 400); // wait until all others are hidden

  // Set active button
  buttons.forEach(btn => {
    btn.classList.remove('active-btn');
    if (btn.getAttribute('data-id') === id) {
      btn.classList.add('active-btn');
    }
  });
}


  document.getElementById("viewMoreBtn").addEventListener("click", function(e) {
    e.preventDefault();
    this.classList.add("clicked");
  });





  