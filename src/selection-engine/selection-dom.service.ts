
import SelectionSource from './selection-source.service';
import {CAMEL_DATASET_IDENTIFIER} from '@src/util/const';
import { DomNode, DomMeta } from '@src/model/selection-types.model';

/**
 * Devido a sobreposição de texto na mesma área
 */
export const getTextChildByOffset = ($parent: Node, offset: number): DomNode => {
    const nodeStack: Array<Node> = [$parent];

    let $curNode: Node = null;
    let curOffset = 0;
    let startOffset = 0;
    while ($curNode = nodeStack.pop()) {
        const children = $curNode.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
            nodeStack.push(children[i]);
        }

        if ($curNode.nodeType === 3) {
            startOffset = offset - curOffset;
            curOffset += $curNode.textContent.length;
            if (curOffset >= offset) {
                break;
            }
        }
    }

    if (!$curNode) {
        $curNode = $parent;
    }

    return {
        $node: $curNode,
        offset: startOffset
    };
}

export const queryElementNode = (
    hs: SelectionSource,
    $root: HTMLElement | Document
): {start: Node, end: Node} => {
    return {
        start: $root.getElementsByTagName(hs.startMeta.parentTagName)[hs.startMeta.parentIndex],
        end: $root.getElementsByTagName(hs.endMeta.parentTagName)[hs.endMeta.parentIndex],
    };
};

const countGlobalNodeIndex = ($node: Node, $root: Document | HTMLElement): number => {
    const tagName = ($node as HTMLElement).tagName;
    const $list = $root.getElementsByTagName(tagName);
    for (let i = 0; i < $list.length; i++) {
        if ($node === $list[i]) {
            return i;
        }
    }
    return -1;
};

/**
 * text total length in all predecessors (text nodes) in the root node
 * (without offset in current node)
 */
const getTextPreOffset = ($root: Node, $text: Node): number => {
    const nodeStack: Array<Node> = [$root];

    let $curNode: Node = null;
    let offset = 0;
    while ($curNode = nodeStack.pop()) {
        const children = $curNode.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
            nodeStack.push(children[i]);
        }

        if ($curNode.nodeType === 3 && $curNode !== $text) {
            offset += $curNode.textContent.length;
        }
        else if ($curNode.nodeType === 3) {
            break;
        }
    }

    return offset;
}

/**
 * find the original dom parent node (none selected dom)
 */
const getOriginParent = ($node: Text | HTMLElement): HTMLElement => {
    if (
        $node instanceof HTMLElement
        && (!$node.dataset || !$node.dataset[CAMEL_DATASET_IDENTIFIER])
    ) {
        return $node;
    }

    let $originParent = $node.parentNode as HTMLElement;
    while (
        $originParent.dataset
        && $originParent.dataset[CAMEL_DATASET_IDENTIFIER]
    ) {
        $originParent = $originParent.parentNode as HTMLElement;
    }
    return $originParent;
};

export const getDomMeta = ($node: Text | HTMLElement, offset: number, $root: Document | HTMLElement): DomMeta => {
    const $originParent = getOriginParent($node);
    const index = countGlobalNodeIndex($originParent, $root);
    const preNodeOffset = getTextPreOffset($originParent, $node);
    const tagName = $originParent.tagName;

    return {
        parentTagName: tagName,
        parentIndex: index,
        textOffset: preNodeOffset + offset
    };
};
