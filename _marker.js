/**
 *  Javascript Templating
 *
 *  @author Brendan Barr brendanbarr.web@gmail.com
 */

var Marker = (function() {
	
	var LogicalFlow = function(template) {
	  this.template = template;
	  this.active = false;
	  this.ignoring = null;
		this.ignored_count = 0;
		this.passed_flag = false;
	};
	
	LogicalFlow.prototype = {
	  
	  start: function() {
	    this.active = true;
	  },
	  
	  end: function() {
	    this.active = false;
	    this.passed_flag = false;
	    this.ignored_count = 0;
	    this.ignoring = false;
	  },
	  
	  set: function(bool) {
	    if (this.passed_flag) {
	      this.ignoring = true;
	    }
	    else {
	      if (bool) {
	        this.ignoring = true;
	        this.passed_flag = true;
	      }
	      else {
	        this.ignoring = false;
	      }
	    } 
	  }
	};
	
	var Iterator = function(template) {
	  this.template = template;
	  this.value;
	  this.key;
	};
	
	Iterator.prototype = {
	  
	  each: function() {
	    if (typeof obj.length === 'number') {
        for (var i = 0, len = obj.length; i < len; i++) {
          if (fn.call(this, obj[i], i) === false) break;
        }
      }
      else {
        for (var key in obj) {
          if (fn.call(this, obj[key], key) === false) break;
        }
      }
	  }
	};
	
	var Template = function(fn) {
		this.fn = this.active_fn = fn;
		this.storage = document.createDocumentFragment();
		this.stack = [];
		this.cache = {};
		this.logic = new LogicalFlow(this);
	}

	Template.prototype = {

		/**
		 * Reuses an existing Marker template
		 * @param name {String} The name of the template
		 * @param 2..n {Arguments} A list of arguments to pass into the template
		 */
		partial: function(name) {
		  
      if (this.ignoring) return;
		  
			var template = (typeof name === 'function') ? name : Marker.templates[name];
			if (!template) throw new Error('Template: ' + name + ' not found');

			// hijack the active_fn so the partial builds itself right into the current template 
			// use either .fn property or the template itself we are given a funtion to call
			this.active_fn = template.fn || template;
			var args = [].slice.call(arguments);
			args.shift();
			this._construct.apply(this, args);
			this.active_fn = this.fn;

			return this;
		},
		
		end: function() {
      if (this.logic.active) {
        this.logic.end();
      }
      else {
        this._pop();
      }
      return this;
		},

		html: function(html) {
		  
		  if (this.logic.ignoring) return;
		  
			var el = this.stack[this.stack.length - 1];
			this._append_html_content(el, text);

			return this;
		},

		text: function(text) {

		  if (this.logic.ignoring) return;
	
			var el = this.stack[this.stack.length - 1];
			this._append_content(el, text);

			return this;
		},
		
		when: function(bool) {
		  this.logic.start();
      this.logic.set(!bool);
      return this;
		},
		
		else_when: function(bool) {
		  this.logic.set(!bool);
      return this;		  
		},
		
		otherwise: function() {
		  this.logic.set(true);
      return this;		  
		},
		
		each: function(obj, fn) {
      var iterator = new Iterator(obj, fn);
      this.iterators.push(iterator);      
      return this;		  
		},
				
		_elements: [],
		
		_create_element: function(tag) {					

			var els = this._elements;
			if (!els[tag]) els[tag] = (tag === 'fragment') ? document.createDocumentFragment() : document.createElement(tag);
	
			return els[tag].cloneNode(false);
		},

		_append_content: function(el, text) {
			(/\&\S+;/.test(text)) ? el.innerHTML += text : el.appendChild(document.createTextNode(text));
		},

		_append_html_content: function(el, html) {
			el.innerHTML += text;
		},

		_append_styles: function(el, styles) {
			
			var name, style = el.style;
			for (name in styles) {
				style[name] = styles[name];
			}
		},
	
		_append_attributes: function(el, attrs) {
			
			var attr, name;
			for (name in attrs) {
				attr = attrs[name];
				if (name === 'style') this._append_styles(el, attr);
				else if (name === 'cache') this.cache[attr] = el;
				else (typeof el[name] !== 'undefined') ? el[name] = attr : el.setAttribute(name, attr);
			}
		},

    _pop: function() {
      
      var last = this.stack.pop();

			if (!this.stack[0] && last) {
				this.storage.appendChild(last);
			}

			return this;
    },

		_push: function(el) {

			if (this.stack[0]) {
				this.stack[this.stack.length - 1].appendChild(el);
			}
			else {
				this.storage.appendChild(el);
			}

			this.stack.push(el);
		},

		_to_html: function() {
			
			this._construct.apply(this, [].slice.call(arguments));
			
			var html = this.storage.cloneNode(true);
			this.storage = document.createDocumentFragment();
	
			return html;
		},

		_construct: function() {

			var current_stack_count = this.stack.length;
	
			this.active_fn.apply(this, [].slice.call(arguments));

			while (this.stack[current_stack_count]) {
				this.end();
			}
		},
		
		_reset: function() {
  		this.storage = document.createDocumentFragment();
  		this.stack = [];
  		this.cache = {};
		}
	};
	
	(function() {

		var tags = [
			'p','h1','h2','h3','h4','h5','h6','strong','em','abbr','address','bdo','blockquote','cite','q','code','ins','del','dfn','kbd','pre','samp','var','br',
			'div', 'span', 'section', 'header', 'footer', 'sidebar', 'sub', 'sup',
			'a', 'base',
			'img','area','map','object','param', 'canvas',
			'ul','ol','li','dl','dt','dd',
			'table','tr','td','th','tbody','thead','tfoot','col','colgroup','caption',
			'form','input','textarea','select','option','optgroup','button','label','fieldset','legend'
	  ],
	  create_tag_generator = function(tag) {
	    return function(attrs, content) {

        if (this.logic.ignoring) {
          this.logic.ignored++;
          return this;
        }

  			var el = this._create_element(tag),
  			    attrs_type = typeof attrs;

  			if (content) {
  				this._append_content(el, content);
  			}

  			if (attrs_type == 'string' || attrs_type == 'number') {
  				this._append_content(el, attrs);
  			}
  			else {
  				this._append_attributes(el, attrs);
  			}

  			this._push(el);

  			return this;
  	  };
	  };
		  
		for (var i = 0, len = tags.length; i < len; i++) {
		  Template.prototype[tags[i]] = create_tag_generator(tags[i]);
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
			
			template._reset();
			
			var html = template._to_html.apply(template, [].slice.call(arguments, 1));
			html = (html.childNodes.length === 1) ? html.childNodes[0] : html;
			
			return {
			  cache: template.cache,
			  html: html
			}
		}
	};
	
	// for testing
	if (util.is_defined(jasmine)) {
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