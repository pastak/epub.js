var assert = require('assert');
var fs = require('fs');

describe('EpubCFI', function() {
  var EpubCFI = require('../src/epubcfi.js');

	it('parse a cfi on init', function() {
		var cfi = EpubCFI("epubcfi(/6/2[cover]!/6)");

		assert.equal( cfi.spinePos, 0, "spinePos is parsed as the first item" );
	});

	it('parse a cfi and ignore the base if present', function() {
		var cfi = EpubCFI("epubcfi(/6/2[cover]!/6)", "/6/6[end]");

		assert.equal( cfi.spinePos, 0, "base is ignored and spinePos is parsed as the first item" );
	});

  describe('#parse()', function() {
		var cfi = new EpubCFI();

		it('parse a cfi on init', function() {
      var parsed = cfi.parse("epubcfi(/6/2[cover]!/6)");

      assert.equal( parsed.spinePos, 0, "spinePos is parsed as the first item" );
    });

		it('parse a cfi and ignore the base if present', function() {
      var parsed = cfi.parse("epubcfi(/6/2[cover]!/6)", "/6/6[end]");

      assert.equal( parsed.spinePos, 0, "base is ignored and spinePos is parsed as the first item" );
    });

		it('parse a cfi with a charecter offset', function() {
      var parsed = cfi.parse("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)");

      assert.equal( parsed.path.terminal.offset, 3, "Path has a terminal offset of 3" );
    });

		it('parse a cfi with a range', function() {
      var parsed = cfi.parse("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)");

			assert.equal( parsed.range, true, "Range is true" );
			assert.equal( parsed.start.steps.length, 2, "Start steps are present" );
      assert.equal( parsed.end.steps.length, 1, "End steps are present" );
			assert.equal( parsed.start.terminal.offset, 1, "Start has a terminal offset of 1" );
			assert.equal( parsed.end.terminal.offset, 4, "End has a terminal offset of 4" );

    });

  });

	describe('#toString()', function() {
    it('parse a cfi and write it back', function() {

      assert.equal(EpubCFI("epubcfi(/6/2[cover]!/6)").toString(), "epubcfi(/6/2[cover]!/6)", "output cfi string is same as input" );
			assert.equal(EpubCFI("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)").toString(), "epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)", "output cfi string is same as input" );
			assert.equal(EpubCFI("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)").toString(), "epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)", "output cfi string is same as input" );

    });
  });

	describe('#checkType()', function() {
    it('determine the type of a cfi string', function() {
			var cfi = new EpubCFI();

			assert.equal( cfi.checkType('epubcfi(/6/2[cover]!/6)'), 'string' );
			assert.equal( cfi.checkType('/6/2[cover]!/6'), false );

    });

		it('determine the type of a cfi', function() {
			var ogcfi = EpubCFI("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)");
			var cfi = new EpubCFI();

			assert.equal( cfi.checkType(ogcfi), 'EpubCFI' );

		});

		it('determine the type of a node', function() {
			var cfi = new EpubCFI();
			var el = document.createElement('div');

			assert.equal( cfi.checkType(el), 'node' );

		});

		it('determine the type of a range', function() {
			var cfi = new EpubCFI();
			var range = document.createRange();

			assert.equal( cfi.checkType(range), 'range' );

		});

  });

	describe('#compare()', function() {
    it('compare CFIs', function() {
			var epubcfi = new EpubCFI();

			// Spines
			assert.equal(epubcfi.compare("epubcfi(/6/4[cover]!/4)", "epubcfi(/6/2[cover]!/4)"), 1, "First spine is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/4[cover]!/4)", "epubcfi(/6/6[cover]!/4)"), -1, "Second spine is greater");

			// First is deeper
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/8/2)", "epubcfi(/6/2[cover]!/6)"), 1, "First Element is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/2)", "epubcfi(/6/2[cover]!/6)"), -1, "Second Element is greater");

			// Second is deeper
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/8/2)", "epubcfi(/6/2[cover]!/6/4/2/2)"), 1, "First Element is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/4)", "epubcfi(/6/2[cover]!/6/4/2/2)"), -1, "Second Element is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/6)", "epubcfi(/6/2[cover]!/4/6/8/1:0)"), -1, "Second");

			// Same Depth
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/6/8)", "epubcfi(/6/2[cover]!/6/2)"), 1, "First Element is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/20)", "epubcfi(/6/2[cover]!/6/10)"), -1, "Second Element is greater");

			// Text nodes
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/5)", "epubcfi(/6/2[cover]!/4/3)"), 1, "First TextNode is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/7)", "epubcfi(/6/2[cover]!/4/13)"), -1, "Second TextNode is greater");

			// Char offset
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/5:1)", "epubcfi(/6/2[cover]!/4/5:0)"), 1, "First Char Offset is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/5:2)", "epubcfi(/6/2[cover]!/4/5:30)"), -1, "Second Char Offset is greater");

			// Normal example
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/8/5:1)", "epubcfi(/6/2[cover]!/4/6/15:2)"), 1, "First Element is greater");
			assert.equal(epubcfi.compare("epubcfi(/6/2[cover]!/4/8/1:0)", "epubcfi(/6/2[cover]!/4/8/1:0)"), 0, "All Equal");

    });
  });

  describe('#fromNode()', function() {
    var base = "/6/4[chap01ref]";
    var contents = fs.readFileSync(__dirname + '/fixtures/chapter1.xhtml', 'utf8');
    // var serializer = new XMLSerializer();
    // var doc = serializer.serializeToString(contents);
    var doc = new DOMParser().parseFromString(contents, "application/xhtml+xml");

    it('get a cfi from a p node', function() {
      var span = doc.getElementById('c001p0004');
      var cfi = new EpubCFI(span, base);

      assert.equal(span.nodeType, Node.ELEMENT_NODE, "provided a element node");
			assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/10/2[c001p0004])" );

    });

    it('get a cfi from a text node', function() {
      var t = doc.getElementById('c001p0004').childNodes[0];
      var cfi = new EpubCFI(t, base);

      assert.equal(t.nodeType, Node.TEXT_NODE, "provided a text node");
      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/10/2[c001p0004]/1)" );


    });

    it('get a cfi from a text node inside a highlight', function() {
      var t = doc.getElementById('highlight-1').childNodes[0];
      var cfi = new EpubCFI(t, base);

      assert.equal(t.nodeType, Node.TEXT_NODE, "provided a text node");
      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/32/2[c001p0017]/1)" );

    });

    it('get a cfi from a highlight node', function() {
      var t = doc.getElementById('highlight-1');
      var cfi = new EpubCFI(t, base);

      assert.equal(t.nodeType, Node.ELEMENT_NODE, "provided a highlight node");
      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/32/2[c001p0017]/1)" );

    });

  });

  describe('#fromRange()', function() {
    var base = "/6/4[chap01ref]";
    var contents = fs.readFileSync(__dirname + '/fixtures/chapter1.xhtml', 'utf8');
    var doc = new DOMParser().parseFromString(contents, "application/xhtml+xml");

    it('get a cfi from a collapsed range', function() {
      var t1 = doc.getElementById('c001p0004').childNodes[0];
      var t2 = doc.getElementById('c001p0007').childNodes[0];
      var range = doc.createRange();
      var cfi;

      range.setStart(t1, 6);

      cfi = new EpubCFI(range, base);

      assert.equal( cfi.range, false);
      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/10/2[c001p0004]/1:6)" );

    });

    it('get a cfi from a range', function() {
      var t1 = doc.getElementById('c001p0004').childNodes[0];
      var t2 = doc.getElementById('c001p0007').childNodes[0];
      var range = doc.createRange();
      var cfi;

      range.setStart(t1, 6);
      range.setEnd(t2, 27);

      cfi = new EpubCFI(range, base);

      assert.equal( cfi.range, true);
      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2,/10/2[c001p0004]/1:6,/16/2[c001p0007]/1:27)" );

    });

    it('get a cfi from a range inside a highlight', function() {
      var t1 = doc.getElementById('highlight-1').childNodes[0];
      var range = doc.createRange();
      var cfi;

      range.setStart(t1, 6);

      cfi = new EpubCFI(range, base);

      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/32/2[c001p0017]/1:43)" );

    });

  });


  describe('#fromRange()', function() {
    var base = "/6/4[chap01ref]";
    var contents = fs.readFileSync(__dirname + '/fixtures/chapter1.xhtml', 'utf8');
    var doc = new DOMParser().parseFromString(contents, "application/xhtml+xml");

    // var serializer = new XMLSerializer();
    // console.log(serializer.serializeToString(doc));

    it('get a range from a cfi', function() {
      var t1 = doc.getElementById('c001p0004').childNodes[0];
      var t2 = doc.getElementById('c001p0007').childNodes[0];
      var ogRange = doc.createRange();
      var cfi;
      var newRange;

      ogRange.setStart(t1, 6);

      cfi = new EpubCFI(ogRange, base);

      // Check it was parse correctly
      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/10/2[c001p0004]/1:6)" );

      // Check the range
      newRange = cfi.toRange(doc);

      assert.equal( newRange.startContainer, t1);
      assert.equal( newRange.startOffset, 6);
      assert.equal( newRange.collapsed, true);

    });

    it('get a range from a cfi with a range', function() {
      var t1 = doc.getElementById('c001p0004').childNodes[0];
      var t2 = doc.getElementById('c001p0007').childNodes[0];
      var ogRange = doc.createRange();
      var cfi;
      var newRange;

      ogRange.setStart(t1, 6);
      ogRange.setEnd(t2, 27);

      cfi = new EpubCFI(ogRange, base);

      // Check it was parse correctly
      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2,/10/2[c001p0004]/1:6,/16/2[c001p0007]/1:27)" );

      // Check the range
      newRange = cfi.toRange(doc);

      assert.equal( newRange.startContainer, t1);
      assert.equal( newRange.startOffset, 6);

      assert.equal( newRange.endContainer, t2);
      assert.equal( newRange.endOffset, 27);

      assert.equal( newRange.collapsed, false);

    });

    it('get a cfi from a range inside a highlight', function() {
      var t1 = doc.getElementById('highlight-1').childNodes[0];
      var ogRange = doc.createRange();
      var cfi;
      var newRange;

      ogRange.setStart(t1, 6);

      cfi = new EpubCFI(ogRange, base);

      assert.equal( cfi.toString(), "epubcfi(/6/4[chap01ref]!/4/2/32/2[c001p0017]/1:43)" );

      // Check the range
      newRange = cfi.toRange(doc);

      assert.equal( newRange.startContainer, t1);
      assert.equal( newRange.startOffset, 6);

    });

  });

});
