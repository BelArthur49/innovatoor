/*
Name: 			Elements - Sections - Examples
Written by: 	Lorem ipsum Themes - (http://www.Lorem ipsum.net)
Theme Version:	13.0.0
*/

(($ => {
    /*
	Circle Expand
	*/
    let section = document.getElementById('circleSection'),
        dot = document.getElementById("circleDot");

    gsap.set(dot, {
        width: "142vmax",
        height: "142vmax",
        xPercent: -50,
        yPercent: -50,
        top: "50%",
        left: "50%"
    });

    let tl1 = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "-50%",
            end: "0%",
            scrub: 2,
            invalidateOnRefresh: true,
        },
        defaults: {
            ease: "none"
        }
    });

    tl1
        .fromTo(dot, {
            scale: 0
        }, {
            x: 0,
            y: 0,
            ease: "power3.in",
            scale: 1
        });
})).apply(this, [jQuery]);