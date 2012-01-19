#MarkerJS

Marker provides a means for registering and rendering templates of Marker's chainable HTML-building API.

Incredibly Simple Example:
```Javascript
Marker.register('header', function() {
  this
    .p('some content')
    .a({ href: '#' }, 'and a link!');
});
```

Here is how you would render the above template:
```Javascript
var rendered = Marker.render('header'); 
// rendered.html = <p>some content</p><a href='#'>and a link!</a>
});
```

Notice how Marker.render returns an object with the generated HTML referenced by the appropriately named "html" property. This is because 
Marker.render also generates a "cache" property populated during HTML creation.

Example With Cache:
```Javascript
Marker.register('header', function() {
  this
    .p('some content')
    .a({ href: '#', cache: 'the_link' }, 'and a link!');
});
```
