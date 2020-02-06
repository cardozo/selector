import SelectionSource from './selection-source.service';
import {DomNode, ERROR, HookMap} from '../model/selection-types.model';
import {getDomRange, removeSelection} from './selection.provider';
import {getDomMeta} from './selection-dom.service';

import Hook from '@src/util/hook';
import uuid from '@src/util/uuid';

class SelectionRange {

    start: DomNode;
    end: DomNode;
    text: string;
    id: string;
    frozen: boolean;

    constructor(start: DomNode, end: DomNode,text: string,id: string,frozen: boolean = false) {
        
        if (start.$node.nodeType !== 3 || end.$node.nodeType !== 3) {
            console.warn(ERROR.RANGE_NODE_INVALID);
        }

        this.start = start;
        this.end = end;
        this.text = text;
        this.frozen = frozen;
        this.id = id;
    }

    static removeDomRange = removeSelection;

    static fromSelection(idHook: Hook) {
        // debugger;
        const range = getDomRange();
        if (!range) {
            return null;
        }

        const startSentence: DomNode = {
            $node: range.startContainer,
            offset: range.startOffset
        };
        const endSentence: DomNode = {
            $node: range.endContainer,
            offset: range.endOffset
        }

        const text = range.toString();
        let id = idHook.call(startSentence, endSentence, text);
        id = id !== undefined && id !== null ? id : uuid();

        return new SelectionRange(startSentence, endSentence, text, id);
    }

    serialize($root: HTMLElement | Document, hooks: HookMap): SelectionSource {
        const startMeta = getDomMeta(this.start.$node as Text, this.start.offset, $root);
        const endMeta = getDomMeta(this.end.$node as Text, this.end.offset, $root);

        let extra;
        if (!hooks.Serialize.RecordInfo.isEmpty()) {
            extra = hooks.Serialize.RecordInfo.call(this.start, this.end, $root);
        }

        this.frozen = true;
        return new SelectionSource(startMeta, endMeta, this.text, this.id, extra);
    }    
}

export default SelectionRange;

