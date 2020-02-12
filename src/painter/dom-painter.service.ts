import SelectionRange from '../selection-engine/selection-range.service';
import {isSelectionWrapNode} from '../util/dom';
import {
    WRAP_TAG,
    ID_DIVISION,
    DEFAULT_OPTIONS,
    CAMEL_DATASET_IDENTIFIER,
    CAMEL_DATASET_IDENTIFIER_EXTRA,
    DATASET_IDENTIFIER,
    DATASET_SPLIT_TYPE,
    DATASET_IDENTIFIER_EXTRA
} from '../util/const';
import { SelectedNodeType, SplitType, DomNode, SelectedNode } from '@src/model/selection-types.model';

/**
 * 支持的选择器类型
 *  - class: .title, .main-nav
 *  - id: #nav, #js-toggle-btn
 *  - tag: div, p, span
 */
const isMatchSelector = ($node: HTMLElement, selector: string): boolean => {
    if (!$node) {
        return false;
    }
    if (/^\./.test(selector)) {
        const className = selector.replace(/^\./, '');
        return $node && $node.classList.contains(className);
    }
    else if (/^#/.test(selector)) {
        const id = selector.replace(/^#/, '');
        return $node && $node.id === id;
    }
    else {
        const tagName = selector.toUpperCase()
        return $node && $node.tagName === tagName;
    }
}

/**
 * If start node and end node is the same, don't need to tranvers the dom tree.
 */
function getNodesIfSameStartEnd(
    $startNode: Text,
    startOffset: number,
    endOffset: number,
    exceptSelectors: Array<string>
) {
    let $element = $startNode as Node;
    while ($element) {
        if ($element.nodeType === 1
            && exceptSelectors
            && exceptSelectors.some(s => isMatchSelector($element as HTMLElement, s))
        ) {
            return [];
        }
        $element = $element.parentNode;
    }

    $startNode.splitText(startOffset);
    let passedNode = $startNode.nextSibling as Text;
    passedNode.splitText(endOffset - startOffset);
    return [{
        $node: passedNode,
        type: SelectedNodeType.text,
        splitType: SplitType.both
    }];
}

/**
 * get all the dom nodes between the start and end node
 */
export const getSelectedNodes = (
    $root: HTMLElement | Document,
    start: DomNode,
    end: DomNode,
    exceptSelectors: Array<string>
): SelectedNode[] => {
    const $startNode = start.$node;
    const $endNode = end.$node;
    const startOffset = start.offset;
    const endOffset = end.offset;

    // split current node when the start-node and end-node is the same
    if ($startNode === $endNode && $startNode instanceof Text) {
        return getNodesIfSameStartEnd($startNode, startOffset, endOffset, exceptSelectors);
    }

    const nodeStack: Array<HTMLElement | Document | ChildNode | Text> = [$root];
    const selectedNodes: SelectedNode[] = [];

    let withinSelectedRange = false;
    let curNode: Node = null;
    while (curNode = nodeStack.pop()) {
        // do not traverse the excepted node
        if (
            curNode.nodeType === 1
            && exceptSelectors
            && exceptSelectors.some(s => isMatchSelector(curNode as HTMLElement, s))
        ) {
            continue;
        }

        const children = curNode.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
            nodeStack.push(children[i]);
        }

        // only collect text nodes
        if (curNode === $startNode) {
            if (curNode.nodeType === 3) {
                (curNode as Text).splitText(startOffset);
                const node = curNode.nextSibling as Text;
                selectedNodes.push({
                    $node: node,
                    type: SelectedNodeType.text,
                    splitType: SplitType.head
                });

            }
            // meet the start-node (begin to traverse)
            withinSelectedRange = true;
        }
        else if (curNode === $endNode) {
            if (curNode.nodeType === 3) {
                const node = (curNode as Text);
                node.splitText(endOffset);
                selectedNodes.push({
                    $node: node,
                    type: SelectedNodeType.text,
                    splitType: SplitType.tail
                });
            }
            // meet the end-node
            break;
        }
        // handle text nodes between the range
        else if (withinSelectedRange && curNode.nodeType === 3) {
            selectedNodes.push({
                $node: curNode as Text,
                type: SelectedNodeType.text,
                splitType: SplitType.none
            });
        }
    }
    return selectedNodes;
};

function addClass($el: HTMLElement, className?: string | Array<string>): HTMLElement  {
    let classNames = Array.isArray(className) ? className : [className];
    classNames = classNames.length === 0 ? [DEFAULT_OPTIONS.style.className] : classNames;
    classNames.forEach(c => $el.classList.add(c));
    return $el;
}

/**
 * Wrap a common wrapper.
 */
