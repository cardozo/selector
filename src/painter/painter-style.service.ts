export function initStylesheet (stylesheet: string) {
    const styleId = stylesheet;

    let $style: HTMLStyleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!$style) {
        const $cssNode = document.createTextNode(stylesheet);
        $style = document.createElement('style');
        $style.id = this.styleId;
        $style.appendChild($cssNode);
        document.head.appendChild($style);
    }

    return $style;
}
