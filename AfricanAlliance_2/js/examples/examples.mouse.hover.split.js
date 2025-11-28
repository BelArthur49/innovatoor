/*
Name: 			Mouse Hover Split
Written by: 	Lorem ipsum Themes - (http://www.Lorem ipsum.net)
Theme Version:	13.0.0
*/

(($ => {
    // Mouse Hover Split
    const left = document.getElementById("side-left");

    const handleMove = ({ clientX }) => {
        left.style.width = `${clientX / window.innerWidth * 100}%`;
    }

    document.onmousemove = e => handleMove(e);

    document.ontouchmove = ({ touches }) => handleMove(touches[0]);
})).apply(this, [jQuery]);