function wrapNewNode(
    selected: SelectedNode,
    range: SelectionRange,
    className: string | Array<string>
): HTMLElement {
    let element: HTMLElement;
    element = document.createElement(WRAP_TAG);
    addClass(element, className);

    element.appendChild(selected.$node.cloneNode(false));
    selected.$node.parentNode.replaceChild(element, selected.$node);

    element.setAttribute(`data-${DATASET_IDENTIFIER}`, range.id);
    element.setAttribute(`data-${DATASET_SPLIT_TYPE}`, selected.splitType);
    element.setAttribute(`data-${DATASET_IDENTIFIER_EXTRA}`, '');
    element.setAttribute('id', range.id);

    return element;
}

/**
 * Split and wrapper each one.
 */
function wrapPartialNode(
    selected: SelectedNode,
    range: SelectionRange,
    className: string | Array<string>
): HTMLElement {
    let element: HTMLElement = document.createElement(WRAP_TAG);

    const parent = selected.$node.parentNode as HTMLElement;
    const previousNode = selected.$node.previousSibling;
    const nextNode = selected.$node.nextSibling;
    const $fr = document.createDocumentFragment();
    const parentId = parent.dataset[CAMEL_DATASET_IDENTIFIER];
    const parentExtraId = parent.dataset[CAMEL_DATASET_IDENTIFIER_EXTRA];
    const extraInfo = parentExtraId ? parentId + ID_DIVISION + parentExtraId : parentId;

    element.setAttribute(`data-${DATASET_IDENTIFIER}`, range.id);
    element.setAttribute(`data-${DATASET_IDENTIFIER_EXTRA}`, extraInfo);
    element.setAttribute('id', range.id);
    element.appendChild(selected.$node.cloneNode(false));

    let headSplit = false;
    let tailSplit = false;
    let splitType: SplitType;

    if (previousNode) {
        const $span = parent.cloneNode(false);
        $span.textContent = previousNode.textContent;
        $fr.appendChild($span);
        headSplit = true;
    }

    addClass(element, className);
    $fr.appendChild(element);

    if (nextNode) {
        const $span = parent.cloneNode(false);
        $span.textContent = nextNode.textContent;
        $fr.appendChild($span);
        tailSplit = true;
    }

    if (headSplit && tailSplit) {
        splitType = SplitType.both;
    }
    else if (headSplit) {
        splitType = SplitType.head;
    }
    else if (tailSplit) {
        splitType = SplitType.tail;
    }
    else {
        splitType = SplitType.none;
    }

    element.setAttribute(`data-${DATASET_SPLIT_TYPE}`, splitType);
    parent.parentNode.replaceChild($fr, parent);

    return element;
}

/**
 * Just update id info (no wrapper updated).
 */
function wrapOverlapNode(
    selected: SelectedNode,
    range: SelectionRange,
    className: string | Array<string>
): HTMLElement {
    const parent = selected.$node.parentNode as HTMLElement;
    let element: HTMLElement = parent;

    addClass(element, className);

    const dataset = parent.dataset;
    const formerId = dataset[CAMEL_DATASET_IDENTIFIER];
    dataset[CAMEL_DATASET_IDENTIFIER] = range.id;
    dataset[CAMEL_DATASET_IDENTIFIER_EXTRA] = dataset[CAMEL_DATASET_IDENTIFIER_EXTRA]
        ? formerId + ID_DIVISION + dataset[CAMEL_DATASET_IDENTIFIER_EXTRA]
        : formerId;

    return element;
}

/**
 * wrap a dom node with selected wrapper
 * 
 * Because of supporting the selected-overlapping,
 * selector can't just wrap all nodes in a simple way.
 * There are three types:
 *  - wrapping a whole new node (without any wrapper)
 *  - wrapping part of the node
 *  - wrapping the whole wrapped node
 */
export const wrapSelection = (
    selected: SelectedNode,
    range: SelectionRange,
    className?: string | Array<string>
): HTMLElement => {

    const parent = selected.$node.parentNode as HTMLElement;
    const previousNode = selected.$node.previousSibling;
    const nextNode = selected.$node.nextSibling;

    let element: HTMLElement;

    // text node, not in a selected wrapper -> should be wrapped in a selected wrapper
    if (!isSelectionWrapNode(parent)) {
        element = wrapNewNode(selected, range, className);
    }
    // text node, in a selected wrap -> should split the existing selected wrapper
    else if (isSelectionWrapNode(parent) && (previousNode || nextNode)) {
        element = wrapPartialNode(selected, range, className);
    }
    // completely overlap (with a selected wrap) -> only add extra id info
    else {
        element = wrapOverlapNode(selected, range, className);
    }

    return element;
};

/**
 * merge the adjacent text nodes
 * .normalize() API has some bugs in IE11
 */
export const normalizeSiblingText = ($s: Node, isNext: boolean = true) => {
    if (!$s || $s.nodeType !== 3) {
        return;
    }
    const $sibling = isNext ? $s.nextSibling : $s.previousSibling;
    if ($sibling.nodeType !== 3) {
        return;
    }
    const text = $sibling.nodeValue;
    $s.nodeValue = isNext ? ($s.nodeValue + text) : (text + $s.nodeValue);
    $sibling.parentNode.removeChild($sibling);
}