/**
 * Painter object is designed for some painting work about higlighting,
 * including rendering, cleaning...
 * No need to instantiate repeatly. A Selector instance will bind a Painter instance.
 */

import {wrapSelection, getSelectedNodes, normalizeSiblingText} from './dom-painter.service';
import {getSelectionsByRoot, forEach} from '@src/util/dom';
import {initStylesheet} from './painter-style.service';
import {
    WRAP_TAG,
    ID_DIVISION,
    DATASET_IDENTIFIER,
    CAMEL_DATASET_IDENTIFIER,
    CAMEL_DATASET_IDENTIFIER_EXTRA
} from '../util/const';
import SelectionRange from '@src/selection-engine/selection-range.service';
import SelectionSource from '@src/selection-engine/selection-source.service';
import { SelectionOptions, PainterOptions, HookMap, ERROR } from '@src/model/selection-types.model';

export default class Painter {
    options: PainterOptions;
    $style: HTMLStyleElement;
    styleId: string;
    hooks: HookMap;

    constructor(hooks: HookMap) {
        this.hooks = hooks;
    }

    updateOptions(options: SelectionOptions, stylesheet?: string){
        if(stylesheet){
            initStylesheet(stylesheet);
        }

        this.options = {
            $root: options.$root,
            exceptSelectors: options.exceptSelectors,
            className: options.style.className
        };
    }

    /* =========================== render =========================== */
    selectionRange(range: SelectionRange): Array<HTMLElement> {
        if (!range.frozen) {
            throw ERROR.SELECTION_RANGE_FROZEN;
        }

        const {$root, className, exceptSelectors} = this.options;
        const hooks = this.hooks;

        let selectedNodes = getSelectedNodes($root, range.start, range.end, exceptSelectors);
        if (!hooks.Render.SelectedNodes.isEmpty()) {
            selectedNodes = hooks.Render.SelectedNodes.call(range.id, selectedNodes);
        }

        return selectedNodes.map(n => {
            let node = wrapSelection(n, range, className);
            if (!hooks.Render.WrapNode.isEmpty()) {
                node = hooks.Render.WrapNode.call(range.id, node);
            }
            return node;
        });
    }

    selectionSource(sources: SelectionSource | SelectionSource[]): Array<SelectionSource> {
        const list = Array.isArray(sources)
            ? sources as SelectionSource[]
            : [sources as SelectionSource];

        const renderedSources: Array<SelectionSource> = [];
        list.forEach(s => {
            if (!(s instanceof SelectionSource)) {
                console.error(ERROR.SOURCE_TYPE_ERROR);
                return;
            }
            const range = s.deSerialize(this.options.$root);
            const nodes = this.selectionRange(range);
            if (nodes.length > 0) {
                renderedSources.push(s);
            }
            else {
                console.warn(ERROR.SELECTION_SOURCE_NONE_RENDER, s);
            }
        });

        return renderedSources;
    }
    /* ============================================================== */

    /* =========================== clean =========================== */
    // id: target id - selection with this id should be clean
    removeSelection(id: string) {
        // whether extra ids contains the target id
        const reg = new RegExp(`(${id}\\${ID_DIVISION}|\\${ID_DIVISION}?${id}$)`);

        const hooks = this.hooks;
        const $spans = document.querySelectorAll(`${WRAP_TAG}[data-${DATASET_IDENTIFIER}]`) as NodeListOf<HTMLElement>;

        // nodes to remove
        const $toRemove: HTMLElement[] = [];
        // nodes to update main id
        const $idToUpdate: HTMLElement[] = [];
        // nodes to update extra id
        const $extraToUpdate: HTMLElement[] = [];

        for (let i = 0; i < $spans.length; i++) {
            const spanId = $spans[i].dataset[CAMEL_DATASET_IDENTIFIER];
            const spanExtraIds = $spans[i].dataset[CAMEL_DATASET_IDENTIFIER_EXTRA];
            // main id is the target id and no extra ids --> to remove
            if (spanId === id && !spanExtraIds) {
                $toRemove.push($spans[i]);
            }
            // main id is the target id but there is some extra ids -> update main id & extra id
            else if (spanId === id) {
                $idToUpdate.push($spans[i]);
            }
            // main id isn't the target id but extra ids contains it -> just remove it from extra id
            else if (spanId !== id && reg.test(spanExtraIds)) {
                $extraToUpdate.push($spans[i]);
            }
        }

        $toRemove.forEach($s => {
            const $parent = $s.parentNode;
            const $fr = document.createDocumentFragment();
            forEach($s.childNodes, $c => $fr.appendChild($c.cloneNode(false)));
            const $prev = $s.previousSibling;
            const $next = $s.nextSibling;
            $parent.replaceChild($fr, $s);
            // there are bugs in IE11, so use a more reliable function
            normalizeSiblingText($prev, true);
            normalizeSiblingText($next, false);
            hooks.Remove.UpdateNodes.call(id, $s, 'remove');
        });

        $idToUpdate.forEach($s => {
            const dataset = $s.dataset;
            const ids = dataset[CAMEL_DATASET_IDENTIFIER_EXTRA].split(ID_DIVISION);
            dataset[CAMEL_DATASET_IDENTIFIER] = ids.shift();
            dataset[CAMEL_DATASET_IDENTIFIER_EXTRA] = ids.join(ID_DIVISION);
            hooks.Remove.UpdateNodes.call(id, $s, 'id-update');
        });

        $extraToUpdate.forEach($s => {
            const extraIds = $s.dataset[CAMEL_DATASET_IDENTIFIER_EXTRA];
            $s.dataset[CAMEL_DATASET_IDENTIFIER_EXTRA] = extraIds.replace(reg, '');
            hooks.Remove.UpdateNodes.call(id, $s, 'extra-update');
        });
    }

    removeAllSelection() {
        const $spans = getSelectionsByRoot(this.options.$root);
        $spans.forEach($s => {
            const $parent = $s.parentNode;
            const $fr = document.createDocumentFragment();
            forEach($s.childNodes, $c => $fr.appendChild($c.cloneNode(false)));
            $parent.replaceChild($fr, $s);
        });
    }
    /* ============================================================== */
};
