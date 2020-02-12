import './index.css';
import './my.css';
import Selector from '../src/index';
import LocalStore from './local.store';

const selector = new Selector({
    $root: document.getElementById('apostila'),
    exceptSelectors: ['.my-remove-tip', 'pre', 'code']
});

const store = new LocalStore();
const log = console.log.bind(console, '[selector]');

/**
 * create a delete tip
 */
const createTag = (top, left, id) => {
    const $span = document.createElement('span');
    $span.style.left = `${left - 20}px`;
    $span.style.width = `${60}px`;
    $span.style.top = `${top - 25}px`;
    $span.dataset['id'] = id;
    $span.textContent = 'remove';
    $span.classList.add('my-remove-tip');
    document.body.appendChild($span);

    $span.addEventListener('click', function() {
        log('*click remove-tip*', this.dataset.id);
        selector.remove(this.dataset.id);
        this.parentNode.removeChild(this);
    });
};

function getPosition($node) {
    let offset = {
        top: 0,
        left: 0
    };
    while ($node) {
        offset.top += $node.offsetTop;
        offset.left += $node.offsetLeft;
        $node = $node.offsetParent;
    }

    return offset;
}

/**
 * selector event listener
 */
selector
    .on(Selector.event.HOVER, (param) => {
        log('hover -', param.id);
    })
    .on(Selector.event.HOVER_OUT, (param) => {
        log('hover out -', param.id);
    })
    .on(Selector.event.CREATE, (param) => {
        let sources = param.sources;
        log('create -', sources);
        sources.forEach(s => {
            const position = getPosition(selector.getDoms(s.id)[0]);
            createTag(position.top, position.left, s.id);
        });
        sources = sources.map(hs => ({hs}));
        store.save(sources);
    })
    .on(Selector.event.REMOVE, (param) => {
        const ids = param.ids;
        log('remove -', ids);
        ids.forEach(id => store.remove(id));
    })
    .on(Selector.event.MODIFY, (param) => {
        log('modify -', param, arguments);
    })
    .on(Selector.event.SELECT, (range) => {
        log('SELECT', range);
    })
    .on(Selector.event.RELEASE, (range) => {
        log('RELEASE', range);

        if(range && activeStyle) {
            selector.makeSelection(range);
        }
    })
    .on(Selector.event.UNSELECT, () => {
        log('unselect');
    })
    .on(Selector.event.CLICK, (param, selectorRef, event) => {
        log('click -', param.id, selectorRef, event);
    });

/**
 * attach hooks
 */
selector.hooks.Render.SelectedNodes.tap(
    (id, selectedNodes)  => selectedNodes.filter(n => n.$node.textContent)
);

/**
 * retrieve from local store
 */
const storeInfos =  store.getAll();
storeInfos.forEach(
    ({hs}) => selector.fromStore(hs.startMeta, hs.endMeta, hs.text, hs.id)
);

let activeStyle = null;

selector.run();

/**
 * Atualiza o estilo de pintura dentro da lib
 */
function updatePaintingStyle(className, style) {
    const options = {
        style: { className }
    };
    selector.updateOption(options, style);
}

/**
 * Liga todos os botões ou apenas um, para a pintura instantânea
 */
function toggleStyleButtons(button, className) {
    if (activeStyle == className) {
        activeStyle = null;
        for(const paintButton of document.getElementsByClassName('paintbox__button')) {
            paintButton.classList.remove('paintbox__button--disable');
        }
    } else {
        activeStyle = className;
        for(const paintButton of document.getElementsByClassName('paintbox__button')) {
            paintButton.classList.add('paintbox__button--disable');
        }
        button.classList.remove('paintbox__button--disable');
    }
}

/**
 * Altera o estilo de pintura e controla a aparência dos botões de estilo 
 */
function togglePaintingStyle(button, className) {
    updatePaintingStyle(className);
    toggleStyleButtons(button, className);   
    selector.makeActionFromSelection();
}

/**
 * Ativa o click de cada botão de estilo
 */
for(const paintboxButton of document.getElementsByClassName('paintbox__button')) {
    paintboxButton.addEventListener('click', (event) => {
        const button = event.target;
        const className = 'selection-' + button.getAttribute('selection-style');
        togglePaintingStyle(button, className);
    });
}