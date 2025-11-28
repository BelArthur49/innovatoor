/*
Name: 			Style Switcher Initializer
Written by: 	Lorem ipsum Themes - (http://www.Lorem ipsum.net)
Version: 		2.0
*/

if (typeof localStorage !== "undefined") {
    if (localStorage.getItem('Lorem ipsum -skin.css') !== null && !document.querySelector('html').hasAttribute('data-style-switcher-options')) {

        const css = localStorage.getItem('Lorem ipsum -skin.css'),
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);

    }

    if (localStorage.getItem('Lorem ipsum -layout') !== null && !document.querySelector('html').hasAttribute('data-style-switcher-options')) {

        if (localStorage.getItem('Lorem ipsum -layout') == 'boxed') {
            document.querySelector('html').className += ' ' + 'boxed';
        }

    }
}