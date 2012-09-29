/**
 *  HTML Templates for Javascript  
 *
 *  @author Brendan Barr brendanbarr.web@gmail.com
 */

var Marker = (function() {
  
  var api,
      
      Template, ElementFactory, Stack, Logic,
      
      ARRAY_SLICE = [].slice,
      TAGS = [
  			'p','h1','h2','h3','h4','h5','h6','strong','em','abbr','address','bdo','blockquote','cite','q','code','ins','del','dfn','kbd','pre','samp','var','br',
  			'div', 'span', 'section', 'header', 'footer', 'sidebar', 'sub', 'sup',
  			'a', 'base',
  			'img','area','map','object','param', 'canvas',
  			'ul','ol','li','dl','dt','dd',
  			'table','tr','td','th','tbody','thead','tfoot','col','colgroup','caption',
  			'form','input','textarea','select','option','optgroup','button','label','fieldset','legend'
  	  ];
  
  
  /**
   *  Templates provide the API for building HTML
   */
  Template = function(fn) {
    this.cache = {};
    this.fns = new Stack([ fn ]);
    this.storage = document.createDocumentFragment();
    this.element_factory = new ElementFactory(this);
    this.elements = new Stack;
    this.logic = new Logic;
  };
  
  Template.prototype = {
  
    partial: function(name) {
      
      if (this.logic.ignoring) return this;

      var template = api.templates[name];
      if (!template) return false;

      this.fns.push(template.fns.top);
      this._render.apply(this, ARRAY_SLICE.call(arguments, 1));
      this.fns.pop();

      return this;
		},
		
		end: function() {

	    if (this.logic.active) {
		    this.logic.states.top.depth--;
		    if (this.logic.states.top.depth === 0) this.logic.exit();
		    else if (!this.logic.ignoring) this._pop();
		  }
		  else this._pop();
		  
      return this;
		},
    
    when: function(bool) {
      this.logic.enter(bool);
      return this;
    },
    
    else_when: function(bool) {
      if (!this.logic.states.top.already_passed) {
        if (bool) this.logic.update({ already_passing: true, ignoring: false });
        else this.logic.update({ ignoring: true });
      }
      else this.logic.update({ ignoring: true });
      
      return this;
    },
    
    otherwise: function() {
      return this.else_when(true);
    },
    
    each: function(obj, fn) {
      if (this.logic.active) this.logic.states.top.depth++;
      if (!this.logic.ignoring) {
        if (typeof obj.length !== 'undefined') {
          for (var i = 0, len = obj.length; i < len; i++) {
            if (!fn.call(this, obj[i], i) === false) break;
          }
        }
        else {
          for (var key in obj) {
            if (fn.call(this, obj[key], key) === false) break;
          }
        }
      }
      return this;
    },
	
    _pop: function() {
      var last = this.elements.pop();
			if (last && !this.elements.length) this.storage.appendChild(last);
			return this;
    },

		_push: function(el) {
			if (this.elements.length) this.elements.top.appendChild(el);
			else this.storage.appendChild(el);
			this.elements.push(el);
		},

		_render: function() {
			this.fns.top.apply(this, ARRAY_SLICE.call(arguments));
			while (this.elements.length) this.end();
			return this.storage;
		}
  };

  /**
   *  ElementFactory is soley responsible for creating the DOM nodes
   */
  ElementFactory = function(template) {
    this.template = template;
    this.current;
  };
  
  ElementFactory.prototype = {
    
    create: function(tag, attrs, content) {
      
      this.current = document.createElement(tag);

      if (typeof content !== 'undefined') {
        if (typeof content === 'boolean') {
          content = undefined
        }
      }
      else {
        if (typeof attrs === 'boolean') {
          attrs = undefined
        }
      }
      
      if (typeof attrs !== 'undefined') {
        if (typeof attrs !== 'object') {
          this._content(attrs);
        }
        else {
          this._attrs(attrs);
          if (content) {
            this._content(content);
          }
        }
      }
      
      return this.current;
    },
    
    _content: function(content) {
      this.current.innerHTML += content;
    },
    
    _css: function(styles) {
			var name, style = this.current.style;
			for (name in styles) {
				style[name] = styles[name];
			}
    },
    
    _attrs: function(attrs) {
			var attr, name, el = this.current;
			for (name in attrs) {
				attr = attrs[name];
        if (attr === false) continue;
				if (name === 'style') this._css(attr);
				else if (name === 'cache') this.template.cache[attr] = el;
        else if (name === 'className' || name === 'class') el.className = attr;
				else {
				  el[name] = attr;
				  el.setAttribute(name, attr)
				}
			}      
    }
  };
  
  /** 
   *  Stack has helpers for arrays that act like stacks
   */
  Stack = function(initial_stack) {
    this.stack = initial_stack || [];
    this.length = this.stack.length;
    this.empty = this.length === 0;
    this.top = this.stack[this.length - 1];
  };
  
  Stack.prototype = {
    
    push: function(item) {
      this.length++;
      this.top = item;
      this.empty = false;
      this.stack.push(item);  
    },
    
    pop: function() {
      this.length--;
      this.top = this.stack[this.length - 1];
      this.empty = !!this.top;
      return this.stack.pop();
    }
  };
  
  /**
   *  Logic manages logic states, for when, else_when and otherwise
   */
  Logic = function() {
    this.states = new Stack;
    this.ignoring = false;
    this.active = false;
  };
  
  Logic.prototype = {
    
    enter: function(bool) {
      this.states.push({ depth: 0, ignoring: !bool, already_passed: bool });
      this._update();
    },
    
    exit: function() {
      this.states.pop();
      this._update();
    },
    
    update: function(changes) {
      for (var key in changes) {
        this.states.top[key] = changes[key];
      }
      this._update();
    },
    
    _update: function() {
      
      var self = this;
      
      this.ignoring = false;
      this.states.stack.forEach(function(state) {
        if (state.ignoring) self.ignoring = true;
      });
      
      this.active = !!this.states.stack.length;
    }
  };
  
  // generate tag methods
	(function() {
		for (var i = 0, len = TAGS.length; i < len; i++) {
		  Template.prototype[TAGS[i]] = (function(tag) {
		    return function(attrs, content) {
		      
		      if (this.logic.active) {
		        this.logic.states.top.depth++;
		      }
		      
	        if (!this.logic.ignoring) {
		        this._push(this.element_factory.create(tag, attrs, content));
		      }
		      
		      if (arguments[arguments.length - 1] === true) {
		        this.end();
		      }
		      
		      return this;
		    }
		  })(TAGS[i]);
		}
	})();
	
  api = {
    
		templates: {},
		
		register: function(name, fn) {
			var template = this.templates[name];
			if (template) return false;
			return this.templates[name] = new Template(fn);
		},
		
		render: function(name) {
			
			var template = this.templates[name];
			if (!template) return false;
			
			var html = template._render.apply(template, ARRAY_SLICE.call(arguments, 1));
			html = (!html.childNodes[1]) ? html.childNodes[0] : html;
			
      html.cache = template.cache;

      return html;
		}
  };
  
  // for testing
	if (typeof jasmine !== 'undefined') {
    api.__exec__ = function() {
      var re = /(\(\))$/,
          args = [].slice.call(arguments),
          name = args.shift(),
          is_method = re.test(name),
          name = name.replace(re, ''),
          target = eval(name);
      return is_method ? target.apply(this, args) : target;
    }
  };
  
  return api;
})();
