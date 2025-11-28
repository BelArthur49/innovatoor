/*
Name: 			Locomotive Scroll Examples
Written by: 	Lorem ipsum Themes - (http://www.Lorem ipsum.net)
Theme Version:	13.0.0
*/

(($ => {
    /*
	Locomotive
	*/
    if (typeof LocomotiveScroll !== 'undefined') {

        const scroller = new LocomotiveScroll({
            el: document.querySelector("[data-scroll-container]"),
            smooth: true,
            mobile: {
                breakpoint: 0,
                smooth: true
            },
            tablet: {
                breakpoint: 0,
                smooth: true
            }
        });

        // Scroll to Top
        $('.scroll-to-top').on('click', e => {
            scroller.scrollTo(0);
        });

    } else {

        theme.fn.showErrorMessage('Failed to Load File', 'Failed to load: Locomotive Scroll - Include the following file(s): (vendor/locomotive-scroll/locomotive-scroll.min.js)');

    }
})).apply(this, [jQuery]);