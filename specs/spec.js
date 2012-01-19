describe('Marker', function() {

  var Template = Marker.__exec__('Template'), 
      ElementFactory = Marker.__exec__('ElementFactory'),
      Stack = Marker.__exec__('Stack'),
      TAGS = Marker.__exec__('TAGS'),
      template,
      element_factory,
      stack,
      logical_state,
      new_div;
  
  beforeEach(function() {
    new_div = document.createElement('div');
    template = new Template(function() {});
    element_factory = new ElementFactory(new Template(function() {}));
    element_factory.current = document.createElement('div');
    stack = new Stack;
  });    

  describe('Template', function() {
    
    describe('#end', function() {
      
      it ('should call #_pop if not ignoring', function() {
        spyOn(template, '_pop');
        template.end();
        expect(template._pop).toHaveBeenCalled();
      });
    });
    
    describe('#partial', function() {
      
      it ('should return false if template is missing', function() {
        var result = template.partial('a_missing_partial');
        expect(result).toBe(false);
      });
      
      it ('should call #_render with arguments[1..]', function() {
        spyOn(template, '_render');
        Marker.templates['a_template'] = new Template(function() {});
        template.partial('a_template', 1, 'some', [ 'data' ]);
        expect(template._render).toHaveBeenCalledWith(1, 'some', [ 'data' ]);
      });
    });
  
    describe('#when', function() {
      
      it ('should process methods if passing', function() {
        template
          .when(true)
            .div().end()
          .end();
        expect(template.storage.childNodes[0].tagName).toBe('DIV');
      });
      
      it ('should ignore methods if not passing', function() {
        template
          .when(false)
            .div().end()
          .end()
          .when(true)
            .span().end()
          .end()
          .p().end();
          
        expect(template.storage.childNodes[0].tagName).toBe('SPAN');
        expect(template.storage.childNodes[1].tagName).toBe('P');
      });
      
      it ('should handle passing nested when statements', function() {
        template
          .when(true)
            .div()
              .when(true)
                .p().end()
              .end()
            .end()
          .end()
        expect(template.storage.childNodes[0].childNodes[0].tagName).toBe('P');
      });
      
      it ('should handle failed nested when statements', function() {
        template
          .when(true)
            .div()
              .when(false)
                .p().end()
              .end()
            .end()
          .end()
        expect(template.storage.childNodes[0].childNodes[0]).not.toBeDefined();
      });
      
    });
    
    describe('#else_when', function() {
      
      it ('should process methods if passing and current logic state hasn\'t matched before', function() {
        template
          .when(false)
            .div().end()
          .else_when(true)
            .p().end()
          .end()
        expect(template.storage.childNodes[0].tagName).toBe('P');
      });
      
      it ('should ignore methods if not passing', function() {
        template
          .when(false)
            .div().end()
          .else_when(false)
            .p().end()
          .end()
        expect(template.storage.childNodes[0]).not.toBeDefined();        
      });
      
      it ('should ignore methods if current logic state has matched already', function() {
        template
          .when(true)
            .div().end()
          .else_when(false)
            .p().end()
          .end()
        expect(template.storage.childNodes[1]).not.toBeDefined();
      });
    });
    
    describe('#otherwise', function() {

      it ('should process methods if current logic state hasn\'t matched before', function() {
        template
          .when(false)
            .div().end()
          .otherwise()
            .p().end()
          .end()
        expect(template.storage.childNodes[0].tagName).toBe('P');
      });
      
      it ('should ignore methods if current logic state has matched already', function() {
        template
          .when(true)
            .div().end()
          .otherwise()
            .p().end()
          .end()
        expect(template.storage.childNodes[1]).not.toBeDefined();
      });
    });
    
    describe('#each', function() {
      
      it ('should iterate and use callback on each item in object', function() {
        template
          .ul()
            .each({ a: 1, b: 2 }, function(v) {
              this.li(v).end();
            });
        expect(template.storage.childNodes[0].childNodes[0].innerHTML).toBe('1');
      });
      
      it ('should iterate and use callback on each item in object', function() {
        template
          .ul()
            .each([ 1, 2 ], function(v) {
              this.li(v).end();
            });
        expect(template.storage.childNodes[0].childNodes[0].innerHTML).toBe('1');
      });
    });
    
    describe('#_render', function() {
      
      it ('should return generated HTML', function() {
        template.storage.appendChild(new_div);
        var html = template._render();
        expect(html.childNodes[0].tagName).toBe('DIV');
      });
    });
    
    describe('#_pop', function() {
      
      it ('should append popped el to storage if it is last in elements', function() {
        spyOn(template.storage, 'appendChild');
        template.elements.stack = [ new_div ];
        template.elements.length = 1;
        template._pop();
        expect(template.storage.appendChild).toHaveBeenCalled();
      });
    });
    
    describe('#_push', function() {
      
      it ('should add to elements', function() {
        spyOn(template.elements, 'push');
        template._push(new_div);
        expect(template.elements.push).toHaveBeenCalledWith(new_div);
      });
      
      it ('should append to last in elements if there is a last', function() {
        template.elements.push(new_div);
        template._push(new_div.cloneNode(false));
        expect(new_div.childNodes[0].tagName).toBe('DIV');
        expect(template.storage.childNodes.length).toBe(0);
      });
      
      it ('should append to storage if there is nothing in elements', function() {
        template._push(new_div);
        expect(template.storage.childNodes[0]).toBe(new_div);
      });
    });      
  
    describe('tag methods', function() {
      
      it ('should create correct tag for each tag name in TAGS list', function() {
        TAGS.forEach(function(tag) {
          expect(template[tag]).toBeDefined();
        });
      });
    });
  });

  describe('ElementFactory', function() {
    
    describe('#create', function() {
      
      it ('should return an empty, simple element', function() {
        var div = element_factory.create('span');
        expect(div.tagName).toBe('SPAN');
      });
      
      it ('should call #_content with attrs unless they are an object', function() {
        spyOn(element_factory, '_content');
        element_factory.create('span', 'some text');
        expect(element_factory._content).toHaveBeenCalledWith('some text');
      });
      
      it ('should call #_attrs with attrs and #_content with contents if both there', function() {
        spyOn(element_factory, '_attrs');        
        spyOn(element_factory, '_content');
        element_factory.create('div', { id: 'an_id' }, 'some text');
        expect(element_factory._attrs).toHaveBeenCalledWith({ id: 'an_id' });
        expect(element_factory._content).toHaveBeenCalledWith('some text');
      });
    });
    
    describe('#_content', function() {
      
      it ('should add text to current element', function() {
        element_factory._content('some text');
        expect(element_factory.current.innerHTML).toBe('some text');
      });
      
      it ('should add html to current element', function() {
        element_factory._content('<span></span>');
        expect(element_factory.current.childNodes[0].tagName).toBe('SPAN');
      });      
    });
    
    describe('#_css', function() {
      
      it ('should set css property of current element', function() {
        element_factory._css({ marginTop: '100px' });
        expect(element_factory.current.style.marginTop).toBe('100px');
      });
    });
    
    describe('#_attrs', function() {
      
      it ('should call #_css when it detects style', function() {
        element_factory._attrs({ style: { marginBottom: '10px' } });
        expect(element_factory.current.style.marginBottom).toBe('10px');
      });
      
      it ('should assign a cache value when it detects cache property', function() {
        element_factory._attrs({ cache: 'some_div' });
        expect(element_factory.template.cache.some_div).toBe(element_factory.current);
      });
      
      it ('should use set HTML attribute if not style or cache', function() {
        element_factory._attrs({ title: 'a title' });
        expect(element_factory.current.getAttribute('title')).toBe('a title');
      });
    });
  });
  
  describe('Stack', function() {
    
    describe('#push', function() {
      
      it ('should add to stack and increment length', function() {
        stack.push('foo');
        expect(stack.stack[stack.stack.length - 1]).toBe('foo');
        expect(stack.length).toBe(1);
      });
    });
    
    describe('#pop', function() {
      
      it ('should remove from stack and deincrement length', function() {
        stack.stack = [ 'foo' ];
        stack.length = 1;
        var popped = stack.pop();
        expect(popped).toBe('foo');
        expect(stack.stack[0]).not.toBeDefined();
        expect(stack.length).toBe(0);
      });
    });
  });
  
  describe('LogicalState', function() {
    
    describe('#set', function() {
      
      xit ('should stop ignoring and remember that it passed if given true', function() {
        logical_state.set(true);
        expect(logical_state.ignoring).toBe(false);
        expect(logical_state.passed_flag).toBe(true);
      });
      
      xit ('should start ignoring if given false', function() {
        logical_state.set(false);
        expect(logical_state.ignoring).toBe(true);
      });
    });
  });
});