(function (enyo) {

	//*@public
	/**
	*/
	enyo.kind({

		// ...........................
		// PUBLIC PROPERTIES

		//*@public
		name: "enyo.DataList",

		//*@public
		kind: "enyo.DataRepeater",

		//*@public
		/**
			The _enyo.DataList_ kind places its rows inside of a scroller. Any
			configurable options associated with an _enyo.Scroller_ can be
			placed in this hash and will be set accordingly on the scroller
			for this list. If none are specified default _enyo.Scroller_
			settings are used.
		*/
		scrollerOptions: null,
		
		orientation: "vertical",

		//*@public
		protectedStatics: {
			defaultScrollerOptions: {
				preventScrollPropagation: false
			}
		},

		//*@public
		handlers: {
			onScroll: "didScroll",
			onpostresize: "didResize"
		},

		//*@public
		controlParentName: "page1",
		
		containerName: "scroller",

		//*@public
		classes: "enyo-data-list",
		
		pageSizeMultiplier: 2,

		//*@public
		containerOptions: {
			name: "scroller",
			kind: "enyo.Scroller",
			canGenerate: false,
			classes: "enyo-fill enyo-data-list-scroller",
			components: [
				{name: "active", classes: "enyo-data-list-active", components: [
					{name: "page1", classes: "enyo-data-list-page", style: "background-color: #d8d8d8;"},
					{name: "page2", classes: "enyo-data-list-page", style: "background-color: #58d3f7;"}
				]},
				{name: "buffer", classes: "enyo-data-list-buffer"}
			]
		},
		
		create: function () {
			this.inherited(arguments);
			this.orientation = this.orientation[0] == "v"? "v": "h";
		},

		rendered: function () {
			// the initial time the list is rendered we've only rendered the
			// list node itself but now we know it should be safe to calculate
			// some boundaries so there's not some ugly overlap in our absolutely
			// positioned elements and rows and we can also render the rows and
			// correctly map them to corresponding pages
			this.$.scroller.canGenerate = true;
			this.$.scroller.render();
			// lets position and size everything initially and it will be adjusted
			// as we go
			var $h = this.getHeight();
			var $w = this.getWidth();
			var $r = this.orientation;
			var $t = 0, $s;
			for (var $i=0, c$; (c$=this.$.active.children[$i]); ++$i) {
				$s = "height: " + $h + "px; width: " + $w + "px; ";
				if ($r == "v") {
					$s += "top: " + ($t == 0? "0; ": $t + "px; ") + "left: 0;";
				} else {
					$s += "left: " + ($t == 0? "0; ": $t + "px; ") + "top: 0;";
				}
				c$.addStyles($s);
				if ($t == 0) {
					if ($r == "v") {
						$t = this.getHeight(c$);
					} else {
						$t = this.getWidth(c$);
					}
				}
			}
			if (this.length) {
				this.reset();
			}
		},
		
		reset: function () {
			if (this.generated && this.$.scroller.generated) {
				this.destroyClientControls();
				this.start = 0;
				this.end = 0;
				if (this.length) {
					for (var $i=0, c$; (c$=this.$.active.children[$i]); ++$i) {
						this.renderPage(c$);
					}
				}
				this.updateBuffer();
				this.$.scroller.renderReusingNode();
				// at this point there is most likely overlap of the pages but
				// if so it will be out of the visible region
				this.resetPagePositions();
			}
		},
		
		prune: function (p, i, e) {
			var $t = p.children.slice(i, e);
			for(var $i=0, c$; (c$=$t[$i]); ++$i) {
				c$.set("model", null);
				this.disableChild(c$);
			}
		},
		
		disableChild: function (c$) {
			c$.connectDom();
			c$.removeNodeFromDom();
			c$.canGenerate = false;
			c$.disabled = true;
		},
		
		enableChild: function (c$) {
			c$.canGenerate = true;
			c$.disabled = false;
			c$.connectDom();
			c$.addNodeToParent();
		},
		
		add: function (record, idx) {
			if (this.generated && this.$.scroller.canGenerate) {
				var $c = this.createComponent({model: record, index: idx});
				$c.render();
			}
		},
		
		renderPage: function (p) {
			this.controlParentName = p.name;
			this.discoverControlParent();
			if (this.length && this.end != this.length-1) {
				var $d = this.get("data"), $i = this.end, r$;
				for (; (r$=$d[$i]) && this.checkPage(p); ++$i) {
					this.add(r$, $i);
				}
				this.end = $i;
			}
			this.adjustPageSize(p);
		},
		
		checkPage: function (p) {
			var $r = this.orientation;
			var $t = this.pageSizeMultiplier * $r == "v"? this.getHeight(): this.getWidth();
			return $t >= ($r == "v"? this.getPageHeight(p): this.getPageWidth(p));
		},
		
		updateBuffer: function () {
			var $r = this.orientation;
			if (this.length) {
				var $c = this.getClientControls()[0];
				var $t = ($r == "v"? this.getHeight($c): this.getWidth($c)) * this.length;
				if (this.getClientControls().length == this.length) {
					var $a = this.getPageActual();
					$t = $a < $t? $a: $t;
				}
				this.$.buffer.applyStyle($r == "v"? "height": "width", ($t  + ($t > 0? "px": "")));
			} else {
				this.$.buffer.applyStyle($r == "v"? "height": "width", "0");
			}
		},
		
		getPageActual: function () {
			var $r = this.orientation;
			for (var $t=0, $i=0, c$; (c$=this.$.active.children[$i]); ++$i) {
				$t += $r == "v"? this.getPageHeight(c$): this.getPageWidth(c$);
			}
			return $t;
		},
		
		adjustPageSize: function (p) {
			var $r = this.orientation;
			var $t = $r == "v"? this.getPageHeight(p): this.getPageWidth(p);
			p.applyStyle($r == "v"? "height": "width", $t + ($t > 0? "px": ""));
		},
		
		resetPagePositions: function () {
			var $1 = this.$.page1;
			var $2 = this.$.page2;
			var $r = this.orientation;
			var $t = $r == "v"? this.getPageHeight($1): this.getPageWidth($1);
			$1.applyStyle($r == "v"? "top": "left", "0");
			$2.applyStyle($r == "v"? "top": "left", $t + ($t > 0? "px": ""));
		},
		
		/**
			These are implemented in this way for efficiency purposes as they will be
			called often and there is a memory penalty for returning an object with these
			properties as opposed to the static value directly.
		*/
		getHeight: function (n) {
			var $n = n || this;
			return $n && $n.hasNode()? $n.node.offsetHeight: 0;
		},
		getWidth: function (n) {
			var $n = n || this;
			return $n && $n.hasNode()? $n.node.offsetWidth: 0;
		},
		getTop: function (n) {
			var $n = n || this;
			return $n && $n.hasNode()? $n.node.offsetTop: 0;
		},
		getLeft: function (n) {
			var $n = n || this;
			return $n && $n.hasNode()? $n.node.offsetLeft: 0;
		},
		getPageHeight: function (p) {
			for (var $t=0, $i=0, c$; (c$=p.children[$i]); ++$i) {
				$t += this.getHeight(c$);
			}
			return $t;
		},
		getPageWidth: function (p) {
			for (var $t=0, $i=0, c$; (c$=p.children[$i]); ++$i) {
				$t += this.getWidth(c$);
			}
			return $t;
		},
		getFirstPage: function () {
			var $r = this.orientation;
			var $1 = this.$.page1
			var $2 = this.$.page2;
			return $r == "v"? this.getTop($1) < this.getTop($2)? $1: $2: this.getLeft($1) < this.getLeft($2)? $1: $2;
		},
		getLastPage: function () {
			var $r = this.orientation;
			var $1 = this.$.page1;
			var $2 = this.$.page2;
			return $r == "v"? this.getTop($1) > this.getTop($2)? $1: $2: this.getLeft($1) > this.getLeft($2)? $1: $2;
		},
		
		
		
		didScroll: function (sender, event) {
			var $d = this.getDirection();
			if ($d) {
				this[$d]();
			}
		},
		getDirection: function () {
			var $s = this.$.scroller;
			var $r = this.orientation, $c, $d, $p = this.last;
			$c = $r == "v"? $s.getScrollTop(): $s.getScrollLeft();
			$d = !isNaN($p)? $p < $c? "down": $p > $c? "up": false: false;
			this.last = $c;
			return $d? $r != "v"? $d == "up"? "left": "right": $d: $d;
		},
		up: function () {
			var $p = this.getLastPage();
			var $t = this.getTop($p);
			var $s = this.$.scroller.getScrollTop();
			var $c = this.getHeight();
			if (($s + $c) < $t) {
				this.positionPageBefore($p);
			}
		},
		down: function () {
			var $p = this.getFirstPage();
			var $t = this.getTop($p);
			// deliberately using explicit height value check on page
			var $h = this.getHeight($p);
			var $s = this.$.scroller.getScrollTop();
			if (($t + $h) < $s) {
				this.positionPageAfter($p);
			}
		},
		left: function () {
			
		},
		right: function () {
			
		},
		positionPageAfter: function (p, noUpdate) {
			if (this.end < this.length-1) {
				var $r = this.orientation;
				var $2 = this.getLastPage();
				var $b = $r == "v"? this.getTop($2) + this.getHeight($2): this.getLeft($2) + this.getWidth($2);
				p.applyStyle($r == "v"? "top": "left", $b + ($b > 0? "px": ""));
				if (!noUpdate) {
					this.updatePage(p, this.end, Math.min(this.length, this.end + p.children.length));
				}
				this.start = $2.children[0].index;
			}
		},
		positionPageBefore: function (p) {
			var $1 = this.getFirstPage();
			// we only want to worry about moving the page up if there are
			// indices to update
			if ($1.children[0].index !== 0) {
				var $r = this.orientation;
				var $s = this.$.scroller;
				// unlike when moving the page down we actually need to execute the
				// update before moving the page so we can accurately calculate
				// the size and move accordingly
				var $b = this.start-1;
				var $e = Math.max($b-p.children.length, 0);
				this.updatePage(p, $b, $e);
				var $t = $r == "v"? this.getPageHeight(p): this.getPageWidth(p);
				var $b = ($r == "v"? this.getTop($1): this.getLeft($1)) - $t;
				p.applyStyle($r == "v"? "top": "left", $b + ($b > 0? "px": ""));
				// adjust the bottom page to meet the bottom of the top page accordingly
				// this.positionPageAfter($1, true);
			}
			
			
			
			/*
			var $r = this.orientation;
			var $t = $r == "v"? this.getHeight(p): this.getWidth(p);
			var $s = this.$.scroller;
			var $l = this.getFirstPage();
			if ($t <= ($r == "v"? $s.getScrollTop(): $s.getScrollLeft())) {
				var $1 = this.getFirstPage();
				var $b = this.start == 0? 0: $r == "v"? this.getTop($1) - $t: this.getLeft($1) - $t;
				p.applyStyle($r == "v"? "top": "left", $b + ($b > 0? "px": ""));
				this.updatePage(p, this.start, 0);
				this.end = $l.children[$l.children.length-1].index;
				this.positionPageAfter($l, true);
			}*/
		},
		updatePage: function (p, start, end) {
			var $d = this.get("data");
			var $p = p;
			var $s = start;
			var $e = $s < end? end < (this.length-1)? end: (this.length-1): end;
			// for efficiency we ensure that no changes will be made to the dom until
			// after we've adjusted all that we can
			$p.disconnectDom();
			if ($s < $e) {
				for (var $i=0, c$, d$; (c$=$p.children[$i]) && (d$=$d[$s]) && $s<=$e; ++$s, ++$i) {
					if (c$.disabled) {
						this.enableChild(c$);
					}
					c$.index = $s;
					c$.set("model", d$);
				}
				this.end = $s;
				// if we're done updating but we have extra children we need to remove them
				if ($i < ($p.children.length-1)) {
					this.prune($p, $i);
				}
				// now we need to go ahead and reconnect the dom and calculate some changes
				// before we can know if we're done
				$p.connectDom();
				$p.renderReusingNode();
				this.adjustPageSize($p);
				this.updateBuffer();
				return;
			} else if ($s > $e) {
				for (var $i=($p.children.length-1), c$, d$; (c$=$p.children[$i]) && (d$=$d[$s]) && $s>=$e; --$s, --$i) {
					if (c$.disabled) {
						this.enableChild(c$);
					}
					c$.index = $s;
					c$.set("model", d$);
				}
				this.start = $s;
				if ($i > 0) {
					this.prune($p, 0, $i);
				}
				$p.connectDom();
				$p.renderReusingNode();
				this.adjustPageSize($p);
				this.updateBuffer();
				return
			}
		}

	});

})(enyo);
