import '@src/util/dataset.polyfill';
import EventEmitter from '@src/util/event.emitter';
import {EventType, SelectionOptions, ERROR, DomNode, DomMeta, HookMap} from './model/selection-types.model';
import {isSelectionWrapNode, getSelectionById, getSelectionsByRoot, getSelectionId} from '@src/util/dom';
import {DEFAULT_OPTIONS, STYLESHEET_TEXT} from '@src/util/const';
import uuid from '@src/util/uuid';
import Hook from '@src/util/hook';
import Cache from '@src/data/cache';
import Painter from '@src/painter/painter.service';
import SelectionRange from './selection-engine/selection-range.service';
import SelectionSource from './selection-engine/selection-source.service';

export default class Selector extends EventEmitter {
    static event = EventType;

    private _hoverId: string;
    options: SelectionOptions;
    hooks: HookMap;
    painter: Painter;
    cache: Cache;

    lastCreated: SelectionSource;

    constructor(options: SelectionOptions) {
        super();
        this.options = DEFAULT_OPTIONS;
        
        this.hooks = this._getHooks();
        this.setOption(options, STYLESHEET_TEXT)
        
        this.cache = new Cache();
        
        this.options.$root.addEventListener('mouseover', this._handleSelectionHover);
        this.options.$root.addEventListener('click', this._handleSelectionClick);
    }

    private _getHooks = () => ({
        Render: {
            UUID: new Hook('Render.UUID'),
            SelectedNodes: new Hook('Render.SelectedNodes'),
            WrapNode: new Hook('Render.WrapNode')
        },
        Serialize: {
            RecordInfo: new Hook('Serialize.RecordInfo')
        },
        Remove: {
            UpdateNodes: new Hook('Remove.UpdateNodes')
        }
    });

    private _selectionFromHRange = (range: SelectionRange): SelectionSource => {
        const source: SelectionSource = range.serialize(this.options.$root, this.hooks);
        const $wraps = this.painter.selectionRange(range);
        if ($wraps.length === 0) {
            console.warn(ERROR.DOM_SELECTION_EMPTY);
            return null;
        }
        this.cache.save(source);
        this.emit(EventType.CREATE, {sources: [source], type: 'from-input'}, this);
        this.lastCreated = source;
        return source;
    }

    private _highlighFromHSource(sources: SelectionSource[] | SelectionSource = []) {
        const renderedSources: Array<SelectionSource> = this.painter.selectionSource(sources);
        this.emit(EventType.CREATE, {sources: renderedSources, type: 'from-store'}, this);
        this.lastCreated = renderedSources[renderedSources.length -1];
        this.cache.save(sources);
    }

    private _handleSelection = (e?: Event) => {
        const range = SelectionRange.fromSelection(this.hooks.Render.UUID);

        if (range) {
            this.emit(EventType.SELECT, range);
        } else {
            this.emit(EventType.UNSELECT);
        }
    }

    private _handleReleased = (e?: Event) => {
        const range = SelectionRange.fromSelection(this.hooks.Render.UUID);

        if (range) {
            this.emit(EventType.RELEASE, range);
        }
    }

    public makeSelection(range: SelectionRange) {
        this._selectionFromHRange(range);
        SelectionRange.removeDomRange();
    }

    public makeActionFromSelection() {
        const range = SelectionRange.getDomRange();
        if(range) {
            this.fromRange(range);
            window.getSelection().removeAllRanges();
        }
    }

    private _handleSelectionHover = e => {
        const $target = e.target as HTMLElement;
        if (!isSelectionWrapNode($target)) {
            this._hoverId && this.emit(EventType.HOVER_OUT, {id: this._hoverId}, this, e);
            this._hoverId = null;
            return;
        }

        const id = getSelectionId($target);
        if (this._hoverId === id) {
            return;
        }

        if (this._hoverId) {
            this.emit(EventType.HOVER_OUT, {id: this._hoverId}, this, e);
        }
        this._hoverId = id;
        this.emit(EventType.HOVER, {id: this._hoverId}, this, e);
    }

    private _handleSelectionClick = e => {
        const $target = e.target as HTMLElement;
        if (isSelectionWrapNode($target)) {
            const id = getSelectionId($target);
            this.emit(EventType.CLICK, {id}, this, e);
            return;
        }
    }

    run = () => {
        document.addEventListener('selectionchange', this._handleSelection);
        if('ontouchstart' in document.documentElement) {
            this.options.$root.addEventListener('touchend', this._handleReleased);
        } else {
            this.options.$root.addEventListener('mouseup', this._handleReleased);
        }
    };

    stop = () => {
        document.removeEventListener('selectionchange', this._handleSelection);
        if('ontouchstart' in document.documentElement) {
            this.options.$root.removeEventListener('touchend', this._handleReleased);
        } else {
            this.options.$root.removeEventListener('mouseup', this._handleReleased);
        }
    };

    addClass = (className: string, id?: string) => this.getDoms(id).forEach($n => $n.classList.add(className));
    removeClass = (className: string, id?: string) => this.getDoms(id).forEach($n => $n.classList.remove(className));
    getIdByDom = ($node: HTMLElement): string => getSelectionId($node);
    getDoms = (id?: string): Array<HTMLElement> => id
        ? getSelectionById(this.options.$root, id)
        : getSelectionsByRoot(this.options.$root);

    dispose = () => {
        this.options.$root.removeEventListener('mouseover', this._handleSelectionHover);
        document.removeEventListener('selectionchange', this._handleSelection);
        if('ontouchstart' in document.documentElement) {
            this.options.$root.removeEventListener('touchend', this._handleReleased);
        } else {
            this.options.$root.removeEventListener('mouseup', this._handleReleased);
        }
        this.options.$root.removeEventListener('click', this._handleSelectionClick);
        this.removeAll();
    }

    setOption = (options: SelectionOptions, stylesheet?: string) => {

        this.options = {
            ...this.options,
            ...options
        };

        this.painter = new Painter(this.hooks);
        this.painter.updateOptions(this.options, stylesheet);
    }

    updateOption = (options: SelectionOptions, stylesheet?: string) =>{
        this.options = {
            ...this.options,
            ...options
        };

        this.painter.updateOptions(this.options, stylesheet);
    }

    fromRange = (range: Range): SelectionSource => {

        const start: DomNode = {
            $node: range.startContainer,
            offset: range.startOffset
        };
        const end: DomNode = {
            $node: range.endContainer,
            offset: range.endOffset
        }

        const text = range.toString();
        let id = this.hooks.Render.UUID.call(start, end, text);
        id = id !== undefined && id !== null ? id : uuid();
        const hRange = new SelectionRange(start, end, text, id);
        if (!hRange) {
            console.warn(ERROR.RANGE_INVALID);
            return null;
        }
        return this._selectionFromHRange(hRange);
    }

    fromStore = (start: DomMeta, end: DomMeta, text, id): SelectionSource => {
        try {
            const hs = new SelectionSource(start, end, text, id);
            this._highlighFromHSource(hs);
            return hs;
        }
        catch (err) {
            console.error(err, id, text, start, end);
            return null;
        }
    }

    remove(id: string) {
        if (!id) {
            return;
        }
        this.painter.removeSelection(id);
        this.cache.remove(id);
        this.emit(EventType.REMOVE, {ids: [id]}, this);
    }

    removeAll() {
        this.painter.removeAllSelection();
        const ids = this.cache.removeAll();
        this.emit(EventType.REMOVE, {ids: ids}, this);
    }
}
