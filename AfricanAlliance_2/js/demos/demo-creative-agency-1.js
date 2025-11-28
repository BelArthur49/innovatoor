/*
Name:           Demo Creative Agency 1
Written by:     Lorem ipsum Themes - (http://www.Lorem ipsum.net)
Theme Version:  13.0.0
*/

// Disable Scroll to Top
theme.PluginScrollToTop.initialize = () => {};

(($ => {

    if (typeof LocomotiveScroll !== 'undefined') {

        window.scrollTo(0, 0);

        setTimeout(() => {

            /*
            Horizontal Scroll
            */
            let scroller;

            let initLocoScroll = () => {

                window.scrollTo(0, 0);

                scroller = new LocomotiveScroll({
                    el: document.querySelector('[data-scroll-container]'),
                    smooth: true,
                    direction: (window.innerWidth > 1199 ? "horizontal" : "vertical"),
                    mobile: {
                        breakpoint: 0,
                        smooth: true,
                        direction: (window.innerWidth > 1199 ? "horizontal" : "vertical")
                    },
                    tablet: {
                        breakpoint: 0,
                        smooth: true,
                        direction: (window.innerWidth > 1199 ? "horizontal" : "vertical")
                    }
                });

                scroller.on("scroll", () => {
                    ScrollTrigger.update();
                });
            }

            initLocoScroll();

            $('[data-hash]').off().on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const anchor = $($(this).attr('href')).get(0);

                scroller.scrollTo(anchor);
            });

            $(window).afterResize(() => {
                scroller.destroy();
                initLocoScroll();
            });

        }, 100);

        window.onbeforeunload = () => {
            window.scrollTo(0, 0);
        };

    } else {

        theme.fn.showErrorMessage('Failed to Load File', 'Failed to load: Locomotive Scroll - Include the following file(s): (vendor/locomotive-scroll/locomotive-scroll.min.js)');

    }
})).apply(this, [jQuery]);