import camel from './camel';
export const ID_DIVISION = ';';
export const LOCAL_STORE_KEY = 'selection';
export const STYLESHEET_ID = 'selection-style';
export const WRAP_TAG = 'span';

export const DATASET_IDENTIFIER = 'selection-id';
export const DATASET_IDENTIFIER_EXTRA = 'selection-id-extra';
export const DATASET_SPLIT_TYPE = 'selection-split-type';
export const CAMEL_DATASET_IDENTIFIER = camel(DATASET_IDENTIFIER);
export const CAMEL_DATASET_IDENTIFIER_EXTRA = camel(DATASET_IDENTIFIER_EXTRA);
export const CAMEL_DATASET_SPLIT_TYPE = camel(DATASET_SPLIT_TYPE);

export const DEFAULT_OPTIONS = {
    $root: window.document.documentElement,
    exceptSelectors: null,
    style: {
        className: 'selection-wrap'
    }
};

export const STYLESHEET_TEXT = `
    .${DEFAULT_OPTIONS.style.className} {
        background: #ff9;
        cursor: pointer;
    }
    .${DEFAULT_OPTIONS.style.className}.active {
        background: #ffb;
    }
`;


export const PURPLE_OPTIONS = {
    $root: window.document.documentElement,
    exceptSelectors: null,
    style: {
        className: 'selection-purple'
    }
};

export const STYLESHEET_TEXT_PURPLE = `
    .${PURPLE_OPTIONS.style.className} {
        background: #a119e0;
        cursor: pointer;
    }
    .${PURPLE_OPTIONS.style.className}.active {
        background: #a119e0;
    }
`;
