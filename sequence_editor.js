
// TODO apparently doesn't work in IE < 9
function setCaret(el, start) {
    if(!el) {
        return false
    }
    el.focus();
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el.childNodes[0], start);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function getCaretIndex() {
    var sel = window.getSelection();
    if(!sel) {
        return null;
    }
    if(!sel.isCollapsed) {
        return null;
    }
    return sel.getRangeAt(0).endOffset;
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
//            editor.spellcheck = false;
            editor.contentEditable = true;

            //  https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.contentEditable?redirectlocale=en-US&redirectslug=Web%2FAPI%2FElement.contentEditable

            this.bind_event_listeners(editor);

            var text = document.createElement('DIV');
            text.className = 'text';
            editor.appendChild(text);
            
            $(this.container).append(editor);

            // ugly, but i guess that's how you do it
            $('body').attr('spellcheck', false);

            this.text = $(text);
            this.editor = $(editor);
        };

        this.bind_event_listeners = function(el) {

            $(el).bind('keydown', this.on_keydown.bind(this));
            $(el).bind('keyup', this.on_keyup.bind(this));
            $(el).bind('focus', this.on_focus.bind(this));
            $(el).bind('paste', this.on_paste.bind(this));
            $(el).bind('click', this.on_click.bind(this));
            $(el).bind('mousedown', this.on_mousedown.bind(this));

        };         

        this.is_modifier_key = function(keycode) {
            if(this.modifier_codes[keycode]) {
                return true;
            }
            return false;
        };

        this.on_focus = function(e) {
            console.log("got focus");

        };

        this.on_mousedown = function(e) {

        };

        this.on_click = function(e) {
            if(!$(e.target).hasClass('word')) {
                var word = this.editor.find('.word').first();
                if(!word || (word.length < 1)) {
                    return true;
                }
                setCaret(word[0], 0);
            }
        };


        this.on_paste = function(e) {
            var str = e.originalEvent.clipboardData.getData('text/plain');
            this.insert_string(str);
            e.preventDefault();
        };

        this.on_keydown = function(e) {

            var pass = false;
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
                    pass = true;
                } else if(char == 'V') {
                    pass = true;
                } else if(char == 'T') {
                    pass = true;
                } else if(char == 'W') {
                    pass = true;
                }
            }

            if(!pass) {
                e.preventDefault();
                this.insert_char(char);
            }

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

                    el = this.text.find('.word');
                    if(!el || (el.length < 1)) {
                        return null;
                    }
                    el = el.first();
                    setCaret(el[0], 0);
                }
                return el;
            }
            return el;
        };

        this.difficult_insert = function(ch, caret_index, word) {
            
            var h;
            var keep;
            var excess;// = ch;
            h = word.html().substr(0, caret_index) + ch + word.html().substr(caret_index)
            excess = h.substr(this.p.word_length);
            word.html(h.substr(0, this.p.word_length));

            var lastw = word;
            var words = word.nextAll()
            caret_index += 1;

            $.each(words, function(i, w) {
                w = $(w);
                h = excess + w.html();
                keep = h.substr(0, this.p.word_length);
                if(keep.length == 0) {
                    w.remove();
                    return true;
                } else {
                    w.html(keep);
                }
                excess = h.substr(this.p.word_length);
                lastw = w;
                if(excess.length <= 0) {
                    return true;
                }
            }.bind(this));

//            var added_new = false;
            if(excess.length > 0) {
                var word_new = this.new_word(excess);
                $(lastw).after(word_new);
//                added_new = true;
            }

            // we added an element and it was the last
            if((getCaretElement() == lastw[0])) {
                setCaret(word.next()[0], 1);
            } else {
                if(caret_index >= this.p.word_length) {
                    setCaret(word.next()[0], 0);
                } else {
                    setCaret(word[0], caret_index);
                }
            }
        };

        // TODO this sucks
        this.insert_string = function(str) {
            var i;
            for(i=0; i < str.length; i++) {
                this.insert_char(str[i]);
            }
        };

        this.insert_char = function(ch) {
            if(!this.is_char_allowed(ch)) {
                return false;
            }

            var el = this.get_selected_word();
            if(!el) {
                el = this.new_word(ch);
                this.text.append(el);
                setCaret(el, 1);
            } else {
                var html = $(el).html();
                if(html.length >= this.p.word_length) {
                    this.difficult_insert(ch, getCaretIndex(), $(el));

                } else {
                    var ci = getCaretIndex();
                    html = html.substr(0, ci) + ch + html.substr(ci);
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

