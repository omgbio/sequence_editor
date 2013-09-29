
// TODO apparently doesn't work in IE < 9
function setCaret(el, start) {
    if(!el) {
        return false
    }
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el.childNodes[0], start);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
}

function getCaretElement() {
    var sel = window.getSelection();
    if(!sel) {
        return null;
    }
    // if the selection doesn't begin and end in
    // the same element
    if(sel.anchorNode != sel.focusNode) {
        return null;
    }
    return sel.anchorNode;
}

var SequenceEditor = {

    className: 'seqed',

    name: "Sequence Editor",
    // used by editor instances to check if parent is correct
    is_sequence_editor_parent: true,
    editors: [],

    create: function(container, p) {
        var editor = new this.instance(this, container, p);
        this.editors.push(editor);
        return editor;
    },

    err: function(msg) {
        var errmsg = '['+(this.name || this.parent.name)+' error] : '+msg;
        console.log(errmsg);
    },

    instance: function(parent, container, p) {
        
        // current position within the current word element
        this.char_index = 0; 

        this.modifier_codes = {
            16: 'shift',
            17: 'ctrl',
            18: 'alt',
//            20: 'CAPS'
        };

        this.init = function(parent, container, p) {

            if(!parent || !parent.is_sequence_editor_parent) {
                console.log("Error: Looks like you called SequenceEditor.init directly. Call SequenceEditor.create instead.");
                return null;
            }

            this.parent = parent;
            this.err = this.parent.err;
            this.container = container;
            this.p = p || {};
            this.editor = null;
            this.text = null;
/*
            if(!this.p.data) {
                this.err('No data given. Cannot visualize plasmid with no data.');
                return null;
            }
*/  
            if(!$(this.container)) {
                this.err('Container element does not exist.');
                return null;
            }

            this.p = $.extend(p, {
                allowed_chars: ['A', 'T', 'G', 'C'],
                word_length: 3
            });

            this.create_thyself();
        };

        this.create_thyself = function() {

            var editor = document.createElement('DIV');
            editor.className = 'seqed';
//            el.tabindex = "1";
            editor.contentEditable = true;
            //  https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.contentEditable?redirectlocale=en-US&redirectslug=Web%2FAPI%2FElement.contentEditable

            this.bind_event_listeners(editor);

            var text = document.createElement('DIV');
            text.className = 'text';
            editor.appendChild(text);
            
            $(this.container).append(editor);

            this.text = $(text);
            this.editor = $(editor);
        };

        this.bind_event_listeners = function(el) {

            $(el).bind('keydown', this.on_keydown.bind(this));
            $(el).bind('keyup', this.on_keyup.bind(this));

            $(el).bind('focus', this.on_focus.bind(this));

        };         

        this.is_modifier_key = function(keycode) {
            if(this.modifier_codes[keycode]) {
                return true;
            }
            return false;
        };

        this.on_focus = function(e) {

        };

        this.on_keydown = function(e) {
            var keycode = e.which;
            if(this.is_modifier_key(keycode)) {
                e.preventDefault();
                return;
            }

            var char = String.fromCharCode(keycode);
            
            // selective allow certain key combinations
            // to pass through to the browser
            if(e.ctrlKey) {
                if(char == 'R') {
                    return true;
                }
            }
            e.preventDefault();

            this.insert_char(0, char);
        };

        this.on_keyup = function(e) {
            var keycode = e.which;
            var char = String.fromCharCode(keycode);
            return false;
        };

        this.is_char_allowed = function(char) {
            if(this.p.allowed_chars.indexOf(char) > -1) {
                return true;
            }
            return false;
        };

        this.get_selected_word = function() {
            var el = getCaretElement();
            if(!el) {
                return null;
            }
            // not a word!
            if(!$(el).hasClass('word')) {
                el = $(el).parents('.word');
                if(!el || (el.length == 0) || !el.parents(this.className)) {
                    return null;
                }
                return el;
            }
            return el;
        };

        this.insert_char = function(location, char) {
            if(!this.is_char_allowed(char)) {
                return false;
            }
            console.log('insert char');
            var el = this.get_selected_word();
            if(!el) {
                el = this.new_word(char);
                this.text.append(el);
                setCaret(el, 1);
            } else {
                var html = el.html();
                if(html.length >= this.p.word_length) {
                    var el_new = this.new_word(char);
                    $(el).after(el_new);
                    setCaret(el_new, 1);
                } else {
                    html += char;
                    el.html(html);
                    setCaret(el[0], html.length);
                }
            }
        };

        this.new_word = function(contents) {
            var el = document.createElement('DIV');
            el.className = 'word';
            el.innerHTML = contents;
            return el;
        };

        this.init(parent, container, p);
    }
};

