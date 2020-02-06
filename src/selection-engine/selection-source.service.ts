/**
 * SelectionSource Class (HSource)
 * This Object can be deSerialized to HRange.
 * Also it has the ability for persistence.
 */

import {DomMeta} from '../model/selection-types.model';
import SelectionRange from './selection-range.service';
import {queryElementNode, getTextChildByOffset} from './selection-dom.service';

class SelectionSource {

    startMeta: DomMeta;
    endMeta: DomMeta;
    text: string;
    id: string;
    extra?: any;
    __isSelectionSource: any;

    constructor(startMeta: DomMeta, endMeta: DomMeta, text: string, id: string, extra?: any) {
        this.startMeta = startMeta;
        this.endMeta = endMeta;
        this.text = text;
        this.id = id;
        this.__isSelectionSource = {};
        if (extra) {
            this.extra = extra;
        }
    }

    deSerialize($root: HTMLElement | Document): SelectionRange {
        const {start, end} = queryElementNode(this, $root);
        const startInfo = getTextChildByOffset(start, this.startMeta.textOffset);
        const endInfo = getTextChildByOffset(end, this.endMeta.textOffset);

        const range = new SelectionRange(
            startInfo,
            endInfo,
            this.text,
            this.id,
            true
        );
        return range;
    }
}

export default SelectionSource;
