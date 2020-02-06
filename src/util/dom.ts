import {
    WRAP_TAG,
    ID_DIVISION,
    DATASET_IDENTIFIER,
    CAMEL_DATASET_IDENTIFIER,
    CAMEL_DATASET_IDENTIFIER_EXTRA
} from './const';


export const isSelectionWrapNode = ($node: HTMLElement): boolean => (
    !!$node.dataset && !!$node.dataset[CAMEL_DATASET_IDENTIFIER]
);

export const getSelectionId = ($node: HTMLElement): string => {
    if (isSelectionWrapNode($node)) {
        return $node.dataset[CAMEL_DATASET_IDENTIFIER];
    }
    return '';
};

export const getSelectionsByRoot = ($roots: HTMLElement | Array<HTMLElement>): Array<HTMLElement> => {
    if (!Array.isArray($roots)) {
        $roots = [$roots];
    }

    const $wraps = [];
    for (let i = 0; i < $roots.length; i++) {
        const $list = $roots[i].querySelectorAll(`${WRAP_TAG}[data-${DATASET_IDENTIFIER}]`);
        $wraps.concat($list);
    }
    return $wraps;
}

export const getSelectionById = ($root: HTMLElement, id: String): Array<HTMLElement> => {
    const $selections = [];
    const reg = new RegExp(`(${id}\\${ID_DIVISION}|\\${ID_DIVISION}?${id}$)`);
    const $list = $root.querySelectorAll(`${WRAP_TAG}[data-${DATASET_IDENTIFIER}]`);
    for (let k = 0; k < $list.length; k++) {
        const $n = $list[k] as HTMLElement;
        const nid = $n.dataset[CAMEL_DATASET_IDENTIFIER];
        if (nid === id) {
            $selections.push($n);
            continue;
        }
        const extraId = $n.dataset[CAMEL_DATASET_IDENTIFIER_EXTRA];
        if (reg.test(extraId)) {
            $selections.push($n);
            continue;
        }
    }
    return $selections;
};

export const forEach = ($nodes: NodeList, cb: Function): void => {
    for (let i = 0; i < $nodes.length; i++) {
        cb($nodes[i], i, $nodes);
    }
};