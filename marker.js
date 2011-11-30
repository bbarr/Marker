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
		this.cache = {};
	}

	Template.prototype = {

		/**
		 * Reuses an existing Marker template
		 * @param name {String} The name of the template
		 * @param 2..n {Arguments} A list of arguments to pass into the template
		 */
		partial: function(name) {
		  
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
		
		_: function() {

			var last = this.stack.pop();

			if (!this.stack[0] && last) {
				this.storage.appendChild(last);
			}

			return this;
		},

		html: function(html) {
		  
			var el = this.stack[this.stack.length - 1];
			this._append_html(el, text);

			return this;
		},

		text: function(text) {
	
			var el = this.stack[this.stack.length - 1];
			this._append_text(el, text);

			return this;
		},

		_elements: [],
	
		_create_element: function(tag) {					

			var els = this._elements;
			if (!els[tag]) els[tag] = (tag === 'fragment') ? document.createDocumentFragment() : document.createElement(tag);
	
			return els[tag].cloneNode(false);
		},

		_append_text: function(el, text) {
			(/\&\S+;/.test(text)) ? el.innerHTML += text : el.appendChild(document.createTextNode(text));
		},

		_append_html: function(el, html) {
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
				this._();
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
	  proto = Template.prototype,
		generate = function(tag) {
	
			proto[tag] = function(attrs, text, has_children) {
	
				var el = this._create_element(tag),
				    attrs_type = typeof attrs;
	
				if (text) {
					this._append_text(el, text);
				}
	
				if (attrs_type == 'string' || attrs_type == 'number') {
					this._append_text(el, attrs);
				}
				else {
					this._append_attributes(el, attrs);
				}
	
				this._place(el);
				
				if (!has_children) {
				  this._();
				}
	
				return this;
		  };
		  
		  proto[tag + '_'] = function(attrs) {
        this[tag](attrs, null, true);
        return this;
		  };
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
			
			return {
			  html: (html.childNodes.length === 1) ? html.childNodes[0] : html,
			  cache: template.cache
			}
		}
	}
})();