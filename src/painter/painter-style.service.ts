/**
 * inject styles
 */
import {STYLESHEET_ID, STYLESHEET_TEXT, STYLESHEET_TEXT_PURPLE} from '@src/util/const';

export function initDefaultStylesheet () {
    const styleId = STYLESHEET_ID;

    let $style: HTMLStyleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!$style) {
        const $cssNode = document.createTextNode(STYLESHEET_TEXT);
        $style = document.createElement('style');
        $style.id = this.styleId;
        $style.appendChild($cssNode);
        document.head.appendChild($style);
    }

    return $style;
}

export function initPurpleStylesheet () {
    const styleId = STYLESHEET_TEXT_PURPLE;

    let $style: HTMLStyleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!$style) {
        const $cssNode = document.createTextNode(STYLESHEET_TEXT_PURPLE);
        $style = document.createElement('style');
        $style.id = this.styleId;
        $style.appendChild($cssNode);
        document.head.appendChild($style);
    }

    return $style;
}
