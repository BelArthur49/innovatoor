/*
Name: 			Style Switcher Initializer
Written by: 	lorem Themes - (http://www.lorem.net)
Version: 		2.0
*/

if (typeof localStorage !== "undefined") {
    if (localStorage.getItem('Lorem-skin.css') !== null && !document.querySelector('html').hasAttribute('data-style-switcher-options')) {

        const css = localStorage.getItem('Lorem-skin.css'),
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

    if (localStorage.getItem('Lorem-layout') !== null && !document.querySelector('html').hasAttribute('data-style-switcher-options')) {

        if (localStorage.getItem('Lorem-layout') == 'boxed') {
            document.querySelector('html').className += ' ' + 'boxed';
        }

    }
}