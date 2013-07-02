(function (enyo) {

	//*@public
	/**
	*/
	enyo.kind({

		// ...........................
		// PUBLIC PROPERTIES

		//*@public
		name: "enyo.DataRepeater",

		//*@public
		kind: "enyo.View",

		//*@public
		childMixins: [
			"enyo.AutoBindingSupport",
			"enyo.RepeaterChildSupport"
		],
		
		//*@public
		concat: ["childMixins"],

		//*@public
		controlParentName: "container",
		
		containerName: "container",
		
		//*@public
		containerOptions: {
			name: "container",
			classes: "enyo-fill enyo-data-repeater-container",
		},

		//*@public
		handlers: {
			onModelAdded: "modelAdded",
			onModelsAdded: "modelsAdded",
			onModelRemoved: "modelRemoved",
			onModelsRemoved: "modelsRemoved"
		},

		//*@public
		bindings: [
			{from: ".controller.length", to: ".length"},
			{from: ".controller.data", to: ".data"}
		],
		

		//*@public
		batching: false,

		// ...........................
		// PROTECTED PROPERTIES

		// ...........................
		// PUBLIC METHODS
		
		//*@public
		initComponents: function () {
			this.initContainer();
			// we need to find the child definition and prepare it for
			// use in our repeater including adding auto binding support
			var $c = this.kindComponents || this.components || [];
			// var $o = this.components? this.owner: this, $p;
			var $o = this.components? this.owner: this;
			// if there is a special definition in the components block we
			// wrap it up in a new anonymous kind for reuse later
			if ($c.length) {
				$p = enyo.pool.claimObject(true);
				$p.kind = this.defaultKind || "enyo.View";
				if ($c.length > 1) {
					$p.components = $c;
				} else {
					enyo.mixin($p, $c[0]);
				}
				this.defaultKind = enyo.kind($p);
				enyo.pool.releaseObject($p);
			} else {
				// otherwise we use the defaultKind property value and assume
				// it was set properly
				this.defaultKind = enyo.constructorForKind(this.defaultKind);
			}
			$p = this.defaultProps || (this.defaultProps = {});
			$p.owner = $o;
			$p.mixins = this.childMixins;
		},

		//*@public
		controllerFindAndInstance: function(ctor, inst) {
			this.inherited(arguments);
			if (inst && inst._isController) {
				this.reset();
			}
		},

		// TODO:
		reset: function () {
			var $d = this.get("data");
			this.destroyClientControls();
			if ($d) {
				enyo.forEach($d, this.add, this);
			}
		},

		render: function () {
			this.reset();
			this.inherited(arguments);
		},

		//*@public
		add: function (rec) {
			if (!this.generated) {
				return;
			}
			var $k = this.defaultKind;
			var $c = this.createComponent({kind: $k, model: rec});
			if (!this.batching) {
				$c.render();
			}
		},

		//*@public
		remove: function (idx) {
			var $ch = this.get("active");
			var $c = $ch[idx || (Math.abs($ch.length-1))];
			if ($c) {
				$c.destroy();
			}
		},

		//*@public
		update: function (idx) {
			var $d = this.get("data");
			var $ch = this.get("active");
			var $c = $ch[idx];
			if ($d && $c) {
				$c.set("model", $d[idx]);
			}
		},

		//*@public
		prune: function () {
			var $ch = this.get("active");
			var l = this.length;
			var $x = $ch.slice(l);
			enyo.forEach($x, function (c) {
				c.destroy();
			});
		},

		// ...........................
		// COMPUTED PROPERTIES

		//*@public
		active: enyo.computed(function () {
			return this.controlParent? this.controlParent.children: this.children;
		}, "controlParent", {cached: true, defer: true}),

		// ...........................
		// PROTECTED METHODS

		initContainer: function () {
			var $c = this.get("containerOptions"), $n;
			$n = $c.name || ($c.name = this.containerName);
			this.createChrome([$c]);
			this.discoverControlParent();
			if ($n != this.containerName) {
				this.$[this.containerName] = this.$[$n];
			}
		},

		modelAdded: function (sender, event) {
			if (sender == this.controller) {
				this.add(event.model, event.index);
			}
		},

		modelsAdded: function (sender, event) {
			if (sender == this.controller) {
				this.set("batching", true);
				for (var $i=0, $m; ($m=event.models[$i]); ++$i) {
					this.add($m.model, $m.index);
				}
				this.set("batching", false);
			}
		},

		modelRemoved: function (sender, event) {
			if (sender == this.controller) {
				this.remove(event.index);
			}
		},

		modelsRemoved: function (sender, event) {
			if (sender == this.controller) {
				for (var $i=0, $m; ($m=event.models[$i]); ++$i) {
					this.remove($m.index);
				}
			}
		},

		// ...........................
		// OBSERVERS

		//*@public
		batchingChanged: function (prev, val) {
			if (this.generated && false === val) {
				this.$[this.containerName].renderReusingNode();
			}
		},

		//*@protected
		_lengthChanged: enyo.observer(function (prop, prev, val) {
			if (!isNaN(prev) && !isNaN(val)) {
				if (prev > val) {
					this.prune();
				}
			}
		}, "length")

	});

})(enyo);
