/*
Name: 			Horizontal Scroll Examples
Written by: 	Okler Themes - (http://www.okler.net)
Theme Version:	12.1.0
*/

(($ => {
    /*
	Horizontal Scroll
	*/
    let locoScrollDefaults = {
	    el: document.querySelector('[data-scroll-container]'),
	    smooth: true,
	    direction: "horizontal",
		mobile: {
			breakpoint: 0,
			smooth: true,
			direction: "horizontal",
		},
		tablet: {
			breakpoint: 0,
			smooth: true,
			direction: "horizontal"
		}
	};

    let locoScroll = new LocomotiveScroll(locoScrollDefaults);

    // GSAP integration
    gsap.registerPlugin(ScrollTrigger);

    locoScroll.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(".smoothScroll", {
	    scrollTop(value) {
	        return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
	    },
	    scrollLeft(value) {
	        return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.x;
	    },

	    getBoundingClientRect() {
	        return {
	            top: 0,
	            left: 0,
	            width: window.innerWidth,
	            height: window.innerHeight
	        };
	    },

	    pinType: document.querySelector(".smoothScroll").style.transform ? "transform" : "fixed"
	});
})).apply( this, [ jQuery ]);