#MarkerJS

Marker is a my take on HTML construction for javascript. It sports a chainable API complete with logical statements and iteration.

###Examples

**Registering**

	Marker.register('header', function() {
	  this
		.header()
	    	.h1('My Site', true)
	    	.a({ href: '#', 'Home', true)
		.end()
	});

Note that elements in Marker require a closing tag; either `end`, or a final argument of `true` to emulate self-closing tags. This should allow you 
to maintain a similar indentation structure that you would use for HTML.

**Rendering**

	Marker.register('header', function() {
	  this
		.header()
	    	.h1('My Site', true)
	    	.a({ href: '#', cache: 'linky' }, 'Home', true)
		.end()
	});
	
	var rendered = Marker.render('header');

The variable, `rendered`, now has two properties. 

1\. `rendered.html` which contains the rendered DOM element (or DocumentFragment if there are multiple first-level children):	

	<header>
		<p>some content</p>
		<a href="#">and a link!</a>
	</header>

2\. `rendered.cache` which is an object containing references to any cached elements:

	rendered.cache //=> { linky: a (dom element) }

**Logic**

	Marker.register('header', function(user) {
		this
			.header()
				.h1('My Site', true)
				.when(user.logged_in)
				  .a({ href: '#', className: 'logout' }, 'Logout')
				.otherwise()
					.a({ href: '#', className: 'login' }, 'Login');
	});

Here we use `when` and `otherwise` to control the link choices depending on the user's session state. There is also an `else_when`, 
which works exactly as you'd expect.

Note, also, that we never need to complete all the trailing `end`'s in a template, as the renderer will resolve them automatically. 

**Each**

	Marker.register('header', function(links) {
		this
			.header()
				.h1('My Site', true)
				.nav()
					.each(links, function(link) {
						this.a({ href: link.href }, link.text, true);
					});
	});

The `each` method can handle both objects and arrays, passing the value and key to the callback. You can cancel an `each` loop by explicitly returning 
`false`.	
	
**Partials**
	Marker.register('header', function(links) {
		this
			.header()
				.h1('My Site', true)
				.partial('nav', links);
	});
	
	Marker.register('nav', function(links) {
		this
			.nav()
				.each(links, function(link) {
					this.a({ href: link.href }, link.text, true);
				});
	});
	
Partials help you keep your templates DRY, and uncluttered.

###API

* `Marker.register( template_name, fn )`

	*Registers given function as a new template, to be rendered using the template name as a key.*

* `Marker.render( template_name, [*args] )`
	
	*Renders template by template_name, passing in any additional arguments as arguments to the template function. Returns object 
	with properties: `html` containing the rendered HTML, and `cache` containing references to any elements cached during rendering via the 
	`cache` attribute.*

* `{any HTML5 tag name}( [attributes], [content], [self_closing] )`
	
	*Generates HTML element with given arguments
	All arguments are optional and can be omitted as long as order is maintained.*
	
* `partial( template_name, [*args])`

	*Renders partial into current template. All arguments past the name will be handed in to the partial on render.*
	
* `each( obj, fn )`

	*Iterates over object or array, passing the given function the value and its key/index. Loop can be exited early by returning `false`*
	
* `when( condition )`

	*If condition resolves true, run the block of code between `when` and the next `else_when`, `otherwise` or its `end`.*

* `else_when( condition )`

	*If condition resolves true and nothing in the current logic stack has yet matched, 
	run the block of code between `when` and `otherwise` or its `end`.*

* `otherwise()`

	*If nothing in the current logic stack has yet matched, run the block of code between `otherwise` and its `end`.*
	

* `end()`

	*Closes tags or finishes a logic stack.*
