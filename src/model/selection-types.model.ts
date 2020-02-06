import Hook from "@src/util/hook";

export interface SelectionOptions {
    $root: HTMLElement;
    exceptSelectors: Array<string>;
    style?: {
        className?: string | Array<string>;
    }
};

export interface PainterOptions {
    $root: HTMLElement;
    className?: string | Array<string>;
    exceptSelectors: Array<string>;
};

export enum SplitType {
    none = 'none',
    head = 'head',
    tail = 'tail',
    both = 'both'
};

export enum ERROR {
    DOM_TYPE_ERROR = '[DOM] Receive wrong node type.',
    DOM_SELECTION_EMPTY = '[DOM] The selection contains no dom node, may be you except them.',
    RANGE_INVALID = '[RANGE] Got invalid dom range, can\'t convert to a valid selection range.',
    RANGE_NODE_INVALID = '[RANGE] Start or end node isn\'t a text node, it may occur an error.',
    DB_ID_DUPLICATE_ERROR = '[STORE] Unique id conflict.',
    CACHE_SET_ERROR = '[CACHE] Cache.data can\'t be set manually, please use .save().',
    SOURCE_TYPE_ERROR = '[SOURCE] Object isn\'t a selection source instance.',
    SELECTION_RANGE_FROZEN = '[SELECTION_RANGE] A selection range must be frozen before render.',
    SELECTION_SOURCE_NONE_RENDER = '[SELECTION_SOURCE] This highliselectionght source isn\'t rendered.'
        + ' May be the exception skips it or the dom structure has changed.'
};

export enum EventType {
    CREATE = 'selection:create',
    REMOVE = 'selection:remove',
    MODIFY = 'selection:modify',
    HOVER = 'selection:hover',
    HOVER_OUT = 'selection:hover-out',
    CLICK = 'selection:click',
};

export enum SelectedNodeType {
    text = 'text',
    span = 'span'
};

export interface SelectedNode {
    $node: Text | Node,
    type: SelectedNodeType,
    splitType: SplitType
};

export interface DomMeta {
    parentTagName: string;
    parentIndex: number;
    textOffset: number;
    extra?: any;
}

export interface DomNode {
    $node: Node;
    offset: number;
}

export interface SelectionPosition {
    start: {
        top: number;
        left: number;
    };
    end: {
        top: number;
        left: number;
    }
}

export type HookMap = {
    Render: {
        UUID: Hook;
        SelectedNodes: Hook;
        WrapNode: Hook;
    };
    Serialize: {
        RecordInfo: Hook;
    };
    Remove: {
        UpdateNodes: Hook;
    }
}
