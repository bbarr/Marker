/**
 *  Javascript Templating
 *
 *  @author Brendan Barr brendanbarr.web@gmail.com
 */

var Marker = (function() {
	
	var Template = function(fn) {
		this.fn = this.active_fn = fn;
		this.storage = document.createDocumentFragment();
		this.stack = [];
		this.ignoring = null;
		this.stack_length_before_conditional = 0;
		this.ignored = 0;
	}

	Template.prototype = {

		/**
		 * Reuses an existing Marker template
		 * @param name {String} The name of the template
		 * @param 2..n {Arguments} A list of arguments to pass into the template
		 */
		partial: function(name) {
		  
		  if (this.ignoring) {
        return this;
      }
		  
			var template = (typeof name === 'function') ? name : Marker.templates[name];
			if (!template) throw new Error('Template: ' + name + ' not found');

			// hijack the active_fn so the partial builds itself right into the current template 
			// use either .fn property or the template itself we are given a funtion to call
			this.active_fn = template.fn || template;
			var args = [].slice.call(arguments, 1);
			this._construct.apply(this, args);
			this.active_fn = this.fn;

			return this;
		},
		
		end: function() {

      if (this._in_conditional()) {
        if (this.ignoring || this.stack.length === this.stack_length_before_conditional) {
          if (this.ignored === 0) {
            this.ignoring = null;
            this.condition_was_met = false;
          }
          else {
            this.ignored--;
          }
          return this;
        }
      }
			
			var last = this.stack.pop();

			if (!this.stack[0] && last) {
				this.storage.appendChild(last);
			}

			return this;
		},

		html: function(html) {
	    if (this.ignoring) return this;
			var el = this.stack[this.stack.length - 1];
			this._append_html_content(el, text);

			return this;
		},

		text: function(text) {
	    if (this.ignoring) return this;
			var el = this.stack[this.stack.length - 1];
			this._append_content(el, text);

			return this;
		},
		
		if: function(bool) {
      this.ignoring = !bool;
      if (!this.ignoring) this.condition_was_met = true;
      this.stack_length_before_conditional = this.stack.length;
      return this;
		},
		
		unless: function(bool) {
      this.ignoring = bool;		  
      if (!this.ignoring) this.condition_was_met = true;
      this.stack_length_before_conditional = this.stack.length;      
		  return this;
		},
	
	  else: function() {
	    this.ignoring = this.condition_was_met;
	    return this;
	  },
	  
	  else_if: function(bool) {
      this.ignoring = !bool;
      if (!this.ignoring) this.condition_was_met = true;      
      return this;
	  },
	
		_elements: [],
		
		_in_conditional: function() {
		  return typeof this.ignoring === 'boolean';
		},
		
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
				else (typeof el[name] !== 'undefined') ? el[name] = attr : el.setAttribute(name, attr);
			}
		},

		_place: function(el) {

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
		    generate = function(tag) {
	
			Template.prototype[tag] = function(attrs, content) {
	
	      if (this.ignoring) {
	        this.ignored++;
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
	
				this._place(el);
	
				return this;
		    	}
		    },
		    len = tags.length,
		    i = 0;
	
		for (; i < len; i++) {
			generate(tags[i]);
		}
	})();	

	return {
		
		templates: {},
		
		register: function(name, fn) {
			var template = this.templates[name];
			if (template) throw new Error('Template: ' + name + ' already exists');
			this.templates[name] = new Template(fn);
		},
		
		render: function(name) {
			var template = this.templates[name];
			if (!template) throw new Error('Template: ' + name + ' not found');
			var args = [].slice.call(arguments);
			args.shift();
			var html = template._to_html.apply(template, args);
			return (html.childNodes.length === 1) ? html.childNodes[0] : html;
		}
	}
})();