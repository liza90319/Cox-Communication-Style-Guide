/** 
 * @author Kyle Patterson, Scott Thompson
 * @version 0.1.0.0
 * @namespace
 * @classdesc This is the JavaScript framework for all of cox.com applications.  While generally serving as a wrapper for the Mediator (represented by the {@link coxfw.core} object) and the Facade (represented by the {@link coxfw.coxjs} object), it also contains the following framework and {@link coxfw.utils} methods.
 */
var coxfw = coxfw || {};

(function(coxfw) {
	/**
	 * Create a deep clone of an object.  Used by {@link coxfw.extend} to add functionality to the framework.
	 * 
	 * @method extendObj
	 * @memberof coxfw
	 * @param {object} destination The object being filled with the clone.
	 * @param {object} source The original object being cloned.
	 * @return {object} The newly cloned object.
	 */
	coxfw.extendObj = function(destination, source) {
		return coxfw.core.dom().extend(true, destination, source);
	};
	/**
	 * Adds inline functionality to the existing framework.
	 * 
	 * @method extend
	 * @memberof coxfw
	 * @param {object} source The original object being cloned.
	 */
	coxfw.extend = function(source) {
		if (typeof source == "string") {
			coxfw[source] = {};
		} else {
			coxfw.extendObj(coxfw, source);
		}
	};
	/**
	 * @author Kyle Patterson, Scott Thompson
	 * @version 0.1.0.0
	 * @namespace
	 * @memberof coxfw
	 * @classdesc Utility methods used by the framework.
	 * @return {object} The utility methods.
	 */
	coxfw.utils = (function() {
		return {
			/**
			 * Check to see if the passed parameter is of a specific type.
			 * 
			 * @method typeEqual
			 * @memberof coxfw.utils
			 * @param {object} input The argument passed for type validation.
			 * @param {string} desiredType The argument passed for object validation.
			 * @return {boolean} True if argument passed is of the desired type.
			 */
			typeEqual : function(input, desiredType) {
				return coxfw.core.type(input) === desiredType;
			},
			/**
			 * Generate a globally unique identifier.
			 * 
			 * @method newGUID
			 * @memberof coxfw.utils
			 * @return {string} The newly created GUID.
			 */
			newGUID : function() {
				var S4 = function() {
					return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
				};

				return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
			},
			/**
			 * Return a DOM parsed object of a given URL.
			 * 
			 * @method parseURL
			 * @memberof coxfw.utils
			 * @param {string} url The URL address to be parsed.
			 * @return {object} The DOM parsed URL object.
			 */
			parseURL : function(url) {
				var anchor = coxfw.core.dom("<a/>")[0];
				anchor.href = url;

				return anchor;
			}
		};
	}());
})(coxfw);
(function(coxfw) {
	/**
	 * @author Kyle Patterson, Scott Thompson
	 * @version 0.1.0.0
	 * @namespace
	 * @memberof coxfw
	 * @classdesc The application core contains the functional pieces of the framework, including the Mediator portion of the Mediator-Facade-Module pattern.
	 * @return {object} The core methods.
	 */
	coxfw.core = (function() {
		/**
		 * Storage for the mapping between module ID and callback code for framework modules.
		 * 
		 * @memberof coxfw.core
		 * @type {object}
		 */
		var data = {};
		/**
		 * Storage for the list of selectors that fire code by virtue of their existence in an AJAX response.
		 * 
		 * @memberof coxfw.core
		 * @type {array}
		 */
		var _selectors = [];
		/**
		 * Storage for storing values which can be accessed by module's sandbox and pub sub handlers
		 * 
		 * @memberof coxfw.core
		 * @type {object}
		 */		
		var _store = {};

		return {
			/**
			 * Method for checking and including a module into the framework.
			 * As a wrapper within which modules are coded, it supplies each module with an instance of the coxjs Facade API. It checks for the existence, empty or not, of .init(), .destroy(), and .execute() methods in the callback.  If they exist, they are added to the .data{} object.
			 * 
			 * @method define
			 * @memberof coxfw.core
			 * @param {string} id The unique id associated with a modules callback code.
			 * @param {function} constructor Callback to be associated with the unique id.
			 */
			define : function(id, constructor) {
				if (coxfw.utils.typeEqual(id, 'string') && coxfw.utils.typeEqual(constructor, 'function')) {
					temp = constructor(coxfw.coxjs.define(this, id));
					if (this.validConstructor(temp)) {
						temp = null;
						data[id] = {
							define : constructor,
							instance : null
						};
					} else {
						coxfw.core.throwError(1, 'Module ' + id + ' registration failed. Instance cannot be initialized');
					}
				} else {
					coxfw.core.throwError(1, 'Module ' + id + ' registration failed. One or more args are of an incorrect type');
				}
			},
			/**
			 * Create a module instance by firing its .init() method.
			 * 
			 * @method initialize
			 * @memberof coxfw.core
			 * @param {string} id The unique id associated with a modules callback code.
			 */
			initialize : function(id) {
				var module = data[id];
				module.instance = module.define(coxfw.coxjs.define(this, id));
				
				try {	
					module.instance.init();
				} catch(e) {
					console.error("COXJS: Module named '" + id + "' had a problem while initializing and said '" + e + "'.");
				}
				
			},
			/**
			 * Create a module instance by firing its .execute() method.
			 * 
			 * @method start
			 * @memberof coxfw.core
			 * @param {string} id The unique id associated with a modules callback code.
			 */
			start : function(id) {
				var module = data[id];
				module.instance = module.define(coxfw.coxjs.define(this, id));
				
				try {
					module.instance.execute();
				} catch(e) {
					console.error("COXJS: Module named '" + id + "' had a problem while executing and said '" + e + "'.");
				}
				
			},
			/**
			 * Create two loops to start all the modules.  First we {@link coxfw.core.initialize} each module, then we {@link coxfw.core.start} them.
			 * 
			 * @method startAll
			 * @memberof coxfw.core
			 */
			startAll : function() {
				var id;
				// Initialize all modules by looping through each and firing .init() method
console.groupCollapsed("INIT initialize all modules");
				for (id in data) {
					if (data.hasOwnProperty(id)) {
						// Verify instance and fire .init()
						this.initialize(id);
					}
				}
console.groupEnd();
				// Start all modules by looping through each and firing .execute() method
console.groupCollapsed("EXEC start all modules");
				for (id in data) {
					if (data.hasOwnProperty(id)) {
						// Verify instance and fire .execute()
						this.start(id);
					}
				}
console.groupEnd();
			},
			/**
			 * Stop and destroy an instance of a module.
			 * 
			 * @method stop
			 * @memberof coxfw.core
			 * @param {string} id The unique id associated with the module you wish to stop.
			 */
			stop : function(id) {
				var modData;
				if (modData = data[id] && modData.instance) {
					modData.instance.destroy();
					modData.instance = null;
				}
			},
			/**
			 * Step through all of the modules and call the {@link coxfw.core.stop} method on each.
			 * 
			 * @method stopAll
			 * @memberof coxfw.core
			 */
			stopAll : function() {
				var id;
				for (id in data) {
					if (data.hasOwnProperty(id)) {
						this.stop(id);
					}
				}
			},
			/**
			 * Report errors to the browser console.
			 * 
			 * @method throwError
			 * @memberof coxfw.core
			 * @param {integer} errType The numeric type of the error thrown.
			 * @param {string} msg The error message to be displayed.
			 */
			throwError : function(errType, msg) {
				console.error(errType, msg);
			},
			/**
			 * Returns Boolean value of whether the module passed contains both .init(), .destroy(), and .execute() methods.
			 * 
	         * @method validConstructor
			 * @memberof coxfw.core
	         * @param {object} temp The module to be validated.
	         * @return {boolean} Anded inline if checking for existence and type of .init(), .destroy(), and .execute() methods.
	         */
			validConstructor : function(temp) {
				return (temp.init && coxfw.utils.typeEqual(temp.init, 'function') && temp.destroy && coxfw.utils.typeEqual(temp.destroy, 'function') && temp.execute && coxfw.utils.typeEqual(temp.execute, 'function'));
			},
			/**
			 * Check incoming parameter to see if it is a plain object.  This is chained into the jQuery prototype for use in module callbacks.
			 * 
			 * @method isPlainObject
			 * @memberof coxfw.core
			 * @param {object} obj The argument passed for object validation.
			 * @return {boolean} True if argument passed is a plain object.
			 */
			isPlainObject : function(obj) {
				return jQuery.isPlainObject(obj);
			},
			/**
			 * Remove the whitespace from the beginning and end of a string.
			 * 
	         * @method trim
			 * @memberof coxfw.core
	         * @param {string} str String to be trimmed.
	         * @return {string} The newly trimmed string.
	         */					
			trim : function(str) {
				return jQuery.trim(str);
			},
			/**
			 * Check incoming parameter to see if second array contains first array.  This is chained into the jQuery prototype for use in module callbacks.
			 * 
			 * @method inArray
			 * @memberof coxfw.core
			 * @param {array} elem The argument we are searching for in the target array.
			 * @param {array} ary The target array within which we are searching for element.
			 * @return {integer} The integer index of the matching element.
			 */
			inArray : function(elem, ary) {
				return jQuery.inArray(elem, ary);
			},
			/**
			 * Iterate over a collection of data, performing code on each instance.
			 * 
			 * @method each
			 * @memberof coxfw.core
			 * @param {object} collection The data to iterate over.
			 * @param {function} callback The code to be called for each instance of the data.
			 * @return {object} Each instance of the data in collection.
			 */
			each : function(collection, callback) {
				return jQuery.each(collection, callback);
			},
			/**
			 * A string containing the URL to which the request is sent.
			 * 
			 * @method getScript
			 * @memberof coxfw.core
			 * @param {string} url Contains the URL to which the request is sent.
			 * @param {function} callback A callback function that is executed if the request succeeds.
			 */
			getScript : function(url, callback) {
				return jQuery.getScript(url, callback);
			},
			/**
			 * jQuery method to see if one node is an ancestor of another node.
			 * 
			 * @method contains
			 * @memberof coxfw.core
			 * @param {object} container Ancestor node we are checking against.
			 * @param {object} contained Node we are checking for as a descendant.
			 */
			contains : function(container, contained) {
				return jQuery.contains(container, contained);
			},
			/**
			 * Generate an in-page HTTP request.  This is chained into the jQuery prototype for use in module callbacks.
			 * 
			 * @method ajax
			 * @memberof coxfw.core
			 * @param {object} obj Object used to configure the HTTP request.
			 * @return {xhr} The server response from the initiated request.
			 */
			ajax : function(obj) {
				return jQuery.ajax(obj);
			},	
			/**
			 * Use jQuery to define the ajax setup
			 * 
			 * @method ajaxSetup
			 * @memberof coxfw.core
			 * @param {object} obj Object used to configure the HTTP request.
			 */
			ajaxSetup : function(obj) {
				return jQuery.ajaxSetup(obj);
			},	
			/**
			 * Use jQuery to determine basic object type.  This is chained into the jQuery prototype for use in module callbacks.
			 * 
			 * @method type
			 * @memberof coxfw.core
			 * @param {var} input The variable we are testing.
			 * @return {string} A string indicating the type of the input.
			 */
			type : function(input) {
				return jQuery.type(input);
			},
			/**
			 * @author Kyle Patterson, Scott Thompson
			 * @version 0.1.0.0
			 * @namespace
			 * @memberof coxfw.core
			 * @classdesc Object wrapper for managing framework events.  This is the heart of the Mediator pattern, allowing any module to communicate an event to any other module, without the two knowing the other exists.
			 */
			events : {
				/**
				 * Add the event passed to the specified module.
				 * 
				 * @method register
				 * @memberof coxfw.core.events
		         * @param {object} events The events object.
		         * @param {string} module The unique id associated with a modules callback code.
				 */
				register : function(events, module) {
					if (coxfw.core.isPlainObject(events) && module) {
						if (data[module]) {
							data[module].events = events;
						} else {
							coxfw.core.throwError(1, 'Module ' + module + ' registration failed. Instance cannot be found');
						}
					}
				},
				/**
				 * Cause the events passed to fire.
				 * 
		         * @method trigger
				 * @memberof coxfw.core.events
		         * @param {object} events The events object.
				 * @return {object} Passes through any code returned by the publishing module.
		         */
				trigger : function(events) {
					if (coxfw.core.isPlainObject(events)) {
						var mod;
						for (mod in data) {
							if (data.hasOwnProperty(mod)) {
								mod = data[mod];
								if (mod.events && mod.events[events.type]) {
									// Set internal returnValue to the output from this events' callback...
									var returnValue = mod.events[events.type](events.data);
									// ...and return it if it's NOT 'undefined'!
									if (!coxfw.utils.typeEqual(returnValue, 'undefined')) return returnValue;
								}
							}
						}
					}
				},
				/**
				 * Delete the events from the specified module.
				 * 
		         * @method remove
				 * @memberof coxfw.core.events
		         * @param {object} events The event object.
		         * @param {string} module The string identifying the module on which to register the events.
		         */
				remove : function(events, module) {
					if (coxfw.core.isPlainObject(events) && module && (module = data[module]) && module.events) {
						delete module.events;
					}
				}
			},
			/**
			 * @author Scott Thompson
			 * @version 0.1.0.0
			 * @namespace
			 * @memberof coxfw.core
			 * @classdesc Object wrapper for tracking what layout and user agent settings are available.
			 * @property {string} os The operating system of the user agent currently browsing.
			 * @property {string} layout The layout style used for the user agent currently browsing.
			 * @property {string} orientation Whether the user agent currently browsing is rotated to portrait or landscape orientation.
			 * @return {object} Properties and their values read from the data-* attributes in the body tag.
			 */
			browser : function() {
				if (window.matchMedia) {
					if (window.matchMedia("(max-width: 767px)").matches) {
						coxfw.core.dom("body").attr("data-layout", "mobile");
					} else {
						coxfw.core.dom("body").attr("data-layout", "desktop");
					}
				} else {
					var winWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;		
					// Get browser type for IE
					if (winWidth <= 767) {
						coxfw.core.dom("body").attr("data-layout", "mobile");
					} else {
						coxfw.core.dom("body").attr("data-layout", "desktop");
					}
				}
				return coxfw.core.dom("body").data();
			},
			/**
			 * Instantiates DOM library and extensions to be applied to module callbacks.  Extensions are applied to the jQuery .prototype() method for use in chaining method calls.  This is exposed in the Facade layer as an instance of the coxjs.select() method for each module.
			 * 
			 * @author Kyle Patterson, Scott Thompson
			 * @version 0.1.0.0
			 * @class
			 * @memberof coxfw.core
			 * @classdesc Sub-class exposing DOM library and extensions.  This is where {@link coxfw.core.dom} supplies module methods for the {@link coxfw.coxjs.select} Facade layer.
			 * @param {string} selector The CSS selector used to gather DOM nodes.
			 * @param {string|object} context Either an additional CSS selector OR a DOM node(s) object within which to search for 'selector'.
			 * @return {object} A jQuery object for DOM manipulation.
			 */
			dom : function(selector, context) {
				/* *
				 * Add new methods to jQuery's prototype, so they are included in chain.
				 * 
				 * @method info
				 * @param {object} obj The argument passed for object validation
				 * @return boolean True if argument passed is a plain object.
				jQuery.prototype.info = function (msg, events) {
					console.info(msg);

					// coxfw.testing.test starts this module's test suite	
					coxfw.core.testing.test("info", function() {
						coxfw.core.testing.ok(events, "info says: " + msg);
					});
				}
				*/
				return new jQuery( selector, context );
			},
			/**
			 * @author Scott Thompson
			 * @version 0.1.0.0
			 * @namespace
			 * @memberof coxfw.core
			 * @classdesc Object wrapper for unit testing.
			 */
			testing : {
				/**
				 * Defines a series of tests to be run.  It serves as a wrapper for the functional test declarations, and generally follows a .timing() performance test.
				 * This method is called from within a module using the coxjs.test() method.
				 * 
		         * @method test
				 * @memberof coxfw.core.testing
		         * @param {string} testName The name of the test to run.
		         * @param {integer} expected The number of assertions expected for this test.
		         * @param {function} callback The function to test with.
		         * @param {boolean} async Should the test run asynchronously.
		         * @return {object} The newly created test.
				 */
				test : function(testName, expected, callback, async) {
					// Reserved for future use...
				},
				/**
				 * Create a Boolean functional test.  If result is true, the test passes.
				 * This method is called from within a module using the {@link coxfw.coxjs.ok} method.
				 * 
		         * @method ok
				 * @memberof coxfw.core.testing
		         * @param {object} result An expression representing the expected result.
		         * @param {string} msg The message displayed for this test.
		         * @return {object} The newly created Boolean test.
		         */
				ok : function(result, msg) {
					// Reserved for future use...
				},
				/**
				 * Create a functional test comparing an actual result with an expected response.  If the two are equal, the test passes.
				 * This method is called from within a module using the {@link coxfw.coxjs.equal} method.
				 * 
		         * @method equal
				 * @memberof coxfw.core.testing
		         * @param {string} actual The variable or method call to be compared.
		         * @param {string} expected The result as it should be.
		         * @param {string} msg The message displayed for this test.
		         * @return {object} The newly created equality test.
		         */
				equal : function(actual, expected, msg) {
					// Reserved for future use...
				},
				/**
				 * Create a performance test reporting the time required for a method.  Run these prior to any functional testing to provide results for those tests.
				 * This method is called from within a module using the {@link coxfw.coxjs.timing} method.
				 * 
		         * @method timing
				 * @memberof coxfw.core.testing
		         * @param {string} name The name of the timing test to run.
		         * @param {function} fn The code to run timing tests against.
		         * @return {object} The newly created timing test.
		         */
				timing : function(name, fn) {
					// Reserved for future use...
				}
			},
			/**
			 * Add to the list of selectors searched for every time AJAX returns.
			 * 
			 * @method setXHRSelectors
			 * @memberof coxfw.core
			 * @param {string} selector The CSS selector to be searched for.
			 */
			setXHRSelectors : function(selector) {
				_selectors.push(selector);
			},
			/**
			 * Retrieve the list of selectors searched for every time AJAX returns.
			 * 
			 * @method getXHRSelectors
			 * @memberof coxfw.core
			 * @return {array} The list of selectors to search for.
			 */
			getXHRSelectors : function() {
				return _selectors;
			},
			/**
			 * Create a JSON Store.
			 * This will be useful for pub sub handlers to access modules properties irrespective of the scope they are in. 
			 * But the properties by itself are not present in the module sandbox instead it can be accessed through the coxjs scope 
			 *  
			 * @method saveItem
			 * @memberof coxfw.core
			 * @param {string} module Module Id. 
			 * @param {string} json Stringified JSON object.
			 */
			saveItem : function(module, json) {
				if (_store[module]) {
					_store[module] = JSON.stringify(jQuery.extend(true, JSON.parse(_store[module]), JSON.parse(json)));
				} else {
					_store[module] = json;	
				}				 
			},
			/**
			 * Retrieves module specific JSON Store.
			 * This will be useful for pub sub handlers to access modules properties irrespective of the scope they are in. 
			 * But the properties by itself are not present in the module sandbox instead it can be accessed through the coxjs scope 
			 *  
			 * @method getItem
			 * @memberof coxfw.core
			 * @param {string} module Module Id.
			 * @return {object} The JSON String for that module 
			 */
			getItem : function(module) {
				return _store[module];
			},
			/**
			 * Clear the JSON store for that particular module.
			 * This will be useful for pub sub handlers to access modules properties irrespective of the scope they are in. 
			 * But the properties by itself are not present in the module sandbox instead it can be accessed through the coxjs scope 
			 *  
			 * @method removeItem
			 * @memberof coxfw.core
			 * @param {string} module Module Id.
			 */			
			removeItem : function(module) {
				delete _store[module];
			},
			/**
			 * Reset JSON Store
			 * Future Use
			 * 
			 * @method clearAllItems
			 * @memberof coxfw.core
			 */		
			clearAllItems : function() {
				_store = {};
			}
		};
	}());
})(coxfw);
(function(coxfw) {
	/**
	 * @author Kyle Patterson, Scott Thompson
	 * @version 0.1.0.0
	 * @namespace
	 * @memberof coxfw
	 * @classdesc The application facade serves as a way to communicate between the module level and the application core.  All methods in the application facade are called directly from the module level.  All modules MUST go through the application facade, NEVER talk directly to the application core.
	 */
	coxfw.coxjs = {
		/**
		 * Instantiate an instance of a module within the context of the {@link coxfw.coxjs} object.  This is the Facade layer that allows each module to interact with the framework without exposing the framework internals.
		 * 
		 * @method define
		 * @memberof coxfw.coxjs
		 * @param {object} core Reference to the application core object.
		 * @param {string} module The unique id associated with a modules callback code.
		 * @return {object} A locally scoped version of the Facade methods.
		 */
		define : function(core, module) {
			/**
			 * Defines a local copy of the {@link coxfw.utils|framework utils} object.
			 * 
			 * @memberof coxfw.coxjs
			 * @type {coxfw.utils}
			 */
			var utils = coxfw.utils;
			/**
			 * Defines a local copy of the {@link coxfw.core|framework core}.
			 * 
			 * @memberof coxfw.coxjs
			 * @type {coxfw.core}
			 */
			var core = coxfw.core;
			/**
			 * Defines a local copy of the {@link coxfw.core.dom|core DOM} class.
			 * 
			 * @memberof coxfw.coxjs
			 * @type {coxfw.core.dom}
			 */
			var dom = core.dom;
			/**
			 * Defines a local copy of the {@link coxfw.core.events|core events} object.
			 * 
			 * @memberof coxfw.coxjs
			 * @type {coxfw.core.events}
			 */
			var events = core.events;
			/**
			 * Defines a local copy of the {@link coxfw.core.testing|core testing} object.
			 * 
			 * @memberof coxfw.coxjs
			 * @type {coxfw.core.testing}
			 */
			var testing = core.testing;
			
			return {
				/**
				 * Register callback(s) to be applied when an arbitrarily named event is published.  This is the frameworks' connector between the Mediator pattern and all Modules.
				 * 
				 * @method subscribe
				 * @memberof coxfw.coxjs
				 * @param {object} e The events object.
				 */
				subscribe : function(e) {
					events.register(e, module);
				},
				/**
				 * Broadcast that an arbitrarily named event has been triggered.  All modules currently subscribed to this event will now fire their callback(s).  This is the frameworks' connector between the Mediator pattern and all Modules.
				 * 
				 * @method publish
				 * @memberof coxfw.coxjs
				 * @param {object} e The events object.
				 * @return {object} Passes through any code returned by the publishing module.
				 */
				publish : function(e) {
					return events.trigger(e);
				},
				/**
				 * Disconnects a callback function from an event on the module specified.
				 * 
		         * @method ignore
				 * @memberof coxfw.coxjs
		         * @param {object} e The events object to be removed from the given module.
		         */
				ignore : function(e) {
					events.remove(e, module);
				},
				/**
				 * Localized version of the DOM library and extensions.  This is the heart of the Facade pattern, allowing every module to have an instance of the functional code used in the general operation of a module.
				 * 
				 * @author Kyle Patterson, Scott Thompson
				 * @version 0.1.0.0
				 * @class
				 * @memberof coxfw.coxjs
				 * @classdesc Sub-class exposing DOM library and extensions.  This is where the {@link coxfw.coxjs.select} Facade layer connects to the {@link coxfw.core.dom} method endpoints.
				 * @param {string} selector The CSS selector used to gather DOM nodes.
				 * @param {string|object} context Either an additional CSS selector OR a DOM node(s) object within which to search for 'selector'.
				 * @return {object} A jQuery object for DOM manipulation.
				 */
				select : function(selector, context) {
					/* *
					 * Add new methods to jQuery's prototype, so they are included in chain.
					 * 
					 * @method info
					 * @param {object} obj The argument passed for object validation
					 * @return boolean True if argument passed is a plain object.
					jQuery.prototype.info = function (msg, events) {
						console.info(msg);
	
						// coxfw.testing.test starts this module's test suite	
						coxfw.core.testing.test("info", function() {
							coxfw.core.testing.ok(events, "info says: " + msg);
						});
					}
					*/
					return new dom(selector, context);
				},
				/**
				 * Remove the whitespace from the beginning and end of a string.
				 * 
		         * @method trim
				 * @memberof coxfw.coxjs
		         * @param {string} str The string to be trimmed.
		         * @return {string} Newly trimmed string.
		         */				
				trim : function(str) {
					return core.trim(str);
				},				
				/**
				 * Bare inArray method to check incoming parameter to see if second array contains first array.
				 * 
		         * @method inArray
				 * @memberof coxfw.coxjs
				 * @param {array} elem The argument we are searching for in the target array.
				 * @param {array} ary The target array within which we are searching for element.
		         * @return {integer} The integer index of the matching element.
		         */
				inArray : function(elem, ary) {
					return core.inArray(elem, ary);
				},
				/**
				 * Check to see if the passed parameter is of a specific type.
				 * 
		         * @method typeEqual
				 * @memberof coxfw.coxjs
				 * @param {object} node The DOM node to be checked.
				 * @param {string} type The type of element we expect node to be.
		         * @return {boolean} Whether the node is or is NOT the type expected.
		         */
				typeEqual : function(node, type) {
					return utils.typeEqual(node, type);
				},
				/**
				 * Iterate over a collection of data, performing code on each instance.
				 * 
				 * @method each
				 * @memberof coxfw.coxjs
				 * @param {object} collection The data to iterate over.
				 * @param {function} callback The code to be called for each instance of the data.
				 * @return {object} Each instance of the data in collection.
				 */
				each : function(collection, callback) {
					return core.each(collection, callback);
				},
				/**
				 * A string containing the URL to which the request is sent.
				 * 
				 * @method getScript
				 * @memberof coxfw.coxjs
				 * @param {string} url Contains the URL to which the request is sent.
				 * @param {function} callback A callback function that is executed if the request succeeds.
				 */
				getScript : function(url, callback) {
					return core.getScript(url, callback);
				},
				/**
				 * jQuery method to see if one node is an ancestor of another node.
				 * 
				 * @method contains
				 * @memberof coxfw.coxjs
				 * @param {object} container Ancestor node we are checking against.
				 * @param {object} contained Node we are checking for as a descendant.
				 */
				contains : function(container, contained) {
					return core.contains(container, contained);
				},
				/**
				 * Generate an in-page HTTP request.  This is chained into the jQuery prototype for use in module callbacks.
				 * 
		         * @method ajax
				 * @memberof coxfw.coxjs
		         * @param {object} obj Configuration object defining various AJAX parameters.
		         * @return {xhr} The response from the destination URL packaged with statistical information.
		         */
				ajax : function(obj) {
					return core.ajax(obj);
				},
				/**
				 * Use jQuery to define the ajax setup
				 * 
				 * @method ajaxSetup
				 * @memberof coxfw.coxjs
				 * @param {object} obj Object used to configure the HTTP request.
				 */
				ajaxSetup : function(obj) {
					return core.ajaxSetup(obj);
				},
				/**
				 * Stop the event's default action from triggering.
				 * 
		         * @method preventDefault
				 * @memberof coxfw.coxjs
		         * @param {object} event The event whose default action you wish to stop
		         * @return {object} The event chain without the default action.
		         */
				preventDefault : function(event) {
					return event.preventDefault();
				},
				/**
				 * Stop the event from bubbling up through the DOM beyond the original trigger element.
				 * 
		         * @method stopPropagation
				 * @memberof coxfw.coxjs
		         * @param {object} event The event whose default action you wish to stop
		         * @return {object} The event chain with bubbling stopped.
		         */
				stopPropagation : function(event) {
					return event.stopPropagation();
				},				
				/**
				 * Defines a series of tests to be run.  It serves as a wrapper for the functional test declarations, and generally follows a .timing() performance test.
				 * 
		         * @method test
				 * @memberof coxfw.coxjs
		         * @param {string} testName The name of the test to run.
		         * @param {integer} expected The number of assertions expected for this test.
		         * @param {callback} callback The function to test with.
		         * @param {boolean} async Should the test run asynchronously.
		         * @return {object} The newly created test.
		         */
				test : function(testName, expected, callback, async) {
					if (arguments.length === 2) {
						callback = expected;
						expected = null;
					}

					return testing.test(testName, expected, callback, async);
				},
				/**
				 * Create a Boolean functional test.  If result is true, the test passes.
				 * 
		         * @method ok
				 * @memberof coxfw.coxjs
		         * @param {object} result An expression representing the expected result.
		         * @param {string} msg The message displayed for this test.
		         * @return {object} The newly created Boolean test.
		         */
				ok : function(result, msg) {
					return testing.ok(result, msg);
				},
				/**
				 * Create a functional test comparing an actual result with an expected response.  If the two are equal, the test passes.
				 * 
		         * @method equal
				 * @memberof coxfw.coxjs
		         * @param {string} actual The variable or method call to be compared.
		         * @param {string} expected The result as it should be.
		         * @param {string} msg The message displayed for this test.
		         * @return {object} The newly created equality test.
		         */
				equal : function(actual, expected, msg) {
					return testing.equal(actual, expected, msg);
				},
				/**
				 * Create a performance test reporting the time required for a method.  Run these prior to any functional testing to provide results for those tests.
				 * 
		         * @method timing
				 * @memberof coxfw.coxjs
		         * @param {string} name The name of the timing test to run.
		         * @param {function} fn The code to run timing tests against.
		         * @return {object} The newly created timing test.
		         */
				timing : function(name, fn) {
					return testing.timing(name, fn);
				},
				/**
				 * Add to the list of selectors searched for every time AJAX returns.
				 * 
				 * @method setXHRSelectors
				 * @memberof coxfw.coxjs
				 * @param {string} selector The CSS selector to be searched for.
				 * @return {object} The method for setting selectors.
				 */
				setXHRSelectors : function(selector) {
					return core.setXHRSelectors(selector);
				},
				/**
				 * Retrieve the list of selectors searched for every time AJAX returns.
				 * 
				 * @method getXHRSelectors
				 * @memberof coxfw.coxjs
				 * @return {array} The list of selectors to search for.
				 */
				getXHRSelectors : function() {
					return core.getXHRSelectors();
				},
				/**
				 * Defines a local copy of the {@link coxfw.core.browser|core browser properties}.
				 * 
				 * @author Scott Thompson
				 * @version 0.1.0.0
				 * @namespace
				 * @memberof coxfw.coxjs
				 * @type {coxfw.core.browser}
				 * @classdesc Object wrapper for tracking what layout and user agent settings are available.
				 * @property {string} os The operating system of the user agent currently browsing.
				 * @property {string} layout The layout style used for the user agent currently browsing.
				 * @property {string} orientation Whether the user agent currently browsing is rotated to portrait or landscape orientation.
				 * @return {object} Properties and their values read from the data-* attributes in the body tag.
				 */
				browser : core.browser(),
				/**
				 * Create a JSON Store in coxjs scope.
				 * This will be useful for pub sub handlers to access modules properties irrespective of the scope they are in. 
				 * But the properties by itself are not present in the module sandbox instead it can be accessed through the coxjs scope 
				 * 
		         * @method createStore
				 * @memberof coxfw.coxjs
				 * @param {string} json Stringified JSON object.
				 * @return {string} The module id or name.
				 * @return {string} The JSON string to be stored as an object.
				 * @example coxjs.createStore('{"key": "value"'}');
				 */
				createStore : function(json) {
					return core.saveItem(this.getModuleId(), json);
				},
				/**
				 * Retrieves module specific JSON Store.
				 * This will be useful for pub sub handlers to access modules properties irrespective of the scope they are in. 
				 * But the properties by itself are not present in the module sandbox instead it can be accessed through the coxjs scope 
				 *  
		         * @method getStore
				 * @memberof coxfw.coxjs
				 * @return {string} The module id or name.
				 * @example coxjs.getStore();
				 */
				getStore : function() {
					return core.getItem(this.getModuleId());
				},
				/**
				 * Clear the JSON store for that particular module.
				 * This will be useful for pub sub handlers to access modules properties irrespective of the scope they are in. 
				 * But the properties by itself are not present in the module sandbox instead it can be accessed through the coxjs scope 
				 *  
		         * @method clearStore
				 * @memberof coxfw.coxjs
				 * @return {string} The module id or name.
				 * @example coxjs.clearStore();
				 */
				clearStore : function() {
					return core.removeItem(this.getModuleId());
				},
				/**
				 * Retrieves module id or name 
				 *  
		         * @method getModuleId
				 * @memberof coxfw.coxjs
				 * @return {string} The module id or name.
				 */
				getModuleId : function() {
					return module;
				}
			};
		}
	};
})(coxfw);
// JSDoc virtual docs for modules namespace.
/** 
 * @namespace modules
 * @classdesc This is where modules live.
 */
/** 
 * @namespace modules.global
 * @classdesc Globally available modules.
 */
(function(coxfw) {
	// When the DOM reports ready, start all the modules.
	coxfw.core.dom().ready(function() {
		// Avoid console errors in browsers that lack a console.
		var noop = function noop() { return; };
		var methods = [
			'assert',
			'clear',
			'count',
			'debug',
			'dir',
			'dirxml',
			'error',
			'exception',
			'group',
			'groupCollapsed',
			'groupEnd',
			'info',
			'log',
			'markTimeline',
			'profile',
			'profileEnd',
			'table',
			'time',
			'timeEnd',
			'timeStamp',
			'trace',
			'warn'
		];
		var length = methods.length;
		var console = (window.console = window.console || {});

		// This is the custom version of console.log for use with IE.
		if (!console["log"]) {
			console["log"] = function(message) {
				// alert(message);
			};
		}
	
		// Stub out all undefined methods.	
		while (length--) {
			var method = methods[length];
			if (!console[method]) { console[method] = noop; }
		}

		// Spin up the framework.
		coxfw.core.startAll();
	});
})(coxfw);
/**
 * @author Robert Sekman, Kyle Patterson, Scott Thompson, Prathima Sanjeevi
 * @version 1.2.3
 * @namespace tracking.global
 * @class GlobalLinkTracker
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('tracking.global.GlobalLinkTracker', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The element clicked to trigger tracking.
		 * All links under cols-gris -> col-content
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger = ".cols-grid .col-content a:not(.accordion-trigger)";

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT GlobalLinkTracker.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC GlobalLinkTracker.js");
		        // set the module variable to this object
				_module = this;

				if (typeof s != 'undefined' && s.linkDownloadFileTypes) {
					coxjs.select("body").on("click", _trigger, function(event) {
						_module.trackComponentHeaderLinks(this);
					});
				}
			},

			trackComponentHeaderLinks : function(caller) {

				// track all links with the component headers (usually h2 or h3) in the path for all the modules used on the grid template
				// i.e. header text:link text
				var pageName = "";
				var componentHeader = $(caller).closest(".col-content").find('h2,h3').text();
				var labelText = componentHeader ? componentHeader + ":" : "";
				// the h2 or h3 tag (usually a component header)
				var cleanInnerHTML = caller.innerHTML.replace(/<\/?[^>]+(>|$)/g, "");
				// remove any html tags
				var linkText = $.trim(caller.title || cleanInnerHTML);
				var trackString = (labelText + linkText).toLowerCase();
				// remove last colon from string if it exists (can happen if the href is blank, like the shop-feature-highlight)
				var re = /:$/;
				trackString = trackString.replace(re, "");

				// Make sure __coxOmnitureParams exists so pageName is FRESH!
				if (typeof(__coxOmnitureParams) != "undefined") {
					pageName = __coxOmnitureParams.pageName;
					trackString = __coxOmnitureParams.pageName + ":" + trackString;

					// Now publish the OmnitureInterface event to report this click.
					coxjs.publish({
						type : "OmnitureInterface",
						data : {
							mode : "track",
							type : "event",
							clearVariables : "true",
							caller : _trigger,
							options : {
								pageName : pageName,
								customLink : trackString
							}
						}
					});
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Robert Sekman, Kyle Patterson, Scott Thompson, Prathima Sanjeevi
 * @version 1.2.3
 * @namespace tracking.global
 * @class ManageOmnitureVariables
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('tracking.global.ManageOmnitureVariables', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT ManageOmnitureVariables.js");
			    // set the module variable to this object
				_module = this;

				// Subscribe to Omniture Interface calls
				coxjs.subscribe({
					"OmnitureInterface" : _module.OmintureInterface
				});
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
// console.log("EXEC ManageOmnitureVariables.js");
			},
			
			OmintureInterface : function(trackRequestObj) {
console.log("     ManageOmnitureVariables.OmintureInterface");
				if (typeof s != 'undefined' && s && !!s.getQueryParam && typeof(__coxOmnitureParams) != "undefined" && typeof(s_account) != "undefined" && s_account != "") { // Only add observers if 's' - the omniture object - exists
					if (!trackRequestObj.mode)
						return;
					if (this.storedVariables == undefined) {
						this.storedVariables = {};
					}
					switch (trackRequestObj.mode) {
						case "track":
							_module.track(trackRequestObj);
							break;

						case "set":
							_module.set(trackRequestObj);
							break;
					}
				}
			},

			onError : function() {
				console.log("There was an error in the Metrics command.");
			},

			track : function(params) {
				// Get parameters
				var type = params['type'] || 'pageview';
				//type: event or page
				var clearVariables = params['clearVariables'] || false;
				var options = params['options'] || {};

				// If clearVariables defined, then clear all variables
				if (clearVariables)
					_module.clearOmnitureVariables();

				try {
					if (!s)
						return;
					switch (type) {

						case "pageview":
							// Adds the new variable declaration to the storedVariables
							_module.storeVariables(options);
							// map site variables to omniture variables
							_module.mapOmnitureVariables(this.storedVariables);
							s.t();
							break;

						case "event":
							var tracking = _module.mapOmnitureVariables(options);
							if (tracking.events.length)
								tracking.vars.push('events');

							// correlations in omniture require pageName
							if ($.inArray('pageName', tracking.vars) == -1)
								tracking.vars.push("pageName");

							s.linkTrackVars = tracking.vars.length ? tracking.vars.join(",") : "None";
							s.linkTrackEvents = tracking.events.length ? tracking.events.join(",") : "None";
							console.log("Event Tracked: ", s);
							if (options.customLink) {
								s.tl(params.caller, 'o', options.customLink);
							} else if (options.eventName == 'download') {
								s.tl(params.caller, 'o', options.download);
							} else if (options.eventName) {
								s.tl(params.caller, 'o', options.eventName);
							} else if (options.actionPerformed) {
								s.tl(params.caller, 'o', options.actionPerformed);
							} else {
								console.log('No event, custom link, or action set during Omniture Track command.');
								s.tl(params.caller, 'o', 'anonymousTrigger');
							}
							break;

						default:
							//type undeclared
							console.log("A call to metrics was attempted, but no Type (pageview/event) was specified.");
		  			}
				} catch(e) {
					_module.onError();
					console.log("Metrics call failed");
				}
			},

			// adds the new variable declaration to the storedVariables
			storeVariables : function(options) {
				if (options.eventName && this.storedVariables.eventName)
					options.eventName += "," + this.storedVariables.eventName;
				this.storedVariables = coxfw.extendObj(this.storedVariables, options);
			},

			overwriteVariables : function(options) {
				this.storedVariables = coxfw.extendObj(this.storedVariables, options);
			},

			// for use when constructing a new tl() request
			// clear all of the necessary variable in preparation for a new image request
			clearOmnitureVariables : function(object) {
				coxjs.each(this.storedVariables, function(key, value) {
					_module.storedVariables[key] = null;
				});
				_module.mapOmnitureVariables(_module.storedVariables);
			},

			set : function(params) {
				_module.storeVariables(params.options);
				if (params.mapImmediately) {
					_module.mapOmnitureVariables(this.storedVariables);
				}
			},
			
			mapOmnitureVariables : function(options) {
				var tracking = {
					vars : [],
					events : []
				};
				var addEvent = function(value) {
					if (s.events) {
						s.events = ($.inArray(value, s.events.split(",")) > -1) ? s.events : s.events + ',' + value;
					} else {
						s.events = value;
					}
					tracking.events.push(value);
				};
				var coxBusiness = false;
				for (var index in options) {
					var value = options[index];
					switch(index) {
						/* English => Omniture mapping */
						// set the localePagename locale:pagename
						case 'localePagename':
							// localName : pageName
							if (value) {
								// set s.pagename
								s.pageName = value;
								// set s.eVar46
								// s.eVar46 = value;
								// tracking.vars.push('eVar46');
							}
							break;
						case 'pageName':
							if (value) {
								s.prop30 = value;
								tracking.vars.push('prop30');
								s.eVar46 = value;
								tracking.vars.push('eVar46');
							}
							// add event for every page load
							addEvent('event52');
							break;
						case 'simplePageName':
							s.prop25 = value;
							break;
						case 'cidm':
							s.eVar61 = value;
							break;
						case 'channel':
							if (value) {
								s.channel = value;
							}
							break;
						case 'contentArea':
							s.channel = value;
							break;
						case 'pageType':
							s.pageType = value;
							break;
						case 'offerSource':
							s.eVar4 = value;
							break;
						case 'localeName':
							//san diego, hartford
							// set s.prop1
							s.prop1 = value;
							tracking.vars.push('prop1');
							//set s.eVar7 also
							s.eVar7 = value;
							tracking.vars.push('eVar7');
							break;
						case 'sectionName':
							//digital cable, watch, voice
							s.prop2 = value;
							tracking.vars.push('prop2');
							break;
						case 'businessUnit':
							//residential|business
							if (value == 'businessstore') {
								coxBusiness = true;
							}
							s.prop3 = value;
							tracking.vars.push('prop3');
							break;
						case 'formName':
							//form name:abandon|error|success:field
							s.prop4 = value;
							tracking.vars.push('prop4');
							break;
						case 'logStatus':
							//logged in, not logged in
							if (!value)
								value = "not logged in";
							s.prop5 = value;
							tracking.vars.push('prop5');
							s.eVar6 = value;
							tracking.vars.push('eVar6');
							break;
						case 'businessLocal':
							//business:locale
							s.prop6 = value;
							tracking.vars.push('prop6');
							s.eVar35 = value;
							tracking.vars.push('eVar35');
							break;
						case 'campaign':
							s.campaign = value;
							tracking.vars.push('campaign');
							break;
						case 'searchResultsFlag':
							//true|false
							if (!value)
								value = "false";
							s.prop7 = value;
							tracking.vars.push('prop7');
							break;
						case 'pathingByCampaign':
							//pathingByCampaign
							s.prop8 = value;
							tracking.vars.push('prop8');
							break;
						case 'productName':
							//productName
							s.prop9 = value;
							tracking.vars.push('prop9');
							break;
						case 'customLink':
							s.prop10 = value;
							tracking.vars.push('prop10');
							s.eVar16 = value;
							tracking.vars.push('eVar16');
							addEvent('event45');
							//click counter
							break;
						case 'exitLink':
							s.prop30 = value;
							tracking.vars.push('prop30');
							break;
						case 'videoTitle':
							s.prop11 = value;
							tracking.vars.push('prop11');
							s.eVar9 = value;
							tracking.vars.push('eVar9');
							break;
						case 'language':
							s.prop12 = value;
							tracking.vars.push('prop12');
							break;
						case 'kanaArticleId':
							s.prop18 = value;
							tracking.vars.push('prop18');
							s.eVar21 = value;
							tracking.vars.push('eVar21');
							break;
						case 'confirmationMsg':
							s.prop31 = value;
							tracking.vars.push('prop31');
							break;
						case 'dvrFilter':
							s.prop32 = value;
							tracking.vars.push('prop32');
							break;
						case 'registrationType':
							if (!value) {
								value = "not set";
							}
							s.eVar1 = value;
							tracking.vars.push('eVar1');
							break;
						case 'products':
							s.products = value;
							break;
						case 'download':
							s.eVar2 = value;
							tracking.vars.push('eVar2');
							break;
						case 'keyword':
							//web|cox|support - search term
							if (value) {
								if (value.match(/^web -/)) {
									value = value.replace(/^web - /, "");
									s.prop38 = value.toLowerCase();
									tracking.vars.push('prop38');
								} else if (value.match(/^cox -/) || value.match(/^support -/)) {
									value = value.toLowerCase();
									s.eVar3 = value;
									tracking.vars.push('eVar3');
									s.prop36 = value;
									tracking.vars.push('pro36');
								}
								addEvent('event4');
								//search result page view counter
							}
							break;
						case 'toolName':
							s.eVar4 = value;
							tracking.vars.push('eVar4');
							break;
						case 'actionPerformed':
							//send to a friend, add to bundle
							s.eVar5 = value;
							tracking.vars.push('eVar5');
							break;
						case 'dvrSearch':
							//King of the Hill
							s.eVar47 = value;
							tracking.vars.push('eVar47');
							break;
						case 'contextualFlag':
							//reg, nonreg
							s.eVar8 = value;
							tracking.vars.push('eVar8');
							break;
						case 'campcode':
							s.eVar10 = value;
							tracking.vars.push('eVar10');
							break;
						case 'promoCode':
							s.eVar22 = value;
							tracking.vars.push('eVar22');
							s.prop26 = value;
							tracking.vars.push('prop26');
							break;
						case 'promoCodeEntered':
							s.eVar56 = value;
							tracking.vars.push('eVar56');
							break;
						case 'orderSavedCartStatus':
							s.eVar57 = value;
							tracking.vars.push('eVar57');
							break;
						case 'orderInstallChargePro':
							s.eVar32 = value;
							break;
						case 'orderInstallChargeProSavings':
							s.eVar33 = value;
							break;
						case 'orderInstallChargeSelfDropShip':
							s.eVar39 = value;
							break;
						case 'orderInstallChargeSelfDropShipSavings':
							break;
						case 'orderInstallChargeSelfPickUp':
							s.eVar36 = value;
							break;
						case 'orderInstallChargeSelfPickUpSavings':
							s.eVar37 = value;
							break;
						case 'selectedServiceFilters':
							s.eVar34 = value;
							tracking.vars.push('eVar34');
							break;
						case 'offerSortType':
							s.eVar38 = value;
							tracking.vars.push('eVar38');
							break;
						case 'featureFilterValue':
							s.eVar55 = value;
							tracking.vars.push('eVar55');
							break;
						case 'offersCompared':
							s.eVar51 = value;
							tracking.vars.push('eVar51');
							break;
						case 'quoteContention':
							s.prop33 = value;
							tracking.vars.push('prop33');
							break;
						case 'ccCode':
							s.eVar23 = value;
							tracking.vars.push('eVar23');
							s.prop27 = value;
							tracking.vars.push('prop27');
							break;
						case 'searchReferrer':
							s.eVar14 = value;
							tracking.vars.push('eVar14');
							break;
						case 'hier1':
							//PATHING
							s.hier1 = value;
							break;
						case 'hier2':
							//PATHING
							s.hier2 = value;
							break;
						case 'pageLayout':
							// device tracking (mobile, desktop, tablet)
							s.eVar40 = value;
							tracking.vars.push('eVar40');
							break;
						/* BEGIN eComm - SMT */
						case 'siteId':
							s.prop21 = value;
							s.eVar17 = value;
							break;
						case 'franchiseId':
							s.prop22 = value;
							s.eVar18 = value;
							break;
						case 'zip':
							s.zip = value;
							break;
						case 'state':
							s.state = value;
							break;
						case 'storeEvent':
							s.events = value;
							break;
						case 'customerType':
							s.prop15 = value;
							break;
						case 'signInType':
							s.prop16 = value;
							break;
						case 'purchaseId':
							s.prop20 = value;
							s.purchaseID = value;
							break;
						case 'errorlist':
							s.prop33 = value;
							break;
						case 'errorAttempts':
							s.prop34 = value;
							break;
						case 'rguSelected':
							s.eVar45 = value;
							break;
						case 'rguSubscribed':
							s.eVar44 = value;
							break;
						case 'moveTransferType':
							s.eVar60 = value;
							break;
						case 'offer':
							s.eVar15 = value;
							break;
						case 'ordersource':
							s.prop40 = value;
							break;
						case 'orderDeposit':
							s.eVar42 = value;
							break;
						case 'monthlyRecurringCharge':
							//Deleted in Sprint 14
							s.eVar25 = value;
							break;
						case 'oneTimeCharge':
							s.eVar28 = value;
							break;
						case 'totalOrderValue':
							//Deleted in Sprint 14
							//s.eVar24 = value;
							//s.eVar43 = value;
							break;
						case 'totalInstallationCharges':
							//s.eVar31 = value;
							break;
						case 'totalMonthlySavings':
							//Deleted in Sprint 14
							//s.eVar26 = value;
							addEvent('event37');
							break;
						case 'orderType':
							s.eVar27 = value;
							break;
						case 'leadId':
							s.prop28 = value;
							break;
						case 'leadType':
							s.prop17 = value;
							break;
						case 'totalOneTimeSavings':
							//s.eVar29 = value;
							break;
						case 'visitCount':
							s.eVar19 = value;
						/*  END  eComm - SMT */
						case 'eventName':
							switch(value) {
								case 'productView':
									addEvent('prodView');
									break;
								case 'download':
									addEvent('event3');
									break;
								case 'searchResultClicked':
									addEvent('event5');
									break;
								case 'toolUsageInitiated':
									addEvent('event6');
									break;
								case 'toolUsageCompleted':
									addEvent('event7');
									break;
								case 'userLogStatus':
									if (!coxBusiness) {
										addEvent('event8');
									}
									break;
								case 'dvrRecord':
									addEvent('event25');
									break;
								case 'dvrSetRecord':
									addEvent('event26');
									break;
								case 'searchRecommendationClicked':
									addEvent('event38');
									break;
								case 'cancelAppointment':
									addEvent('event46');
									break;
								case 'rescheduleAppointment':
									addEvent('event58');
									break;
								case 'activateDevice':
									addEvent('event53');
									break;
								case 'easypay':
									addEvent('event87');
									break;
								case 'paperlessbilling':
									addEvent('event86');
									break;
							}
							break;
						default:
							break;
					}
					// console.log(index, " --> ", value);
				}
				return tracking;
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Robert Sekman, Kyle Patterson, Scott Thompson, Prathima Sanjeevi
 * @version 1.2.3
 * @namespace tracking.global
 * @class OmnitureMetricsController
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('tracking.global.OmnitureMetricsController', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		var _omnitureVars = {};

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT OmnitureMetricsController.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC OmnitureMetricsController.js");
				// set the module variable to this object
				_module = this;

				// set variables if 's' - the omniture object - exists
				if ( typeof s != 'undefined' && typeof __coxOmnitureParams != 'undefined' && s && !!s.getQueryParam) {
					// create a copy of the Omniture vars
					coxfw.extendObj(_omnitureVars, __coxOmnitureParams);
					//set various omniture variables
					_module.setVars();
				}
			},

			setVars : function() {
console.log("     OmnitureMetricsController.setVars");
				// set the log in status
				// we are not using event8 in omniture, so commenting below code.
				/*if (_omnitureVars.logStatus != 'not logged in')
					_omnitureVars.eventName = 'userLogStatus'; */
				// add the campaign if available
				var campaign = _omnitureVars.campaign || s.getQueryParam('scid') || s.getQueryParam('sc_id') || s.getQueryParam('s_cid');
				if (campaign) {
					_omnitureVars.pathingByCampaign = campaign + ":" + _omnitureVars.pageName;
					_omnitureVars.campaign = campaign;
				}
				// add the camp code if available
				var campcode = s.getQueryParam('campcode');
				if (campcode !== '' && campcode !== null)
					_omnitureVars.campcode = campcode;
				// create Line Of Business/Locale traffic variable
				_omnitureVars.businessLocal = _omnitureVars.businessUnit + ":" + _omnitureVars.localeName;
				// create Locale Pagename
				_omnitureVars.localePagename = _omnitureVars.localeName + ":" + _omnitureVars.pageName;

				// add kana article id
				var kanaArticle = $("#support-article:first")[0];

				// see if we are on an article page and have a querystring
				if (kanaArticle && window.location.search) {
					// convert our query string into an object (use slice to strip the leading "?")
					var uri = window.location.search.slice(1);
					var queryParams = {};
					uri.replace(new RegExp("([^?=&]+)(=([^&]*))?", "g"), function($0, $1, $2, $3) {
						queryParams[$1] = $3;
					});

					// get the tab index: parseInt will convert undefined/rubbish to NaN
					var articleId = queryParams["articleId"];
					if (articleId) {
						_omnitureVars.kanaArticleId = articleId;
					}

				}

				// publish OmnitureInterface call
				coxjs.publish({
					type : "OmnitureInterface",
					data : {
						mode : "track",
						type : "pageview",
						options : _omnitureVars
					}
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Kyle Patterson
 * @version 1.0
 * @namespace tracking.global
 * @class TealiumTagManager
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('tracking.global.TealiumTagManager', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {

			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				// set the module variable to this object
				_module = this;

				var currentCoxOmnitureObj = null;
				var currentCoxOmnitureHolder = [];

				// check for s_account var, if not null continue to map cox_omniture
				if ( typeof (__coxOmnitureParams) != "undefined" && typeof (s_account) != "undefined" && s_account != "") {
					currentCoxOmnitureObj = __coxOmnitureParams;

					// make cox omniture into array
					if (currentCoxOmnitureObj) {
						var myUDO = new Object();

						currentCoxOmnitureHolder.push(currentCoxOmnitureObj);

						for (var i = 0; i < currentCoxOmnitureHolder.length; i++) {
							var obj = currentCoxOmnitureHolder[i];

							coxjs.each(obj, function(name, value) {
								var myTempValue = value.toString();
								if (myTempValue) {
									if (myTempValue.search(",") > 0)
										myTempValue = splitParam(myTempValue);
								} else {
									myTempValue = "";
								}

								myUDO[name] = myTempValue;
							});
						}

						utag_data = myUDO;

						console.log('Creating Teallium UDO');
						console.log(utag_data);

					   (function(a,b,c,d){
						    a='//tags.tiqcdn.com/utag/cox/main/prod/utag.js';
						    b=document;c='script';d=b.createElement(c);d.src=a;d.type='text/java'+c;d.async=true;
						    a=b.getElementsByTagName(c)[0];a.parentNode.insertBefore(d,a);
						})();

					}
				}

				// splits an omniture param into an array
				function splitParam(obj) {
					if (obj) {
						return obj.split(",");
					}
				}

			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Manage CoxCenters Maps
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.aboutus.map.CoxCenters
 */
(function(coxfw) {
	coxfw.core.define("modules.aboutus.map.CoxCenters", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		/**
		 * Stores a copy of the Google map API to apply inside methods.
		 *
		 * @member {object} _coxMap
		 */
		var _coxMap;
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @member {object} _context
		 */
		var _mapSelector = coxjs.select(".map-container");

		var _currentLocation;

		var _zoomLevel = 14;

		var _requestForMarkersCalled = false;

		var _totalMarkerObjects = [];

		var _markersHolder = [];

		var _iconPath = "/ui/4_1/tsw/img/interface/map/";

		var _infowindow;

		var _markerClicked = false;

		var _currentMarker;

		var _currentSets;

		var _currentInfo;

		var _filteredSets;

		var NETWORK_ERROR_MSG = "We're sorry, there was a problem with your request. Please try again.";

		var NO_COX_CENTERS = "There are no retail & payment locations in this area. Try zooming in or out to see where others may be located near you.";

		var _injectedJS = false;

		return {
			/**
			 *
			 * @method init
			 */
			init : function() {
				_module = this;

				coxjs.subscribe({
					"init-cox-centers" : _module.initCoxCentersMap,
					"responseMarkers" : _module.responseMarkers
				});

			},
			/**
			 * Setup initial map associated event listeners.
			 *
			 * @method execute
			 */
			execute : function() {
			},

			initCoxCentersMap : function(data) {
				var address = data.address;
				var geocoder = new google.maps.Geocoder();

				// convert the address to coordinates then make call
				geocoder.geocode({
					'address' : address
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						// get the address coordinates and set the current location to that
						_currentLocation = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());

						// set the map
						_coxMap = _module.getCoxMap();

						// set the listeners
						_module.addEventListeners(_coxMap);
						
						// set the current marker location
						//_module.setCurrentLocation();
					}
				});

				_module.displayLocationResults(address);
			},

			getCoxMap : function() {
				// add map to page
				return new google.maps.Map(_mapSelector[0], {
					zoom : _zoomLevel,
					center : _currentLocation,
					scaleControl : true,
					mapTypeId : google.maps.MapTypeId.ROADMAP
				});
			},
			
			setCurrentLocation : function() {
				
				
				var newIcon = _iconPath + "current-location.png";
				
				//console.log(newIcon)
				
				var marker = {
					position : _currentLocation,
					map : _coxMap,
					icon : newIcon
					/*sets : sets,
					info : info,
					address : address*/
				}
	//console.log(marker)
				//_markersHolder.push(marker);
				
			},

			displayLocationResults : function(address) {
				var resultsContainer = coxjs.select(".map-search-results");
				coxjs.select(resultsContainer).html('Showing results for <strong>"' + address + '"</strong>');
			},

			addEventListeners : function(map) {
				if (!_infowindow)
					_infowindow = new google.maps.InfoWindow();

				// listen for map loaded, then get lat, long, radius and make ajax call for data points
				google.maps.event.addListener(map, 'dragstart', function() {
					// get markers
					if (!_requestForMarkersCalled)
						_module.requestMarkers();
					else
						_module.populateMapWithMarkers();

					// check for open marker
					_module.keepInfoWindowOpen();
				});

				google.maps.event.addListener(map, 'tilesloaded', function() {
					// get markers
					if (!_requestForMarkersCalled)
						_module.requestMarkers();
					else
						_module.populateMapWithMarkers();

					// check for open marker
					_module.keepInfoWindowOpen();
				});

				google.maps.event.addListener(_infowindow, 'closeclick', function() {
					_markerClicked = false;
				});

				// listen for previous btn clicked
				coxjs.select(".paging").find(".previous").click(function(e) {
					e.preventDefault();
					_module.paginationPrev(this);
				});

				// listen for next btn clicked
				coxjs.select(".paging").find(".next").click(function(e) {
					e.preventDefault();
					_module.paginationNext(this);
				});

				// listen for search input clicked
				coxjs.select(".map-search-wrapper a.button").click(function(event) {
					event.preventDefault();
					// close any markers that might have been open
					_markerClicked = false;
					_module.getLocationFromAddressInput();

					var address = coxjs.select(".map-search-wrapper input").val();
					_module.displayLocationResults(address);
				});

				coxjs.select(".map-search-wrapper input").focus(function(event) {
					event.preventDefault();
					// listen if the user presses the "enter" key
					coxjs.select(this).bind("keypress", function(e) {
						if (e.which == 13) {
							e.preventDefault();
							// close any markers that might have been open
							_markerClicked = false;
							_module.getLocationFromAddressInput();

							var address = coxjs.select(".map-search-wrapper input").val();
							_module.displayLocationResults(address);
						}
					});
				});

				// find the selected checkboxes and listen for changes
				_module.filterMarkersOnMap();
			},

			filterMarkersOnMap : function() {
				var servicesCheckboxes = coxjs.select('.cox-centers-select-options input');

				coxjs.select(servicesCheckboxes).on("click", function(evt) {
					getNumberOfItemsChecked();
				});

				getNumberOfItemsChecked();

				function getNumberOfItemsChecked() {
					var serviceCheckboxesArray = []
					// listen for all the checkboxes to be selected
					coxjs.select(servicesCheckboxes).each(function(index, el) {
						if (coxjs.select(el).is(":checked"))
							serviceCheckboxesArray.push(coxjs.select(el).val());
					});

					// get checkboxes
					getFilteredCheckboxes(serviceCheckboxesArray)
				}

				function getFilteredCheckboxes(checkboxes) {
					var temp = "";
					coxjs.select(checkboxes).each(function(index, el) {
						temp += "," + el.replace('"', '');
					})
					var tempArr = temp.split(',');
					var sets = [];
					coxjs.select(tempArr).each(function(i, e) {
						if (e != "") {
							sets.push(e);
						}
					});

					_filteredSets = sets;

					_module.populateMapWithMarkers();
				}

			},

			getLocationFromAddressInput : function() {
				// initialize geocoder
				var geocoder = new google.maps.Geocoder();
				// get the address from input field
				var address = coxjs.select('.map-search-wrapper input').val();

				// convert the address to coordinates then make call
				geocoder.geocode({
					'address' : address
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						// get the address coordinates and set the current location to that
						_currentLocation = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
						_coxMap.fitBounds(results[0].geometry.viewport);
						
						// set the current marker location
						//_module.setCurrentLocation();
						
					} else {
						var errorMsg = "We could not find that location.";
						_module.displayErrorMsg(errorMsg);
					}
				});
			},

			displayErrorMsg : function(msg) {
				var error = coxjs.select(_mapSelector).find(".zoom-too-high")[0];

				if (!error)
					coxjs.select(_mapSelector).append('<div class="zoom-too-high"><p>' + msg + '</p></div>');
				else
					coxjs.select(_mapSelector).find('.zoom-too-high p').html(msg);

				coxjs.select(".zoom-too-high").removeClass("hide");

			},

			hideErrorMsg : function() {
				coxjs.select(".zoom-too-high").addClass("hide");
			},

			requestMarkers : function() {
				// make ajax call to get markers
				var mapOptions = {
					map : _coxMap
				};

				coxjs.publish({
					type : "requestCoxCentersMarkers",
					data : mapOptions
				});
			},

			responseMarkers : function(data) {
				if (data) {
					// set the total markers array with all the marker data
					_module.setTotalMarkerObjects(data.response.locations);

					// reset flag so cox centers only gets markers once
					_requestForMarkersCalled = true;
				} else
					_module.displayErrorMsg(NETWORK_ERROR_MSG);
			},

			setTotalMarkerObjects : function(locations) {
				// add all the marker data into total array
				coxjs.select(locations).each(function(index, location) {
					var marker = {};
					marker.address = location.address;
					marker.info = location.info;
					marker.lat = location.lat;
					marker.lng = location.lon;
					marker.sets = location.sets;
					marker.newIcon = _iconPath + "marker.png";

					_totalMarkerObjects.push(marker);
				});

				// populate the map
				_module.populateMapWithMarkers();
			},

			populateMapWithMarkers : function() {
				// remove prev markers
				_module.removeMarkers();

				// get the current location
				_currentLocation = _coxMap.getCenter();

				var tempDistanceHolder = [];
				var markersHolder = [];

				// loop through all the markers and find the closest to current location
				coxjs.select(_totalMarkerObjects).each(function(index, marker) {
					var currentMarker = marker;
					var distance = new google.maps.LatLng(marker.lat, marker.lng);
					distance = _module.getDistanceBetweenLocations(distance);
					currentMarker.distance = _module.getMiles(distance);

					tempDistanceHolder.push(currentMarker);
				});

				// sort markers by distance
				tempDistanceHolder = tempDistanceHolder.sort(function(a, b) {
					return a.distance - b.distance;
				});

				// loop through sorted markers and only display the markers within 50 miles
				coxjs.select(tempDistanceHolder).each(function(index, marker) {
					if (marker.distance <= 50) {
						markersHolder.push(marker);
					}
				});

				// check for filter items
				var tempMarkersHolder = [];
				coxjs.select(markersHolder).each(function(index, marker) {
					coxjs.select(marker.sets).each(function(i, e) {
						coxjs.select(_filteredSets).each(function(ii, ee) {
							if ((ee == e))
								tempMarkersHolder.push(marker);
						});
					});
				});

				// set the markers array with the filtered items
				if (_filteredSets.length > 0) {
					var uniqueMarkers = [];
					coxjs.each(tempMarkersHolder, function(i, el) {
						if (coxjs.inArray(el, uniqueMarkers) === -1)
							uniqueMarkers.push(el);
					});

					markersHolder = uniqueMarkers;
				}

				// place markers on map
				_module.placeMarkersOnMap(markersHolder);

				// create pagination and display list
				_module.displayCoxcentersList(markersHolder);
				// display error message if no markers are close
				if (markersHolder.length == 0)
					_module.displayErrorMsg(NO_COX_CENTERS);
				else
					_module.hideErrorMsg();
			},
			
			injectMarkerWithLabelIntoHtmlPage : function() {
				_module.load_script('/ui/4_1/tsw/js/extlib/markerLabel.js');	
			},
			
			//Script loading function
			load_script : function( source ) {
				if(!_injectedJS) {
					 var new_script  = document.createElement('script');
				    new_script.type = 'text/javascript';
				    new_script.src = source;
				    new_script.className = 'myMarkerLabel';
				    document.getElementsByTagName('head')[0].appendChild(new_script);
				    _injectedJS = true;
				}
			   
			},
			
			escapeHtml : function(unsafe) {
			  return unsafe
			      .replace(/&/g, "&amp;")
			      .replace(/</g, "&lt;")
			      .replace(/>/g, "&gt;")
			      .replace(/"/g, "&quot;")
			      .replace(/'/g, "&#039;");
			},

			placeMarkersOnMap : function(markers) {
				_module.injectMarkerWithLabelIntoHtmlPage();
				
				var cnt = 0;

				coxjs.select(markers).each(function(index, el) {
					cnt++;

					var position = new google.maps.LatLng(el.lat, el.lng);

					var marker = new MarkerWithLabel({
						position : position,
						map : _coxMap,
						icon : el.newIcon,
						sets : el.sets,
						labelContent : cnt + "",
						labelAnchor : new google.maps.Point(13, 31),
						labelClass : "marker-label", // the CSS class for the label
						labelStyle : {
							opacity : 1.0
						}
					});

					_module.getInfoWindowContent(marker, el.info, el.sets);

					_markersHolder.push(marker);
				});
				
				// set the current marker location
				//_module.setCurrentLocation();
			},

			getInfoWindowContent : function(marker, info, sets) {
				google.maps.event.addListener(marker, 'click', function() {
					// set the current marker data so info window can stay open
					_currentMarker = marker;
					_currentSets = sets;
					_currentInfo = info;
					_markerClicked = true;

					_module.keepInfoWindowOpen();

				});
			},

			keepInfoWindowOpen : function() {
				var info = coxjs.select(_currentInfo)[1];
				var address = coxjs.select(info).text();

				if (_markerClicked) {
					// open panel
					_infowindow.setContent("<div class=\"map-info-panel\">" + _currentInfo + _module.addServiceIcons(_currentSets) + "<a href='https://www.google.com/maps/dir/" + address + " ' target='_blank'>Get Directions</a>" + "</div>");
					_infowindow.open(_coxMap, _currentMarker);
					_module.hideErrorMsg();
				}
			},

			addServiceIcons : function(collectionOfIcons) {
				var iconContainer = '<div>';

				coxjs.select(collectionOfIcons).each(function(index, imgNumber) {
					iconContainer += "<img style='display:inline;' src='" + _iconPath + imgNumber + ".png'/>";
				});

				iconContainer += "</div>";

				return iconContainer;
			},

			displayCoxcentersList : function(markers) {
				var items = [];
				var newPage = 0;
				var list = coxjs.select(".centers-list-wrapper");
				var pagination = [];
				var lists = [];
				var listItem = '';
				// empty list
				coxjs.select(list).find(".centers-list-item").remove();

				// loop thru markers
				coxjs.select(markers).each(function(index, el) {
					// create pages
					var pages = index % 5;
					if (pages == 0)
						newPage++;

					//  use lat and lng to pan to location when anchor is clicked from list
					var lat = el.lat;
					var lng = el.lng;
					var currentIndex = index;
					var info = coxjs.select(el.info);
					var title = coxjs.select(info[0]).text();
					var address = coxjs.select(info[1]).html();
					var phone = coxjs.select(info[3]).text();

					// create list items
					if (newPage == 1)
						listItem += '<div class="centers-list-item page-' + newPage + ' active-page"><a href="#" data-current-index="' + currentIndex + '"><div class="center-marker-number">' + (index + 1) + '</div></a><a href="#" data-current-index="' + currentIndex + '"><h5>' + title + '</h5></a><p>' + address + '</p><p>' + phone + '</p></div>';
					else
						listItem += '<div class="centers-list-item page-' + newPage + '"><a href="#" data-current-index="' + currentIndex + '"><div class="center-marker-number">' + (index + 1) + '</div></a><a href="#" data-current-index="' + currentIndex + '"><h5>' + title + '</h5></a><p>' + address + '</p><p>' + phone + '</p></div>';

					// create pagination
					pagination.push(newPage);
				});

				coxjs.select(list).html(listItem);

				coxjs.select(".centers-list-item a").click(function(e) {
					e.preventDefault();
					var currentIndex = coxjs.select(this).attr("data-current-index");
					_module.gotoMarkerFromList(currentIndex, markers);
				});

				_module.createPagination(pagination);
			},

			createPagination : function(pages) {
				var uniquePages = [];
				var pagination = coxjs.select(".paging ul");
				var page = "";

				// remove duplicate number of pages
				coxjs.each(pages, function(i, el) {
					if (coxjs.inArray(el, uniquePages) === -1)
						uniquePages.push(el);
				});

				// create list items for pagination
				coxjs.select(uniquePages).each(function(index, el) {
					if (el == 1)
						page += '<li><a href="#" class="active">' + el + '</a></li>';
					else if (el > 5)
						page += '<li class="hide-page"><a href="#">' + el + '</a></li>';
					else
						page += '<li><a href="#">' + el + '</a></li>';
				});

				// add pages to pagination
				coxjs.select(pagination).removeAttr("style").html(page);

				// use the width of the container for pagination width
				coxjs.select(".paging").width((coxjs.select(".centers-list-wrapper").width() - 20));

				coxjs.select(".paging ul").find("a").click(function(e) {
					e.preventDefault();
					_module.paginationChange(this);
				});

				_module.setPrevBtnStatus();
				_module.setNextBtnStatus();
			},

			paginationChange : function(btn) {
				var pages = coxjs.select(".paging li");

				coxjs.select(pages).each(function(index, el) {
					var currentBtn = coxjs.select(el).find("a");
					var currentPage = coxjs.select(el).find("a").text();
					if (coxjs.select(currentBtn).hasClass("active"))
						coxjs.select(currentBtn).removeClass("active");
					if (currentBtn[0] == btn) {
						coxjs.select(currentBtn).addClass("active");
						_module.displayCurrentPage(currentPage);
					}
				});

				_module.setPrevBtnStatus();
				_module.setNextBtnStatus();
			},

			paginationNext : function(btn) {
				var pages = coxjs.select(".paging li");
				var currentPage = coxjs.select(".paging li").find("a.active")[0];

				coxjs.select(pages).each(function(index, el) {
					coxjs.select(el).find("a").removeClass("active");
				});

				var nextPage = coxjs.select(currentPage).parent().next().find("a").addClass("active");
				if (nextPage[0])
					_module.displayCurrentPage(coxjs.select(nextPage).text());
			},

			paginationPrev : function() {
				var pages = coxjs.select(".paging li");
				var currentPage = coxjs.select(".paging li").find("a.active")[0];

				coxjs.select(pages).each(function(index, el) {
					coxjs.select(el).find("a").removeClass("active");
				});

				var prevPage = coxjs.select(currentPage).parent().prev().find("a").addClass("active");
				if (prevPage[0])
					_module.displayCurrentPage(coxjs.select(prevPage).text());
			},

			displayCurrentPage : function(page) {
				var listItems = coxjs.select(".map-wrapper .centers-list-item");
				var currentPaginationSet = (page / 5);
				var pages = coxjs.select(".paging li");

				if ((currentPaginationSet % 1) != 0)
					currentPaginationSet = Math.floor(currentPaginationSet + 1);

				var start = (currentPaginationSet * 5 - 5);
				var end = (currentPaginationSet * 5);

				coxjs.select(pages).each(function(index, el) {
					var currentIndex = index + 1;

					if (currentIndex <= start || currentIndex > end)
						coxjs.select(el).addClass("hide-page");
					else
						coxjs.select(el).removeClass("hide-page");
				});

				coxjs.select(listItems).each(function(index, el) {
					var currentItem = coxjs.select(el);

					if (coxjs.select(currentItem).hasClass("page-" + page))
						coxjs.select(currentItem).addClass("active-page");
					else
						coxjs.select(currentItem).removeClass("active-page");
				});

				_module.setPrevBtnStatus();
				_module.setNextBtnStatus();
			},

			setNextBtnStatus : function() {
				// set the next btn status
				var currentPage = coxjs.select(".paging li").find("a.active");
				var nextPage = coxjs.select(currentPage).parent().next();
				if (!nextPage[0])
					coxjs.select(".paging").find("a.next").addClass("disabled");
				else
					coxjs.select(".paging").find("a.next").removeClass("disabled");
			},

			setPrevBtnStatus : function() {
				// set the prev btn status
				var currentPage = coxjs.select(".paging li").find("a.active");
				var prevPage = coxjs.select(currentPage).parent().prev();

				if (!prevPage[0])
					coxjs.select(".paging").find("a.previous").addClass("disabled");
				else
					coxjs.select(".paging").find("a.previous").removeClass("disabled");
			},

			gotoMarkerFromList : function(currentIndex, markers) {
				coxjs.select(markers).each(function(index, el) {
					if (currentIndex == index) {
						var marker = _markersHolder[index];
						// set the current marker data so info window can stay open
						_currentMarker = marker;
						_currentSets = el.sets;
						_currentInfo = el.info;
						_markerClicked = true;

						_module.keepInfoWindowOpen();
					}
				});
			},

			removeMarkers : function() {
				for (var i = 0; i < _markersHolder.length; i++) {
					_markersHolder[i].setMap(null);
				}

				_markersHolder = [];
			},

			getMiles : function(i) {
				return i * 0.000621371192;
			},

			getDistanceBetweenLocations : function(pointLocation) {
				var currentLoc = _currentLocation;
				var pLoc = pointLocation;

				return _module.getDistance(currentLoc, pLoc);
			},

			getDistance : function(p1, p2) {
				var R = 6378137;
				// Earth’s mean radius in meter
				var dLat = _module.rad(p2.lat() - p1.lat());
				var dLong = _module.rad(p2.lng() - p1.lng());
				var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(_module.rad(p1.lat())) * Math.cos(_module.rad(p2.lat())) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				var d = R * c;
				return d;
				// returns the distance in meter
			},

			rad : function(x) {
				return x * Math.PI / 180;
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Manage Wifi Maps and Cox Centers
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.aboutus.map.Map
 */
(function(coxfw) {
	coxfw.core.define("modules.aboutus.map.Map", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		/**
		 * Stores a copy of the Google map API to apply inside methods.
		 *
		 * @member {object} _coxMap
		 */
		//var _coxMap;
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @member {object} _context
		 */
		var _mapSelector = coxjs.select(".map-container");
		
		var _currentAddress;
		
		var _mapType;

		return {
			/**
			 *
			 * @method init
			 */
			init : function() {
				
			},
			/**
			 * Setup initial map associated event listeners.
			 *
			 * @method execute
			 */
			execute : function() {
				_module = this;
				
				if (coxjs.select(_mapSelector).length > 0) {
					// get the zipcode from cookie
					_currentAddress = _module.getLocationFromCookie();
					
					// get the passed query param 
					if(_module.getPassedQueryStr()) _currentAddress = _module.getPassedQueryStr();
					
					// get map type
					_mapType = _module.getMapType();
					
					// initialize map
					var mapOptions = {
						address : _currentAddress,
						mapType : _mapType
					};
					
					coxjs.publish({
						type : "initializeMap",
						data : mapOptions
					});

				} else return;
			},
				
			getLocationFromCookie : function() {
				var cookieArr = document.cookie.split(';');
				// default is usa
				var zipcode = 'United States';
				coxjs.select(cookieArr).each(function(i, e) {					
					var name = e.split('=')[0];
					// remove space on name of prop
					name = name.replace(" ", "");
					if(name == 'cox-current-zipcode') zipcode = e.split('=')[1];	
				});
				
				return zipcode;
			},	
				
			getPassedQueryStr : function() {
				var currentURL = window.location.search;
				var passedAddress = "";
				
				if (currentURL) {
					var queryParams = {};
	
					currentURL.slice(1).replace(new RegExp("([^?=&]+)(=([^&]*))?", "g"), function($0, $1, $2, $3) {
						queryParams[$1] = $3;
					});
	
					var submitForm = queryParams['submit'];
					passedAddress = queryParams['map-address-input'];
					
					if (submitForm) return passedAddress = queryParams['map-address-input'];
				} else return passedAddress;
			},
			
			getMapType : function() {
				return mapType;
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Manage Maps Ajax
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.aboutus.map.MapWifi
 */
(function(coxfw) {
	coxfw.core.define("modules.aboutus.map.MapAjax", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		var _totalPages;
		
		var _wifiMap;
		
		var _wifiResponse = [];
		
		var _pageCnt = 1;
		
		var _wifiTotalReached = false;

		
		return {
			/**
			 *
			 * @method init
			 */
			init : function() {
				
				_module = this;
				
				coxjs.subscribe({
					// default map
					"initializeMap" : _module.initializeMap,
					
					// get cox centers ajax calls
					"requestCoxCentersMarkers" : _module.requestCoxCentersMarkers, 
					"responseCoxCentersMarkers" : _module.responseCoxCentersMarkers,
					
					// get wifi ajax calls
					"requestWifiAjaxPages" : _module.requestWifiAjaxPages,
					"responseWifiAjaxPages" : _module.responseWifiAjaxPages,
					"requestWifiMarkers" : _module.requestWifiMarkers,
					"responseWifiMarkers" : _module.responseWifiMarkers
				});
				
			},

			/**
			 * Setup initial map associated event listeners.
			 *
			 * @method execute
			 */
			execute : function() {},


			initializeMap : function(data) {
				var mapType = data.mapType;
				var address = data.address;
				var mapOptions = {
					address : address
				};
				
				// initialize coxcenters map or wifi map
				coxjs.publish({
					type : "init-" + mapType,
					data : mapOptions
				});
			},
		
			requestCoxCentersMarkers : function(data) {
				var map = data.map;

				var ajaxOptions = {
					id : "responseCoxCentersMarkers",
					url : locationUrl + "?" + _module.calculateRadiusOfMap(map),
					type : "GET",
					dataType : "json",
					timeout : "3000",
					cache : false
				};

				coxjs.publish({
					type : "Ajax",
					data : ajaxOptions
				});
			},
			
			responseCoxCentersMarkers : function(data) {
				if(data) {
					var response = data.responseJSON;
					var mapOptions = {
						response : response
					};
					
					coxjs.publish({
						type : "responseMarkers",
						data : mapOptions
					});
				}
			},
			
			requestWifiAjaxPages : function(data) {
				_wifiMap = data.map;
				_wifiTotalReached = false;
				
				var ajaxOptions = {
					id : "responseWifiAjaxPages",
					url : locationUrl + "?" + _module.calculateRadiusOfMap(_wifiMap),
					type : "GET",
					dataType : "json",
					timeout : "3000",
					cache : false
				};

				coxjs.publish({
					type : "Ajax",
					data : ajaxOptions
				});
			},
			
			responseWifiAjaxPages : function(data) {
				if(data) {
					var response = data.responseJSON;
					_totalPages = response.pages.totalPages;
					
					(_totalPages > 10) ? _module.showZoomInMsg() : _module.makeNumberOfAjaxRequests(_totalPages);
				
				}else console.log("wifi ajax error for pages.");
			},
			
			makeNumberOfAjaxRequests : function(totalCalls) {
				if(totalCalls == 0) {
					coxjs.publish({
						type : "noWifiMarkers"
					});
				} else {
					for ( i = 0; i < totalCalls; i++) {
						// make ajax call to get markers
						var mapOptions = {
							page : i,
							map : _wifiMap
						};
		
						coxjs.publish({
							type : "requestWifiMarkers",
							data : mapOptions
						});
					}
				}
			},
			
			
			requestWifiMarkers : function(data) {
				var page = data.page;
				var map = data.map;
				
				var ajaxOptions = {
					id : "responseWifiMarkers",
					url : locationUrl + "?" + _module.calculateRadiusOfMap(map) + "&page=" + page,
					type : "GET",
					dataType : "json",
					timeout : "3000",
					cache : false
				};

				coxjs.publish({
					type : "Ajax",
					data : ajaxOptions
				});
			},
			
			responseWifiMarkers : function(data) {
				if(data && !_wifiTotalReached) {
					var response = data.responseJSON;
					
					coxjs.select(response.locations).each(function(index, el) {
						var marker = {};
						marker.id = el.id
						marker.lat = el.lat;
						marker.lng = el.lon;
						marker.type = el.type;
						_wifiResponse.push(marker);
					});
					
					// publish when all the markers are here
					if(_pageCnt == _totalPages) {
						var mapOptions = {
							response : _wifiResponse
						};
						
						coxjs.publish({
							type : "totalResponseWifiMarkers",
							data : mapOptions
						});
						
						_wifiTotalReached = true;
						_pageCnt = 0;
						_wifiResponse = [];
					}
					
					_pageCnt++;
				}
				
			},
			
			showZoomInMsg : function() {
				coxjs.publish({
					type : "showZoomMsgOverlay"
				});
			},
			
			calculateRadiusOfMap : function(map) {
				var newZoomLevel = map.getZoom();
				var bounds = map.getBounds();

				var center = bounds.getCenter();
				var ne = bounds.getNorthEast();

				// r = radius of the earth in statute miles
				var r = 3963.0;

				// Convert lat or lng from decimal degrees into radians (divide by 57.2958)
				var lat1 = center.lat();
				var lon1 = center.lng();

				var lat11 = center.lat() / 57.2958;
				var lon11 = center.lng() / 57.2958;

				var lat2 = ne.lat() / 57.2958;
				var lon2 = ne.lng() / 57.2958;

				// used for radius calculation
				var rad = r * Math.acos(Math.sin(lat11) * Math.sin(lat2) + Math.cos(lat11) * Math.cos(lat2) * Math.cos(lon2 - lon11));
				// dont go any lower than 2 radius
				if (rad <= 2)
					rad = 2;
				// if zoom level is higher than 18 set radius to 1
				if (newZoomLevel >= 18)
					rad = 1;

				var queries = "lat=" + lat1 + "&lon=" + lon1 + "&radius=" + Math.round(rad) + "&zoom=" + newZoomLevel;

				return queries;
			},

			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Manage Wifi Maps
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.aboutus.map.Wifi
 */
(function(coxfw) {
	coxfw.core.define("modules.aboutus.map.Wifi", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		/**
		 * Stores a copy of the Google map API to apply inside methods.
		 *
		 * @member {object} _coxMap
		 */
		var _coxMap;

		var _currentLocation;

		var _zoomLevel = 14;

		var _infowindow;

		var _iconPath = "/ui/4_1/tsw/img/interface/map/";

		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @member {object} _context
		 */
		var _mapSelector = coxjs.select(".map-container");

		var _totalMarkers = [];

		var _markerClustering;

		var ZOOM_IN_MSG = "Please zoom in further to find additional locations.";

		return {
			/**
			 *
			 * @method init
			 */
			init : function() {
				_module = this;

				coxjs.subscribe({
					"init-wifi" : _module.initWifiMap,
					"totalResponseWifiMarkers" : _module.totalResponseWifiMarkers,
					"showZoomMsgOverlay" : _module.showZoomMsgOverlay,
					"noWifiMarkers" : _module.hideThrobber,
					"infowindow_response" : _module.responseInfoWindowCall
				});
			},
			/**
			 * Setup initial map associated event listeners.
			 *
			 * @method execute
			 */
			execute : function() {
			},

			initWifiMap : function(data) {
				var address = data.address;
				var geocoder = new google.maps.Geocoder();

				// convert the address to coordinates then make call
				geocoder.geocode({
					'address' : address
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						// get the address coordinates and set the current location to that
						_currentLocation = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());

						// set the map
						_coxMap = _module.getCoxMap();

						// set the listeners
						_module.addEventListeners(_coxMap);
					}
				});

				_module.displayLocationResults(address);
			},

			getCoxMap : function() {
				// add map to page
				return new google.maps.Map(_mapSelector[0], {
					zoom : _zoomLevel,
					center : _currentLocation,
					scaleControl : true,
					mapTypeId : google.maps.MapTypeId.ROADMAP
				});
			},

			displayLocationResults : function(address) {
				var resultsContainer = coxjs.select(".map-search-results");
				coxjs.select(resultsContainer).html('Showing results for <strong>"' + address + '"</strong>');
			},

			addEventListeners : function(map) {
				if (!_infowindow)
					_infowindow = new google.maps.InfoWindow();

				// listen for map loaded, then get lat, long, radius and make ajax call for data points
				google.maps.event.addListener(map, 'dragstart', function() {_module.showThrobber();
					_module.requestNumberOfAjaxCalls();
				});

				google.maps.event.addListener(map, 'tilesloaded', function() {_module.showThrobber();
					_module.requestNumberOfAjaxCalls();
				});

				google.maps.event.addListener(map, 'zoom_changed', function() {
					// show throbber on new request
					_module.showThrobber();
				});

				// listen for search input clicked
				coxjs.select(".map-search-wrapper a.button").click(function(event) {
					event.preventDefault();
					var address = coxjs.select(".map-search-wrapper input").val();
					if(address) {
						_module.showThrobber();
						_module.getLocationFromAddressInput();
						_module.displayLocationResults(address);
					}
				});

				coxjs.select(".map-search-wrapper input").focus(function(event) {
					event.preventDefault();
					// listen if the user presses the "enter" key
					coxjs.select(this).bind("keypress", function(e) {
						if (e.which == 13) {
							e.preventDefault();
							var address = coxjs.select(".map-search-wrapper input").val();
							if(address) {
								_module.showThrobber();
								_module.getLocationFromAddressInput();
							 	_module.displayLocationResults(address);
							}
						}
					});
				});

			},
			
			getLocationFromAddressInput : function() {
				// initialize geocoder
				var geocoder = new google.maps.Geocoder();
				// get the address from input field
				var address = coxjs.select('.map-search-wrapper input').val();
				// convert the address to coordinates then make call
				geocoder.geocode({
					'address' : address
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						// get the address coordinates and set the current location to that
						_currentLocation = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
						_coxMap.fitBounds(results[0].geometry.viewport);
						
					} else {
						var errorMsg = "We could not find that location.";
						_module.insertZoomMsgContainer(errorMsg);
					}
					
					_module.hideThrobber();
				});
			},

			requestNumberOfAjaxCalls : function() {
				// show throbber
				_module.showThrobber();
				
				// remove previous markers
				_module.removeAllMarkers();

				// hide zoom msg overlay
				_module.hideZoomMsgOverlay();

				// make ajax call to get number of pages
				var mapOptions = {
					map : _coxMap
				};

				coxjs.publish({
					type : "requestWifiAjaxPages",
					data : mapOptions
				});
			},

			totalResponseWifiMarkers : function(data) {
				if (data) {
					var response = data.response;
					_module.placeAllMarkersOnMap(response);
				}
			},

			placeAllMarkersOnMap : function(markers) {
				_totalMarkers = [];

				coxjs.select(markers).each(function(index, el) {
					var marker = new google.maps.Marker({
						position : new google.maps.LatLng(el.lat, el.lng),
						map : _coxMap,
						icon : _iconPath + el.type + ".png"
					});

					_module.getInfoWindowContent(marker, el.id);

					_totalMarkers.push(marker);
				});

				// define the map clustering icon
				var styles = [{
					url : _iconPath + 'cluster.png',
					height : 56,
					width : 50,
					anchor : [32, 0],
					textColor : '#ffffff',
					textSize : 11
				}];

				if (_coxMap.getZoom() < 18) {
					_markerClustering = new MarkerClusterer(_coxMap, _totalMarkers, {
						styles : styles
					});
				}

				// hide throbber on new request
				_module.hideThrobber();
			},

			removeAllMarkers : function() {
				for (var i = 0; i < _totalMarkers.length; i++) {
					_totalMarkers[i].setMap(null);
				}

				if (_markerClustering)
					_markerClustering.clearMarkers();
			},

			showThrobber : function() {
				coxjs.select(_mapSelector).addClass('loading');
			},

			hideThrobber : function() {
				coxjs.select(_mapSelector).removeClass('loading');
			},

			showZoomMsgOverlay : function() {
				_module.hideThrobber();
				_module.insertZoomMsgContainer(ZOOM_IN_MSG);
				coxjs.select(".zoom-too-high").removeClass("hide");
			},

			hideZoomMsgOverlay : function() {
				coxjs.select(".zoom-too-high").addClass("hide");
			},

			insertZoomMsgContainer : function(msg) {
				var zoomDiv = coxjs.select(_mapSelector).find(".zoom-too-high")[0];

				if (!zoomDiv)
					coxjs.select(_mapSelector).append('<div class="zoom-too-high"><p>' + msg + '</p></div>');
				else
					coxjs.select(_mapSelector).find('.zoom-too-high p').html(msg);
			},

			getInfoWindowContent : function(marker, id) {

				google.maps.event.addListener(marker, 'click', function() {
					if (id) {
						var url = markerInfoURL + "?id=" + id;
						// set current marker
						_curentMarker = marker;
						// 	generate ajax request object to be publised
						var ajaxOptions = {
							id : "infowindow_response",
							container : _mapSelector,
							url : url,
							type : "GET",
							dataType : "json",
							timeout : "3000",
							cache : false
						};

						coxjs.publish({
							type : "Ajax",
							data : ajaxOptions
						});

					}
				});
			},

			responseInfoWindowCall : function(data) {
				var response = data.responseJSON;
				// Hotspot name
				var hostspotName = response.info.hotspotName;
				if (hostspotName.length > 0)
					hostspotName = "<h2>" + hostspotName + "</h2>";

				// Business name
				var businessName = response.info.businessName;
				if (businessName.length > 0)
					businessName = "<strong>" + businessName + "</strong><br/>";

				// Street Address
				var street = response.info.street;
				if (street.length > 0)
					street += "<br/>";

				// City, State and Zip
				var cityStateZip = response.info.city + ", " + response.info.state + " " + response.info.zip;

				// Network (ssid)
				var network = response.info.type;
				if (network.length > 0)
					network = "<p><strong>Network: </strong>" + network + "</p>";

				// build out the info panel html
				var infoHTML = hostspotName + "<p>" + businessName + street + cityStateZip + "</p>" + network;

				// add driving form to info window
				_infowindow.setContent("<div class=\"map-info-panel\">" + infoHTML + "<a href='https://www.google.com/maps/dir/" + street + " " + cityStateZip + " ' target='_blank'>Get Directions</a>" + "</div>");
				// open info window
				_infowindow.open(_coxMap, _curentMarker);
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Provide site-wide functionality for managing overlays.
 *
 * @author Prakhar Gupta
 * @version 0.1.0.0
 * @module modules.ecomm.ActiveButtonWelcome
 */
(function(coxfw) {
	coxfw.core.define("modules.ecomm.ActiveButtonWelcome", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The element clicked to trigger the show/hide of DIV.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * The parent node for the widget that provides context for other node selections.
		 * @property _context
		 * @type object
		 */
		var _context;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				/**
				 * Stores a copy of the module context to apply inside methods.
				 *
				 * @member {object} _module
				 */
				_module = this;
				
			},
			/**
			 * Execute this module.
			 * @method execute
			 */
			execute : function() {

				// set the module variable to this object
				_module = this;

				console.log("EXEC ActiveButtonWelcome.js");
				
				/**
				 * selecting active class on click of particular box
				 * @event click
				 * @param {selector} "body" The parent container to listen within
				 * @param {string} ".customer-option a div"
				 * */ 
				coxjs.select("body").on("click", ".customer-option a div", function(event) {
					
					_trigger = coxjs.select(this);
					_context = _trigger.parents(".toggle-container");
					
					var isActive = coxjs.select(".active",_context);
					 for(var i = 0; i < isActive.length; i++){
						 coxjs.select(isActive[i]).removeClass("active");
					}
					
					_trigger.addClass("active");
					
					});
				
				/**
				 * @event click
				 * @param {selector} "body" The parent container to listen within
				 * @param {string} ".welcome-error-viewupgrade"
				 * */ 
				coxjs.select("body").on("click", ".welcome-error-viewupgrade", function(event) {
					
					coxjs.select(".welcome-view-upgrade a div").trigger("click");
					/*mobile*/
					var _trigger = coxjs.select(".upgrade-service-header");
					coxjs.publish({
						type : "openAccordion",
						data : {
							trigger: _trigger
						}
					});
					
				});
				
				
			},
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
				destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Santhana;
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class AutoScroll
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.AutoScroll', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		var _context = coxjs.select(".autoscroll-placeholder");
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				
				console.log("INIT AutoScroll.js");
				
				_module = this;
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC AutoScroll.js");
			
			_module = this;
			if(_context.length > 0){
				//Animating the pages on load
				// autoscroll-placeholder is a div to which "You are Customizing.." header will scroll, this placeholder is written inorder to avoid the headers line height issue.
				coxjs.select("html, body").animate({
					scrollTop: coxjs.select(".autoscroll-placeholder").offset().top
				},1000);
			}				
		
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Prakhar Gupta
 * @version 0.1.0.0
 * @namespace modules.global
 * @class BYOBRadioButton
 *
 *
 *|
 */

/*copy of actuaL code + additional functionality for project*/

(function(coxfw) {
	coxfw.core.define('modules.ecomm.BYOBRadioButton', function(coxjs) {
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".group-chooser-byob";

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				_module = this;

				// handle the body on load if theres an active radio btn
				coxjs.select("body").on("xhr-selectors init-group-choose-block", _selector, function(event) {
					// check if theres a checked radio btn onload
					var radioBtns = coxjs.select(this).find('input[type="radio"]');	
					
					//var radioBtnInputField = coxjs.select(this).find('input.choice-value');					
					
					coxjs.select(radioBtns).each(function(index, el) {
						if (coxjs.select(el).attr("checked") == "checked") _module.handleRadioBtnSelection(coxjs.select(el).parent()[0]);
					});

					// when user tabs onto radio btn add focused class
					coxjs.select(radioBtns).focus(function(e) {
						var radioBox = coxjs.select(this).parent();
						coxjs.select(radioBox).addClass("focused-choice");
							
					});
					// when user tabs off radio btn
					coxjs.select(radioBtns).blur(function(e) {
						var radioBox = coxjs.select(this).parent();
						if (coxjs.select(radioBox).hasClass("focused-choice"))
							coxjs.select(radioBox).removeClass("focused-choice");
						if (coxjs.select(radioBox).hasClass("active-choice"))
							coxjs.select(radioBox).removeClass("focused-choice");
					});
					
					// when user selects radio btn
					coxjs.select(radioBtns).change(function(e) {
						var radioBox = coxjs.select(this).parent();
						if (coxjs.select(radioBox).hasClass("active-choice"))
							coxjs.select(radioBox).removeClass("focused-choice");
					});
				});

				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("init-group-choose-block");

				// handle when user clicks the radio btn
				coxjs.select("body").on("click", ".group-choice", function(event) {
					// handle the selected radio box and set hidden radio btn value with radio box value
					_module.handleRadioBtnSelection(this);
					
				});
			},
			
			/**
			 * @method handleRadioBtnSelection
			 * @param {object} current selected box
			 **/
			handleRadioBtnSelection : function(selectedRadioBox) {
				// get the current radio block
				var currentRadioBlock = coxjs.select(selectedRadioBox).closest(".group-chooser-byob");
				// make current selection focused
				// get all the radio btns in group
				var radioBtns = coxjs.select(currentRadioBlock).find(".group-choice");

				// loop through radio btns add active class to current radio btn
				coxjs.select(radioBtns).each(function(index, el) {
					
					var flagValue = coxjs.select(el).hasClass("active-choice");
					if(flagValue){
						coxjs.select(el).removeClass("active-choice");
						var checkedValue = coxjs.select(el).find('input').attr("checked");
						
						if(checkedValue = "checked"){
							coxjs.select(el).find('input').removeAttr("checked");
						}
					}
					else{
					
					if (el == selectedRadioBox) {
						// add active class
						coxjs.select(el).addClass("active-choice");
						// set the current real radio btn to checked = true
						var selectedRadioBtn = coxjs.select(el).find('input[type="radio"]')[0];
						coxjs.select(selectedRadioBtn).prop('checked', 'checked');
						coxjs.select(selectedRadioBtn).attr("checked", "checked");
					} else {
						// remove active class
						coxjs.select(el).removeClass("active-choice");
						// uncheck other radio btns in group
						var nonSelectedRadioBtn = coxjs.select(el).find('input[type="radio"]')[0];
						coxjs.select(nonSelectedRadioBtn).removeAttr("checked");
						// clear out input field inside radio btn
					}
					}
					
				});
				
				// check for input field inside of radio box
				// make it validate if radio box is selected
				_module.addInputFieldValidation(currentRadioBlock);
			},
			
			/**
			 * @method addInputFieldValidation
			 * @param {object} parent of current selected box
			 * */
			addInputFieldValidation : function(radioBlock) {
				var radioValue = coxjs.select(radioBlock).find(".group-choice .choice-value");
				
				coxjs.select(radioValue).each(function(index, el) {
					if (coxjs.select(el).is("input")) {
						var radioBtn = coxjs.select(el).closest(".group-choice").find('input[type="radio"]');
						
						if (coxjs.select(radioBtn).attr("checked") == "checked") coxjs.select(el).addClass("required").removeClass("ignore-validation");
						else coxjs.select(el).removeClass("required").addClass("ignore-validation");
					}
				});
			},
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Maruthi
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class ChannelLineupEcomm
 *
 * Manage loading and submitting Channel Lineup Ecomm listings via AJAX.
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.ecomm.ChannelLineupEcomm", function(coxjs) {
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context = coxjs.select(".channel-lineup-ecomm");
		/**
		 * The element clicked to set a favorite.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The default settings for an AJAX request.
		 *
		 * @property _ajaxOptions
		 * @type object
		 */
		var _ajaxOptions = {
			container : coxjs.select(".response", _context),
			url : _context.attr("data-ajax-source"),
			type : "GET",
			dataType : "text",
			timeout : "30000",
			cache : false,
			throbber : {
				type : "showThrobber",
				data : {
					nodes : ".loading-wrapper"
				}
			}
		};
		/**
		 * The object used to subscribe to AJAX responses sent by the AJAX module.
		 *
		 * @property _ajaxResponseListener
		 * @type object
		 */
		var _ajaxResponseListener = {};

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT ChannelLineupEcomm.js");	
				coxjs.setXHRSelectors(".channel-lineup-ecomm");
			},
			/**
			 * Setup initial channel lineup grid and associated event listeners.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC ChannelLineupEcomm.js");
				// Store a copy of module context.
				_module = this;
				
				if (_context.length == 0) return;
				
				// Get out of here if we're not on the .channel-lineup-ecomm app.
				coxjs.select("body").on("xhr-selectors", ".channel-lineup-ecomm", function(event) {
					if (_context.length == 0) return;
				});
				

				// Publish AJAX call.
				coxjs.publish({
					type : "Ajax",
					data : _ajaxOptions
				});
				/**
				 * @event submit
				 *
				 * Override the page reload submit with an AJAX version.
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".channel-lineup-ecomm form" The Filter/Search form
				 */
				coxjs.select("body").on("submit", ".channel-lineup-ecomm form", function(event) {
					// Stop default form submission.
					coxjs.preventDefault(event);
					// Publish AJAX call.
					coxjs.publish({
						type : "Ajax",
						data : coxfw.extendObj(_ajaxOptions, {
							url : this.action,
							data : coxjs.select(this).serialize(),
							container : coxjs.select(this).parents(".response")
						})
					});
				});
							
				/**
				 * @event change
				 *
				 * Fire form submit, by triggering a click on the submit button, when the user changes the dropdowns in the header.
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".channel-lineup-ecomm .select-wrapper select" The dropdowns in the header
				 */				
				coxjs.select("body").on("change", ".channel-lineup-ecomm .select-wrapper select", function(event) {					
					coxjs.select("[type='submit']", coxjs.select(this).parents("form")).click();
				});
				
				/**
				 * Trigger "xhr-selectors" if any .channel-lineup-ecomm node exists when the DOM is loaded.
				 *
				 * @event load
				 * @param {string} ".channel-lineup-ecomm" bind channel lineup when open in modal
				 */
				if (coxjs.select(".channel-lineup-ecomm").length > 0)  coxjs.select(".channel-lineup-ecomm").trigger("xhr-selectors");
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);/**
 * @author Santhana Rajagopalan;Prakhar Gupta
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class CheckOut
 *
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.CheckOut', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		
		var _context = coxjs.select(".checkout-page");
		
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = '.checkout-page';
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				_module = this;
				
				
				 /**
				  * @event subscribe
				  * @param {string} calling when all the field is filled from google API
				  * */
				coxjs.subscribe({
					"autoFillActionComplete": _module.handleCreditCheckButton,
					"HashChange":  _module.onHashChange,
					"PseudoFormState": _module.pseudoFormValidation
				});
				
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
			
				console.log("EXEC CheckOut.js");
			
			_module = this;
				/**
				 * @event click
				 *
				 */
			if (_context.length == 0) return;
			
			/**
			 * @event click
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".show-pin" show pin link of profile section of checkout page
			 * removed this functionality from ie8
			 * */
			coxjs.select("body").on("click",".show-pin", function(event) {

				var upass = document.querySelectorAll('.cox-pin')[0];
				var toggleBtn = coxjs.select(".show-pin");
				if (upass.value.length > 0) {
					if (upass.type == 'password') {
						upass.type = 'text';
						toggleBtn.text('Hide Pin');
					} else {
						upass.type = 'password';
						toggleBtn.text('Show Pin');
					}
				}
			});
			
			/**
			 * @event click
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".show-answer" show answer link of profile section of checkout page
			 * removed this functionality from ie8
			 * */
			coxjs.select("body").on("click",".show-answer", function(event) {
				var upass = document.querySelectorAll('.secret-answer')[0];
				var toggleBtn = coxjs.select(".show-answer");
				if (upass.value.length > 0) {
					if (upass.type == "password") {
						upass.type = "text";
						toggleBtn.text("Hide Answer");
					} else {
						upass.type = "password";
						toggleBtn.text("Show Answer");
					}
				}
			});
			
			
			
			/**
			 * @event click
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".show-ssn-link" show ssn link of credit check section of checkout page
			 * removed this functionality from ie8
			 * */
			coxjs.select("body").on("click",".show-ssn-link", function(event) {
				coxjs.preventDefault(event);
				var upass = document.querySelectorAll('.ssn-input')[0];
				var toggleBtn = coxjs.select(".show-ssn-link");
				if (upass.value.length > 0) {
					if (upass.type == "password") {
						upass.type = "text";
						toggleBtn.text("Hide SSN");
					} else {
						upass.type = "password";
						toggleBtn.text("Show SSN");
					}
				}
			});
			
			
			/**
			 * calling removeerror function for custom error on SSN field
			 * @event click
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".scc-yes" click of Yes in secure SSN
			 * */
			coxjs.select("body").on("click",".scc-yes", function(event) {
				/*coxjs.preventDefault(event);*/
				coxjs.select(".credit-check-address").hide();
				var sccInputLength = coxjs.select(".ssn-input").val().length;
				
				_module.removErrorSSN();
				
				if(sccInputLength==11){
					coxjs.select(".credit-submit-button").removeClass("button-disabled-checkout");
				}
				
			});
			
			/**
			 * @event click
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".scc-no" click of no in secure SSN
			 * */
			coxjs.select("body").on("click",".scc-no", function(event) {
				/*coxjs.preventDefault(event);*/
				coxjs.select(".credit-check-address").show();
				var sccStreet = coxjs.select(".scc-street").val().length;
				var sccInputLength = coxjs.select(".ssn-input").val().length;
				
				_module.removErrorSSN();
				
				if(sccStreet>0 && sccInputLength==11){
					coxjs.select(".credit-submit-button").removeClass("button-disabled-checkout");
				}
				else{
					coxjs.select(".credit-submit-button").addClass("button-disabled-checkout");
				}
			});
				
			
			/**
			 * custom error on blur of SSN field- Validations
			 * @event blur
			 * @param {string} ".ssn-input"
			 * @param {selector} "body" The parent container to listen within
			 * */
			coxjs.select("body").on("blur", ".ssn-input", function(event){
				if(coxjs.select(".ssn-input").val().length<11){
					coxjs.select(".make-payment-form").validate().showErrors({"ssn-input":"Please enter 9 digits of your SSN"});
				}
			});
			
			/**
			 * custom error on blur of SSN field- Validations
			 * @event focus
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".ssn-input"
			 * */
			coxjs.select("body").on("focus", ".ssn-input",function(event){
				_module.removErrorSSN();
			});
			
			/**
			 * Validation on submit credit check button based on Age of user
			 * It should be more than 18 years
			 * @event onchange
			 * @param {string} ".day-ri-input, .month-ri-input, .year-ri-input"
			 * */
			coxjs.select(".day-ri-input, .month-ri-input, .year-ri-input").change(function(){
				_module.secureCreditCheckSubmit();
				
			});
		
		/**
		 * validation on submit credit check button based on mandatory fields in address
		 * @event keyup
		 * @param {string}  ".scc-street, .scc-city, .scc-zip, .scc-state, .ssn-input"
		 * @param {selector} "body" The parent container to listen within
		 * */
		coxjs.select("body").on("keyup", ".scc-street, .scc-city, .scc-zip, .scc-state, .ssn-input",function(){	
			
			_module.secureCreditCheckSubmit();
		});
		
		/**
		 * @event keyup
		 * @param {selector} "body" The parent container to listen within
		 * @param {string} ".cox-pin" validation of cox pin number format
		 * no letter should be there
		 * consequence number in not allowed
		 * */
		coxjs.select("body").on("keyup", ".cox-pin",function(){
			var patt = new RegExp("^(0123|1234|2345|3456|4567|5678|6789|3210|4321|5432|6543|7654|8765|9876|0000|1111|2222|3333|4444|5555|6666|7777|8888|9999)$");
			var res = patt.test(coxjs.select(".cox-pin").val());
			if((coxjs.select(".cox-pin").val().length == 4)&&(res)){
				coxjs.select(".make-payment-form").validate().showErrors({"cox-pin":"Sequential and same number not allowed"});
				coxjs.select(".profile-continue-button").removeClass("accordion-next");
			}
			else{
				coxjs.select("#cox-pin-error").remove();
				coxjs.select("label[for='cox-pin']").removeClass("errorMsg");
				coxjs.select(".profile-continue-button").addClass("accordion-next");
				coxjs.select(".cox-pin").removeClass("error");
			}
		});
		
		/**
		 * disable enter button when button is disabled
		 * @event click
		 * @param {selector} "body" The parent container to listen within
		 * 
		 * disabling on enter submit when button is disable. 
		 * */	
		coxjs.select("body").on("click", ".final-checkout-button, .term-continue-button, .scc-continue-button, .payment-continue-button, .credit-submit-button",function(e){
		  if(this.className.indexOf("button-disabled-checkout")>0){
			  e.preventDefault();
			  e.stopImmediatePropagation();
			  return false;
		  }
		});
		
		
		/**
		 * there will be two button for checkout in checkout page 
		 * disabling one button on click of another one
		 * @event click
		 * @string {} "final-checkout-button" 
		 */
		coxjs.select("body").on("click", ".final-checkout-button", function(e){
			 var allFinalButton = coxjs.select(".final-checkout-button");
			 allFinalButton.not(this).addClass("button-disabled-checkout");
		});
		

		/**
		 * ignore-validation creating problem in custom form
		 * writing show hide functionality
		 * @event click
		 * @string {} "directory-name-checkbox"
		 */
		coxjs.select("body").on("click", ".directory-name-checkbox", function(e){
			if(coxjs.select(this).is(":checked")) {
				coxjs.select(".directory-name").removeClass("required error");
				coxjs.select("label[for='directory-name']").removeClass("errorMsg");
				coxjs.select(".directory-name").parent().find(".error-wrapper").remove();
				coxjs.select(".directory-name-parent").hide();
			}
			else{
				coxjs.select(".directory-name-parent").show();
				coxjs.select(".directory-name").addClass("required");
			}
		});
		
		
		/**
		 * @event click
		 * @param {string} ".profile-continue-button"
		 * setting value for ssn service parameters
		 * */
		coxjs.select(".profile-continue-button").click(function(){
			coxjs.select(".last-name-profile").val(coxjs.select(".last-name").val());
			coxjs.select(".first-name-profile").val(coxjs.select(".first-name").val()); 
			coxjs.select(".phone-number-profile").val(coxjs.select(".phone-number").val());
			coxjs.select(".email-from-profile").val(coxjs.select(".email-profile").val());
		});
		
		/*IE7 and IE8 browser don’t support leadingWhitespace, it will return False*/
		/*fix for select dropdown*/
		if (!jQuery.support.leadingWhitespace){
			var	element = coxjs.select("select.secret-question-select");
			element.data("origWidth", element.outerWidth()) 
			element.mouseenter(function(){
				    coxjs.select(this).css("width", "auto");
				  }).bind("blur change", function(){
					  element = coxjs.select(this);
					  element.css("width", element.data("origWidth"));
				  });
	    }
	
		if(window.location.hash){
				var loc = window.location.hash.slice(1);
				var ref = document.referrer;
				
				if (ref.length > 0){
					coxjs.publish({
                     type: "HashChange",
                     data: {
                         route: loc
                     }
                 });
				}             
		 }
		},
		
		/**
		 * @event click
		 * @param {selector} "body" The parent container to listen within
		 * @param {string} ".profile-continue-button" 
		 * enable final checkout button only when SSN and payment section is not there 
		 * when all checkboxes of term and conditions is preselected
		 * profile section has no error
		 */
		pseudoFormValidation : function(data){
			if (_context.length == 0) return;
			var checkingDomExistence = document.querySelectorAll(".card-number-append").length;
			var secureCheckDomExistence = document.querySelectorAll(".secure-credit-check").length;
			var finalcheckoutReference = coxjs.select(".final-checkout-button");
			var termsConditionCheck = true;
			
			coxjs.select(".terms-and-condition .check-boxes").each(function(index, element) {
				if (!coxjs.select(element).hasClass("active-check")) {
					termsConditionCheck = false;
				}
			});
			
			if((data.valid)&&(termsConditionCheck)){
				if((checkingDomExistence=="0")&&(secureCheckDomExistence=="0")){
					finalcheckoutReference.removeClass("button-disabled-checkout");
				}
				else{
					coxjs.select(".term-continue-button").removeClass("button-disabled-checkout");
				}
			}
		},
		

		/**
		 * credit check auto complete section check
		 * @method handleCreditCheckButton
		 * */
		handleCreditCheckButton : function() {
			
			_module.secureCreditCheckSubmit();
			
			if (_context.length == 0) return;
			
			/*check for credit check fields*/
			
			var termConditionStatus = coxjs.select(".term-continue-button").hasClass("button-disabled-checkout");
			var finalcheckoutReference = coxjs.select(".final-checkout-button");
			var secureCheckDomExistence = document.querySelectorAll(".secure-credit-check").length;
			var secureCheckStatus = coxjs.select(".scc-continue-button").hasClass("button-disabled-checkout");
			
			//if secure credit submit section is present then check for credit check button only 
			//otherwise check for term condition only (else part)*/
			if(secureCheckDomExistence != "0"){
				var secureCheckStatus = coxjs.select(".scc-continue-button").hasClass("button-disabled-checkout");
				if(!secureCheckStatus && !termConditionStatus){
					finalcheckoutReference.removeClass("button-disabled-checkout");
				}
				else{
					finalcheckoutReference.addClass("button-disabled-checkout");
				}
			}
			else{
				if(!termConditionStatus){
					finalcheckoutReference.removeClass("button-disabled-checkout");
				}
				else{
					finalcheckoutReference.addClass("button-disabled-checkout");
				}
			}
			
		},
		
		/**
		 * validation to submit creditcheck
		 * user should be more than 18 year old
		 * all address field should be filled - if applicable
		 * ssn number should be proper
		 * all the section is conditional so check for dom is also there
		 * @method secureCreditCheckSubmit
		 * */
		secureCreditCheckSubmit : function() {
			
			var noDomSSNField = document.querySelectorAll(".credit-check-address").length;
			var dobDomCheck =  document.querySelectorAll(".rhode-island-dob").length;
			
			/*Checking DOM for credit check section.
			In some cases credit check is not required*/
			if(noDomSSNField != "0"){
				
				var sccStreet = coxjs.select(".scc-street").val().length;
				var displayState = coxjs.select(".credit-check-address").css("display");
				var sccCity = coxjs.select(".scc-city").val().length;
				var sccState = coxjs.select(".scc-state").val().length;
				var sccZip = isNaN(parseInt(coxjs.select(".scc-zip").val()));
				var sccZipLength = coxjs.select(".scc-zip").val().length;
				var sccInput = isNaN(parseInt(coxjs.select(".ssn-input").val()));
				var sccInputLength = coxjs.select(".ssn-input").val().length;
				
				/*Checking dom for DOB section.
				DOB section is required for specific states only*/
				
				if(dobDomCheck !="0"){
					var day = coxjs.select(".day-ri-input").val();
					var month = coxjs.select(".month-ri-input").val();
					var year = coxjs.select(".year-ri-input").val();
				
					/*user age should be more than 18 year then only user can perform credit check.
					otherwise button wiil be disable*/
					var myDateObject = new Date(year,month,day);
					myDateObject.setFullYear(myDateObject.getFullYear()+18);
					var currentDate = new Date();
				
					
					if(myDateObject < currentDate){
						if((displayState=="block" || displayState=="inline-block" )&&((sccStreet==0)||(sccCity==0)||(sccState==0)||(sccZip)||(sccZipLength==0)||(sccInputLength<11)||(sccInput))){
							coxjs.select(".credit-submit-button").addClass("button-disabled-checkout");
						}
						else if((displayState=="none")&&((sccInputLength<11)||(sccInput))){
							coxjs.select(".credit-submit-button").addClass("button-disabled-checkout");
						}
						else{
							coxjs.select(".credit-submit-button").removeClass("button-disabled-checkout");
						}
					}
					else{
						coxjs.select(".credit-submit-button").addClass("button-disabled-checkout");
					}
				}
				else{
					if((displayState=="block" || displayState=="inline-block" )&&((sccStreet==0)||(sccCity==0)||(sccState==0)||(sccZip)||(sccZipLength==0)||(sccInputLength<11)||(sccInput))){
						coxjs.select(".credit-submit-button").addClass("button-disabled-checkout");
					}
					else if((displayState=="none")&&((sccInputLength<11)||(sccInput))){
						coxjs.select(".credit-submit-button").addClass("button-disabled-checkout");
					}
					else{
						coxjs.select(".credit-submit-button").removeClass("button-disabled-checkout");
					}
				}
			}
		},
		
		
		/**
		 * remove error of ssn-input
		 * @method removErrorSSN
		 * */
		removErrorSSN : function(){
			coxjs.select("#ssn-input-error").remove();
			coxjs.select('.secure-credit-check-font').removeClass("errorMsg");
			coxjs.select(".ssn-input").removeClass("error");
		},
		/**
		 * Event handler to open accordion headers on hash change
		 * 
		 * @event onHashChange
		 * @param data, the hash present in the url
		 */	
		onHashChange: function(data){
			var loc = data.route,
				id;
			// id is accordion panel id
			if(loc.indexOf('checkout') > -1){
				id = loc.match(/\/(.*?)$/)[1];
				_module.accordionOpen(id);
			}
			
		},
		/**
		 * Enabling all the accordions and opening only the particular accordion whose id is present in the hash
		 * 
		 * @method accordionOpen
		 * @param id, id of the accordion panel that needs to be open
		 */
		accordionOpen: function(id){
			var context = coxjs.select("#"+id).closest('.accordion');
			coxjs.select(".accordion-trigger",context).removeClass('accordion-trigger-open');
			coxjs.select(".accordion-panel",context).removeClass('accordion-panel-open');
			coxjs.select("#"+id).addClass('accordion-panel-open');
			coxjs.select("#"+id).prev().addClass('accordion-trigger-open');
		},
				
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @authorPrakhar Gupta
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class CheckoutPayment
 *
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.CheckoutPayment', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context = coxjs.select(".payment-mode");
		
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = '.payment-mode';
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				
				/**
				 * Stores a copy of the module context to apply inside methods.
				 *
				 * @member {object} _module
				 */
				_module = this;
				
				/**
				 * @event subscribe
				 * execute after all the address field is filled by google API
				 **/
				coxjs.subscribe({
					"autoFillActionComplete": _module.handleStatePaymentButton
				});
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
			console.log("EXEC CheckoutPayment.js");
			
			_module = this;
			
			/**
			 * validation of final Checkout button when user click on yes of payment section
			 * @event click
			 * @param {string} "cp-yes"
			 * @param {selector} "body" The parent container to listen within
			 * */
			coxjs.select("body").on("click",".cp-yes", function(event) {
				
				var checkingDomExistence = document.querySelectorAll(".card-number-append").length;
				var termConditionStatus = coxjs.select(".term-continue-button").hasClass("button-disabled-checkout");
				var finalcheckoutReference = coxjs.select(".final-checkout-button");
				
				coxjs.select(".payment-address").hide();
				coxjs.select(".final-checkout-button").removeClass("button-disabled-checkout");
				
				/*if payment section is in dom */
				if(checkingDomExistence=="0"){
					
					if(termConditionStatus){
						finalcheckoutReference.addClass("button-disabled-checkout");
					}
					else{
						finalcheckoutReference.removeClass("button-disabled-checkout");
					}
					
				}
				
				else{
					
					_module.handleStatePaymentButton();
					
					/*var paymentInputReference = coxjs.select(".txtCCNum-payment").val();
					var paymentFieldCharAtZero = paymentInputReference.charAt(0);
					var cpMonthValue = coxjs.select(".cp-month").val();
					var cpYearValue = coxjs.select(".cp-year").val();
					var creditCardName = coxjs.select(".credit-card-name").val().length;
					if credit card number start with 3; that credit card will have 15 digit only
					if((paymentFieldCharAtZero == "3")&&((paymentInputReference.length<17)||(creditCardName==0)||(termConditionStatus)||(cpMonthValue=="")||(cpYearValue==""))){
						finalcheckoutReference.addClass("button-disabled-checkout");
					}
					if credit card number is not starting with 3; that credit card will have 16 digit
					else if((paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")&&((paymentInputReference.length<19)||(creditCardName==0)||(termConditionStatus)||(cpMonthValue=="")||(cpYearValue==""))){
						finalcheckoutReference.addClass("button-disabled-checkout");
					}
					else if(!(paymentFieldCharAtZero =="3" || paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")&&((creditCardName==0)||(termConditionStatus)||(cpMonthValue=="")||(cpYearValue==""))){
						finalcheckoutReference.addClass("button-disabled-checkout");
					}
					else if((paymentFieldCharAtZero =="3" || paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")&&(creditCardName !=0)&&(!termConditionStatus)&&(cpMonthValue!="")&&(cpYearValue!="")){
						finalcheckoutReference.removeClass("button-disabled-checkout");
					}
					else{
						finalcheckoutReference.addClass("button-disabled-checkout");
					}*/
				}
			});
			
			/**
			 * validation of final Checkout button when user click on yes of payment section
			 * @event click
			 * @param {string} "cp-no"
			 * @param {selector} "body" The parent container to listen within
			 * */
			coxjs.select("body").on("click",".cp-no", function(event) {
				coxjs.preventDefault(event);
				coxjs.select(".payment-address").show();
				coxjs.select(".payment-address input").val("");
				var cpStreet = coxjs.select(".cp-street").val().length;
				if(cpStreet>0){
					coxjs.select(".final-checkout-button").removeClass("button-disabled-checkout");
				}
				else{
					coxjs.select(".final-checkout-button").addClass("button-disabled-checkout");
				}
				
			});
			
			
			/**
			 * diable and enable button on basis of form box values on keyup event
			 * @event keyup
			 * @param {string} ".credit-card-name, .txtCCNum-payment, .cp-street, .cp-city, .cp-zip, .cp-state"
			 * @param {selector} "body" The parent container to listen within
			 * 
			 * */
			coxjs.select("body").on("keyup", ".credit-card-name, .txtCCNum-payment, .cp-street, .cp-city, .cp-zip, .cp-state",function(){
				
				var checkingDomExistence = document.querySelectorAll(".card-number-append").length;
				if(checkingDomExistence!="0"){
				var paymentInputReference = coxjs.select(".txtCCNum-payment");
				var creditCardNumber = isNaN(parseInt(paymentInputReference.val()));
				var creditCardNumberValue = paymentInputReference.val().charAt(0);
				var creditCardFullNumberValue = paymentInputReference.val();
				
				/**
				 * card number validation and data masking
				 * adding data masking on run time because of multiple format of card numbers
				 * */
				if((coxjs.select(this).hasClass("txtCCNum-payment"))&&(!creditCardNumber)&&(creditCardFullNumberValue.length == 1)){
				
					if(creditCardNumberValue == "3"){
						paymentInputReference.mask('0000-000000-00000');
						paymentInputReference.removeClass("visa discover mastercard all-cards").addClass("amex");
					}
					else if(creditCardNumberValue == "4"){
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("amex discover mastercard all-cards").addClass("visa");
					}					
					else if(creditCardNumberValue == "5"){
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("visa amex discover all-cards").addClass("mastercard");
					}
					else if(creditCardNumberValue == "6"){
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("visa amex mastercard all-cards").addClass("discover");
					}
					else{
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("visa amex discover all-cards mastercard").addClass("randomcard");
					}
				}
				
				/**
				 * adding generic class of card if no exact match found
				 * if no number entered in card number then all images should display.
				 * */
				if((coxjs.select(this).hasClass("txtCCNum-payment"))&&(creditCardFullNumberValue.length=="0")){
					paymentInputReference.removeClass("visa discover mastercard amex randomcard").addClass("all-cards");
				}
				}
					_module.handleStatePaymentButton();
				
			});
			
			coxjs.select("body").on("change", ".txtCCNum-payment",function(){
				var paymentInputReference = coxjs.select(".txtCCNum-payment");
				var creditCardNumber = isNaN(parseInt(paymentInputReference.val()));
				var creditCardNumberValue = paymentInputReference.val().charAt(0);
				var creditCardFullNumberValue = paymentInputReference.val();
				
				/**
				 * card number validation and data masking
				 * adding data masking on run time because of multiple format of card numbers
				 * */
				if((coxjs.select(this).hasClass("txtCCNum-payment"))&&(!creditCardNumber)){
				
					if(creditCardNumberValue == "3"){
						paymentInputReference.mask('0000-000000-00000');
						paymentInputReference.removeClass("visa discover mastercard all-cards").addClass("amex");
					}
					else if(creditCardNumberValue == "4"){
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("amex discover mastercard all-cards").addClass("visa");
					}					
					else if(creditCardNumberValue == "5"){
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("visa amex discover all-cards").addClass("mastercard");
					}
					else if(creditCardNumberValue == "6"){
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("visa amex mastercard all-cards").addClass("discover");
					}
					else{
						paymentInputReference.mask('0000-0000-0000-0000');
						paymentInputReference.removeClass("visa amex discover all-cards mastercard").addClass("randomcard");
					}
				}
				
			});
			/**
			 * error handling on cardnumbner section
			 * check for 15 digit card number and 16 digit card number
			 * adding additional character of "-"
			 * @event blur
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".txtCCNum-payment"
			 * */
			coxjs.select("body").on("blur",".txtCCNum-payment",function(event){
				var paymentFieldReference = coxjs.select(".txtCCNum-payment").val();
				var paymentFieldCharAtZero = paymentFieldReference.charAt(0);
				if((paymentFieldCharAtZero == "3")&&(paymentFieldReference.length<17)){
					coxjs.select(".make-payment-form").validate().showErrors({"txtCCNum-payment":"Please enter 15 digits of your card"});
				}
				else if((paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")&&(paymentFieldReference.length<19)){
					coxjs.select(".make-payment-form").validate().showErrors({"txtCCNum-payment":"Please enter 16 digits of your card"});
				}
				else if(!(paymentFieldCharAtZero =="3" || paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")){
					coxjs.select(".make-payment-form").validate().showErrors({"txtCCNum-payment":"Please enter valid credit card number"});
				}
			});
			
			/**
			 * error handling on cardnumber section
			 * @event focus
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".txtCCNum-payment"
			 * */
			coxjs.select("body").on("focus",".txtCCNum-payment",function(event){
				coxjs.select("#txtCCNum-payment-error").remove();
				coxjs.select("label[for='card-number']").removeClass("errorMsg");
				coxjs.select(".txtCCNum-payment").removeClass("error");
			});
			
			
			
			/**
			 * @event keypress
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".credit-card-name""
			 * no number input
			 */
			coxjs.select("body").on("keypress",".credit-card-name",function(event){
		        var inputValue = event.which;
		        if((inputValue > 47 && inputValue < 58) && (inputValue != 32)){
		            event.preventDefault();
		        }
			});
			

			/**
			 * @event keypress
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".txtCCNum-payment""
			 * no character input
			 */
			coxjs.select("body").on("keypress",".txtCCNum-payment",function(event){
				var inputValue = event.which;
				 return !(inputValue != 8 && inputValue != 0 && (inputValue < 48 || inputValue > 57) && inputValue != 46);
			});
			
			/**
			 * disable and enable button on basis of form dropdown event
			 * @param {selector} "body" The parent container to listen within
			 * @param {string} ".cp-month, .cp-year"
			 * */
			coxjs.select("body").on("change",".cp-month, .cp-year",function(){
				/*var finalcheckoutReference = coxjs.select(".final-checkout-button");
				var creditCardName = coxjs.select(".credit-card-name").val().length;
				var creditCardNumber = isNaN(parseInt(coxjs.select(".txtCCNum-payment").val()));
				var monthValue = document.querySelectorAll(".cp-month")[0].selectedIndex;
				var yearValue = document.querySelectorAll(".cp-year")[0].selectedIndex;
				var termConditionStatus = coxjs.select(".term-continue-button").hasClass("button-disabled-checkout");
				
				var displayState = coxjs.select(".payment-address").css("display");
				var cpStreet = coxjs.select(".cp-street").val().length;
				var cpCity = coxjs.select(".cp-city").val().length;
				var cpZip = isNaN(parseInt(coxjs.select(".cp-zip").val()));
				var cpState = coxjs.select(".cp-state").val().length;
				
				if((creditCardName>0)&&(!creditCardNumber)&&(monthValue>0)&&(yearValue>0)&&(!termConditionStatus)){
					finalcheckoutReference.removeClass("button-disabled-checkout");
					
					if((displayState=="block")&&((cpStreet==0)||(cpCity==0)||(cpZip)||(cpState==0))){
						finalcheckoutReference.addClass("button-disabled-checkout");
					}
				}
				else{
					finalcheckoutReference.addClass("button-disabled-checkout");
				}*/
				_module.handleStatePaymentButton();
			});
			},
			
			/**
			 * all fields should be filled
			 * address filed should be filled if mandatory
			 * checking for dom existence because every field is conditional
			 * @method handleStatePaymentButton
			 * */
			handleStatePaymentButton : function() {
				
				/*return the control if not in current scope*/
				if (_context.length == 0) return;
				//payment-mode
				var secureCheckDomExistence = document.querySelectorAll(".secure-credit-check").length;
				var checkingDomExistence = document.querySelectorAll(".card-number-append").length;
				
				/*if Payment section dom is present or not*/ 
				if(checkingDomExistence!="0"){
				
				var displayState = coxjs.select(".payment-address").css("display");
				var cpStreet = coxjs.select(".cp-street").val().length;
				var cpCity = coxjs.select(".cp-city").val().length;
				var cpZip = isNaN(parseInt(coxjs.select(".cp-zip").val()));
				var cpState = coxjs.select(".cp-state").val().length;
					
				var paymentInputReference = coxjs.select(".txtCCNum-payment").val();
				var paymentFieldCharAtZero = paymentInputReference.charAt(0);
				var finalcheckoutReference = coxjs.select(".final-checkout-button");
				var creditCardName = coxjs.select(".credit-card-name").val().length;
				var creditCardNumber = isNaN(parseInt(paymentInputReference));
				var monthValue = document.querySelectorAll(".cp-month")[0].selectedIndex;
				var yearValue = document.querySelectorAll(".cp-year")[0].selectedIndex;
				var termConditionStatus = coxjs.select(".term-continue-button").hasClass("button-disabled-checkout");
				
				/*checking value of each field if its filled then enable checkoutbutton else disable it*/
				/*if SSN part is not present in DOM*/
					if(secureCheckDomExistence == "0"){
						if((creditCardName>0)&&(!creditCardNumber)&&(monthValue>0)&&(yearValue>0)&&(!termConditionStatus)){
							finalcheckoutReference.removeClass("button-disabled-checkout");
							
							if((displayState=="block")&&((cpStreet==0)||(cpCity==0)||(cpZip)||(cpState==0))){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							/*checking length of creditcard number*/
							else if((paymentFieldCharAtZero=="3")&&(paymentInputReference.length<17)){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							else if((paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")&&(paymentInputReference.length<19)){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							else if(!(paymentFieldCharAtZero =="3" || paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							else{
								finalcheckoutReference.removeClass("button-disabled-checkout");
							}
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
					else{
						var secureCheckStatus = coxjs.select(".scc-continue-button").hasClass("button-disabled-checkout");
						if((creditCardName>0)&&(!creditCardNumber)&&(monthValue>0)&&(yearValue>0)&&(!termConditionStatus)&&(!secureCheckStatus)){
							finalcheckoutReference.removeClass("button-disabled-checkout");
							
							if((displayState=="block")&&((cpStreet==0)||(cpCity==0)||(cpZip)||(cpState==0))){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							/*checking length of creditcard number*/
							else if((paymentFieldCharAtZero=="3")&&(paymentInputReference.length<17)){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							else if((paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")&&(paymentInputReference.length<19)){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							else if(!(paymentFieldCharAtZero =="3" || paymentFieldCharAtZero =="4" || paymentFieldCharAtZero =="5" || paymentFieldCharAtZero =="6")){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
							else{
								finalcheckoutReference.removeClass("button-disabled-checkout");
							}
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
				
				}
				
				else{
					var finalcheckoutReference = coxjs.select(".final-checkout-button");
					var termConditionStatus = coxjs.select(".term-continue-button").hasClass("button-disabled-checkout");
					
					if(secureCheckDomExistence == "0"){
						if(!termConditionStatus){
							finalcheckoutReference.removeClass("button-disabled-checkout");
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
					else{
						var secureCheckStatus = coxjs.select(".scc-continue-button").hasClass("button-disabled-checkout");
						if(!termConditionStatus && !secureCheckStatus){
							finalcheckoutReference.removeClass("button-disabled-checkout");
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
				}
			},
			
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Shilpa Mathadevaru
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class ChooseFeatures
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.ChooseFeatures', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */	
		
		var _context = coxjs.select(".choose-your-feature");
		
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = '.choose-your-feature';
		
		var _saveCartId = '';
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT ChooseFeatures.js");
				_module = this;
				
				/**
				 * Listen for {@link coxfw.coxjs.publish} events to handle ajax complete and update Big Price.
				 * 
				 * @event subscribe
				 * @param {string} PriceData Action intended to update Big Price in Right rail.
				 * @param {string} MultiAjaxComplete Action intended to process the response data.
				 */
				coxjs.subscribe({
					"PriceData" : _module.updatePriceValue,
					"MultiAjaxComplete" : _module.multiAjaxComplete,
					"HashChange": _module.onHashChange
				});							
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC ChooseFeatures.js");
			
			_module = this;
				/**
				 * @event click
				 *
				 * Adds class 'selected' on click of radio box
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".feature-radio"
				 */
			if (_context.length === 0) return;
			
			coxjs.select(window).scroll(_module.bannerHandler);

			/**
			 * @event click
			 *
			 * Show and Hide Installation Date based on type of Installation selected
			 *
			 * @param {selector} "body" The parent container to listen within
			 * @param {selector} ".installation .feature-section .group-choice"
			 */			
			coxjs.select("body").on("click", ".installation .feature-section .group-choice", function(event) {
				// Stop default link click.
				_trigger = coxjs.select(this)[0];
				var installContext = coxjs.select(".installation");
				if(coxjs.select(_trigger).hasClass("professional-install")){
					coxjs.select(_trigger).addClass('selected');
				} else {
					coxjs.select(_trigger).siblings().closest('.professional-install').removeClass('selected');				
				}	
				if (coxjs.select('.professional-install.selected').length > 0){
					coxjs.select(".installation-date", installContext).css("display", "block");
				} else {
					coxjs.select(".installation-date", installContext).css("display", "none");
					coxjs.select(".installation-time", installContext).css("display", "none");
				}
								
			});
			
			/**
			 * @event click
			 *
			 * Adds class 'selected' on click of checkbox box
			 *
			 * @param {selector} "body" The parent container to listen within
			 * @param {selector} ".feature-checkbox"
			 */
			coxjs.select("body").on("click", ".feature-checkbox", function(event) {
				// Stop default link click.
				coxjs.preventDefault(event);
				_trigger = coxjs.select(this)[0];
				coxjs.select(_trigger).toggleClass("selected");
				
				if(coxjs.select(_trigger).children(".offer-badge")[0] != undefined){
					coxjs.select(".offer-badge", _trigger).toggleClass("selected");
				}
				
				//DONT-remove commented section. price update code
				//_module.updatePriceValue(_trigger);	
			});
			
			/**
			 * Function to stop submitting if address is not entered when install ship is selected
			 *
			 * @param {selector} "body" The parent container to listen within
			 * @param {selector} ".install-ship-address .street-ship-address"
			 */			
			coxjs.select("body").on("change", ".install-ship-address .street-ship-address", function(event) {
					var streetAddress = coxjs.select(this).val();
					
					if( streetAddress.length > 0 &&  streetAddress != undefined){
						coxjs.select(".install-ship-button").removeClass("button-disabled-checkout");
						coxjs.select(".install-ship-button").removeAttr("disabled");
					} else {
						coxjs.select(".install-ship-button").addClass("button-disabled-checkout");
						coxjs.select(".install-ship-button").attr("disabled", "disabled");
					}
					
			});
			/**
			 * Function to stop submitting if address is not entered when install ship is selected
			 *
			 * @param {selector} "body" The parent container to listen within
			 * @param {selector} ".install-ship-address .street-ship-address"
			 */			
			coxjs.select("body").on("click", ".ship-service-address", function(event) {
					
				if(coxjs.select(this).attr("data-show-div")) {
					if(coxjs.select(".street-ship-address").val() == "" ) {
						coxjs.select(".install-ship-button").addClass("button-disabled-checkout");
						coxjs.select(".install-ship-button").attr("disabled", "disabled");
					} else {						
						coxjs.select(".install-ship-button").removeClass("button-disabled-checkout");
						coxjs.select(".install-ship-button").removeAttr("disabled");
					}				
					
				} else {
					coxjs.select(".install-ship-button").removeClass("button-disabled-checkout");
					coxjs.select(".install-ship-button").removeAttr("disabled");
				}
			});
			
			coxjs.select("body").on("click", ".save-cart-trigger", function(event) {
				_saveCartId = coxjs.select('.accordion-panel-open').attr('id');
			});			
			
			coxjs.select("body").on("click", "#ecomm-save-cart", function(event) {
				//window.location.hash = "#cyf/accordion-id";
				$(this).closest('form').submit(function(e){
					if(_saveCartId.length > 0){
						$(this).attr('action',$(this).attr('action') + "cyf/"+_saveCartId );
						_saveCartId = '';
					}
				});
				 
			});
			
			_module.registerMutationObservers();
			/**
			 * Tabs navigation using hash bang 
			 *
			 * @method 
			 * @param {object} 
			 */ 
			 if(window.location.hash){
					var loc = window.location.hash.slice(1);
					var ref = document.referrer;
					
					if (ref.length > 0){
						coxjs.publish({
	                        type: "HashChange",
	                        data: {
	                            route: loc
	                        }
	                    });
					}                    
			 }
			},

			/**
			 * Function which handles Multi Ajax 
			 *
			 * @method multiAjaxComplete
			 * @param {object} data Object sent by MultiAjax Complete trigger.
			 */
			multiAjaxComplete: function(data){
				var trigger = data.trigger;
				var targetContainer = coxjs.select(data.trigger).data('multiAjaxTarget');
				if (targetContainer.indexOf('tv-equipment-content-container') > -1) {
					// TV Equipment Section
					/*var targetId = targetContainer.match('sb-content-[0-9]*');*/
					if(!coxjs.select('.continue-btn a', '.tv-equipment-panel').hasClass('accordion-next')){
						coxjs.select('.continue-btn a', '.tv-equipment-panel').addClass('accordion-next').removeClass('button-disabled');
					}
																
				} 
				if(targetContainer.indexOf('installation-date') > -1){
					if (coxjs.select('.professional-install.selected').length > 0){
						coxjs.select('.installation-date').css('display','block');
					}
					coxjs.publish({
						type : "DatePickerEcomm",
						data : {
							trigger: coxjs.select('.ecomm-date-picker', coxjs.select('.installation'))
						}
					});	

				}
				var selectedOptions = coxjs.select(".date-picker-dates ul li.selected");
					if(coxjs.select(selectedOptions).length >= 1 && (targetContainer.indexOf('installation-time') > -1 || targetContainer.indexOf('update-installation-option') > -1)){
						if(coxjs.select(data.trigger).hasClass('self-ship-install') || coxjs.select(data.trigger).hasClass('self-pickup-install')){
							coxjs.select(".installation-time").css("display", "none");
						} else {
							coxjs.select(".installation-time").css("display", "block");
						}
						
					} else {
						coxjs.select(".installation-time").css("display", "none");
					}			
			},
			/**
			 * Event handler to open accordion headers on hash change
			 * 
			 * @event onHashChange
			 * @param data, the hash present in the url
			 */	
			onHashChange: function(data){
				var loc = data.route,
					id;
				// id is accordion panel id
				if(loc.indexOf('cyf') > -1){
					id = loc.match(/\/(.*?)$/)[1];
					_module.accordionOpen(id);
				}
				
			},
		
			/**
			 * Enabling all the accordions and opening only the particular accordion whose id is present in the hash
			 * 
			 * @method accordionOpen
			 * @param id, id of the accordion panel that needs to be open
			 */
			accordionOpen: function(id){
				var context = coxjs.select("#"+id).closest('.accordion');
				
				coxjs.select(".accordion-trigger",context).siblings().each(function(){					
					if(coxjs.select(this).attr("id") == id){
						return false;
					} else {
						coxjs.select(this).removeClass('accordion-trigger-open').removeClass('accordion-trigger-disabled').removeClass('accordion-panel-open').removeClass('accordion-panel-disabled');
					}	
				});
				coxjs.select("#"+id).addClass('accordion-panel-open').removeClass('accordion-panel-disabled');
				coxjs.select("#"+id).prev().addClass('accordion-trigger-open').removeClass('accordion-trigger-disabled');
			},
			
			/**
			 * Observers for handling date picker
			 * 
			 * @mutationObservers
			 */
			registerMutationObservers: function() {
			
				if(window.MutationObserver) {
					var installationSection = document.querySelector(".installation");
					var observer = new MutationObserver(function(mutations) {
							if(coxjs.select('.installation').is(':visible')){
								console.log("Installation section observer");
								coxjs.publish({
									type : "DatePickerEcomm",
									data : {
										trigger: coxjs.select('.ecomm-date-picker')
									}
								});	
								observer.disconnect();
							}
				
					  });

					observer.observe(installationSection, {
					    attributes: true
					});

				} else {
					var interval = window.setInterval(function() {
						if(coxjs.select('.installation').is(':visible')){
							coxjs.publish({
								type : "DatePickerEcomm",
								data : {
									trigger: coxjs.select('.ecomm-date-picker')
								}
							});	
							clearInterval(interval);
						}
					}, 50);				
				}			
			},
			/**
			 * 
			 * banner test target feature handler on scrol
			 * 
			 * @method bannerHandler
			 */
			bannerHandler: function() {
					if(coxjs.select('.promo-banner').length > 0) {
						if(coxjs.select(window).scrollTop() > coxjs.select('.promo-banner').offset().top) {
							coxjs.select('.promo-banner').addClass('sticky');
						} else if(coxjs.select(window).scrollTop() <=  coxjs.select('#promo-banner-wrapper').offset().top) {
							coxjs.select('.promo-banner').removeClass('sticky');
						}
						
					}
					// TODO
					/**
					 * Handle mobile display based on requirements
					 */
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Shilpa Mathadevaru;
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class ConfirmationScreenCapture
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.ConfirmationScreenCapture', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context = coxjs.select(".confirmation-content");
					
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				_module = this;
				
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(".confirmation-content");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {	
				// Return if confirmation-content class is not present
				if (_context.length == 0) return;
				
				coxjs.select("body").on("xhr-selectors", ".confirmation-content", function(event) {
					//capture the source code of confirmation page
					var content = document.querySelector(".confirmation-content").innerHTML;
					//make a ajax call
					coxjs.publish({
						type : "Ajax",
						data : {						
							url :  coxjs.select(".confirmation-content").attr("data-ajax-source"),
							type : "POST",
							dataType : "text",
							data : "screenContent=" +encodeURIComponent(content),
							timeout : "30000",
							cache : false
						}
					});				
				});
					
				/**
				 * Trigger "xhr-selectors" if any .confirmation-content node exists when the DOM is loaded.
				 *
				 * @event load
				 * @param {string} ".confirmation-content" Nodes intended to open overlays when loaded.
				 */				
				if (coxjs.select(".confirmation-content").length > 0) coxjs.select(".confirmation-content").trigger("xhr-selectors");
			
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Santhana Rajagopalan
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class DatePickerEcomm
 *
 */

(function(coxfw) {
	coxfw.core.define('modules.ecomm.DatePickerEcomm', function(coxjs) {
		
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".ecomm-date-picker";

		/**
		 * The object to configure accordion.
		 *
		 * @member {object} _accordionConfig
		 */
		var _datePickerConfig = {
				highlightWeekends: false,
				visibleDaysDesktop: 6,
				visibleDaysMobile: 3,
				animationSpeed: 1000,
				isAnimating: false,
				firstDate : {},
				lastDate: {},
				mobileLastDate: {}
		};
	
		var _trigger;
		
		var _dates;
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT DeliveryMethod.js");
				_module = this;
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
				/**
				 * Create the DatePicker.
				 * 
				 * @event subscribe
				 * @param {string} create the DatePicker.
				 */
				coxjs.subscribe({
					"DatePickerEcomm" : _module.createDatePicker,
					"Orientation" : _module.orientationChange
				});
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC DatePickerEcomm.js");
				_module = this;
				var scrollLeftWidth = 0;
				var scrollRightWidth = 0;
				var dateContainer = coxjs.select(_selector + ' .date-picker-dates');
				coxjs.select("body").on("ecomm-date-picker", _selector, function(event) {
					_trigger = coxjs.select(this);
					
					coxjs.publish({
						type : "DatePickerEcomm",
						data : {
							trigger: _trigger,
							data: _module
						}
					});					
				});
				
				coxjs.select("body").on("click", _selector + ' ul li', function(event) {
					if(!coxjs.select(this).hasClass('disabled')){
						_module.clearSelection();
						var day = coxjs.select(this)[0];
						
						coxjs.select(day).addClass("selected");
						coxjs.publish({
							type : "ecommDatePickerDateSelected",
							data : {
								day: day
							}
						});
					}
					
				});

				if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("ecomm-date-picker");
								
			},
			/**
			 * Create Date Picker.
			 *
			 * @method createDatePicker
			 * @param {object} self The Date Picker object.
			 */
			createDatePicker : function(data) {
			     //Storing a copy of the object
				if(coxjs.select('.installation').is(':visible') && coxjs.select('.date-picker-month-flash').length > 0){
				var trigger;
				trigger = data.trigger;
				
				var dateContainer = coxjs.select('.date-picker-dates ul',trigger);
				var dateElement = coxjs.select(_selector + " .date-picker-dates ul li");
				var boxWidth = parseInt(dateElement.outerWidth());
				var boxHeight = parseInt(dateElement.outerHeight());
				var marginLeft = parseInt(dateElement.css('marginLeft'));
				var marginRight = parseInt(dateElement.css('marginRight'));
				var marginTop = parseInt(dateElement.css('marginTop'));
				var marginBottom = parseInt(dateElement.css('marginBottom'));

				var finalBoxWidth = boxWidth + marginLeft + marginRight;
				var finalBoxHeight = boxHeight + marginTop + marginBottom;
				
				_dates = coxjs.select('.date-picker-dates ul',trigger).children();
				_datePickerConfig.firstDate = coxjs.select(_dates[0]);
				_datePickerConfig.lastDate = coxjs.select(_dates[5]);
				_datePickerConfig.mobileLastDate = coxjs.select(_dates[2]);
				//Identifying the initial month from the list of dates populated from java.
				
				var dateLeftMonth = coxjs.select('.date-picker-month-flash p:nth-child(1)');
				var dateRightMonth = coxjs.select('.date-picker-month-flash p:nth-child(2)');
				var leftPos = coxjs.select('.left').offset();
				var rightPos = coxjs.select('.right').offset();
				var prevLeftMonth;
				
				coxjs.select('.date-picker-month-flash p:nth-child(1)').html(coxjs.select(_dates[0]).data('month'));
				// populate months initially
				var initLeftMonthName = coxjs.select(_dates[0]).data('month');
				var initRightMonthName = coxjs.select(_dates[5]).data('month');
				dateLeftMonth.html(initLeftMonthName);
				prevLeftMonth = initLeftMonthName;
				if(initLeftMonthName == initRightMonthName){
					dateRightMonth.html("");
				} else {
					dateRightMonth.html(initRightMonthName);
				}
				
				// mobile
				//dateRightMonth.html(coxjs.select(_dates[2]).data('month'));
				coxjs.select('.date-picker-month-flash p:first-child').css('left', coxjs.select('.left').position().left + coxjs.select('.left').width() + 10);
				if(window.innerWidth < 768 || window.innerHeight > window.innerWidth) 
					coxjs.select('.date-picker-month-flash p:last-child').css('left', coxjs.select('.right').position().left - 10 - _datePickerConfig.mobileLastDate.width());
				else
					coxjs.select('.date-picker-month-flash p:last-child').css('left', coxjs.select('.right').position().left - 10 - _datePickerConfig.lastDate.width());
				
				coxjs.select(".right",trigger).on("click", function(event) {	
					if(!_datePickerConfig.isAnimating) {
						_datePickerConfig.isAnimating = true;
						// checking for tablet portrait mode
						if(window.innerWidth < 768 || window.innerHeight > window.innerWidth) {
							scrollLeftWidth = dateContainer.scrollLeft() + ( _datePickerConfig.visibleDaysMobile * finalBoxWidth);
						} else {
							scrollLeftWidth = dateContainer.scrollLeft() + ( _datePickerConfig.visibleDaysDesktop * finalBoxWidth);
						}

						dateContainer.animate({scrollLeft: scrollLeftWidth}, _datePickerConfig.animationSpeed, function(){
							_datePickerConfig.isAnimating = false;
						});
					}
				});
				
				coxjs.select(".left",trigger).on("click", function(event) {
					if(!_datePickerConfig.isAnimating) {
						_datePickerConfig.isAnimating = true;
						//checking for tablet portrait mode
						if(window.innerWidth < 768 || window.innerHeight > window.innerWidth) {
							scrollRightWidth = -(dateContainer.scrollLeft()) + ( _datePickerConfig.visibleDaysMobile * finalBoxWidth);
						} else {
							scrollRightWidth = -(dateContainer.scrollLeft()) + ( _datePickerConfig.visibleDaysDesktop * finalBoxWidth);
						}
						
						dateContainer.animate({scrollLeft: -scrollRightWidth}, _datePickerConfig.animationSpeed, function(){
							_datePickerConfig.isAnimating = false;
						});	
					}					
				});

				coxjs.select('.date-picker-dates ul').scroll(_module.debounce(function() {
					// to solve performance issue.
					leftPos = coxjs.select('.left').offset();
					rightPos = coxjs.select('.right').offset();
					var leftMonth = _module.getMonthLeft(leftPos);
					var rightMonth = _module.getMonthRight(rightPos);
					
					if(prevLeftMonth != leftMonth) {
						//dateLeftMonth.hide().html(leftMonth).fadeIn(800);
						dateLeftMonth.html(leftMonth);
						prevLeftMonth = leftMonth;
					}
					
					if (leftMonth == rightMonth) {
						dateRightMonth.fadeOut(800,function(){
							dateRightMonth.html('');
						});	
					} else {
						dateRightMonth.hide().html(rightMonth).fadeIn(800);
					}

										
					/*				var l = _dates.length;
					while(l--) {
					  var dateElem = coxjs.select(_dates[l]);
					  if(dateElem.position().left == 0){
						  dateElem.closest('.date-picker-wrap').siblings('.date-picker-month-flash').html('<p>'+ dateElem.data('month')+ '</p>')
					  }
					}	*/			
					
				}, 250, false));
				}
			},
			/**
			 * clear all the selected dates
			 * @method clearSelection
			 */
			clearSelection : function() {
				var dates = coxjs.select( _selector + ' ul li');
				dates.removeClass('selected');
			},
			/**
			 * Get the month of the date which is nearest to the left arrow
			 * @method getMonthLeft
			 * @param leftArg, offset of left arrow
			 */
			getMonthLeft : function(leftArg) {
				var monthElem = document.elementFromPoint((leftArg.left + 30), (leftArg.top - coxjs.select(window).scrollTop()));
				return coxjs.select(monthElem).data('month');
			},
			/**
			 * Get the month of the date which is nearest to the left arrow
			 * @method getMonthRight
			 * @param rightArg, offset of right arrow
			 */
			getMonthRight : function(rightArg) {
				var monthElem = document.elementFromPoint((rightArg.left - 30), (rightArg.top - coxjs.select(window).scrollTop()));
				
				return coxjs.select(monthElem).data('month');
			},
			
			/**
			 * Debounce functionality to do some heavy tasks in the background
			 * Inspired from David walsh blog post on debounce
			 * @method debounce
			 * 
			 */
			debounce : function(func, delay, immediate) {						 
				    var timeout;
				 
				    return function debounced () {
				        var context = this, args = arguments;
				        function later () {
				            if (!immediate)
				                func.apply(context, args);
				            timeout = null; 
				        }
				 
				        if (timeout)
				            clearTimeout(timeout);
				        else if (immediate)
				            func.apply(context, args);
				 
				        timeout = setTimeout(later, delay); 
				    };
			},
			/**
			 * Handle position of months on orientation
			 *
			 * @handler orientationChange
			 **/
			orientationChange : function() {
				if(coxjs.select(".date-picker-month-flash").length > 0){
					setTimeout(function(){
						coxjs.select('.date-picker-month-flash p:first-child').css('left', coxjs.select('.left').position().left + coxjs.select('.left').width() + 10);
						if(window.innerWidth < 768 || window.innerHeight > window.innerWidth) 
							coxjs.select('.date-picker-month-flash p:last-child').css('left', coxjs.select('.right').position().left - 10 - _datePickerConfig.mobileLastDate.width());
						else
							coxjs.select('.date-picker-month-flash p:last-child').css('left', coxjs.select('.right').position().left - 10 - _datePickerConfig.lastDate.width());
					},250);
				}				
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * 
 * @author Santhana Rajagopalan S;
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class EcommFeatures
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.EcommFeatures', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		/**
		 * Identify the list of ecomm pages for which some features has to be added
		 *
		 * @member {object} _context
		 */		
		
		var _context = coxjs.select(".choose-your-feature").length + 
					   coxjs.select(".byob-page").length + 
					   coxjs.select(".checkout-page").length + 
					   coxjs.select('.campaign-content').length +
					   coxjs.select('.offer-page-content').length +
					   coxjs.select('.shop-page-content').length +
					   coxjs.select('.shopping-cart-content').length +
					   coxjs.select('.order-status-signin-content').length +
					   coxjs.select('.order-status-register-content').length +
					   coxjs.select('.order-status-unregister-content').length +
					   coxjs.select('.affiliate-login-page').length +
					   coxjs.select('.affiliate-logout-form').length +
					   coxjs.select('.get-gig-content').length +
					   coxjs.select('.multi-address-modal').length +
					   coxjs.select('.order-list-box').length +
					   coxjs.select('.order-message-details').length +
					   coxjs.select('.upgrade-page').length +
					   coxjs.select('.gigabit-packages').length;
			
		/**
		 * Session timeout page context selector
		 *
		 * @member {string} _sessionTimeoutContext
		 */
		
		var _sessionTimeoutContext = coxjs.select('.session-logout').length;
		
		/**
		 * Session timeout page reload interval
		 *
		 * @member {string} _sessionTimeoutInterval
		 */
		var _sessionTimeoutInterval = 8 * 1000 * 60;
		
		// timeout title
		var __warningTitle = "Error";
		// content for first warning
		var __errorMSG = "<p>It looks like something is wrong.</p> " +
				"<p>Please try again.</p> <p> If the error persists please" +
				" contact customer support </p>";
		
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				_module = this;
				
                coxjs.subscribe({
                    "MultiAjaxError": _module.multiAjaxError,
                    "Orientation" : _module.orientationChange
                });
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
			
			_module = this;
			
			coxjs.ajaxSetup({
				ajaxError: function( event, jqxhr, settings, thrownError) {
			    	console.log('jqxhr', jqxhr);  
			    	console.log('error pop up');
			    }
			});
			
			if((/iPhone|iPod|iPad|Android|BlackBerry/).test(navigator.userAgent)){
				_module.applyTag();			
			} else {
				if(window.utag_data){
					utag_data.responsiveDisplayType = 'desktop';
				}
				
			}
			// session timeout page reload interval
			if (_sessionTimeoutContext > 0) {
				_module.startReloadInterval();
			}
			
			//hotfix for iphone select box
			coxjs.select('#secret-question').append('<optgroup label=""></optgroup>');
			//Checking the context
			if (_context == 0) return;
			
			_module.enableTimeout();
			// Disabling geolocation popup
			coxjs.select(".pf-tsw-titlebar-location").hide();
			
			// Affiliate login
			coxjs.select("#agree-policy", ".affiliate-login-page").on("change",function() {
				if(coxjs.select(this).is(':checked')){
					coxjs.select('.affiliate-login-submit-button').removeClass('button-disabled');
				} else {
					coxjs.select('.affiliate-login-submit-button').addClass('button-disabled');
				}
			});

/*			coxjs.select('.affiliate-login-submit-button.button-disabled').on('click', function(event) {
				coxjs.preventDefault(event);
				coxjs.select(this).removeClass('loading-wrapper-active');
			});*/
			
			},
			/**
			 * Time out trigger for ecomm pages
			 * 
			 * @method: enableTimeout
			 */
			enableTimeout: function() {
				coxjs.publish({
                    type: "SessionTimeoutStart"});
			},
			/**
			 * Starting a refresh scenario on sessiontimeout page for every 8 seconds
			 * 
			 */
			startReloadInterval : function() {
				// commented for 
				//setInterval(function() { location.reload() }, _sessionTimeoutInterval);
			},
			/**
			 * Handle Multi ajax error
			 * @method
			 * 
			 */
			multiAjaxError: function(data) {
				if(data.status == '500') {
					/*_module.showErrorPopup();*/
					location.href = "something-went-wrong.cox?URL="+data.url;
				} else {
					location.href = "session-timeout.cox?E=AJAX&URL="+data.url;
				}
			},
			orientationChange: function(data) {
				if(data.orientation === 'landscape') {
					_module.applyTag();
					
				} else {
					_module.applyTag();
				}
			},
			
			applyTag: function() {
				var mq = window.matchMedia('all and (max-width: 766px)');
				if (mq.matches)
				{
					if(window.utag_data)
					{
						utag_data.responsiveDisplayType='mobile';
					}
				}
				else {
					if(window.utag_data)
						{
							utag_data.responsiveDisplayType = 'desktop';
						}
				}
				/*if(window.innerWidth < 768) {
					if(utag_data)
						utag_data.responsiveDisplayType = 'mobile';
				} else {
					if(utag_data)
						utag_data.responsiveDisplayType = 'desktop';
				}*/	
			},
			
			showErrorPopup: function() {
				var modalDisplay = '<div id="pf-underlay" style="display: block;"></div><div class="pf-dialog-component session-time-out-popup" style="top:'+ (coxjs.select('body').scrollTop() + (450/2))  +'px;"><div class="pf-dialog-component-head"><span title="Close" class="pf-btn-close"></span></div><div class="pf-dialog-component-title">' + __warningTitle + '</div><div class="pf-dialog-component-content" style="">' + __errorMSG + '<div class="pf-dialog-component-buttons"><a class="button pf-btn-close">Continue</a></div></div></div>';
				
				var currentModal = $("#pf-underlay");
				if(currentModal.length) {
					_module.removeModalDisplay();
				}
				
				coxjs.select('body').append(modalDisplay);
				
				coxjs.select("#pf-underlay, .pf-btn-close").click(function(){
					_module.hideErrorPopup();
				});
				
			},
			hideErrorPopup: function() {
				// remove underlay
				coxjs.select("#pf-underlay").remove();
				// remove dialog
				coxjs.select(".pf-dialog-component").remove();
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Shilpa Mathadevaru
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class FeatureCustomization
 *
 *
 *|
 *//*
(function(coxfw) {
	coxfw.core.define('modules.ecomm.FeatureCustomization', function(coxjs) {
		*//**
		 * The element clicked to trigger the click event.
		 *
		 * @property _trigger
		 * @type object
		 *//*
		var _trigger;

		return {
			*//**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 *//*
			init : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				*//**
				 * Listen for {@link coxfw.coxjs.publish} events to open or close an accordion.
				 * 
				 * @event subscribe
				 * @param {string} openAccordion Action intended to OPEN an accordion.
				 * @param {string} closeAccordion Action intended to CLOSE an accordion.
				 *//*				
				coxjs.select(".tv-equipment-section").siblings().addClass("accordion-opacity-low");
			
			},
			*//**
			 * Execute this module.
			 * 
			 * @method execute
			 *//*
			execute : function() {
console.log("EXEC FeatureCustomization.js");
				*//**
				 * @event click
				 *
				 * Add active on click of required installation method
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".install-options div"
				 *//*
				coxjs.select("body").on("click", ".next-feature", function(event) {
					// Stop default link click.
					coxjs.preventDefault(event);					
					_trigger = coxjs.select(this);
					var enabledAccordianPanel = coxjs.select(_trigger).parent().parent();
					var enabledAccordianTrigger = coxjs.select(enabledAccordianPanel).prev();
										
					*//**
					 * close the accordion.
					 * 
					 * @event publish
					 * @param {string} openAccordion What changes the dropdown and tab content.
					 *//*
					coxjs.publish({
						type : "closeAccordion",
						data : {
							trigger: enabledAccordianTrigger
						}
					});
					
					coxjs.select(enabledAccordianPanel).parent().next().removeClass("accordion-opacity-low");
					
					var enableAccordion = coxjs.select(enabledAccordianPanel).parent().next().next();
					coxjs.select(enableAccordion).removeClass("accordion-opacity-low");
					//remove accordion disabled class
					var disabledElement = coxjs.select(enableAccordion).children().toArray();
					coxjs.select(disabledElement[0]).removeClass("accordion-trigger-disabled");
					coxjs.select(disabledElement[1]).removeClass("accordion-panel-disabled");
					var accordionTrigger = coxjs.select(".accordion-trigger", enableAccordion);
								
					
				  *//**
					 * Open the accordion.
					 * 
					 * @event publish
					 * @param {string} openAccordion What changes the dropdown and tab content.
					 *//*
				  coxjs.publish({
						type : "openAccordion",
						data : {
							trigger: accordionTrigger
						}
					});
					
				});
			},
			*//**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 *//*
			destroy : function() {}
		};
	});
})(coxfw);
*//**
 * Code for PricingOfferDetailsModal
 *
 * @author Santhana
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class PriceDetailsModalEcomm
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.PriceDetailsModalEcomm', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * Stores a copy of the tabs that will be used for the navigation
		 *
		 * @member {object} _tabs
		 */
		var _tabs;

				
		return {
			/**
			 * Setup all subscriptions for this module.
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT PricingOfferDetailsModal.js");
			},
			/**
			 *
			 * @method execute
			 */
			execute : function() {
//console.log("EXEC PricingOfferDetailsModal.js");
				// Store a copy of module context.
				_module = this;
				
				//if (_chooseYourFeatureContext.length == 0 && _checkoutContext.length == 0 && _BYOB) return;

				
				coxjs.select("body").on("click", ".price-lock-shortcut", function(event) {
					_module.deselectAll();
					_module.closeAll();
					_module.selectTab('.price-lock');
				});
				
				// listen to ajax complete event
				coxjs.select(document).ajaxComplete(function(event, ajaxResponse, options) {
					_module.closeAll();					
					_module.selectActiveClass();
					//Setting the first tab as active
					var stickyHeader = coxjs.select(".sticky-header-ecomm");

									
					// listen to the click event on the tab					
					coxjs.select(".tabs a").click(function() {
						_tabs = coxjs.select(this).closest('.tabs');
						_module.getSelectedTab(this);
					});
					// Get out of here if we don't have a .sticky-header node.
					if (stickyHeader.length == 0) return;

					// Make the _trigger sticky.
					stickyHeader.stickyTableHeaders({ scrollableArea: coxjs.select(".scrollable-area")[0]});

				});
			},
			/**
			 * Handles the selected tab from the click event
			 *
			 * @method getSelectedTab
			 * @param {object} tab A reference to the tab element that was clicked.
			 */
			getSelectedTab : function(tab) {
				var caller = tab;
				var tabs = _tabs;
				// check whether caller is a link from tab-header
				// sometimes the caller link can be from modals as well 
				if (coxjs.select(caller).parents().eq(1).hasClass("tabs")) {
					// TODO: Investigate what the $ means for these vars.
					$active = coxjs.select("li.active-header > a", tabs);
					$content = coxjs.select(($active.attr('href')) + "-data", '.dialog-component');

					// Make the old tab inactive.
					$active.parent().removeClass('active-header');
					$content.hide();

					// Update the variables with the new link and content
					$active = coxjs.select(caller);
					$content = coxjs.select((coxjs.select(caller).attr('href')) + "-data", '.dialog-component');

					// Make the tab active.
					$active.parent().addClass('active-header');
					$content.show();
				}
			},
			/**
			 * Close all the content area of the tabs
			 *
			 * @method closeAll
			 */
			closeAll: function(){
				var allTabContent = coxjs.select(".pricing-offer-details-content > .tab-content > .tab-data");
				allTabContent.hide();			
			},
			/**
			 * Reset All the active headers to none
			 *
			 * @method deselectAll
			 */
			deselectAll: function() {
				var allTabHeaders = coxjs.select(".tabs > li");
				allTabHeaders.removeClass('active-header');
			},
			/**
			 * Select a particular tab
			 *
			 * @method selectTab
			 * @param className , class name of the element that has to be selected
			 */
			selectTab: function(className) {
				var tabInitialHeader = coxjs.select(className + "-header",'.pricing-offer-details-content');
				tabInitialHeader.addClass('active-header');
				var tabContent = coxjs.select(className + "-content",'.pricing-offer-details-content');
				tabContent.addClass('active-content');
				tabContent.show();	
			},
			/**
			 * Select a tab which has active class
			 *
			 * @method selectActiveClass
			 */
			selectActiveClass: function() {
				var tabInitialHeader = coxjs.select(".active-header",'.pricing-offer-details-content');
				var tabContent = coxjs.select(".active-content",'.pricing-offer-details-content');
				tabContent.show();
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});

})(coxfw);
/**
 * @author Santhana R S
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class RightRail
 * @param coxfw
 */

(function(coxfw) {
	coxfw.core.define('modules.ecomm.RightRail', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = '.right-progress-rail';
		

		/**
		 * Stores scroll details of the right rail
		 *
		 * @member {object} _module
		 */		
		var _scrollDetails = {
				offTop: 0,
				offLeft: 0,
				footerCutOff: 0,
				mobileOffTop: 0,
				mobileFooterCutOff: 0,
				mobileRightRailHeight: 0,
				chargesAndDisc: 0
		};
		
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type number
		 */
		
		var _context = coxjs.select(".choose-your-feature").length + 
					   coxjs.select(".checkout-page").length +
					   coxjs.select(".byob-page").length;
		
		var interval = null;
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {				
				console.log("INIT RightRail.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC RightRail.js");
				
				_module = this;
				//Checking the context
				if (_context == 0) return;
				// Register Event Handlers for handling scroll animations
				if(navigator.userAgent.match(/iPad/i)){
					coxjs.select('.right-progress-rail').addClass('sticky-ipad');
				} else {
					if (!coxjs.select(".byob-page").length > 0 && !coxjs.select(".checkout-page").length > 0 && coxjs.select('.right-progress-rail').length > 0 && coxjs.select('.right-progress-rail').offset().top == 0 ){
						setTimeout(function(){
							_module.initRightRail();
						}, 2000);
					} else {
						_module.initRightRail();
					}
					
				}
					
			
				coxjs.select("body").on("click",".accordion-trigger", function(event){
					coxjs.select("html, body").animate({
						scrollTop: coxjs.select(window).scrollTop() - 1
					}, 250, function() {
						coxjs.select("html, body").animate({
							scrollTop: coxjs.select(window).scrollTop() + 1
						},250);
					});
				});
			 // Mobile top rail
			 coxjs.select("body").on("click",".hamburger-slider", function(event){
					var contentHeight = coxjs.select(".toggle-content-div").css("height");
					if(contentHeight == '0px'){
						coxjs.select(".toggle-content-div").animate({height: _module.calculateMobileScollableAreaHeight()}, 1000);
						coxjs.select(".hamburger-slider").removeClass("rail-scroll-img-open").addClass("rail-scroll-img-close");
					}
					else{
						coxjs.select(".toggle-content-div").animate({height: 0}, 1000);
						coxjs.select(".hamburger-slider").removeClass("rail-scroll-img-close").addClass("rail-scroll-img-open"); 
					}					
			 });
			 
			 coxjs.select("body").on("click", ".right-rail-accordion",function(event){
				 
					 var rightRail = coxjs.select(".right-progress-rail");
					 
					 if (coxjs.select(this).children().first().hasClass('open')){
						 coxjs.select(this).children().first().removeClass('open');
						 if(!coxjs.select(".byob-page").length > 0 && !coxjs.select('.feature-customize-section').height() <= 391 && !coxjs.select('.complete-order-section').height() <= 295 && !navigator.userAgent.match(/iPad/i)){
							 // mobile rail content
							 if ((rightRail.offset().top + coxjs.select(window).scrollTop()) <= (143 + _scrollDetails.adBannerHeight)){
								 rightRail.css('position','relative');
									
							 } else {
								 // making it sticky when all the accordions in right rail are closed
								 if(!_module.isRightRailAccOpen() && (rightRail.offset().top + coxjs.select(window).scrollTop())>= (154 + _scrollDetails.adBannerHeight)){
									 var topOff = rightRail.offset().top - (153 + _scrollDetails.adBannerHeight);
									 coxjs.select(window).off('scroll',_module.rightRailContentScroll);								 
									 rightRail.css('position','relative');
									 rightRail.css('top',topOff);
									 _scrollDetails.chargesAndDisc = 0;
									 _scrollDetails.isChargesVisible = false;
								 }						 
							 }
							 // Registering scroll handler again when all the accordions are closed
							 if(!_module.isRightRailAccOpen()) {								 
								 coxjs.select(window).scroll(_module.rightRailScrollHandler);
								 _scrollDetails.rightRailOffTop = 0;
								 if(navigator.userAgent.match(/iPad/i) && interval) {
									 window.cancelAnimationFrame(interval);
									 interval = null;
								 }
									 
							 }
							 
						 }
	
					 } else {
						 coxjs.select(this).children().first().addClass('open');
						 if(!coxjs.select(".byob-page").length > 0 && !coxjs.select('.feature-customize-section').height() <= 391 && !coxjs.select('.complete-order-section').height() <= 295 && !navigator.userAgent.match(/iPad/i)){
							 // mobile rail content
							 var currentTop = rightRail.offset().top - (153 + _scrollDetails.adBannerHeight);//153px is the initial offset value when the right rail is relative
							 rightRail.css('position','relative').css('top',currentTop).css('marginBottom',currentTop);
							 
							 coxjs.select(window).off('scroll',_module.rightRailScrollHandler);
							 
							 _scrollDetails.chargesAndDisc = currentTop;
							 _scrollDetails.isChargesVisible = true;
							 
							 if(navigator.userAgent.match(/iPad/i)) {
								 if(!interval)
								 _module.resetFix();
							 }else {
								 coxjs.select(window).scroll(_module.rightRailContentScroll);
							 }
							 
							 
						 }
					 }		 
					 if(coxjs.select('.feature-customize-section').height() <= 391 && coxjs.select('.complete-order-section').height() <= 295) {
						 rightRail.css('position','relative').css('top','');
					 }
					 coxjs.select(".toggle-right-rail", this).slideToggle(
							 function(){
								 if(!coxjs.select(this).parent().children().first().hasClass('open')){
									 rightRail.css('marginBottom','');
								 }
							 }
					 );
				 
			 });	
			 // test code for windows
			 coxjs.select( window ).resize(function() {
				 var contentContainer = coxjs.select('.pf-constrain-width');
				 if(coxjs.select('.right-progress-rail').is(":visible")){
						contentContainer.css('marginTop','');
					}
			});
			 
			 coxjs.subscribe({
					"MultiAjaxComplete" : _module.multiAjaxComplete,
					"Orientation" : _module.orientationChange
				});	
			},
			/**
			 * Init Right Rail
			 * @method initRightRail
			 * 
			 */
			initRightRail: function() {
				if(coxjs.select('.right-progress-rail').length > 0){
					_scrollDetails.offTop = coxjs.select('.right-progress-rail').offset().top;
					_scrollDetails.offLeft = coxjs.select('.right-progress-rail').offset().left;

					// promo ad banner height
					_scrollDetails.adBannerHeight = coxjs.select('#promo-ad-banner').height();
					if (_scrollDetails.adBannerHeight && _scrollDetails.adBannerHeight > 0) {
						_scrollDetails.initOffTop = 153 + parseInt(_scrollDetails.adBannerHeight); // 153 init offset + 
					} else {
						_scrollDetails.initOffTop = 153;
					}
					if(coxjs.select('.right-rail-mobile').length > 0){
						_scrollDetails.mobileOffTop = coxjs.select('.right-rail-mobile').offset().top;
					}
					_scrollDetails.mobileRightRailHeight = parseInt(coxjs.select('.checkout-feature-details').css('height')) + parseInt(coxjs.select('.rail-divider').css('height'));
			
					if (!coxjs.select(".checkout-page").length > 0 && (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))){
						// for iphone alone
						coxjs.select(window).on('touchmove',_module.mobileScrollHandler);	
						
					} else {
						coxjs.select(window).on('scroll',_module.rightRailScrollHandler);
					}	
					
					//setting minimum height to avoid jumpy behaviour when there are no contents in the accordion
					coxjs.select('.complete-order-section').css('min-height', coxjs.select(".right-progress-rail").outerHeight());
					coxjs.select('.feature-customize-section').css('min-height', coxjs.select(".right-progress-rail").outerHeight());
					
				}
			},
			/**
			 * Function which handles Right Rails fixed position when scrolling.
			 *
			 * @method rightRailScrollHandler
			 * @param {object} data Object sent by closing trigger.
			 */
			rightRailScrollHandler : function(){
				var rightRail = coxjs.select(".right-progress-rail");
				var contentContainer = coxjs.select('.pf-constrain-width');
				var mobileRightRail = coxjs.select(".right-rail-mobile");
				var legalTop;
				if(coxjs.select('.feature-customize-section').height() <= 391 && coxjs.select('.complete-order-section').height() <= 391 ) {
					coxjs.select('.right-progress-rail').css('position','relative').css('top','');
				} else {
					
					if (coxjs.select('.mobile-only').css('display') == 'none' && !coxjs.select(".byob-page").length > 0) {
						if(coxjs.select(".legal-text").length > 0){
							legalTop = coxjs.select(".legal-text p").offset().top;
						} else {
							legalTop = 0;
						}					
						var rightRailBottomOffset = coxjs.select(window).scrollTop() +10 + parseInt(rightRail.outerHeight());
						
						if (coxjs.select(window).scrollTop() >= (parseInt(_scrollDetails.offTop) - 10)) {							
							// stoping the stickiness when the rail reaches the footer
							if (rightRailBottomOffset > legalTop - 10) {
								rightRail.css('position', 'relative').css('top', parseInt(_scrollDetails.footerCutOff) - parseInt(rightRail.outerHeight()) - parseInt(_scrollDetails.offTop));
								
							} else {
								rightRail.css('position', 'fixed').css('top', '10px');
								_scrollDetails.footerCutOff = rightRailBottomOffset;						
							}
						} else if (coxjs.select(window).scrollTop() < (parseInt(_scrollDetails.offTop))) {
							rightRail.css('position', 'relative').css('top', '0');
							//_scrollDetails.footerCutOff = 0;
		                }
					} else {
						// mobile code
						// disabling for checkout page alone
/*						if (!coxjs.select(".checkout-page").length > 0 && !coxjs.select(".byob-page").length > 0) {
							if (coxjs.select(window).scrollTop() >= (parseInt(_scrollDetails.mobileOffTop))) {
								mobileRightRail.css('position','fixed');
								// TODO: margin top has a negative margin of -20px so giving it as 20 need to revisit the dom structure
								mobileRightRail.css('top','20px'); 
								// To prevent content from jumping
								contentContainer.css('margin-top',(_scrollDetails.mobileRightRailHeight + 20));
							} else if(coxjs.select(window).scrollTop() < (parseInt(_scrollDetails.mobileOffTop))) {
								mobileRightRail.css('position','relative').css('top','');
								contentContainer.css('margin-top','');
							}
						}*/
						
					}
					
				} 				
			},
			/**
			 * Mobile scroll handler
			 * 
			 * @method mobileScrollHandler
			 */
			mobileScrollHandler : function(){
/*				var contentContainer = coxjs.select('.pf-constrain-width');
				var mobileRightRail = coxjs.select(".right-rail-mobile");
				if (coxjs.select(window).scrollTop() > (parseInt(_scrollDetails.mobileOffTop))) {
					mobileRightRail.css('position','fixed');
					// TODO: margin top has a negative margin of -20px so giving it as 20 need to revisit the dom structure
					mobileRightRail.css('top','20px'); 
					// To prevent content from jumping
					contentContainer.css('margin-top',(_scrollDetails.mobileRightRailHeight + 20));
				} else if(coxjs.select(window).scrollTop() < (parseInt(_scrollDetails.mobileOffTop))) {
					mobileRightRail.css('position','relative').css('top','');
					contentContainer.css('margin-top','');
				}*/
			
			},
			/**
			 * Scroll handler that manages scroll when charges and discounts section is open
			 * @method rightRailContentScroll
			 */
			rightRailContentScroll: function() {
				var rightRail = coxjs.select(".right-progress-rail");

				if(rightRail.is(":visible") && !(_scrollDetails.rightRailOffTop==_scrollDetails.initOffTop)){
					if(rightRail.offset().top <= (153 + _scrollDetails.adBannerHeight)){
						rightRail.css('position','relative').css('top','');	
					} else if(rightRail.offset().top < (coxjs.select(window).scrollTop()+ (143 + _scrollDetails.adBannerHeight))) {
						rightRail.css('position','relative');
						 //setting initial position if right rail's offset is below its initial position
						rightRail.css('top',_scrollDetails.chargesAndDisc);
						//console.log("setting relative else if >>", (Math.ceil(rightRail.offset().top) < (coxjs.select(window).scrollTop()+ (143 + _scrollDetails.adBannerHeight))));
					} 
					
					
					if(coxjs.select(window).scrollTop() < rightRail.offset().top && rightRail.offset().top > (153 + _scrollDetails.adBannerHeight) && rightRail.css('position') == 'relative'){
						//console.log("Condition >>>",  coxjs.select(window).scrollTop() < rightRail.offset().top , rightRail.offset().top > (153 + _scrollDetails.adBannerHeight), rightRail.offset().top,coxjs.select(".right-progress-rail").offset().top,(153 + _scrollDetails.adBannerHeight)  , rightRail.css('position') == 'relative')
						rightRail.css('position','fixed').css('top',10);	
						//console.log("setting fixed >>");
					}
					_scrollDetails.rightRailOffTop = Math.ceil(rightRail.offset().top);
					if(_scrollDetails.isChargesVisible) {
						//console.log("rightRail.css('position')" , rightRail.css('position'));
						
					}
				}
				
			},
			/**
			 * Function which calculates the scrollable area of the top rail accordion
			 * 
			 * @method calculateMobileScollableAreaHeight
			 * @returns {Number} Height of the Scrollable area
			 */
			calculateMobileScollableAreaHeight: function() {
				var height,
					checkoutBar = coxjs.select('.checkout-feature-details');				
					// calculating the scrollable area present 48px is the height of the slider button
				return coxjs.select(window).height() - (checkoutBar.outerHeight() + checkoutBar.offset().top - coxjs.select(window).scrollTop())- 48; 
			},
			
			isRightRailAccOpen: function(){
				var isOpen = false;
				coxjs.select(".right-rail-accordion").each(function(index){
					if(coxjs.select('.right-rail-toggle',this).hasClass('open')){
						isOpen = true;
					}
				});
				return isOpen;
			},
			/***
			 * Multiajax compelte handler
			 * 
			 * @method multiAjaxComplete
			 *
			 */
			multiAjaxComplete: function() {	
				// For BYOB we are not having the right rail initially in the DOM, so after an ajax call we have to re-register the handlers
				if(coxjs.select(".byob-page").length > 0){
					if(coxjs.select('.right-rail-mobile').length > 0 || coxjs.select('.right-progress-rail').length > 0){
						 if(!navigator.userAgent.match(/iPad/i))
						_module.initRightRail();
						window.scrollBy(0,1);
					}
				}									
			},

			/***
			 * Handle orientation changes. 
			 * Specifically for devices with resolutions like nexus 7
			 * 
			 * @method orientationChange
			 * @param data, object that holds the orientation type
			 */
			orientationChange: function(data) {
				var contentContainer = coxjs.select('.pf-constrain-width');
				if(data.orientation === 'landscape') {
					//Landscape mode
					if(coxjs.select('.right-progress-rail').is(":visible")){
						contentContainer.css('marginTop','');
						_scrollDetails = {
								offTop: 0,
								offLeft: 0,
								footerCutOff: 0,
								mobileOffTop: 0,
								mobileFooterCutOff: 0,
								mobileRightRailHeight: 0
						};
						coxjs.select('.right-progress-rail').css('position','relative');
						coxjs.select('.right-progress-rail').css('top',0);
						 if(!navigator.userAgent.match(/iPad/i))
						_module.initRightRail();
					}
				} else  {
					// portrait mode
					_scrollDetails.mobileOffTop = 45;
				}
				//_module.initRightRail();
			},
			
			/**
			 * 
			 * reset position in iPad 8
			 * bug fix on onscroll
			 * 
			 * @method resetFix
			 */
			resetFix: function(){
				interval = window.requestAnimationFrame(_module.resetFix);
				var rightRail = coxjs.select(".right-progress-rail");
				if(rightRail.is(":visible")){
					if(rightRail.offset().top <= 153){
						rightRail.css('position','relative').css('top','');	
					} else if(rightRail.offset().top < (document.body.scrollTop+ 143)) {
						rightRail.css('position','relative');
						 //setting initial position if right rail's offset is below its initial position
						rightRail.css('top',_scrollDetails.chargesAndDisc);
					} 
						
					if(document.body.scrollTop < rightRail.offset().top && rightRail.offset().top > 153 && rightRail.css('position') == 'relative'){
						rightRail.css('position','fixed').css('top',10);	
						//console.log("is charges visible");
					}
					if(_scrollDetails.isChargesVisible) {
						//console.log("rightRail.css('position')" , rightRail.css('position'));
						
					}
				}
					
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);/**
 * @author Shilpa Mathadevaru
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class ScheduleInstallation
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.ScheduleInstallation', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */

		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT ScheduleInstallation.js");
				_module = this;

				coxjs.subscribe({
					"ecommDatePickerDateSelected" : _module.showInstallTime
				});
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC ScheduleInstallation.js");

				_module = this;

				/**
				 * @event click
				 *
				 * Add active on click of required installation method
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".install-options "
				 */
				coxjs.select("body").on("click", ".install-date", function(event) {
					_trigger = coxjs.select(this)[0];

					var context = coxjs.select(".installation");
					var selectedOptions = coxjs.select(".install-date.selected", context);

					if (coxjs.select(selectedOptions).length >= 1) {
						coxjs.select(".installation-time").css("display", "block");
					} else {
						coxjs.select(".installation-time").css("display", "none");
					}
				});

			},

			/**
			 * Shows or Hides the time selection
			 *
			 * @method showInstallTime
			 * @param {object} data Object sent by opening trigger.
			 */
			showInstallTime : function(data) {
				coxjs.select(".installation-time").css("display", "block");
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Shilpa Mathadevaru
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class SelectEquipmentAjax
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.SelectEquipmentAjax', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT SelectEquipmentAjax.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC SelectEquipmentAjax.js");
				/**
				 * @event click
				 *
				 * Add active on click of required installation method
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".install-options div"
				 */
				coxjs.select("body").on("click", ".select-equip", function(event) {
					// Stop default link click.
					coxjs.preventDefault(event);
					_trigger = coxjs.select(this)[0];
					var parentContext = coxjs.select(_trigger).closest(".equipment-comparison").parent();
					var parentContextId = coxjs.select(parentContext).attr("id");					
					var ajaxUrl = coxjs.select(_trigger).attr("data-ajax-url");

					
				});
				
				
				
				coxjs.select("body").on("click", ".equip-feature-select > a", function(event) {
					// Stop default link click.
					coxjs.preventDefault(event);
					_trigger = coxjs.select(this)[0];
					var parentContext = coxjs.select(_trigger).closest(".equipment-comparison").parent();
					var parentContextId = coxjs.select(parentContext).attr("id");	
					var ajaxUrl = coxjs.select(_trigger).attr("data-ajax-url");
					
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author srajagop
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class SessionManager
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.SessionManager', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		var __heartbeat;
		// first warning to user, pop up modal when time expires
		var __firstAlertTime = '00:19:00';
		// time has expired, log out user, redirect to login page
		var __expireHeartbeatTime = '00:20:15';
		// timeout title
		var __warningTitle = "Timeout Warning";
		// content for first warning
		var __firstWarningMSG = "<p>Your session will time out soon.</p><p>If there is no additional activity, your online session will be timed out for your protection. You will be redirected to the login screen.</p><p>If you are still working in your online session, simply click continue</p>";

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {

				console.log("INIT SessionManager.js");

				_module = this;
				coxjs.subscribe({
					"SessionTimeoutStart" : _module.startHeartbeat
				});

			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC SessionManager.js");

				_module = this;

			},
			/**
			 * method to check the user interaction when pop up is active
			 *
			 * @method checkForUserInteraction
			 */
			checkForUserInteraction : function() {
				coxjs.select("#pf-underlay, .pf-btn-close").click(function() {
					_module.removeModalDisplay();
					_module.resetHeartbeat();
					_module.ping();
				});
			},
			/**
			 * core logic to check the inactivity
			 *
			 * @method checkForInactivity
			 * @param currentSeconds, the time taken
			 */
			checkForInactivity : function(currentSeconds) {
				var currentHeartbeat = _module.convertIntervalToTimeFormat(currentSeconds);

				// check if the user has been idle for the allowed time
				if (currentHeartbeat == __firstAlertTime) {
					// first warning
					_module.notifyUserWithWarning("first");
				} else if (currentHeartbeat == __expireHeartbeatTime) {
					// stop heartbeat
					_module.stopHeartbeat();
					// last warning, expired
					_module.notifyUserWithWarning("last");
				}
			},
			/**
			 * Notify user with warning, first will be a pop up, second warning is reload
			 *
			 * @method notifyUserWithWarning
			 * @param notificationAttempt, the type first or second
			 */
			notifyUserWithWarning : function(notificationAttempt) {
				(notificationAttempt == "first") ? _module.createModalDisplay() : _module.signOutUser();
			},
			/**
			 * Creates Modal Display
			 *
			 * @method createModalDisplay
			 */
			createModalDisplay : function() {
				var modalDisplay = '<div id="pf-underlay" style="display: block;"></div><div class="pf-dialog-component session-time-out-popup" style="top:' + (coxjs.select('body').scrollTop() + (450 / 2)) + 'px;"><div class="pf-dialog-component-head"><span title="Close" class="pf-btn-close"></span></div><div class="pf-dialog-component-title">' + __warningTitle + '</div><div class="pf-dialog-component-content" style="">' + __firstWarningMSG + '<div class="pf-dialog-component-buttons"><a class="button pf-btn-close">Continue</a></div></div></div>';

				var currentModal = $("#pf-underlay");
				if (currentModal.length) {
					_module.removeModalDisplay();
				}

				coxjs.select('body').append(modalDisplay);
				_module.checkForUserInteraction();
			},
			/**
			 * Method to remove modal display
			 *
			 * @method removeModalDisplay
			 */
			removeModalDisplay : function() {
				// remove underlay
				coxjs.select("#pf-underlay").remove();
				// remove dialog
				coxjs.select(".pf-dialog-component").remove();
			},
			/**
			 * Method to reset heartbeat
			 *
			 * @method resetHeartbeat
			 */
			resetHeartbeat : function() {
				_module.stopHeartbeat();
				_module.startHeartbeat();
			},
			/**
			 * Start Heartbeat, triggered by publish call from EcommFeatures module
			 *
			 * @method startHeartbeat
			 */
			startHeartbeat : function() {
				// handle ajax calls
				coxjs.ajaxSetup({
					beforeSend : function() {
						_module.resetHeartbeat();
					}
				});
				// start timer
				var seconds = 0;
				__heartbeat = setInterval(function() {
					seconds = seconds + 1;
					_module.checkForInactivity(seconds);
				}, 1000);
			},
			/**
			 * Stop the  Heartbeat.
			 *
			 * @method startHeartbeat
			 */
			stopHeartbeat : function() {
				clearInterval(__heartbeat);
			},
			/**
			 * Sign out action performed after user gets the popup and the session timeouts
			 *
			 * @method signOutUser
			 */
			signOutUser : function() {
				// remove modal
				_module.removeModalDisplay();
				// reload current page to sign out the user automatically
				//location.reload();
				location.href = "session-timeout.cox";
			},
			/**
			 * Metod responsible for making ajax call to the current location
			 *
			 * @method ping
			 */
			ping : function() {
				$.ajax({
					url : location.url
				});
			},
			/**
			 * Metod responsible for converting time to desired format
			 *
			 * @method convertIntervalToTimeFormat
			 */
			convertIntervalToTimeFormat : function(totalSeconds) {
				function displayTimeFormat(num) {
					return (num < 10 ? "0" : "" ) + num;
				}

				var hours = Math.floor(totalSeconds / 3600);
				totalSeconds = totalSeconds % 3600;

				var minutes = Math.floor(totalSeconds / 60);
				totalSeconds = totalSeconds % 60;

				var seconds = Math.floor(totalSeconds);

				// Pad the minutes and seconds with leading zeros, if required
				hours = displayTimeFormat(hours);
				minutes = displayTimeFormat(minutes);
				seconds = displayTimeFormat(seconds);

				// Compose the string for display
				var currentTimeString = hours + ":" + minutes + ":" + seconds;

				return currentTimeString;

			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Santhana
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class ShopGig
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.ShopGig', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		/**
		 * Instance variable for storing right rail scroll details.
		 *
		 * @member {object} _module
		 */

		var _context = coxjs.select("#gigabit-offer-container");

		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		/*var _selector = '.checkout-page';*/
		var _store = {
			offerRows : '',
			offerPositions : '',
			floatingPrice : ''
		};

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {

				console.log("INIT ShopGig.js");

				_module = this;
				coxjs.subscribe({
					"MultiAjaxComplete" : _module.multiAjaxComplete
				});
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC ShopGig.js");

				_module = this;

				//Checking the context
				if (_context.length == 0)
					return;

				if (coxjs.select('.gig-desktop-check').is(':visible')) {
					coxjs.select(window).scroll(_module.floatingPriceHandler);
					if (coxjs.select('.giga-pkg-price').length > 0) {
						_store['floatingPrice'] = coxjs.select('.giga-pkg-price', '.floating-price').offset().top;

						coxjs.select(".gig-info-msg").css('left', coxjs.select(".gig-info-msg").position().left);
					}
					//Scroll to gig-info message in desktop
					coxjs.select("html,body").animate({
						scrollTop : 150
					}, 1000);
				}
				var page = coxjs.select("#gigabit-offer-container");
				var gigHeaderView = coxjs.select(".shop-gig-header");

				gigHeaderView.on("click", ".tab-gig a", function gigHeader(event) {
					var currElement = coxjs.select(this);
					var contentId = currElement.attr('href');

					var prevActiveElement = currElement.siblings('.active-header');
					prevActiveElement.removeClass('active-header');
					currElement.addClass('active-header');

					coxjs.select(contentId + "-data").addClass('active-content');
					coxjs.select(prevActiveElement.attr('href') + "-data").removeClass('active-content');

				});

				page.on("click", ".gig-toggle-header", function gigToggleHeader(event) {
					//Prevent default anchor click.
					coxjs.preventDefault(event);
					_module.togglePickYourGig(page);
				});

				page.on("click", ".gig-temp-animate", function(event) {
					// animate
					_module.togglePickYourGig(page);

				});

				page.on("click", ".gig-temp-collapse", function(event) {
					// collapse
					_module.togglePickYourGig(page);
				});

				page.on("click", ".toggle-single-click", function gigToggleSingleClick(event) {
					var context = coxjs.select(this).closest('.gig-offer-row');

					if (!context.hasClass('current-sel-row')) {
						// closing learn more section in other offers
						var openContext = coxjs.select('.toggle-single-click.expand-view').not(this).closest('.gig-offer-row');
						if (openContext.length > 0) {
							coxjs.select('.cox-offers-info', openContext).slideToggle();
							coxjs.select('.toggle-single-click', openContext).addClass('collapse-view').removeClass('expand-view');
						}
						// toggling current selection
						coxjs.select('.cox-offers-info', context).slideToggle();

						// animation behaviour for other gig offers
						if (coxjs.select('.toggle-single-click').hasClass('expand-view')) {
							coxjs.select('.gig-offer-row').not(coxjs.select(this).closest('.gig-offer-row')).animate({
								opacity : 1
							}, 500);
						} else {
							coxjs.select('.gig-offer-row').css('opacity', 1);
							coxjs.select('.gig-offer-row').not(coxjs.select(this).closest('.gig-offer-row')).animate({
								opacity : 0.2
							}, 500);
						}
					} else {
						coxjs.select('.gig-offer-row').css('opacity', 1);
						_module.learnMoreAltToggle(this, context);

					}

				});

				page.on("click", ".gig-order-now", function gigOrderNow(event) {
					// Prevent default anchor click.
					coxjs.preventDefault(event);
					coxjs.select('.gig-offer-row').css('opacity', 1);
					var currentRow = coxjs.select(this).closest('.gig-offer-row'), index = coxjs.select(currentRow).index();

					// Animate elements (hide them)above the current row
					console.log("animate elements above row");
					// calculating the index of the element to get the offest height of the previous element

					currentRow.addClass('current-sel-row');

				});

				page.on("click", ".gig-mobile-order-now", function gigMobileOrderNow(event) {
					// Prevent default anchor click.
					coxjs.preventDefault(event);
					coxjs.select('.gig-offer-row').css('opacity', 1);
					var currentRow = coxjs.select(this).closest('.gig-offer-row');

				});

				coxjs.select(".change-address.desktop-only").on("click", function gigChangeAddressDesktop(event) {
					coxjs.preventDefault(event);
					coxjs.select(".gig-hero .hero-tab").css('right', -(coxjs.select(".gig-hero").width()));
					coxjs.select(".gig-login-col").css({
						'display' : 'inline-block',
						'opacity' : 0
					});
					coxjs.select(".gig-info-msg").animate({
						left : coxjs.select(".gig-hero").width(),
						opacity : 0.1
					}, 1500);
					coxjs.select(".gig-login-col").animate({
						opacity : 1
					}, 1500);
					coxjs.select(".gig-hero .hero-tab").css({
						'display' : 'inline-block'
					}).animate({
						right : 0
					}, 1500);
				});

				coxjs.select(".change-address.mobile-only").on("click", function gigChangeAddressMobile(event) {
					coxjs.preventDefault(event);
					coxjs.select(".gig-info-msg").hide();
					coxjs.select(".gig-login-col").show();

				});

			},
			/**
			 * toggle pick your gig section header
			 *
			 * @method togglePickYourGig
			 * @param context, context to look for
			 */
			togglePickYourGig : function(context) {
				var pickYourGigHeader = coxjs.select('.gig-toggle-header', context), floatingPriceMobile = coxjs.select('.floating-price-mobile');
				coxjs.select('.gig-offer-row').css('opacity', 1);
				if (!pickYourGigHeader.hasClass('gig-header-open')) {
					pickYourGigHeader.addClass('gig-header-open');
					// Hide mobile floating price
					if (floatingPriceMobile.is(':visible')) {
						//mobile
						coxjs.select('.accordion-header', '.gig-toggle-header').html('Pick Your One Gig Package');
						coxjs.select('.gig-cyp-header').addClass('accordion-trigger-disabled').removeClass('accordion-trigger-open');
						coxjs.select('.gig-cyp-panel').removeClass('accordion-panel-open');
						coxjs.select('.contact-info-section').prev().addClass('accordion-trigger-disabled').removeClass('accordion-trigger-open');
						coxjs.select('.contact-info-section').removeClass('accordion-panel-open');
						coxjs.select('.floating-price-mobile').slideToggle(500, function complete() {
							coxjs.select("html, body").animate({
								scrollTop : coxjs.select(".gig-toggle-header").offset().top
							});
						});
					}
				} else {
					pickYourGigHeader.removeClass('gig-header-open');
				}
				if (!pickYourGigHeader.hasClass('prevent-close')) {
					coxjs.select('.gig-toggle-content').slideToggle(500);
				} else {
					// desktop
					coxjs.select('.accordion-header', '.gig-toggle-header').html('Pick Your One Gig Package');
					_module.reverseAnimation();
				}

			},
			/**
			 * toggle icon change for pick your gig section header
			 *
			 * @method togglePickYourGig
			 * @param context, context to look for
			 */
			toggleIconChange : function(context) {
				var pickYourGigHeader = coxjs.select('.gig-toggle-header', context);
				if (!pickYourGigHeader.hasClass('gig-header-open')) {
					pickYourGigHeader.addClass('gig-header-open');
				} else {
					pickYourGigHeader.removeClass('gig-header-open');
				}
			},
			/**
			 * Animation sequence. Close all the gig offers below the current row
			 *
			 * @method hideGigOffersBelow
			 * @param index, current row index
			 */
			hideGigOffersBelow : function(index) {
				var noOfRows = coxjs.select('.gig-offer-row');
				var height = 0;
				for (var i = index, len = noOfRows.length; i < len; i++) {
					coxjs.select(".gig-offer-row:eq(" + parseInt(i) + ")").css('display', 'none');
				}
			},
			/**
			 * Animation sequence. Close Pick your gig header and animate floating price and open checkout accordion
			 *
			 * @method orderNowAnimation
			 * @param currentRow, current row object
			 * @param index, current row index, just to fasten things a bit
			 * @param page, context
			 */
			orderNowAnimation : function(currentRow, index, page) {
				var prevElement, heightTillPrevElement = 0, pickYourGigHeader, targetHeight = 0, initialHeight = 0, gigPanel = coxjs.select('.gigabit-panel-anim');

				// closing learn more section in other offers
				coxjs.select('.cox-offers-info').not(coxjs.select('.cox-offers-info', currentRow)).css('display', 'none');
				//coxjs.select('.toggle-arrow').not(coxjs.select('.toggle-arrow', currentRow)).addClass('collapse-view').removeClass('expand-view');
				coxjs.select('.toggle-single-click').not(coxjs.select('.toggle-single-click', currentRow)).addClass('collapse-view').removeClass('expand-view');

				initialHeight = gigPanel.outerHeight();
				if (index > 0) {
					prevElement = coxjs.select(".gig-offer-row:eq(" + parseInt(index - 1) + ")");
				} else {
					//There is no element above the current selected element
				}

				// if prevElement is there then
				if (prevElement) {
					// Calculating the offset height of the current element w.r.t .gigabit-panel-anim
					heightTillPrevElement = prevElement.position().top + prevElement.outerHeight();

					gigPanel.animate({
						marginTop : -(heightTillPrevElement)
					}, 500, function() {
						// Animation end
					});
				}

				// adding class prevent-close to the header to change the icon
				pickYourGigHeader = coxjs.select('.gig-toggle-header', page);
				pickYourGigHeader.addClass('prevent-close');
				_module.toggleIconChange(page);

				// Animate elements (hide them)below the current row
				console.log("animate elements below row");
				targetHeight = heightTillPrevElement + currentRow.outerHeight(true);

				// calculate the margin of 'learn more' section to it so we can get that area closer to the offers section icons
				// learmore top - (offers top + offers height without descriptio i.e. 60px );
				var learnMoreMargin = coxjs.select('.toggle-arrow', currentRow).position().top - (coxjs.select('.colspan-m6', currentRow).position().top + 60);
				targetHeight = targetHeight - learnMoreMargin;

				// closing the remaining offers
				gigPanel.animate({
					height : targetHeight
				}, 500, function() {
					// Animation end
					// hide elements below so that we can set the height to auto

					// animating lear more section
					coxjs.select('.toggle-arrow', currentRow).animate({
						marginTop : -learnMoreMargin //border-bottom 1px
					}, 500, function() {
						_module.hideGigOffersBelow(index + 1);

						gigPanel.css('height', 'auto');
						_store['offerPositions'] = '{"heightTillPrevElement":' + heightTillPrevElement + ', "learnMoreMargin":' + learnMoreMargin + ', "targetHeight":' + targetHeight + ',"initialHeight":' + initialHeight + '}';
						coxjs.createStore('{"heightTillPrevElement":' + heightTillPrevElement + ', "learnMoreMargin":' + learnMoreMargin + ', "targetHeight":' + targetHeight + ',"initialHeight":' + initialHeight + '}');
						coxjs.select('.gig-cyp-header').removeClass('accordion-trigger-disabled');
						coxjs.publish({
							type : "openAccordion",
							data : {
								trigger : coxjs.select('.gig-cyp-header')
							}
						});
					});

				});

			},
			/**
			 * Reverse Order Now animation
			 *
			 * @method reverseAnimation
			 *
			 */
			reverseAnimation : function() {
				//var currentRow =
				var gigPanel = coxjs.select('.gigabit-panel-anim');
				gigPanel.css('height', JSON.parse(coxjs.getStore()).targetHeight);
				coxjs.select('.gig-offer-row').css('display', 'block');

				var section = coxjs.select('.cox-offers-info', '.current-sel-row');
				coxjs.select('.floating-price').animate({
					'right' : '-50%'
				}, 1000);
				if (section.is(':visible')) {
					section.slideToggle(1, function() {
						var moreInfoIcon = coxjs.select('.toggle-single-click', section.closest('.gig-offer-row'));
						moreInfoIcon.removeClass('expand-view').addClass('collapse-view');
						_module.reverseReset(gigPanel);
					});
				} else {
					_module.reverseReset(gigPanel);
				}
			},
			/**
			 * Reset Learn More section
			 *
			 * @method reverseReset
			 * @param gigPanel,  Gig Offers Panel
			 */
			reverseReset : function(gigPanel) {
				gigPanel.animate({
					marginTop : 0
				}, 500, function() {
					// Animation end
					// Reset learn more section
					coxjs.select('.toggle-single-click').css('marginTop', 0);
					coxjs.select('.toggle-arrow').css('marginTop', 0);
					// Reset current row selection
					coxjs.select('.gig-offer-row').removeClass('border-remove');
					coxjs.select('.gig-offer-row').removeClass('current-sel-row');
				});

				gigPanel.animate({
					height : JSON.parse(coxjs.getStore()).initialHeight
				}, 500, function() {
					gigPanel.css('height', 'auto');
				});

				coxjs.select(".gig-toggle-header").removeClass("prevent-close");

				coxjs.publish({
					type : "closeAccordion",
					data : {
						trigger : coxjs.select('.gig-cyp-header')
					}
				});
				coxjs.select('.gig-cyp-header').addClass('accordion-trigger-disabled');
				coxjs.publish({
					type : "closeAccordion",
					data : {
						trigger : coxjs.select('.contact-info-section').prev()
					}
				});
				coxjs.select('.contact-info-section').prev().addClass('accordion-trigger-disabled');

				setTimeout(function() {
					coxjs.select("html, body").animate({
						scrollTop : coxjs.select(".gig-toggle-header").offset().top
					});
				}, 1000)

			},
			/**
			 * Close learn more section
			 *
			 * @method learnMoreClose
			 *
			 */
			learnMoreClose : function() {
				var section = coxjs.select('.cox-offers-info', '.current-sel-row');

				if (section.is(':visible')) {
					section.slideToggle(1, function() {
						var moreInfoIcon = coxjs.select('.toggle-single-click', currentRow);
						moreInfoIcon.removeClass('expand-view').addClass('collapse-view');
					});
				}
			},
			/**
			 * Toggling learn more section
			 *
			 * @method learnMoreToggle
			 */
			learnMoreAltToggle : function(learnMoreArg, context) {

				var learnMoreMargin = JSON.parse(coxjs.getStore()).learnMoreMargin;
				var learnMore = coxjs.select(learnMoreArg);

				if (learnMore.hasClass('expand-view')) {
					coxjs.select('.cox-offers-info', context).slideToggle();

					learnMore.animate({
						marginTop : -learnMoreMargin //border-bottom 1px, for some reason(border-box) i am not able to omit this
					}, 500, function() {

					});

				} else {
					learnMore.animate({
						marginTop : learnMoreMargin
					}, 500, function() {

					});
					coxjs.select('.cox-offers-info', context).slideToggle();
				}

			},
			/**
			 * Floating price scroll handler
			 *
			 * @method floatingPriceHandler
			 * @param none
			 */
			floatingPriceHandler : function() {
				var price = coxjs.select('.giga-pkg-price');
				if (parseInt(coxjs.select('.floating-price').css('right')) >= 0) {
					if (!price.hasClass('sticky') && coxjs.select(window).scrollTop() >= _store['floatingPrice']) {
						price.addClass('sticky');
					}

					if (coxjs.select(window).scrollTop() < _store['floatingPrice']) {
						price.removeClass('sticky');
					}
				}
			},

			/**
			 * Method to handle some events after ajax call
			 *
			 * @handler multiAjaxComplete, MultiAjax Module sends a message when all the queued up ajax are completed
			 * @param data, trigger element
			 */
			multiAjaxComplete : function(data) {
				var trigger = data.trigger, targetContainer = coxjs.select(data.trigger).data('multiAjaxTarget'), page = coxjs.select("#gigabit-offer-container");
				// animation for order now
				if (coxjs.select(trigger).hasClass('gig-order-now')) {
					if (coxjs.select('.floating-price').is(':visible') && targetContainer.indexOf('floating-price') > -1) {
						// change text to edit
						coxjs.select('.accordion-header', '.gig-toggle-header').html('Pick Your One Gig Package (Edit)');
						var currentRow = coxjs.select(".current-sel-row"), index = coxjs.select(currentRow).index();
						// Animate elements (hide them)above the current row
						console.log("animate elements above row");
						// calculating the index of the element to get the offest height of the previous element

						// After Order now animates
						var section = coxjs.select('.cox-offers-info', '.current-sel-row');

						coxjs.select('.floating-price').animate({
							'right' : '0%'
						}, 1000);
						if (section.is(':visible')) {
							// close lear more section
							section.slideToggle(1, function() {
								var moreInfoIcon = coxjs.select('.toggle-single-click', currentRow);
								moreInfoIcon.removeClass('expand-view').addClass('collapse-view');
								_module.orderNowAnimation(currentRow, index, page);
							});
						} else {
							_module.orderNowAnimation(currentRow, index, page);
						}
						coxjs.select('.gig-offer-row').addClass('border-remove');
					}
				}

				if (coxjs.select(trigger).hasClass('gig-mobile-order-now')) {
					coxjs.select('.accordion-header', '.gig-toggle-header').html('Pick Your One Gig Package (Edit)');
					_module.togglePickYourGig(page);
					coxjs.select('.floating-price-mobile').slideToggle(500, function() {
						coxjs.select("html, body").animate({
							scrollTop : coxjs.select(".floating-price-mobile").offset().top
						});
						coxjs.select('.gig-cyp-header').removeClass('accordion-trigger-disabled').addClass('accordion-trigger-open');
						coxjs.select('.gig-cyp-header').next().removeClass('accordion-panel-disabled').addClass('accordion-panel-open');
					});
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
				coxjs.clearStore();
			}
		};
	});
})(coxfw);
/**
 * @author Shilpa
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class ShoppingCartAccordion
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.ShoppingCartAccordion', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		/**
		 * The element clicked to expand/collapse all primary accordions in shopping cart page.
		 *
		 * @member {object} _toggler
		 */
		var _toggler;		
		
		/**
		 * The common selector Expand/Collapse all.
		 *
		 * @member {string} _selectorExpandCollapseAll
		 */
		var _selectorExpandCollapseAll = "[class*='shopping-cart-toggle-']";
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				
				console.log("INIT ShoppingCartAccordion.js");
				
				_module = this;
				// Get any toggler with the same parent .accordion node.
				_toggler = coxjs.select(_selectorExpandCollapseAll, ".accordion");

				// Check if we have a _toggler...
				if (_toggler.length > 0) {
					// ...find all open panels that share the same parent .accordion as the _toggler...
					var openSiblings = coxjs.select(".accordion-trigger-open:not('.accordion-panel .accordion-trigger-open')", _toggler.closest(".accordion"));

					// ...and swap the _toggler based on how many panels are open.
					if (openSiblings.length > 0) {
						_toggler.removeClass("shopping-cart-toggle-expand").addClass("shopping-cart-toggle-collapse");
					} else {
						_toggler.removeClass("shopping-cart-toggle-collapse").addClass("shopping-cart-toggle-expand");
					}
				}
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC AutoScroll.js");
				coxjs.select("body").on("click", _selectorExpandCollapseAll, function(event) {
					// Stop default anchor click.
					coxjs.preventDefault(event);

					// Start with the default _toggler.
					_toggler = coxjs.select(this);
					
					//open all the panels that are not currently open
					if(_toggler.hasClass("shopping-cart-toggle-expand")) {
						var CloseSiblings = coxjs.select(".accordion-trigger:not('.accordion-trigger-open')", _toggler.closest(".accordion"));							
							coxjs.select(CloseSiblings).each(function(index, element) {
								coxjs.select(element).addClass("accordion-trigger-open");
								coxjs.select(element).next().slideToggle({
									duration: "slow",
									progress : function(animation) {
										// DEV NOTES: This 'progress' option exists to allow IE8 to mitigate hasLayout issues during animation that were causing white space/overlap.
										if (coxjs.select("body.IE8").length > 0) coxjs.select(".accordion-panel").parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");
									},
									complete: function(animation) {
										var scrollTop = coxjs.select(".accordion").offset().top;
										coxjs.select("html, body").animate({
											scrollTop: scrollTop
										});
									}	
									});
								});									
						//close all the panels that are not currently close	
						} else if(_toggler.hasClass("shopping-cart-toggle-collapse")) {
							var openSiblings = coxjs.select(".accordion-trigger-open:not('.accordion-panel .accordion-trigger-open')", _toggler.closest(".accordion"));
							coxjs.select(openSiblings).each(function(index, element) {
								coxjs.select(element).removeClass("accordion-trigger-open");									
								coxjs.select(element).next().slideToggle({
									duration: "slow",
									progress : function(animation) {
										// DEV NOTES: This 'progress' option exists to allow IE8 to mitigate hasLayout issues during animation that were causing white space/overlap.
										if (coxjs.select("body.IE8").length > 0) coxjs.select(".accordion-panel").parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");
									},
									complete: function(animation) {
										var scrollTop = coxjs.select(".accordion").offset().top;
										coxjs.select("html, body").animate({
											scrollTop: scrollTop
										});
									}	
									});
								});
								
							}
						// And finally, swap the togglers' class so the link message is updated.
						if (_toggler.hasClass("shopping-cart-toggle-expand")) {
							_toggler.removeClass("shopping-cart-toggle-expand").addClass("shopping-cart-toggle-collapse");
						} else if (_toggler.hasClass("shopping-cart-toggle-collapse")) {
							_toggler.removeClass("shopping-cart-toggle-collapse").addClass("shopping-cart-toggle-expand");
						}
					});			
		
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @authorPrakhar Gupta
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class TermCondition
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.TermCondition', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context = coxjs.select(".terms-and-condition");
		
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = '.terms-and-condition';
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				_module = this;
				
				_module.disableContinueButton();
				
				/**
				 * @event subscribe
				 * calling when check box has been clicked
				 * */
				coxjs.subscribe({
					"checkBoxActionComplete": _module.disableContinueButton
				});
				
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
			console.log("EXEC TermCondition.js");
			
			_module = this;
			
			
			/**
			 * text area max length support ie8
			 * @event keyup
			 * @param {string} .term-condition-textarea, input
			 * @param {selector} input
			 * */
			coxjs.select('.term-condition-textarea, input').keyup(function(e){
				var max = coxjs.select(this).attr("maxlength");
		        if (e.which < 0x20) {
		            return; 
		        }
		        if (this.value.length == max) {
		            e.preventDefault();
		        } else if (this.value.length > max) {
		            this.value = this.value.substring(0, max);
		        }
			});
			
			},
			
			/**
			 * term condition button should be active only when all checkboxes are checked
			 * changing button text on check event
			 * @method disableContinueButton
			 * */
			disableContinueButton : function() {
				if (_context.length == 0) return;
				var termsConditionCheck = false;
				
				/*changing text of button on click*/
				coxjs.select(".terms-and-condition .check-boxes").each(
					function(index, element) {

						if (!coxjs.select(element).hasClass("active-check")) {
							termsConditionCheck = true;
							coxjs.select(coxjs.select(element).find('span')).text("Select to agree");
						}
						else{
							coxjs.select(coxjs.select(element).find('span')).text("Yes, I Agree");
						}
					});
					
					/*enable  continue from term and condition if every field is checked*/
					if (termsConditionCheck) {
						coxjs.select(".term-continue-button").addClass("button-disabled-checkout");
					} else {
						coxjs.select(".term-continue-button").removeClass("button-disabled-checkout");
					}
				
					_module.termConditionValidation();
				
			},
			
			/**
			 * @method termConditionValidation
			 * validation on term and condition section button
			 * it depend on other section also on checkout page, based on the existence in DOM
			 * */
			termConditionValidation : function() {
				
				var finalcheckoutReference = coxjs.select(".final-checkout-button");
				var termConditionStatus = coxjs.select(".term-continue-button").hasClass("button-disabled-checkout");
				
				var secureCheckDomExistence = document.querySelectorAll(".secure-credit-check").length;
				var checkingDomForPayment = document.querySelectorAll(".card-number-append").length;

				/*if payment section is not there in DOM*/
				if(checkingDomForPayment=="0"){
					/*secure credit check section is not in dom*/
					if(secureCheckDomExistence =="0"){
						if(!termConditionStatus){
							finalcheckoutReference.removeClass("button-disabled-checkout");
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
					/*if secure credit check section is present in dom*/
					else{
						
						/*	var secureCheckStatus = coxjs.select(".scc-continue-button").hasClass("button-disabled-checkout");*/
						/*if credit check is not require*/
						var subSecureCheckButton = document.querySelectorAll(".credit-submit-button").length;
						
						/*if(!termConditionStatus && !secureCheckStatus){*/
						if(!termConditionStatus && subSecureCheckButton == "0"){
							finalcheckoutReference.removeClass("button-disabled-checkout");
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
				}
				
				else{
					var displayState = coxjs.select(".payment-address").css("display");
					var cpStreet = coxjs.select(".cp-street").val().length;
					var cpCity = coxjs.select(".cp-city").val().length;
					var cpZip = isNaN(parseInt(coxjs.select(".cp-zip").val()));
					var cpState = coxjs.select(".cp-state").val().length;
					var creditCardName = coxjs.select(".credit-card-name").val().length;
					var creditCardNumber = isNaN(parseInt(coxjs.select(".txtCCNum-payment").val()));
					var monthValue = document.querySelectorAll(".cp-month")[0].selectedIndex;
					var yearValue = document.querySelectorAll(".cp-year")[0].selectedIndex;
						
					if(secureCheckDomExistence =="0"){
						if((creditCardName>0)&&(!creditCardNumber)&&(monthValue>0)&&(yearValue>0)&&(!termConditionStatus)){
							finalcheckoutReference.removeClass("button-disabled-checkout");
							if((displayState=="block")&&((cpStreet==0)||(cpCity==0)||(cpZip)||(cpState==0))){
								finalcheckoutReference.addClass("button-disabled-checkout");
							}
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
					
					else{
						var secureCheckStatus = coxjs.select(".scc-continue-button").hasClass("button-disabled-checkout");
							if((creditCardName>0)&&(!creditCardNumber)&&(monthValue>0)&&(yearValue>0)&&(!termConditionStatus)&&(!secureCheckStatus)){
								finalcheckoutReference.removeClass("button-disabled-checkout");
								if((displayState=="block")&&((cpStreet==0)||(cpCity==0)||(cpZip)||(cpState==0))){
									finalcheckoutReference.addClass("button-disabled-checkout");
								}
						}
						else{
							finalcheckoutReference.addClass("button-disabled-checkout");
						}
					}
				}
				
			},
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Shilpa Mathadevaru
 * @version 0.1.0.0
 * @namespace modules.ecomm
 * @class UpdateTvEquipment
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.ecomm.UpdateTvEquipment', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT DeliveryMethod.js");
			
				_module = this;
	
				// Subscribe to spin requests.
				coxjs.subscribe({
					"TVEquipSpinner" : _module.updateSpinner
				});
			
			
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC UpdateTvEquipment.js");
			},
			
			updateSpinner : function(data){
				var val = data.sbInputVal;
				console.log(val);
				var context = data.spinContext;
				var dataCopy = coxjs.select(".sb-content-copy");				
				var dataEle = coxjs.select(".sb-content-" + (val + 1), context).children();	
				var priceValue = coxjs.select("span:first-of-type", dataEle).text();
				
				//DONT-remove commented section. price update code
				/*var priceValue = coxjs.select("span:first-of-type", dataEle).text();
				if(coxjs.trim(coxjs.select("span:first-of-type", _trigger).text()).indexOf('FREE') == 0){
					return false;
				}				
				var priceDataarr = parseInt(priceValue.split("$")[1]);
				var bigData = coxjs.select(".update-price");
				var bigPriceData = coxjs.select("div:first-of-type", ".update-price").html();
				bigPriceData = parseInt(bigPriceData) - priceDataarr;
				coxjs.select("div:first-of-type", bigData).html(bigPriceData);
				*/
				
				/*if(){
					
				}
				*/
				
		if(coxjs.select(dataEle).hasClass("selected") || coxjs.select(dataEle).hasClass("unselected")){
					var dataClone = coxjs.select(dataCopy).clone();
					coxjs.select(dataEle).replaceWith(dataClone);
					coxjs.select(".modal-trigger", dataClone).attr("data-content-element","equipment-content-"+(val+1)+"");
					coxjs.select(".equipment-comparison-modal", dataClone).attr("id","equipment-content-"+(val+1)+"");
					coxjs.select(dataClone).removeClass("sb-content-copy");
					coxjs.select(dataClone).css("display","inline-block");
					if((val + 1)%3 == 0){
						coxjs.select(dataClone).addClass("position-last");
					}
				}
				
				
				
			},
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * Observes attribute changes to body tag and, assuming it has a prent frame with a particular ID, reads the current inline body width and applies it to that frame.
 * This should fix the buggy emulation used by AEM.
 * 
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.AEMEmulatorFixes
 */
(function(coxfw) {
	coxfw.core.define("modules.global.AEMEmulatorFixes", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Starts up the current module.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT AEMEmulatorFixes.js");
				// Return if we don't have a parent iframe.
				if (!window.frameElement) return;

				// Stores a copy of the module context to apply inside methods.
				_module = this;
			},
			/**
			 * Observer attribute changes on our body tag, in case it's in the AEM emulator/iframe.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC AEMEmulatorFixes.js");
				// Return if we don't have a parent iframe.
				if (!window.frameElement) return;

				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Listen for changes to our body.
				var bodyObserver = new MutationObserver(_module.frameMaker);
				bodyObserver.observe(coxjs.select("body")[0], {
					attributes: true,
					subtree: false,
					childList: false,
					characterData: false
				});
			},
			/**
			 * Checks for a frame wrapping our page, and does stuff to it.
			 *
			 * @method frameMaker
			 * @param {object} mutationRecord Information about what has been modified.
			 * @param {object} mutationObserver The original mutation observer.
			 */
			frameMaker : function(mutationRecord, mutationObserver) {
				// See if we have a parent frame...
				if (window.frameElement) {
					var aemulator = coxjs.select(window.frameElement);
					// ...and make sure it has the correct ID.
					if (aemulator.is("#cq-cf-frame")) {
						// Reset the frame's CSS...
						aemulator.css({
							// ... by using the value of the inline style attribute.  DO NOT use jQuery .width() or similar; it is the calculated width inherited from previously set iframe width.
							"width": coxjs.select("body")[0].style.width
						});
						// Set the containing div to have the same appearance originally applied to our body.
						aemulator.parent("#cq-cf-frame-ct").css({
							"text-align": "center"
						});
					}
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * Manages opening and closing accordion panels.
 * 
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.Accordion
 */
(function(coxfw) {
	coxfw.core.define("modules.global.Accordion", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * The element clicked to trigger the show/hide of DIV.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * The element clicked to expand/collapse all primary accordions.
		 *
		 * @property _toggler
		 * @type object
		 */
		var _toggler;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selectorTriggers
		 */
		var _selectorTriggers = ".accordion-trigger, .accordion-next";
		/**
		 * The common selector Expand/Collapse all.
		 *
		 * @member {string} _selectorExpandCollapseAll
		 */
		var _selectorExpandCollapseAll = "[class*='accordion-toggle-']";

		return {
			/**
			 * Begins listening for {@link coxfw.coxjs.publish} events to Accordions.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT Accordion.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Listen for {@link coxfw.coxjs.publish} events to open or close an accordion.
				 * 
				 * @event subscribe
				 * @param {string} openAccordion Action intended to OPEN an accordion.
				 * @param {string} closeAccordion Action intended to CLOSE an accordion.
				 */
				coxjs.subscribe({
					"openAccordion" : _module.openAccordion,
					"closeAccordion" : _module.closeAccordion
				});

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selectorExpandCollapseAll);
			},
			/**
			 * Manage accordions based on events.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC Accordion.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Load the default content based on the option set as default.
				 * 
				 * @event click
				 * @param {string} _selectorTriggers The select drop-down used for navigation.
				 */
				coxjs.select("body").on("click", _selectorTriggers, function(event) {
					// Stop default anchor click.
					coxjs.preventDefault(event);

					// Start with the default _trigger.
					_trigger = coxjs.select(this);

					// Skip if this accordion is disabled.
					if (!_trigger.hasClass("accordion-trigger-disabled")) {
						// What type of trigger is clicked determines whether to open or close the accordion.
						if (_trigger.hasClass("accordion-trigger-open") || _trigger.hasClass("accordion-next")) {
							/**
							 * Close the accordion.
							 * 
							 * @event publish
							 * @param {string} closeAccordion Slide this panel closed.
							 */
							coxjs.publish({
								type : "closeAccordion",
								data : {
									trigger: _trigger
								}
							});
						} else {
							/**
							 * Open the accordion.
							 * 
							 * @event publish
							 * @param {string} openAccordion Slide this panel open.
							 */
							coxjs.publish({
								type : "openAccordion",
								data : {
									trigger: _trigger
								}
							});

							// Track accordion on clicking to open.
							_module.trackAccordionOpen(_trigger);
						}
					}

					// Get any toggler with the same parent .accordion node.
					_toggler = coxjs.select(_selectorExpandCollapseAll, _trigger.closest(".accordion"));

					// Check if we have a _toggler...
					if (_toggler.length > 0) {
						// ...find all open panels that share the same parent .accordion as the _toggler...
						var openSiblings = coxjs.select(".accordion-trigger-open:not('.accordion-panel .accordion-trigger-open')", _toggler.closest(".accordion"));

						// ...and swap the _toggler based on how many panels are open.
						if (openSiblings.length > 0) {
							_toggler.removeClass("accordion-toggle-expand").addClass("accordion-toggle-collapse");
						} else {
							_toggler.removeClass("accordion-toggle-collapse").addClass("accordion-toggle-expand");
						}
					}
				});
				/**
				 * Handles toggling all primary accordions.
				 * 
				 * @event click
				 * @param {string} _selectorExpandCollapseAll The anchor used to toggle.
				 */
				coxjs.select("body").on("click", _selectorExpandCollapseAll, function(event) {
					// Stop default anchor click.
					coxjs.preventDefault(event);

					// Start with the default _toggler.
					_toggler = coxjs.select(this);

					// If the _toggler was set to expand...
					if (_toggler.hasClass("accordion-toggle-expand")) {
						// ...temporarily remove data-cox-accordion-style and...
						var coxAccordionStyle = _toggler.closest(".accordion").data("coxAccordionStyle");
						_toggler.closest(".accordion").data("coxAccordionStyle", "");

						// ...open all panels that are not currently open.
						coxjs.select(".accordion-trigger:not('.accordion-trigger-open')", _toggler.closest(".accordion")).each(function(index, element) {
							var _trigger = coxjs.select(element);
							/**
							 * Open the accordion.
							 * 
							 * @event publish
							 * @param {string} openAccordion Slide this panel open.
							 */
							coxjs.publish({
								type : "openAccordion",
								data : {
									trigger: _trigger
								}
							});
						});

						// Then, reset the data-cox-accordion-style attribute.
						_toggler.closest(".accordion").data("coxAccordionStyle", coxAccordionStyle);
					// If the _toggler was set to collapse...
					} else if (_toggler.hasClass("accordion-toggle-collapse")) {
						// ...close all panels that are not currently closed.
						coxjs.select(".accordion-trigger-open", _toggler.closest(".accordion")).each(function(index, element) {
							var _trigger = coxjs.select(element);
							/**
							 * Close the accordion.
							 * 
							 * @event publish
							 * @param {string} closeAccordion Slide this panel closed.
							 */
							coxjs.publish({
								type : "closeAccordion",
								data : {
									trigger: _trigger
								}
							});
						});
					}

					// And finally, swap the togglers' class so the link message is updated.
					if (_toggler.hasClass("accordion-toggle-expand")) {
						_toggler.removeClass("accordion-toggle-expand").addClass("accordion-toggle-collapse");
					} else if (_toggler.hasClass("accordion-toggle-collapse")) {
						_toggler.removeClass("accordion-toggle-collapse").addClass("accordion-toggle-expand");
					}
				});
				/**
				 * Make sure the toggle all matches the current panel states.
				 * 
				 * @event xhr-selectors
				 * @param {string} _selectorExpandCollapseAll The anchor used to toggle
				 */
				coxjs.select("body").on("xhr-selectors", _selectorExpandCollapseAll, function(event) {
					// Start with the default _toggler.
					_toggler = coxjs.select(this);

					// Find all open panels that share the same parent .accordion as the _toggler.
					var openSiblings = coxjs.select(".accordion-trigger-open:not('.accordion-panel .accordion-trigger-open')", _toggler.closest(".accordion"));

					// See if there are any top-level, open panels...
					if (openSiblings.length > 0) {
						_toggler.removeClass("accordion-toggle-expand").addClass("accordion-toggle-collapse");
					} else {
						_toggler.removeClass("accordion-toggle-collapse").addClass("accordion-toggle-expand");
					}
				});
				/**
				 * Trigger "xhr-selectors" if any "[class*='accordion-toggle-']" node exists when the DOM is loaded.
				 *
				 * @event xhr-selectors
				 * @param {object} _selectorExpandCollapseAll Nodes intended to open overlays when loaded.
				 */
				if (coxjs.select(_selectorExpandCollapseAll).length > 0) coxjs.select(_selectorExpandCollapseAll).trigger("xhr-selectors");
			},
			/**
			 * Opens an accordion.
			 *
			 * @method openAccordion
			 * @param {object} data Object sent by opening trigger.
			 */
			openAccordion : function(data) {
				console.log("Accordion.openAccordion");
				// Setup vars for each trigger/panel combo surrounding the current one.
				var currentTrigger = data.trigger;
				var currentPanel = currentTrigger.nextAll(".accordion-panel").first();
				
				// If this .accordion has a data-cox-accordion-style attribute that is exactly "open-single-panel"...
				if(!currentTrigger.hasClass("accordion-toggle-collapse") && currentTrigger.closest(".accordion").data("coxAccordionStyle") === "open-single-panel") {
					// ...find all sibling accordions that are open and CLOSE THEM.
					coxjs.select(".accordion-trigger-open", currentTrigger.closest(".accordion")).each(function(index, element) {
						/**
						 * Close EACH OTHER open accordion.
						 * 
						 * @event publish
						 * @param {string} closeAccordion Slide this panel closed.
						 */
						coxjs.publish({
							type : "closeAccordion",
							data : {
								trigger: coxjs.select(element)
							}
						});
					});
				}
				
				// Slide the current panel open...
				currentPanel.slideToggle({
					duration : "slow",
					progress : function(animation) {
						// DEV NOTES: This 'progress' option exists to allow IE8 to mitigate hasLayout issues during animation that were causing white space/overlap.
						if (coxjs.select("body.IE8").length > 0) coxjs.select(".accordion-panel").parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");
					},
					complete : function(animation) {
						var stickToArr = currentTrigger.closest('.accordion').data('coxAccordionStickBelow');
						var scrollTop = currentTrigger.offset().top;
						
						if(stickToArr != undefined && stickToArr.length > 0) {
							stickToArr = stickToArr.split(' ');
											
							coxjs.each(stickToArr, function(index, value) {
								if(coxjs.select('#'+value).is(":visible")){
									// Calculating the new scroll top to fix the accordion below the fixed header because offset bottom is not working properly.
									scrollTop = scrollTop - parseInt($('#'+value).outerHeight());
								}							 
							});
						}						
						
						coxjs.select("html, body").animate({
							scrollTop: scrollTop
						});
						currentPanel.addClass("accordion-panel-open");
						if (coxjs.select("body.IE8").length === 0) currentPanel.removeAttr("style");
					}
				});

				// ...set ARIA attributes for an open accordion...
				currentPanel.attr("aria-hidden", false);
				currentTrigger.attr("aria-selected", true);
				currentTrigger.attr("aria-expanded", true);

				// ...then add the open class to the trigger.
				currentTrigger.addClass("accordion-trigger-open");
			},
			/**
			 * Closes an accordion.
			 *
			 * @method closeAccordion
			 * @param {object} data Object sent by closing trigger.
			 */
			closeAccordion : function(data) {
				console.log("Accordion.closeAccordion");
				// Setup vars for each trigger/panel combo surrounding the current one.
				var continueAccordion = true;
				var currentTrigger = data.trigger;
				var currentPanel = currentTrigger.nextAll(".accordion-panel").first();
				var nextTrigger;
				var nextPanel;

				// Handle clicks on the next button.
				if (currentTrigger.hasClass("accordion-next")) {
					// Switch the trigger to the trigger for the node the button was clicked in.
					nextTrigger = currentTrigger.closest(".accordion-panel").next();
					nextPanel = nextTrigger.next();
					currentTrigger = currentTrigger.closest(".accordion-panel").prev();
					currentPanel = currentTrigger.next();
					// set focus on the next accordion header to enable tabbing from current position
					nextTrigger.focus();
				}

				// If we're inside a form.accordion construct, check if we're validated.
				if (currentPanel.closest("form.accordion").length > 0) {
					/**
					 * Used by other modules to prevent closing animation under certain circumstances.
					 * 
					 * @event publish
					 * @param {string} continueCloseAccordion Check with any module to see if we can continue closing this accordion.
					 */
					continueAccordion = coxjs.publish({
						type : "continueCloseAccordion",
						data : {
							trigger: currentTrigger
						}
					});
				}

				// Check if we can continue closing this accordion first.
				if (continueAccordion) {
					// Slide the current panel closed...
					currentPanel.slideToggle({
						duration : "slow",
						progress : function(animation) {
							// DEV NOTES: This 'progress' option exists to allow IE8 to mitigate hasLayout issues during animation that were causing white space/overlap.
							if (coxjs.select("body.IE8").length > 0) coxjs.select(".accordion-panel").parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");
						},
						complete : function(animation) {
							// If there are any fixed headers then we can configure accordion to scroll and stick to that header by giving data-stick-below option
							var stickToArr = currentTrigger.closest('.accordion').data('coxAccordionStickBelow');
							var scrollTop = currentTrigger.offset().top;
							
							if(stickToArr != undefined && stickToArr.length > 0) {
								stickToArr = stickToArr.split(' ');
												
								coxjs.each(stickToArr, function(index, value) {
									if(coxjs.select('#'+value).is(":visible")){
										// Calculating the new scroll top to fix the accordion below the fixed header because offset bottom is not working properly.
										scrollTop = scrollTop - parseInt($('#'+value).outerHeight());
									}							 
								});
							}
							coxjs.select("html, body").animate({
								scrollTop: scrollTop
							});
							
							currentPanel.removeClass("accordion-panel-open");
							if (coxjs.select("body.IE8").length === 0) currentPanel.removeAttr("style");
						}
					});

					// ...set ARIA attributes for a closed accordion....
					currentPanel.attr("aria-hidden", true);
					currentTrigger.attr("aria-selected", false);
					currentTrigger.attr("aria-expanded", false);

					// ...then remove the open class from the trigger.
					currentTrigger.removeClass("accordion-trigger-open");

					// Unlock and open the next panel, if one exists.
					if (!coxfw.utils.typeEqual(nextTrigger, "undefined")) {
						nextTrigger.removeClass("accordion-trigger-disabled");
						nextPanel.removeClass("accordion-panel-disabled");
						/**
						 * Open the NEXT accordion.
						 * 
						 * @event publish
						 * @param {string} openAccordion What changes the dropdown and tab content.
						 */
						coxjs.publish({
							type : "openAccordion",
							data : {
								trigger: nextTrigger
							}
						});
					}
				} else {
					// Scroll to the top of the current trigger to make changes.
					var stickToArr = currentTrigger.closest('.accordion').data('coxAccordionStickBelow');
					var scrollTop = currentTrigger.offset().top;
					
					if(stickToArr.length > 0) {
						stickToArr = stickToArr.split(' ');
										
						coxjs.each(stickToArr, function(index, value) {
							if(coxjs.select('#'+value).is(":visible")){
								// Calculating the new scroll top to fix the accordion below the fixed header because offset bottom is not working properly.
								scrollTop = scrollTop - parseInt($('#'+value).outerHeight());
							}							 
						});
					}
					coxjs.select("html, body").animate({
						scrollTop: scrollTop
					});					
				}
			},
				
			/**
			 * Tracks Omniture values for every accordion when it is manually opened.
			 *
			 * @method trackAccordionOpen
			 * @param {object} caller The DOM node that generated the modal.
			 */
			trackAccordionOpen : function(caller) {
				if (typeof(__coxOmnitureParams) != "undefined" && typeof(s_account) != "undefined" && s_account != "") {
					var pageName = __coxOmnitureParams ? __coxOmnitureParams.pageName + ":" : "";
					var hier1 = __coxOmnitureParams ? __coxOmnitureParams.hier1 + "," : "";
					var hier2 = __coxOmnitureParams ? __coxOmnitureParams.hier2 + "," : "";
					var localeName = __coxOmnitureParams ? __coxOmnitureParams.localeName + ":" : "";
					var callerParentTitle = "";
					var caller = coxjs.select(caller)[0];

					// If the current caller/trigger is INSIDE another .accordion-panel...
					if (coxjs.select(caller).closest(".accordion-panel").length > 0) {
						// Start setting the callerParentTitle string.
						var callerParentTrigger = coxjs.select(caller).closest(".accordion-panel").prev()[0];
						callerParentTitle = callerParentTrigger.title.toLowerCase();

						// If the callerParentTitle is blank...
						if (!callerParentTitle) {
							// ...use the firstChild's innerHTML for callerParentTitle.
							callerParentTitle = coxjs.select(callerParentTrigger).children(":not('div')").text().toLowerCase() + ":";
						} else {
							// Just use the callerParentTitle attribute, if it has one.
							callerParentTitle = callerParentTitle + ":";
						}
					}

					// Use the caller's title attribute for callerTitle.
					var callerTitle = caller.title.toLowerCase();

					// If the title wasn't empty...
					if (!callerTitle) {
						// ...otherwise, use the firstChild's innerHTML for callerTitle.
						callerTitle = coxjs.select(caller).children(":not('div')").text().toLowerCase();
					}
					/**
					 * Track usage for this accordion.
					 * 
					 * @event publish
					 * @param {string} OmnitureInterface Interact with the external Omniture library.
					 * @param {object} data The configuration for the AJAX request with the following properties:
					 * @param {string} data.mode How we want to interact with Omniture.
					 * @param {string} data.type What kind of interaction are we having with Omniture.
					 * @param {string} data.clearVariables A stringified Boolean telling whether to clear the variables or not.
					 * @param {object} data.options The options to configure for this Omniture call.
					 * @param {string} data.options.pageName The name of the page being accessed.
					 * @param {string} data.options.hier1 First heir for this action.
					 * @param {string} data.options.hier2 Second heir for this action.
					 * @param {string} data.options.localePagename The locale name of the page being accessed.
					 */
					coxjs.publish({
						type : "OmnitureInterface",
						data : {
							mode : "track",
							type : "pageview",
							clearVariables : "true",
							options : {
								pageName : pageName + callerParentTitle + callerTitle,
								hier1 : hier1 + callerParentTitle + callerTitle,
								hier2 : hier2 + callerParentTitle + callerTitle,
								localePagename : localeName + pageName + callerParentTitle + callerTitle
							}
						}
					});
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * Manages validation of form elements in an accordion-panel layout.  Currently, revalidates when an accordion panel is closed.
 * 
 * @author Sudeep Kumar
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.AccordionFormValidation
 */
(function(coxfw) {
	coxfw.core.define('modules.global.AccordionFormValidation', function(coxjs) {
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context = coxjs.select("form.accordion");
		
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Begins listening for {@link coxfw.coxjs.publish} events to closeAccordion.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT AccordionFormValidation.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Get out of here if we're not in a form.accordion page.
				if (_context.length == 0) {
					/**
					 * If we're not validating a form, let the Accordion know it's OK to close.
					 * 
					 * @event subscribe
					 * @param {string} continueCloseAccordion Action intended fire BEFORE closing an accordion.
					 */
					coxjs.subscribe({
						"continueCloseAccordion" : function() {
							return true;
						}
					});
				} else {
					/**
					 * Listen for {@link coxfw.coxjs.publish} events.
					 * 
					 * @event subscribe
					 * @param {string} continueCloseAccordion Action intended fire BEFORE closing an accordion.
					 */
					coxjs.subscribe({
						"continueCloseAccordion" : _module.validateAccordion
					});
				}
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
// console.log("EXEC AccordionFormValidation.js");
			},
			/**
			 * Revalidates an accordion when it's closed.
			 *
			 * @method validateAccordion
			 * @param {object} data Object sent by closing trigger.
			 */
			validateAccordion : function(data) {
console.log("     AccordionFormValidation.validateAccordion");
				var currentTrigger = data.trigger;
				var currentPanel = currentTrigger.next();
				var nextTrigger = currentPanel.next();
				var nextPanel = nextTrigger.next();
				var currentForm = currentPanel.closest("form.accordion")[0];
				var currentIgnored = coxjs.select(".ignore-validation", currentForm);

				// Ignore validation for ALL fields...
				coxjs.select("input, select, textarea", currentForm).addClass("ignore-validation");

				// ...except for those in the currentPanel...
				coxjs.select("input, select, textarea", currentPanel).removeClass("ignore-validation");

				// ...but include those originally MARKED to be ignored.
				currentIgnored.addClass("ignore-validation");

				// Then, validate remaining fields (which should ONLY be in the currentPanel)...
				coxjs.select(currentForm).valid();

				// ...followed by removing .ignore-validation across the form...
				coxjs.select("input, select, textarea", currentForm).removeClass("ignore-validation");

				// ...and finally adding .ignore-validation to those fields that had it by default.
				currentIgnored.addClass("ignore-validation");

				// And if we have invalid fields, open the accordion back up.
				if (coxjs.select(currentForm).validate().numberOfInvalids() > 0) {
					return false;
				} else {
					return true;
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * Subscription based AJAX behavior.
 *
 * @author Kyle Patterson
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.Ajax
 */
(function(coxfw) {
	coxfw.core.define("modules.global.Ajax", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT Ajax.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Subscribe to AJAX requests.
				 *
				 * @event subscribe
				 * @param {string} Ajax Mediator subscription to {@link modules.global.module:Ajax~makeAjaxRequest}.
				 */
				coxjs.subscribe({
					"Ajax" : _module.makeAjaxRequest
				});

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(".ajax-select");
			},
			/**
			 * Listen for AJAX subscriptions and make the AJAX request.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC Ajax.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Publish AJAX request if an .ajax-loader node exists after page is either loaded or AJAX has finished.
				 *
				 * @event ajax-loader-trigger
				 * @param {string} ".ajax-loader" Nodes intended to open AJAX requests.
				 */
				coxjs.select("body").on("ajax-loader-trigger", ".ajax-loader", function(event) {
					// Grab the launcher for this AJAX load.
					var launcher = coxjs.select(this);
					/**
					 * Use the .ajax-loader node to publish an Ajax request for the data at the given URL.
					 *
					 * @event publish
					 * @param {string} Ajax Requests a URL via AJAX.
					 * @param {object} data The configuration for the AJAX request with the following properties:
					 * @property {object} container The DOM element intended to receive AJAX response.
					 * @property {string} url The address to fetch via AJAX.
					 * @property {string} type The HTML form method being used for this request.
					 * @property {string} dataType The type of data being returned.
					 * @property {string} timeout The amount of time, in milliseconds, to wait for a response.
					 * @property {boolean} cache Whether to cache the response or not.
					 * @property {object} throbber Pass to {@link modules.global.module:Ajax} whether and what kind of loading indicator to show.
					 * @property {string} throbber.type The CoxJS event to be published for the throbber.
					 * @property {object} throbber.data The object containing configuration options for the throbber.
					 * @property {object} throbber.data.nodes DOM nodes for the throbber container.
					 */
					coxjs.publish({
						type : "Ajax",
						data : {
							container : coxjs.select(".response", launcher),
							url : launcher.attr("data-ajax-source"),
							type : "GET",
							dataType : "text",
							timeout : "30000",
							cache : false,
							throbber : {
								type : "showThrobber",
								data : {
									nodes : coxjs.select(".response", launcher).closest(".loading-wrapper")
								}
							}
						}
					});
				});
				/**
				 * Trigger "ajax-loader-trigger" if any AJAX response has an .ajax-loader node.
				 *
				 * @event ajaxComplete
				 * @param {string} ".ajax-loader" Nodes intended to open overlays when AJAX completes.
				 */
				coxjs.select(document).ajaxComplete(function(event, ajaxResponse, options) {
					// If we didn't get a .responseJSON back...
					if (!ajaxResponse.responseJSON) {
						// ...grab the ajaxResponse.responseText and...
						var responseText = coxjs.select(ajaxResponse.responseText);

						// ...scan it for .ajax-loader classed node(s).
						if (coxjs.select(".ajax-loader", responseText).length > 0)
							coxjs.select(".ajax-loader").trigger("ajax-loader-trigger");
					}
				});
				/**
				 * Trigger "ajax-loader-trigger" if any .ajax-loader node exists when the DOM is loaded.
				 *
				 * @event load
				 * @param {string} ".ajax-loader" Nodes intended to open overlays when loaded.
				 */
				if (coxjs.select(".ajax-loader").length > 0)
					coxjs.select(".ajax-loader").trigger("ajax-loader-trigger");
				/**
				 * Trigger "xhr-selectors" if any AJAX response has any coxjs.getXHRSelectors nodes.
				 *
				 * @event ajaxComplete
				 * @param {string} "xhr-selectors" Nodes intended to fire when loaded.
				 */
				coxjs.select(document).ajaxComplete(function(event, ajaxResponse, options) {
					if (coxjs.getXHRSelectors().length > 0) {
						// Grab the stored selectors...
						var selectors = coxjs.getXHRSelectors();

						// If we didn't get a .responseJSON back...
						if (!ajaxResponse.responseJSON) {
							// ...grab the ajaxResponse.responseText and...
							var responseText = coxjs.select(ajaxResponse.responseText);

							// ...scan it for each selector.
							coxjs.each(selectors, function(index, selector) {
								if (coxjs.select(selector, responseText).length > 0)
									coxjs.select(selector).trigger("xhr-selectors");
							});
						}
					}
				});
				/**
				 * Grab new page content if an .ajax-select dropdown is changed.
				 *
				 * @event xhr-selectors
				 * @param {string} ".ajax-select" Dropdowns intended to load AJAX content when changed.
				 */
				coxjs.select("body").on("xhr-selectors", ".ajax-select", function(event) {
					// Grab the DOM for this select.
					var select = coxjs.select(this);

					// Check for dropdown selection and handle AJAX.
					select.on("change", function(event) {
						/**
						 * Use dropdown value to load new content via AJAX.
						 *
						 * @event publish
						 * @param {string} Ajax Requests a URL via AJAX.
						 * @param {object} data The configuration for the AJAX request with the following properties:
						 * @property {object} container The DOM element intended to receive AJAX response.
						 * @property {string} url The address to fetch via AJAX.
						 * @property {string} type The HTML form method being used for this request.
						 * @property {string} dataType The type of data being returned.
						 * @property {string} timeout The amount of time, in milliseconds, to wait for a response.
						 * @property {boolean} cache Whether to cache the response or not.
						 */
						coxjs.publish({
							type : "Ajax",
							data : {
								container : select.closest(".ajax-loader").find(".loading-wrapper .response"),
								url : select.closest(".ajax-loader").attr("data-ajax-source") + select.val(),
								type : "GET",
								dataType : "text",
								timeout : "30000",
								cache : false,
								throbber : {
									type : "showThrobber",
									data : {
										nodes : select.closest(".ajax-loader").find(".loading-wrapper")
									}
								}
							}
						});
					});
				});
				/**
				 * Trigger "xhr-selectors" if any .ajax-select node exists when the DOM is loaded.
				 *
				 * @event load
				 * @param {string} ".ajax-select" Dropdowns intended to load AJAX content when changed.
				 */
				if (coxjs.select(".ajax-select").length > 0)
					coxjs.select(".ajax-select").trigger("xhr-selectors");
				/**
				 * Override the page reload submit with an AJAX version.
				 *
				 * @event submit
				 * @param {string} ".ajax-form-submit form" The loaded form.
				 */
				coxjs.select("body").on("submit", ".ajax-form-submit form", function(event) {
					// Stop default form submission.
					coxjs.preventDefault(event);
					/**
					 * Forms with an ".ajax-form-submit" ancestor are submitted by publishing an "Ajax" message to the framework.
					 *
					 * @event publish
					 * @param {string} Ajax Requests a URL via AJAX.
					 * @param {object} data The configuration for the AJAX request with the following properties:
					 * @property {object} container The DOM element intended to receive AJAX response.
					 * @property {string} url The address to fetch via AJAX.
					 * @property {string} type The HTML form method being used for this request.
					 * @property {string} dataType The type of data being returned.
					 * @property {string} timeout The amount of time, in milliseconds, to wait for a response.
					 * @property {boolean} cache Whether to cache the response or not.
					 * @property {string} data A QUERY_STRING'ified version of the forms' inputs.
					 * @property {object} throbber Pass to {@link modules.global.module:Ajax} whether and what kind of loading indicator to show.
					 * @property {string} throbber.type The CoxJS event to be published for the throbber.
					 * @property {object} throbber.data The object containing configuration options for the throbber.
					 * @property {object} throbber.data.nodes DOM nodes for the throbber container.
					 */
					coxjs.publish({
						type : "Ajax",
						data : {
							container : coxjs.select(this).parents(".response"),
							url : this.action,
							type : this.method.toUpperCase(),
							dataType : "text",
							timeout : "30000",
							cache : false,
							data : coxjs.select(this).serialize(),
							throbber : {
								type : "showThrobber",
								data : {
									nodes : coxjs.select(this).parents(".response").closest(".loading-wrapper")
								}
							}
						}
					});
				});
			},
			/**
			 * Makes an AJAX request from a {@link coxfw.coxjs.publish} call.
			 *
			 * @method makeAjaxRequest
			 * @param {object} ajaxRequest The incoming AJAX request object.
			 * @return {xhr} The resulting XMLHttpRequest object, wrapped in library fluffiness.
			 */
			makeAjaxRequest : function(ajaxRequest) {
				// If the incoming request has a throbber configuration, show the throbber.
				if (coxfw.utils.typeEqual(ajaxRequest.throbber, "object"))
					_module.showThrobber(ajaxRequest.throbber);

				// Make the AJAX request.
				return coxjs.ajax({
					type : ajaxRequest.type,
					url : ajaxRequest.url,
					data : ajaxRequest.data,
					dataType : ajaxRequest.dataType,
					context : ajaxRequest.container,
					cache : false,
					success : function(data, text, ajaxResponse) {
						// We're in the success callback, so...
						ajaxResponse.isError = false;

						// We also need to pass around the response container, so anybody listening can access it.
						ajaxResponse.container = this;

						// Assign a test message depending on what type of response we're getting.
						if (ajaxResponse.responseJSON) {
							if (ajaxResponse.responseJSON.status) {
								ajaxResponse.testMessage = ajaxResponse.responseJSON.status.successMessage;
							} else {
								ajaxResponse.testMessage = "AJAX call to '" + ajaxRequest.url + "' returned object '" + ajaxResponse.responseJSON + "'.";
							}
						} else {
							ajaxResponse.testMessage = "AJAX call to '" + ajaxRequest.url + "' returned status '" + ajaxResponse.statusText + "'.";
						}

						// Send the AJAX response back.
						_module.sendAjaxResponseBack(ajaxRequest.id, ajaxResponse);
					},
					error : function(ajaxResponse, status, error) {
						// We're in the error callback, so...
						ajaxResponse.isError = true;

						// We also need to pass around the response container, so anybody listening can access it.
						ajaxResponse.container = this;

						// Assign a test message.
						ajaxResponse.testMessage = ajaxResponse.statusText;

						// Send the AJAX response back.
						_module.sendAjaxResponseBack(ajaxRequest.id, ajaxResponse);
					},
					complete : function(ajaxResponse, status) {
						// If the incoming request has a throbber configuration, hide the throbber.
						if (coxfw.utils.typeEqual(ajaxRequest.throbber, "object")) {
							// Wrapping setTimeout waits long enough to see throbber reset position.
							// setTimeout(function() {
							ajaxRequest.throbber.data.nodes = ajaxRequest.throbber.data.nodes.filter(".loading-wrapper-active");
							_module.hideThrobber(ajaxRequest.throbber);
							// }, 5000);
						}

						// DEV NOTES: If we're IE8, bounce the CSS zoom property so AJAX nodes hasLayout and doesn't get overlapped.
						if (coxjs.select("body.IE8").length > 0) {
							ajaxResponse.container.closest("[class*='colspan-']").css("zoom", "").css("zoom", "1");
						}
					}
				});
			},
			/**
			 * Processes the response from AJAX.  This is a generic method for processing internal AJAX responses.
			 *
			 * @method getAjaxResponse
			 * @param {object} ajaxResponse The AJAX response object.
			 */
			getAjaxResponse : function(ajaxResponse) {
				if (ajaxResponse.isError) {
					coxjs.select(ajaxResponse.container).html("<p class='col-reset'>" + ajaxResponse.statusText + "</p>");
				} else {
					coxjs.select(ajaxResponse.container).html(ajaxResponse.responseText);
				}
			},
			/**
			 * Process the response from AJAX.
			 *
			 * @method sendAjaxResponseBack
			 * @param {string} id The unique identifier for the module that sent the {@link coxfw.coxjs.publish} request.
			 * @param {object} ajaxResponse The AJAX response object.
			 */
			sendAjaxResponseBack : function(id, ajaxResponse) {
				// See if the original ajaxRequest included an id...
				if (coxfw.utils.typeEqual(id, "string")) {
					// ...and send AJAX response to listening module.
					coxjs.publish({
						type : id,
						data : ajaxResponse
					});
				} else {
					// ...or just send AJAX response to generic getAjaxResponse in this _module.
					_module.getAjaxResponse(ajaxResponse);
				}
			},
			/**
			 * Display the waiting indicator.
			 *
			 * @method showThrobber
			 * @param {object} throbber The object containing the throbber settings.
			 */
			showThrobber : function(throbber) {
				throbber.type = "showThrobber";
				coxjs.publish(throbber);
			},
			/**
			 * Remove the waiting indicator.
			 *
			 * @method hideThrobber
			 * @param {object} throbber The object containing the throbber settings.
			 */
			hideThrobber : function(throbber) {
				throbber.type = "hideThrobber";
				coxjs.publish(throbber);
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Nimesh Shroti
 * @version 1.0.0
 * @namespace modules.global
 * @class AlignContainerItems
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.AlignContainerItems', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		var _selector = ".section-container";

		var _containerElementGrp;

		var _timer;

		var defaultButtonMargin = null;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT AlignContainerItems.js");
				
				_module = this;
				// subscribe to realign container items; 
				coxjs.subscribe({
					"RealignContainerItems" : _module.alignContainerItems
				})
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC AlignContainerItems.js");

				// set the module variable to this object
				_module = this;

				// Do not execute in the Adobe author mode as it causes miscalculation issues as the user modifies content on the fly causing the UI to break,
				if ( typeof CQ != "undefined" && typeof CQ.WCM != "undefined") {
					if (CQ.WCM.getMode() == "edit" || CQ.WCM.getMode() == null) {
						return;
					}
				}

				// Execute only for Offer Comparison, Feature Highlight, Best Offer, and Promo Feature components
				if (coxjs.select(".offer-comparison-container").length == 0 && coxjs.select(".feature-highlight").length == 0 && coxjs.select(".best-offer").length == 0 && coxjs.select(".promo-feature-content").length == 0 ) {
					return;
				}

				_containerElementGrp = coxjs.select(_selector);

				coxjs.select("body").on("xhr-selectors init-alignment", _selector, function(event) {
					coxjs.select(window).bind('resize', function() {
						_timer = setTimeout(function() {
							_module.getContainers(_containerElementGrp);
						}, 200);
					});

					// had to add a timer because Safari bug, on page load the position of the buttons was incorrect until the DOM is fully loaded
					// TODO: is this still needed?
					_timer = setTimeout(function() {
						_module.getContainers(_containerElementGrp);
					}, 200);

				});

				if (_containerElementGrp.length > 0) _containerElementGrp.trigger("init-alignment");
			},

			// Get all <div> elements with .section-container class and align buttons in each of that container
			getContainers : function(containers) {
				clearTimeout(_timer);
				coxjs.select(containers).each(function(index, containerElement) {
					_module.alignContainerItems(containerElement);
				});
			},

			// Align all the visible buttons
			alignContainerItems : function(containerElement) {
				var button = ".button:visible, .button-payment:visible, .button-secondary:visible";
				var buttonContainers = ".offer-comparison-container, .feature-highlight, .best-offer, .promo-feature-content";
				
				var buttonContainersGroup = coxjs.select(containerElement).find(buttonContainers);
				if(buttonContainersGroup[0]){
					var buttonsGroup = [];
					for(var i=0;i<buttonContainersGroup.length;i++){
						//Find buttons from all the button groups present
						var alignItemsGroup = coxjs.select(buttonContainersGroup[i]).find(button);
						if (alignItemsGroup[0]) {
							$.merge(buttonsGroup,alignItemsGroup);
							if (defaultButtonMargin == null)
								defaultButtonMargin = parseInt(coxjs.select(alignItemsGroup[0]).css("margin-top"));
							_module.alignHeightOfGroup(buttonsGroup);
						}
					}				
				}				
			},

			alignHeightOfGroup : function(group) {
				var tallest = 0;
				var diff = 0;

				// calculating tallest button from the group
				coxjs.select(group).each(function(i, e) {
					if (coxjs.select(window).width() < 768) {
						coxjs.select(e).css("margin-top", Math.round(defaultButtonMargin) + "px");
					} else {
						coxjs.select(e).removeAttr("style"); //remove margin top set earlier if any, otherwise the margin gets added incrementally creating a large space gap on orientation change/ resize
						var buttonOffset = Math.round(coxjs.select(e).offset().top);

						if (buttonOffset > tallest)
							tallest = buttonOffset;
					}
				});

				if (coxjs.select(window).width() > 767) {
					// Adjusting other buttons to match the height of <div> with tallest button's <div>
					coxjs.select(group).each(function(i, e) {
						var buttonOffset = Math.round(coxjs.select(e).offset().top);
						var existingMargin = parseInt(coxjs.select(e).css("margin-top"));
						if (buttonOffset < tallest) {
							diff = Math.round(tallest - buttonOffset) + existingMargin;
							diff = Math.round(diff);
							
							// prevent crazy top margins when the content is not authored properly
							if (diff > 600) diff = 0; // 600 is random...might still be too high
							
							// set the top margin
							coxjs.select(e).css("margin-top", diff + "px");
						}
					});
				}
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Nimesh Shroti
 * @version 1.0.0
 * @namespace modules.global
 * @class AnchorLinks
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.AnchorLinks', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The element clicked to trigger the anchor bar.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * Stores a copy of the anchorBar node to apply inside methods.
		 *
		 * @member {object} _anchorBarSticky
		 */
		var _anchorBarSticky;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT AnchorLinks.js");
				_module = this;
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC AnchorLinks.js");
				// Return if we don't have any anchor links on the page.
				if (coxjs.select(".anchor-links-bar").length < 1)
					return;
				// set the module variable to this object
				_module = this;
				_anchorBarSticky = coxjs.select(".anchor-sticky");
				//determine event type based on device
				var eventType = coxjs.select("body").data('os') == "ios" ? "touchstart" : "click";
				
				coxjs.select("body").on(eventType, ".link-selection", function(e) {
					// Assign _trigger.
					_trigger = coxjs.select(".link-selection");
					
					//to show link dropdown for mobile
					_module.showHideDropdown();
					e.stopPropagation();
				});

				/**
				 * Close the dropdown when user clicks the html node.
				 *
				 * @event click, touchstart
				 * @param {string} "html" The main HTML node.
				 */
				coxjs.select("html").on(eventType, function(event) {
					//Only for mobile
					if (coxjs.select(window).width() < 768) {
						//check if active class is present i.e. dropdown is open, then remove.
						if (_trigger.find("span").hasClass("active")) {
							_trigger.find("span").removeClass("active");
							_trigger.find(".anchor-link-content").removeClass("selected");
						}
						// call function to highlight active blocks and change the dropdown text
						_module.highlightActiveBlocks();
					}
				});
				
				coxjs.select("body").on(eventType, ".anchor-links-bar .anchor-link-content a", function(e) {
					if (coxjs.select(window).width() < 768) {
						//set drop down text to selected block
						var setAnchorText = coxjs.select(this).text();
						_module.changeDropdownText(setAnchorText);
					} else {
						_trigger = coxjs.select(".link-selection");
						//when user selects an option from the desktop
						_trigger.find('.anchor-link-content div').removeClass("active");
						coxjs.select(this).closest('div').parent().addClass("active");
					}
					// Webkit browsers use 'body' and others use 'html'  
					var animateNode = coxjs.select("body").is(".CH, .SF") ? "body" : "html";
					var stickyHeaderHeight = _anchorBarSticky.height();
					// At initial page load the sticky header height has to subtracted twice  
					if(coxjs.select(".anchor-sticky.active").length == 0){
						stickyHeaderHeight = stickyHeaderHeight + _anchorBarSticky.height() + parseInt(_anchorBarSticky.css("padding-top")) ;
					}
					// code to offset clicked section to account for sticky anchor bar + 30px spacing
					var setScrollTop = coxjs.select(coxjs.select(this).attr('href')).offset().top - stickyHeaderHeight - 30;
					coxjs.select(animateNode).scrollTop(setScrollTop);	
				});
				
				//on scroll - highlight the anchor block
				coxjs.select(window).on("scroll touchmove", function(e) {
					// in case "anchor-sticky" class is not present, then return
					if (coxjs.select(".anchor-sticky").length < 1)
						return;
					_trigger = coxjs.select(".link-selection");

					var viewportOffset = _module.getViewportOffset(_anchorBarSticky);

					// to add sticky effect i.e. position fixed and set bar at the top
					if (this.scrollTop > viewportOffset.top) {
						_anchorBarSticky.addClass("active");
					} else {
						_anchorBarSticky.removeClass("active");
						coxjs.select(".anchor-link-content > div").removeClass("active");
						_trigger.find(".link-heading").text("Navigate to:");
						_trigger.find(".link-heading").removeClass("selected");
					}
					// call function to highlight active blocks
					_module.highlightActiveBlocks();
				});
			},

			// this function show/hides the dropdown.
			showHideDropdown : function() {
				//only applicable for mobile
				if (coxjs.select(window).width() > 767)
					return;
				//on dropdown click, selected text to be replaced with default text
				_trigger.find(".link-heading").text("Navigate to:");
				_trigger.find(".link-heading").removeClass("selected");

				//check if active class is present i.e. dropdown is open, then remove.
				if (_trigger.find("span").hasClass("active")) {
					_trigger.find("span").removeClass("active");
					_trigger.find(".anchor-link-content").removeClass("selected");
				} else {
					_trigger.find(".anchor-link-content").addClass("selected");
					_trigger.find("span").addClass("active");
				}
			},

			// this function highlights active blocks
			highlightActiveBlocks : function() {
				var scrolled = coxjs.select(window).scrollTop();
				// loop through each anchor tag and highlight the blocks
				coxjs.select(".link-selection a").each(function(index, anchorElement) {
					var currLink = coxjs.select(this);
					// reference element is the closest parent DIV having class 'section-container'
					var refElement = coxjs.select(currLink.attr("href")).closest(".section-container");
					// Toggle active class such that there is 30px spacing between sticky bar and the target container
					if ((refElement.offset().top - _anchorBarSticky.height() - 35 <= scrolled) && (refElement.offset().top - _anchorBarSticky.height() - 35 + refElement.height() > scrolled)) {
						coxjs.select(".anchor-link-content > div").removeClass("active");
						coxjs.select(this).closest('div').parent().addClass("active");
						//set drop down text to selected block
						var setAnchorText = this.innerHTML;
						_module.changeDropdownText(setAnchorText);
					} else {
						//to set mobile dropdown text to default when user passes last block
						if (refElement.offset().top - _anchorBarSticky.height() - 35 + refElement.height() < scrolled) {
							_trigger.find(".link-heading").text("Navigate to:");
							_trigger.find(".link-heading").removeClass("selected");
						}
						coxjs.select(this).closest('div').parent().removeClass("active");
					}
				});
			},

			// this function changes dropdown text when user scrolls through the page.
			changeDropdownText : function(setAnchorText) {

				coxjs.select(".link-heading").html(setAnchorText);
				coxjs.select(".link-heading").addClass("selected");
				coxjs.select(".anchor-link-content").removeClass("selected");
				coxjs.select(".link-selection span").removeClass("active");
			},

			//get view port position for the passed element
			getViewportOffset : function(barPosition) {
				var windowPosition = coxjs.select(window);
				scrollTop = windowPosition.scrollTop();
				offset = barPosition.offset();

				return {
					top : offset.top - scrollTop
				};
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw); /**
 * @author Robert Sekman, Kyle Patterson, Scott Thompson, Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.global
 * @class Base64
 *
 * Base64 encode / decode
 * http://www.webtoolkit.info
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.global.Base64", function(coxjs) {

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		/**
		 * Stores a string to be used inside methods.
		 *
		 * @property _keyStr
		 *
		 */
		var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT Base64.js");
				// Store a copy of module context.
				_module = this;

				// Subscribe to base64 requests.
				coxjs.subscribe({
					"Base64" : _module.makeBase64Request
				});
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC Base64.js");
				// Store a copy of module context.
				_module = this;
			},
			/**
			 * Makes the various Base64 requests
			 *
			 * @method makeBase64Request
			 * @param {object}
			 */
			makeBase64Request : function(base64Request) {
console.log("     Base64.makeBase64Request");
				var value;
				switch(base64Request.type) {
					case "encode":
					value = _module.encode(base64Request.data);
					break;

					case "decode":
					value = _module.decode(base64Request.data);
					break;

					case "utf8_encode":
					value = _module._utf8_encode(base64Request.data);
					break;

					case "utf8_decode":
					value = _module._utf8_decode(base64Request.data);
					break;
				}
				_module.sendBase64Response(base64Request.id, value,base64Request.context);
			},

			//encoding
			encode : function(input) {
				var output = "";
				var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
				var i = 0;

				input = _module._utf8_encode(input);

				while (i < input.length) {

					chr1 = input.charCodeAt(i++);
					chr2 = input.charCodeAt(i++);
					chr3 = input.charCodeAt(i++);

					enc1 = chr1 >> 2;
					enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
					enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
					enc4 = chr3 & 63;

					if (isNaN(chr2)) {
						enc3 = enc4 = 64;
					} else if (isNaN(chr3)) {
						enc4 = 64;
					}

					output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

				}
				return output;
			},

			//decoding
			decode : function(input) {
				var output = "";
				var chr1, chr2, chr3;
				var enc1, enc2, enc3, enc4;
				var i = 0;

				input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

				while (i < input.length) {

					enc1 = _keyStr.indexOf(input.charAt(i++));
					enc2 = _keyStr.indexOf(input.charAt(i++));
					enc3 = _keyStr.indexOf(input.charAt(i++));
					enc4 = _keyStr.indexOf(input.charAt(i++));

					chr1 = (enc1 << 2) | (enc2 >> 4);
					chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
					chr3 = ((enc3 & 3) << 6) | enc4;

					output = output + String.fromCharCode(chr1);

					if (enc3 != 64) {
						output = output + String.fromCharCode(chr2);
					}
					if (enc4 != 64) {
						output = output + String.fromCharCode(chr3);
					}

				}

				output = _module._utf8_decode(output);

				return output;

			},

			//UTF-8 encoding
			_utf8_encode : function(string) {
				string = string.replace(/\r\n/g, "\n");
				var utftext = "";

				for (var n = 0; n < string.length; n++) {

					var c = string.charCodeAt(n);

					if (c < 128) {
						utftext += String.fromCharCode(c);
					} else if ((c > 127) && (c < 2048)) {
						utftext += String.fromCharCode((c >> 6) | 192);
						utftext += String.fromCharCode((c & 63) | 128);
					} else {
						utftext += String.fromCharCode((c >> 12) | 224);
						utftext += String.fromCharCode(((c >> 6) & 63) | 128);
						utftext += String.fromCharCode((c & 63) | 128);
					}

				}

				return utftext;
			},

			//UTF-8 decoding
			_utf8_decode : function(utftext) {
				var string = "";
				var i = 0;
				var c = c1 = c2 = 0;

				while (i < utftext.length) {

					c = utftext.charCodeAt(i);

					if (c < 128) {
						string += String.fromCharCode(c);
						i++;
					} else if ((c > 191) && (c < 224)) {
						c2 = utftext.charCodeAt(i + 1);
						string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
						i += 2;
					} else {
						c2 = utftext.charCodeAt(i + 1);
						c3 = utftext.charCodeAt(i + 2);
						string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
						i += 3;
					}

				}

				return string;
			},

			// publish Base64responsevalue
			sendBase64Response : function(id, value, target) {
				coxjs.publish({
					type : id,
					data : {
						value: value,
						context: target
					}
				});

			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.global
 * @class CarouselRotator
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.CarouselRotator', function(coxjs) {
		/**
		 * Stores a copy of the flexsider object from jquery library
		 *
		 * @property _carousel
		 * @type object
		 */
		var _carousel;
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
			},
			/**
			 * Sets the local module object and sets the private flexslider variable
			 *
			 * @method execute
			 */
			execute : function() {
				// set the module variable to this object
				_module = this;

				// set the flexslider variable to the slider object in the DOM
				_carousel = coxjs.select(".carousel-container");

				// Leave if we don't have any .carousel-container's on the page.
				if (_carousel.length < 1) return; 

				// Now we can step through all the .carousel-container's on the page.
				_carousel.each(function(carouselIndex, carousel) {
					var carousel = coxjs.select(carousel);
					var slideshow = false;
					if (carousel.data("slideshow")) {
						slideshow = (carousel.data("slideshow") == true) ? true : false;
					}
					// custom navigation controls
					var manualControls = (carousel.data("manualControls") == true) ? ".flexslider-controls li" : "";
					
					carousel.flexslider({
						animation: "fade", // we need fade because slide clones the slides and creates 2 extra mboxes per page load which costs us money
						manualControls: manualControls,
						slideshow: slideshow,
						slideshowSpeed: parseInt(carousel.data("slideshowSpeed")),
						animationSpeed: 700,
						pauseOnAction: false,
						pauseOnHover: true,
						useCSS: false,
						directionNav: false
					});
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Prakhar Gupta
 * @version 0.1.0.0
 * @namespace modules.global
 * @class checkBox
 *
 */
(function(coxfw) {
	coxfw.core.define('modules.global.CheckBox', function(coxjs) {
		
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".checkbox-block";
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				_module = this;

				/**
				 * handle the body on load if theres an active checked btn
				 * @event xhr-selectors init-checkbox-block
				 * @param {string} _selector
				 * @param {selector} "body" The parent container to listen within
				*/
				
				coxjs.select("body").on("xhr-selectors init-checkbox-block", _selector, function(event) {
					
					var checkBtns = coxjs.select(this).find('input[type="checkbox"]');
					
					coxjs.select(checkBtns).focus(function(e) {
						
						var checkBox = coxjs.select(this).parent();
						
						coxjs.select(checkBox).addClass("focused-check");
					
					});

					/**
					 * @event blur
					 * @param {object} checkBtns
					 */
					coxjs.select(checkBtns).blur(function(e) {
						
						var checkBox = coxjs.select(this).parent();
						
						coxjs.select(checkBox).removeClass("focused-check");
					
					});
					
					
				});

				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("init-checkbox-block");
				
				/**
				 * handle when user clicks the check btn
				 * @event click
				 * @param {selector} "body" The parent container to listen within
				 * @param {string} ".check-boxes"
				 * */
				coxjs.select("body").on("click", ".check-boxes", function(event) {
					// handle the selected check box and set hidden check btn value with check box value
					_module.handlecheckBtnSelection(this);
				});
			},
			
			/**
			 * @method handlecheckBtnSelection
			 * @object selectedcheckBox
			 * */
			handlecheckBtnSelection : function(selectedcheckBox) {
				
						// add active class
						var selectedcheckboxValue = coxjs.select(selectedcheckBox);
						selectedcheckboxValue.toggleClass("active-check");
						// set the current  check btn to checked = true
						var selectedcheckBtn = selectedcheckboxValue.find('input[type="checkbox"]')[0];
						var selectcheckBtnValue = coxjs.select(selectedcheckBtn);
						
						if(selectedcheckboxValue.hasClass("active-check")){
							
							selectcheckBtnValue.prop('checked', 'checked');
							selectcheckBtnValue.attr("checked", "checked");

						}
						else{
							
							selectcheckBtnValue.removeAttr('checked');
						}
			
						/**
						 * publish when checkbox is selected
						 * @event publish
						 * */
						coxjs.publish({
							type:"checkBoxActionComplete",
							data : {
							}
							
						});
			},
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.global
 * @class CustomValidation
 *
 * This module contains all the customization that needs to be done to display
 * error messages in a certain way. 
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.global.CustomValidation", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		var _timer;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT CustomValidation.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Subscribe to custom validation requests.
				coxjs.subscribe({
					"CustomizeValidation" : _module.customizeOptions
				});

			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				 //console.log("EXEC CustomValidation.js");
				// For IE8 place holder issue
				 var reqFunc = $.validator.methods['required'];
				 
				 $.validator.methods['required'] = function() {
				      var el = $(arguments[1]);
				      if (el.is('[placeholder]') && arguments[0] == el.attr('placeholder')) {
				          arguments[0] = '';
				      }
				      return reqFunc.apply(this, arguments);
				  };

			},

			customizeOptions : function(dataObj) {
				// get the current form 
				currentForm = coxjs.select(dataObj.formObj);
				//set form validate options
				currentForm.validate({
					onfocusin : false,
					onfocusout : false,
					onkeyup : false,
					onclick : false,
					errorClass : "error",
					errorHighlightClass : "errorMsg",
					verticalGroupClass : "vertical-group-element",
					validClass : "valid",
					errorMessageContainerClass : "error-wrapper bubble-pointer mbubble-pointer",
					errorElement : "div",
					ignore : ".ignore-validation",

					groups : {
						services : "services",
						checkservices : "check-services"
						// Example below for grouping of error messages; Key - arbitrary; Value - Space seperated 'name' attribute of fields to be grouped
						/* groupvalidation1 : "group1-element1 group1-element2" */
					},

					invalidHandler : function(event, validator) {
						/* set zoom:1 on form so that if any dynamic element gets loaded, form gets resized properly */
						coxjs.select(validator.currentForm).css("zoom", "1");
						var loadingElement = coxjs.select(validator.currentForm).find(".loading-wrapper-active");
						//Clear timer set by setTimeout method so it does not re-execute after delay
						if (!(coxjs.typeEqual(window.buttonThrobberTimer, "undefined"))) {
							clearTimeout(window.buttonThrobberTimer);
						}
						coxjs.publish({
							type : "hideThrobber",
							data : {
								nodes : loadingElement
							}
						});
					},

					showErrors : function(errorMap, errorList) {
						var i, elements, error;
						for ( i = 0; this.errorList[i]; i++) {
							error = this.errorList[i];
							var msgPrefix = error.element.tagName == 'SELECT' ? 'A selection is' : 'This field is';
							// Custom error messages
							switch(error.method) {
								case "required" :
									error.message = error.element.type != "checkbox" ? msgPrefix + " required." : "You must check at least one option to continue.";
									break;

								case "equalTo" :
									error.message = "Confirm value does not match actual value.";
									break;

								case "date" :
									error.message = "Please use the mm/dd/yyyy format.";
									break;
							
								case "max" :
									error.message.replace('value', 'number');
									break;

								case "min" :
									error.message.replace('value', 'number');
									break;
							}

							var errorItemDiv = coxjs.select(error.element).parent();							
							coxjs.select(errorItemDiv).prev().addClass(this.settings.errorHighlightClass);
							
							//add error class to label used to mask password field in IE8
							var testInput = document.createElement("input");
							if (!("placeholder" in testInput)) {
								if (coxjs.select(error.element).hasClass("create-placeholder")) {
									coxjs.select(error.element).prev().addClass("error");
								}
							}
							if (this.settings.highlight) {
								this.settings.highlight.call(this, error.element, this.settings.errorClass, this.settings.validClass);
							}
							error.message = "<p>" + error.message + "</p>";
							this.showLabel(error.element, error.message);
						}
						// Error display modification for accordion in form
						if (this.errorList.length && coxjs.select("form.accordion").length > 0) {
							this.toShow = this.toShow.add(this.containers);
							var errorHeaderElement = coxjs.select(".error-header", ("form.accordion"));
							if (coxjs.select(errorHeaderElement).length > 0) {
								for (var i = 0; i < errorHeaderElement.length; i++) {
									if (coxjs.select(errorHeaderElement[i]).parent(".accordion-panel").find(".error").length > 0) {
										coxjs.select(errorHeaderElement[i]).html("<p>Please correct the items marked below to continue.</p>");
										coxjs.select(errorHeaderElement)[i].style.display = "block";
										coxjs.select(errorHeaderElement[i]).parent(".accordion-panel").addClass("accordion-panel-open").removeClass("accordion-panel-disabled");
										coxjs.select(errorHeaderElement[i]).parent(".accordion-panel").prev().addClass("accordion-trigger-open").removeClass("accordion-trigger-disabled");
									}
								}
							}
						} else if (this.errorList.length) {
							this.toShow = this.toShow.add(this.containers);
							var errorHeaderElement = coxjs.select(".error-header", this.currentForm);
							if (coxjs.select(errorHeaderElement).length) {
								coxjs.select(errorHeaderElement).html("<p>Please correct the items marked below to continue.</p>");
								coxjs.select(errorHeaderElement)[0].style.display = "block";
							}
						} else {
							//console.log("___SMT___| so, yeah, we have headers: ", coxjs.select(".error-header", this.currentForm));
							coxjs.select(".error-header", this.currentForm).hide();
						}
						if (this.settings.unhighlight) {
							for ( i = 0, elements = this.validElements(); elements[i]; i++) {
								var errorItemDiv = coxjs.select(elements[i]).parent();
								if (coxjs.select(errorItemDiv).hasClass(this.settings.verticalGroupClass)) {
									coxjs.select(errorItemDiv).prev().find(".error-wrapper").css("display", "none");
								} else {
									coxjs.select(elements[i]).siblings(".error-wrapper").css("display", "none");
								}
								coxjs.select(errorItemDiv).prev().removeClass(this.settings.errorHighlightClass);									
								this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, this.settings.validClass);
							}
						}
						this.toHide = this.toHide.not( this.toShow );
						this.hideErrors();
						this.addWrapper( this.toShow ).show();
					},
					
					// custom error placement
					errorPlacement : function(error, element) {
						errorPlacementDiv = coxjs.select(element).parents().eq(0);
						if (coxjs.select(errorPlacementDiv).hasClass(this.verticalGroupClass)) {
							coxjs.select(errorPlacementDiv).prev().append(error);
						} else if(coxjs.select(errorPlacementDiv).hasClass('group-choice')){
							coxjs.select(errorPlacementDiv).parent().append(error);
							coxjs.select(error).css("display", "inline-block");
						} else {
							coxjs.select(errorPlacementDiv).append(error);
							coxjs.select(error).css("display", "inline-block");
						}
					}
				});
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Generates in-page calendar display when clicking a text field intended to pass a date.
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.global.DatePicker
 */
(function(coxfw) {
	coxfw.core.define('modules.global.DatePicker', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = "input.date-picker";
		/**
		 * Stores a boolean value corresponding to launch device layout
		 *
		 * @property _hasDualLayout
		 * @type boolean
		 */
		var _hasDualLayout;

		return {
			/**
			 * Begin listening for coxjs.publish() events to "DatePicker".
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT DatePicker.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);

				/**
				 * Display the calendar to allow picking a date.
				 *
				 * @event subscribe
				 * @param {string} demoChange What changes the dropdown and tab content.
				 */
				coxjs.subscribe({
					"DatePicker" : _module.displayDatePicker
				});

				/**
				 * @event load
				 *
				 * Check if launched device has dual layout
				 *
				 */
				//check if the launching device has different layout in each orientation
				//Trying to target 'Nexus7' and 'Samsung Galaxy Tab' which behave as mobile in 'portrait' and desktop in 'landscape'
				if (window.matchMedia) {
					_hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600;
				}
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC DatePicker.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Apply the DatePicker when there is a date-picker input in-page or AJAX.
				 *
				 * @event xhr-selectors,date-picker
				 * @param {selector} _selector The text input for the date.
				 */
				coxjs.select("body").on("xhr-selectors date-picker", _selector, function(event) {
					/**
					 * Publish DatePicker call.
					 *
					 * @event publish
					 * @param {string} DatePicker The event used to show/hide calendar for picking a date.
					 */
					coxjs.publish({
						type : "DatePicker",
						data : this
					});
				});
				/**
				 * Trigger "date-picker" if `_selector` exists when the DOM is loaded.
				 *
				 * @event date-picker
				 * @param {selector} _selector Nodes intended to open overlays when loaded.
				 */
				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("date-picker");
			},
			/**
			 * Display the calendar and handle passing date back to input.
			 *
			 * @method displayDatepicker
			 * @param {object} dp The datepicker object.
			 */
			displayDatePicker : function(dp) {
				// set the styles for the days object
				var dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
				this.monthsAhead = 60; // 5 years --

				// create maximum days for the month
				var maxDays = (this.monthsAhead + 1 ) * 31;

				// get current day from date picker object
				dp.today = new Date();

				var todaysDate = new Date(dp.today.getFullYear(), dp.today.getMonth(), dp.today.getDate());

				// Variables dpTodayPlusDays, dpDaysToDueDate, dpPlusDays & disableWeekends set in HTML file that uses the Date Picker.
				// If not set, Due Date & Plus Date will occur after the allowed number of displayed months (currently 3), so will not be seen.
				/* Example : set the below variables in HTML within <script>
				 * var dpTodayPlusDays = 2;
				 * var dpDaysToDueDate = 30;
				 * var dpPlusDays = 5;
				 * var dpdisableDays = [0, 6];     //disables Sunday and Saturday
				 * var dpdisableDates = ["19-4-2015", "14-4-2015"];   //disables the array of dates which are passed in HTML
				 */
				todayPlusDays = ( typeof dpTodayPlusDays != "undefined" ) ? dpTodayPlusDays : 0;
				daysToDueDate = ( typeof dpDaysToDueDate != "undefined" ) ? dpDaysToDueDate : maxDays;
				plusDays = ( typeof dpPlusDays != "undefined" ) ? dpPlusDays : maxDays;
				//disables the days passed in HTML variable "dpdisableDays" which is an Array [0, 1, 2..6],  where 0=SUN, 1=MON, 2=TUE.....6=SAT
				disableDays = ( typeof dpdisableDays != "undefined" ) ? dpdisableDays : null;
				//disables the dates passed in HTML
				//disableDates = ( typeof dpdisableDates != "undefined" ) ? dpdisableDates : null;

				dueDate = new Date(todaysDate.setDate(todaysDate.getDate() + daysToDueDate));
				endDate = new Date(todaysDate.setDate(todaysDate.getDate() + plusDays));

				// get the current date object
				var currentDate = new Date();
				dp.nowDay = (currentDate.getDate() + todayPlusDays);
				var today = new Date(dp.today.getFullYear(), dp.today.getMonth(), dp.nowDay);

				//For Storefront, to remove the conflict of datepicker with richfaces
				if (coxjs.select(dp).hasClass("ecomm-date")) {
					$.noConflict(true);
				}

				//custom date function
				function renderCalendarCallback(date) {
					//highlight due date (used for ibill)
					if (daysToDueDate == 0) {
						return [true, ''];
					}
					if (date - dueDate == 0) {
						return [true, 'ui-datepicker-due-date'];
					}
					return [true, ''];
				}

				//array of dates to disable
				var disableDates = ["9-5-2015", "14-5-2015", "15-5-2015", "5-5-2015", "30-4-2015", "11-5-2015"];

				function randomlyDateCallback(date) {
					//disables the days passed in html variable "dpdisableDays"
					if (disableDays != null && disableDays.length > 0) {
						var day = date.getDay();
						if ($.inArray(day, disableDays) != -1) {
							return [false, ""];
						} else {
							return [true, ""];
						}
					}
					//enables the only dates passed in HTML variable "dpEnableDates"
					if (!coxjs.typeEqual(window.dpEnableDates, "undefined")) {
						return randomlyEnableDateCallback(date);
					} else if (daysToDueDate != maxDays) {
						return renderCalendarCallback(date);
					}
					return randomlyDisableDateCallback(date);
				}

				//enables only those date received from html.
				function randomlyEnableDateCallback(date) {
					var dateMonthYear = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
					if (coxjs.inArray(dateMonthYear, window.dpEnableDates) >= 0) {
						return [true];
					} else {
						return [false];
					}
				}

				//disables the dates received from html
				function randomlyDisableDateCallback(date) {
					if (disableDates != null && disableDates.length > 0) {
						var dateMonthYear = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
						if (coxjs.inArray(dateMonthYear, disableDates) < 0) {
							return [true, ""];
						} else {
							return [false, ""];
						}
					}
				}

				// create jquery datepicker object and pass properties to it for custom styling
				coxjs.select(dp).datepicker({
					numberOfMonths : 1,
					dayNamesMin : dayNames,
					maxDate : endDate,
					beforeShowDay : randomlyDateCallback,
					showOtherMonths : true,
					minDate : today,
					onClose : function() {
						//modifying attributes of pick time fields, before closing of pick date overlay. This applies for mobile version on pro install page
						if (coxjs.select(".pro-date").length > 0 || coxjs.select(".mpro-date").length > 0) {
							coxjs.publish({
								type : "DatePickerModifier"
							});
						}
						//prevent closing of date modal on selection of date. This is applied to datepicker opens on modal instead of overlay.
						if (coxjs.select(".datepicker-modal-component").attr('style') != undefined) {
							coxjs.select(this).data('datepicker').inline = false;
						}
						
						//fixes for incorrect hide/show of calendar div
						if(coxjs.select(window).width() < 768) {
							// fix to show the calendar div when clicked from inside the 'datepicker-modal-component' wrapper
							// Bug Fix #47035
							if (event.target.closest(".datepicker-modal-component") != null) {		
									//delay is needed as this has to execute after default jquery hide functionality						
									window.setTimeout(function() {
										coxjs.select("#ui-datepicker-div").css({
											"display" : "block"
										});
									}, 400);								
							} else {
								// fix to close the datepicker-modal-component wrapper when datepicker calendar div is closed
								coxjs.select(".datepicker-modal-component").css({
									"display" : "none"
								});
							}							
						}
					},
					onSelect : function(selectedDate, inst) {
						var dpId = this.id; //get the current element id

						//sets the days name in calender
						coxjs.select(dpId).datepicker('option', 'dayNamesMin');

						//get the input elements id of start date and end date
						var dpStartId = dpId.match(/(.*?)-start/);
						var dpEndId = dpId.match(/(.*?)-end/);

						if (dpEndId) {
							var dpStart = coxjs.select("#" + dpEndId[1] + "-start");
							var startDate = dpStart.val();
							var dpStartDate = Date.parse(dpStart[0].value);
							// TODO: Investigate using coxjs.select().datepicker instead of bare jQuery `$` version.
							var todayDate = $.datepicker.formatDate('mm/dd/yy', new Date(dp.today));
							if (isNaN(dpStartDate) == false) {
								//If we're selecting end date, set start date as the start date of calender
								coxjs.select("#" + dpEndId[1] + "-end").datepicker("option", "minDate", startDate);
							} else {
								//If we're selecting end date, then set today as the start date.
								coxjs.select("#" + dpEndId[1] + "-end").datepicker("option", "minDate", todayDate);
							}
						}

						// get the start date and configure end date after start date
						if (dpStartId && dpEndId) {
							var dpEnd = coxjs.select("#" + dpStartId[1] + "-end");
							var dpEndDate = Date.parse(dpEnd[0].value);
							var dpStart = coxjs.select("#" + dpStartId[1] + "-start");
							var dpStartDate = Date.parse(dpStart[0].value);
							var newEndDate;

							//If we're selecting start date, push end date back by the same number of days
							if (isNaN(dpEndDate)) {
								newEndDate = selectedDate;
							} else if (new Date(selectedDate) > new Date(dpEndDate)) {
								newEndDate = selectedDate;
								if (!isNaN(dpStartDate)) {
									var newEndDate = new Date(newEndDate);
									newEndDate.setDate(newEndDate.getDate() + Math.abs((dpEndDate - Date.parse(dpStart[0].value)) / (1000 * 60 * 60 * 24)));
								}
							} else {
								newEndDate = new Date(dpEndDate);
							}
							if (!isNaN(dpStartDate)) {
								// TODO: Investigate using coxjs.select().datepicker instead of bare jQuery `$` version.
								dpEnd[0].value = $.datepicker.formatDate('mm/dd/yy', new Date(newEndDate));
							}
						}
						// Prevent closing of date modal on selection of any date. This is applied to datepicker opens on modal instead of overlay.
						if (coxjs.select(".datepicker-modal-component").attr('style') != undefined) {
							coxjs.select(this).data('datepicker').inline = true;
							if (window.matchMedia) {
								if (_hasDualLayout && window.matchMedia("(orientation : landscape)").matches) {
									coxjs.select(this).data('datepicker').inline = false;
								}
							}
						}

						coxjs.publish({
							type : "DatePickerSelect",
							data : this
						});
					},

					// If we're selecting end date before start date, set today as a start date
					beforeShow : function(input, inst) {
						var dpId = this.id;
						var dpEndId = dpId.match(/(.*?)-end/);
						if (dpEndId) {
							var dpStart = coxjs.select("#" + dpEndId[1] + "-start");
							var startDate = dpStart.val();
							var dpStartDate = Date.parse(dpStart[0].value);
							// TODO: Investigate using coxjs.select().datepicker instead of bare jQuery `$` version.
							var todayDate = $.datepicker.formatDate('mm/dd/yy', new Date(dp.today));
							if (isNaN(dpStartDate) == false) {
								coxjs.select("#" + dpEndId[1] + "-end").datepicker("option", "minDate", startDate);
							} else {
								coxjs.select("#" + dpEndId[1] + "-end").datepicker("option", "minDate", todayDate);
							}
						}
						// Modifying the positioning of datepicker overlay.
						var offset = coxjs.select("#" + dpId).offset();
						var height = coxjs.select("#" + dpId).height();
						var width = coxjs.select("#" + dpId).width();
						window.setTimeout(function() {
							coxjs.select(inst.dpDiv).css({
								top : (offset.top + height - 185) + 'px',
								left : (offset.left + width + 50) + 'px'
							});
						}, 1);

						if (coxjs.select(".pro-date").length > 0 || coxjs.select(".mpro-date").length > 0) {
							coxjs.publish({
								type : "DatePickerModifier"
							});
						}

						coxjs.publish({
							type : "MobileDatePickerModal"
						});
					}
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.global
 * @class FocusManager
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.FocusManager', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The list of focusable items in a given container 
		 * 
		 *
		 * @property _focusableItems
		 * @type object
		 */
		var _focusableItems;
		

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// console.log("INIT FocusManager.js");
				// set the module variable to this object
				_module = this;		
				
				// Subscribe to managing tab requests.
				coxjs.subscribe({
					"FocusManager" : _module.manageFocusableItems
				});
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC FocusManager.js");						
			},		
			
			//Manage Focusable Items
			manageFocusableItems : function(data) {		
				var focusableElementsString = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";
				var childElements = coxjs.select(data.container).find('*'); //get all the elements in the container
				_focusableItems = childElements.filter(focusableElementsString).filter(':visible');	//filter the focusable items			
				var focusedItem = coxjs.select(document.activeElement);	//get the focused item, usually the first input 							
				var numberOfFocusableItems = _focusableItems.length;
				var focusedItemIndex = _focusableItems.index(focusedItem);
				// trap the focus within the container
				if (data.event.keyCode == 9) {
					if (data.event.shiftKey) {
						//back tab
						// if focused on first item and user presses back-tab, go to the last focusable item
						if (focusedItemIndex == 0) {
							_focusableItems.get(numberOfFocusableItems - 1).focus();
							data.event.preventDefault();
						}

					} else {
						//forward tab						
						// if focused on the last item and user presses tab, go to the first focusable item						
						if (focusedItemIndex == numberOfFocusableItems - 1) {
							_focusableItems.get(0).focus();	
							data.event.preventDefault();										
						}					
					}
				}
				
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.global
 * @class FormValidation
 *
 *
 *|
 */
(function(coxfw) {

	coxfw.core.define('modules.global.FormValidation', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */		
		var _module;		
		/**
		 * Stores the delay timer count to be set after which hideThrobber needs to be executed.
		 * Set to default of 30000ms which is the timeout of browsers
		 *
		 * @property _delay		 
		 *  
		 */			
		var _delay = 30000;
		/**
		 * timeout variable used to clear the timeout 
		 *
		 * @property _timerId		 
		 *  
		 */			
		var _timerId;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT FormValidation.js");
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors("form");
			},
			/**
			 * Select the form and use default jquery validation
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC FormValidation.js");
				_module = this;
				/**
				 * @event xhr-selectors,form-validation
				 *
				 * Attach validation to any form.
				 *
				 * @param {selector} "form" Nodes intended to receive validation
				 */
				coxjs.select("body").on("xhr-selectors form-validation", "form", function(event) {
					//get the form object
					var formObj = coxjs.select(this);
					// publish call to customize validate options
					coxjs.publish ({
						type : "CustomizeValidation",
						data : {
							formObj : formObj
						}
					});
				});
				
				/**
				 * @event click
				 *
				 * Show throbber whenever a form is submitted
				 *
				 * @param {selector} input having type as submit
				 */
				coxjs.select("body").on("click", "input[type='submit']", function(event) {
					/* Prevent 'form' from getting submitted if called from header*/
					if (coxjs.select(this).parents(".pf-header-wrapper").length > 0) {
						return;
					}
					if (enableButtonThrobber != false) {
						var loadingElement = coxjs.select(this);
						_module.loadThrobber(loadingElement, event);	
						
					}
															
				});
				/**
				 * @event load
				 *
				 * Trigger "form-validation" if any form exists when the DOM is loaded.
				 *
				 * @param {selector} "form" Nodes intended to open overlays when loaded
				 */
				if (coxjs.select("form").length > 0) coxjs.select("form").trigger("form-validation");
				
				/**
				 * @event load
				 *
				 * Check for script variable 'enableButtonThrobber', set to 'true' if undefined
				 *  
				 */
				if(coxjs.typeEqual(window.enableButtonThrobber, "undefined")){
					enableButtonThrobber = true;
				}
			},
			
			// load throbber to control the throbber display functionality on form submit
			loadThrobber : function(throbberNode, event) {
				//prevent 'form' from submitting again if throbber is active
				if (throbberNode.hasClass("loading-wrapper-active")) {
					coxjs.preventDefault(event);  
					return; 
				}
			    //If the form is submitted via Ajax, do not show button throbber; this will show default inline throbber	
				if (throbberNode.parents(".ajax-form-submit").length == 0) {
					if (throbberNode.prop("tagName").toLowerCase() == "input") {
						// Show throbber 
						_module.showThrobber(throbberNode);	
						// capture ID of the timer returned by setTimeout method
						// execute method hide throbber after a set delay						
						_timerId = setTimeout(function(){
							_module.hideThrobber(throbberNode)
						}, _delay);						
						window.buttonThrobberTimer = _timerId;	
					}					
				}
			},
			
			// Show throbber
			showThrobber : function(throbberNode) {				
				coxjs.publish({
					type : "showThrobber",
					data : {
						nodes : throbberNode
					}
				});				
			},
			
			//Hide throbber
			hideThrobber : function(throbberNode) {
				//Clear timer set by setTimeout method so it does not re-execute after delay
				clearTimeout(_timerId);	
				// publish to hide throbber			
			    coxjs.publish({
					type : "hideThrobber",
					data : {
						nodes : throbberNode
					}
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Sudeep Kumar
 * @version 0.1.0.0
 * @namespace modules.global
 * @class GoogleMapAutoCompleteAddressController |
 */
(function(coxfw) {
	coxfw.core.define('modules.global.GoogleMapAutoPopulateAddress', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside
		 * methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".autocomplete-address";
		/**
		 * Stores the active input element (either autocomplete or autocomplete-dummy) to be used in multiple places within the module.
		 *
		 * @property _activeElement
		 * @type object
		 */
		var _activeElement;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT GoogleMapAutoPopulateAddress.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);

				/**
				 * Display the addresses drop down given by google map api.
				 *
				 * @event subscribe
				 * @param {string} AutoPopulate address.
				 */
				coxjs.subscribe({
					"AutoCompleteAddress" : _module.getAutoCompleteAddressConfigs
				});
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC GoogleMapAutoPopulateAddress.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Apply the autopopulate address when there is a autocomplete-address div in-page or AJAX.
				 *
				 * @event xhr-selectors,autocomplete-address
				 * @param {selector} _selector The text div.
				 */
				coxjs.select("body").on("xhr-selectors autocomplete-address", _selector, function(event) {
					/**
					 * Publish AutoCompleteAddress call.
					 *
					 * @event publish
					 * @param {string} Auto populate address when user start type in input field.
					 */
					coxjs.publish({
						type : "AutoCompleteAddress",
						data : this
					});
				});

				/**
				 * Trigger "autocomplete-address" if `_selector` exists when the DOM is loaded.
				 *
				 * @event autocomplete-address
				 * @param {selector} _selector Nodes intended to open overlays when loaded.
				 */
				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("autocomplete-address");
			},

			getAutoCompleteAddressConfigs : function() {
				var autoComp = coxjs.select(".autocomplete")[0];
				var autoComplete_dummy = coxjs.select(".autocomplete-dummy")[0];
				var hiddenField = coxjs.select(".autocomplete-hidden");
				var options = {
					types : ['geocode'],
					componentRestrictions : {
						country : 'us'
					}
				};
				// fetch the addresses provided by google maps api
				autocomplete = new google.maps.places.Autocomplete(autoComp, options);
				google.maps.event.addListener(autocomplete, 'place_changed', _module.fillInAddress);

				autocomplete_dummy = new google.maps.places.Autocomplete(autoComplete_dummy, options);
				google.maps.event.addListener(autocomplete_dummy, 'place_changed', _module.fillInAddress);

				/**
				 * @event keypress
				 *
				 * stop submitting form on press of enter key
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} "autocomplete" The loaded form
				 */
				coxjs.select("body").on("keypress", ".autocomplete", function(event) {
					if (event.keyCode == 13) {
						coxjs.preventDefault(event);
						//prevent form submission
						_activeElement = this;
						coxjs.select(_activeElement).blur();
						//remove focus as it causes issue while making selection using downward arrow
					}
				});

				/**
				 * @event keypress
				 *
				 * stop submitting form on press of enter key
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} "autocomplete" The loaded form
				 */
				coxjs.select("body").on("keypress", ".autocomplete-dummy", function(event) {
					if (event.keyCode == 13) {
						coxjs.preventDefault(event);
						//prevent form submission
						_activeElement = this;
						coxjs.select(_activeElement).blur();
						//remove focus as it causes issue while making selection using downward arrow
					}
				});

				/**
				 * @event blur
				 *
				 * populate the hidden field on blur of the autocomplete field
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".autocomplete" The loaded form
				 */
				coxjs.select("body").on("blur", ".autocomplete", function(event) {
					hiddenField.val(coxjs.select(".autocomplete").val());
					_activeElement = this;
				});
				/**
				 * @event blur
				 *
				 * populate the hidden field on blur of the autocomplete-dummy field
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".autocomplete-dummy" The loaded form
				 */
				coxjs.select("body").on("blur", ".autocomplete-dummy", function(event) {
					hiddenField.val(coxjs.select(".autocomplete-dummy").val());
					_activeElement = this;
				});

			},
			fillInAddress : function() {
				var _autocomplete = coxjs.select(".autocomplete");
				var _autocomplete_dummy = coxjs.select(".autocomplete-dummy");
				var _autocomplete_hidden = coxjs.select(".autocomplete-hidden");
				var activeElementId = coxjs.select(_activeElement).attr("id");
				var place;
				// retrieve 'place' object and change display based on what input is active
				if (activeElementId == "autocomplete") {
					_autocomplete.css({
						"display" : "inline-block"
					});
					_autocomplete.removeClass("ignore-validation");
					_autocomplete_dummy.css({
						"display" : "none"
					});
					_autocomplete_dummy.addClass("ignore-validation");
					if ((_autocomplete_dummy.val() != "") && !(_autocomplete_dummy.hasClass("error"))) {
						_autocomplete.removeClass("error");
					}
					place = autocomplete.getPlace();
				} else {
					place = autocomplete.getPlace();
					_autocomplete_dummy.css({
						"display" : "inline-block"
					});
					_autocomplete_dummy.removeClass("ignore-validation");
					_autocomplete.css({
						"display" : "none"
					});
					_autocomplete.addClass("ignore-validation");
					if (_autocomplete.hasClass("error")) {
						_autocomplete_dummy.addClass("error");
					}
					if ((_autocomplete.val() != "") && !(_autocomplete.hasClass("error"))) {
						_autocomplete_dummy.removeClass("error");
					}
					place = autocomplete_dummy.getPlace();
				}
				_autocomplete_hidden.attr("value", coxjs.select(_activeElement).val());

				//fetch address components only when 'place' is not undefined
				if (place != undefined) {
					var components = place.address_components;
					var street = null;
					var number = null;
					var zip = null;
					var city = null;
					var state = null;
					// featch street name , number and zip code from
					// selected address by user and populate it in
					// their respective variable.

					coxjs.select(components).each(function(index, component) {
						if (component.types[0] == 'route') {
							street = component['long_name'];
						}
						if (component.types[0] == 'street_number') {
							number = component['long_name'];
						}
						if (component.types[0] == 'postal_code') {
							zip = component['long_name'];
						}
						if (component.types[0] == 'locality') {
							city = component['long_name'];
						}
						if (component.types[0] == 'administrative_area_level_1') {
							state = component['long_name'];
						}

					});
					// populate the value of street number, street
					// name, city, state and zip code to input
					// fields of html.
					if (number != null && street != null) {
						if (_autocomplete.css('display') == 'inline-block') {
							_autocomplete.val(number + ' ' + street);
						} else {
							_autocomplete_dummy.val(number + ' ' + street);
						}
						_autocomplete_hidden.val(number + ' ' + street);
					} else if (number == null && street != null) {
						if (_autocomplete.css('display') == 'inline-block') {
							_autocomplete.val(street);
						} else {
							_autocomplete_dummy.val(street);
						}
						_autocomplete_hidden.val(street);
					} else if (number != null && street == null) {
						if (_autocomplete.css('display') == 'inline-block') {
							_autocomplete.val(number);
						} else {
							_autocomplete_dummy.val(number);
						}
						_autocomplete_hidden.val(street);

					} else {
						if (_autocomplete.css('display') == 'inline-block') {
							_autocomplete.val('');
						} else {
							_autocomplete_dummy.val('');
						}
						_autocomplete_hidden.val('');
					}
					var _postal_code = coxjs.select(".postal-code");
					_postal_code.val(zip);

					var _city_name = coxjs.select(".city-name");
					_city_name.val(city);

					var _state_name = coxjs.select(".state-name");
					_state_name.val(state);
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi
 * @version 0.1.0.0
 * @namespace modules.residential.cms
 * @class Hero
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.Hero', function(coxjs) {

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
			},
			/**
			 *
			 * Manages Hero navigation on click
			 * Tracks Hero click event
			 *
			 * @method execute
			 */
			execute : function() {
				// set the module variable to this object
				_module = this;

				if (coxjs.select(".hero-block")[0]) {
					coxjs.select(".hero-block").each(function(index, el) {
						_module.checkHeroTabs();

						if (coxjs.select(el).find(".mobile-only .button").length !== 0) {
							coxjs.select(el).addClass("hero-button-offset");

							// for carousel hero
							if (coxjs.select(this).closest(".flexslider").length !== 0) {
								coxjs.select(this).closest(".flexslider").addClass("carousel-controls-offset");
							}
						}
						
					});
				}

				coxjs.select(".hero-block").on("click", ".position-content, a", function(e) {
					// Hero Navigation
					_module.handleHeroNavigation(this, e);
				});

			},

			checkHeroTabs : function() {
				// toggle hero tabs
				_module.toggleHeroTabs();
				// on resize toggle hero tabs
				coxjs.select(window).bind('resize', function() {
					_module.toggleHeroTabs();
				});
			},

			toggleHeroTabs : function() {
				// check for browser
				if (window.matchMedia) {
					if (window.matchMedia("(max-width: 767px)").matches) {
						// change any hero tabs to dots for mobile
						coxjs.select(".hero-tabs ol.flexslider-controls").switchClass("flexslider-controls", "flex-control-nav");
					} else {
						// change the hero tab variation dots back to tabs
						coxjs.select(".hero-tabs ol.flex-control-nav").switchClass("flex-control-nav", "flexslider-controls");
					}
				}
			},

			handleHeroNavigation : function(el, e) {
				// get the url from hero-image
				var selectedSlide = coxjs.select(el).closest(".hero-block").find(".hero-image");
				var slideUrlLocation = coxjs.select(selectedSlide).attr("href");
				var slideTarget = coxjs.select(selectedSlide).attr("target") || "_self";
				// only process if the background image has an actual href
				if (slideUrlLocation) {
					// stop all anchors from default behavior, and manually set the href location
					e.preventDefault();
					e.stopPropagation();

					// if user clicks an anchor element, check to see if the anchor has an href and set the url
					// location, if theres no href then use the hero-image location
					if (coxjs.select(el).is("a")) {
						slideUrlLocation = coxjs.select(el).attr("href");
						if (!slideUrlLocation)
							slideUrlLocation = coxjs.select(selectedSlide).attr("href");
					}
					window.open(slideUrlLocation, slideTarget);
				}
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Restricts the number of items that can be shown in a list.
 * Allows us to set number of visible items in the html as well
 * as whether we want Read More to show up only on mobile, desktop,
 * all devices, or none for future use.
 *
 * @author Robert Sekman
 * @version 0.1.0.0
 * @module modules.global.HideMaxListItems
 */
(function(coxfw) {
	coxfw.core.define('modules.global.HideMaxListItems', function(coxjs) {
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".hide-max-items";
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT HideMaxListItems.js");
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Select the list container.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC HideMaxListItems.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				
				/**
				 * @event xhr-selectors
				 *
				 * Attach mask to any data-mask attribute.
				 *
				 * @param {selector} _selector Node containing the list.
				 */

				coxjs.select("body").on("xhr-selectors", _selector, function(event) {
					// looking for inputs with data-mask attribute
					coxjs.select(this).each(function() {
						var listItem = coxjs.select(this);
						var displayType = listItem.data('maxItemsDisplay'); // "mobile", "desktop", "all", "none"
						
						if (displayType == "desktop" || displayType == "all") {
							_module.displayList(listItem);
						} else if (displayType == "mobile") {
							// Check for window.matchMedia capability.
							if (window.matchMedia) { 
								// Set positioning below player if it is on the right.
								if (window.matchMedia("(max-width: 767px)").matches) {
									_module.displayList(listItem);
								}
							}
						}

					});
				});
				/**
				 * @event load
				 *
				 * Trigger "xhr-selectors" if `_selector` exists when the DOM is loaded.
				 *
				 * @param {selector} _selector Nodes intended to init mask library.
				 */
				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("xhr-selectors");

			},
			/**
			 * Hide the appropriate amount of items and display either a Read More or Read Less link
			 *
			 * @method displayList
			 */			
			displayList : function(listItem) {
				var speedPerLI;
				var maxItems = listItem.data('maxItems') || "3";
				var moreText = listItem.data('moreText') || "Read More";
				var lessText = listItem.data('lessText') || "Read Less";
				var speed = 600;
				var moreHTML = "<div class='col-content maxlist-more'><a href='#'></a></div>";

				var totalListItems = listItem.children("li").length;

				// Get animation speed per LI; Divide the total speed by num of LIs.
				// Avoid dividing by 0 and make it at least 1 for small numbers.
				if (totalListItems > 0 && speed > 0) {
					speedPerLI = Math.round(speed / totalListItems);
					if (speedPerLI < 1) {
						speedPerLI = 1;
					}
				} else {
					speedPerLI = 0;
				}

				// If list has more than the "max" option
				if ((totalListItems > 0) && (totalListItems > maxItems)) {
					// Initial Page Load: Hide each LI element over the max
					listItem.children("li").each(function(index) {
						if ((index + 1) > maxItems) {
							coxjs.select(this).hide(0);
						}
					});

					// Add "Read More" button
					listItem.after(moreHTML);
					// Add "Read More" text
					listItem.next(".maxlist-more").children("a").html(moreText);

					// Click events on "Read More" button: Slide up and down
					listItem.next(".maxlist-more").children("a").click(function(e) {
						// Get array of children past the maximum option
						var listElements = coxjs.select(this).parent().prev("ul, ol").children("li");
						listElements = listElements.slice(maxItems);

						// Sequentially slideToggle the list items
						if (coxjs.select(this).html() == moreText) {
							coxjs.select(this).html(lessText);
							var i = 0;
							(function() {
								coxjs.select(listElements[i++] || []).slideToggle(speedPerLI, arguments.callee);
							})();
						} else {
							coxjs.select(this).html(moreText);
							var i = listElements.length - 1;
							(function() {
								coxjs.select(listElements[i--] || []).slideToggle(speedPerLI, arguments.callee);
							})();
						}

						// Prevent Default Click Behavior (Scrolling)
						e.preventDefault();
					});
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * A jQuery Plugin to make masks on form fields and html elements.
 *
 * @author Robert Sekman
 * @version 0.1.0.0
 * @module modules.global.InputMask
 */
(function(coxfw) {
	coxfw.core.define('modules.global.InputMask', function(coxjs) {
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = "*[data-mask]";

		return {
			/**
			 * Setup all subscriptions for this module.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT InputMask.js");
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Select the data-mask attribute and load the mask library.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC InputMask.js");
				/**
				 * @event xhr-selectors
				 *
				 * Attach mask to any data-mask attribute.
				 *
				 * @param {selector} _selector Node intended to receive masking
				 */
					
				coxjs.select("body").on("xhr-selectors", _selector, function(event) {
					// looking for inputs with data-mask attribute
					coxjs.select(this).each(function() {
						var input = coxjs.select(this),
							options = {},
							prefix = "data-mask-";
						
						// Activating a reversible mask
						if (input.attr(prefix + 'reverse') === 'true') {
							options.reverse = true;
						}
						// Disabling automatic maxlength
						if (input.attr(prefix + 'maxlength') === 'false') {
							options.maxlength = false;
						}
						// Using clearIfNotMatch option
						if (input.attr(prefix + 'clearifnotmatch') === 'true') {
							options.clearIfNotMatch = true;
						}
						
						input.mask(input.attr('data-mask'), options);
					});
				});
				/**
				 * @event load
				 *
				 * Trigger "xhr-selectors" if `_selector` exists when the DOM is loaded.
				 *
				 * @param {selector} _selector Nodes intended to init mask library.
				 */
				if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("xhr-selectors");
					    
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Scott Thompson
 * @version 0.1.0.0
 * @namespace modules.global
 * @class LoadingThrobber
 *
 * Show and hide loading spinner.
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.global.LoadingThrobber", function(coxjs) {
		/**
		 * Set a default class name to modify, unless another is provided.
		 *
		 * @property _class
		 * @type string
		 */
		var _class = "loading-wrapper-active";
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT LoadingThrobber.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Subscribe to throbber show/hide requests.
				coxjs.subscribe({
					"showThrobber" : _module.showThrobber,
					"hideThrobber" : _module.hideThrobber
				});
			},
			/**
			 * Subscribe to throbber show/hide requests.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC LoadingThrobber.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
			},
			/**
			 * Display the waiting indicator.
			 *
			 * @method showThrobber
			 * @param {object} throbber The configuration object for this throbber
			 */
			showThrobber : function(throbber) {
console.log("     LoadingThrobber.showThrobber");
				// Generate a DOM object if throbber.nodes is a string.
				if (coxfw.utils.typeEqual(throbber.nodes, "string"))
					throbber.nodes = coxjs.select(throbber.nodes);

				// Assign throbber.className if provided as a string.
				if (coxfw.utils.typeEqual(throbber.className, "string"))
					_class = throbber.className;

				// Add the class to activate the throbber...
				throbber.nodes.addClass(_class);

				// ...and position it based on how much of the throbber node is visible on screen.
				if (coxjs.select(window).height() < throbber.nodes.height()) {
					coxjs.select(".loader", throbber.nodes).css("backgroundPosition", "center " + ((coxjs.select(window).height() - throbber.nodes.offset().top) / 2) + "px");
				} else {
					coxjs.select(".loader", throbber.nodes).css("backgroundPosition", "center center");
				}
			},
			/**
			 * Remove the waiting indicator.
			 *
			 * @method hideThrobber
			 * @param {object} throbber The configuration object for this throbber
			 */
			hideThrobber : function(throbber) {
console.log("     LoadingThrobber.hideThrobber");
				// Generate a DOM object if throbber.nodes is a string.
				if (coxfw.utils.typeEqual(throbber.nodes, "string"))
					throbber.nodes = coxjs.select(throbber.nodes);

				// Assign throbber.className if provided as a string.
				if (coxfw.utils.typeEqual(throbber.className, "string"))
					_class = throbber.className;

				// Remove the class to deactivate the throbber...
				throbber.nodes.removeClass(_class);

				// ...and reset position to zero.
				coxjs.select(".loader", throbber.nodes).css("backgroundPosition", "center top");
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Robert Sekman, Kyle Patterson, Scott Thompson, Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.global
 * @class LoginCookie
 *
 * Set a cox-rememberme-user Base64 encoded cookie on the username if the remember me checkbox is checked.
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.LoginCookie', function(coxjs) {
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context = coxjs.select("form[name='sign-in']");

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		//unique id to listen to Base64 response
		var id = "loginCookie";

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT LoginCookie.js");
			},
			/**
			 * Sets the local module object and listens for form submit
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC LoginCookie.js");
				/**
				 * @event submit
				 *
				 *
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} "form" with name 'sign-in'
				 */

				// set the module variable to this object
				_module = this;

				/**
				 * @event submit
				 *
				 * generate coded name and set cookie on submit
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} _context The form with name='sign-in'
				 */

				coxjs.select("body").on("submit", function(event) {						 					
						// exit module if submitted form does not have name 'sign-in'
						if (coxjs.select(event.target).attr("name") != "sign-in") return;								
						_module.generateCodedName(event);										
				});

				// listen for base64 response and call 'setCookie' function
				var Base64ResponseSubscribe = {};
				Base64ResponseSubscribe[id] = _module.setCookie;
				coxjs.subscribe(Base64ResponseSubscribe);
			},

			generateCodedName : function(args) {

				var theUserName;

				// res idm
				if ( dummy = coxjs.select("input[name='username']:first")[0]) {
					theUserName = coxjs.select("input[name='username']:first", args.target)[0].value;
				}
				// biz idm
				if ( dummy = coxjs.select("input[name='USER']:first")[0]) {
					theUserName = coxjs.select("input[name='USER']:first", args.target)[0].value;
				}

				// get encoded value for 'theUserName' field
				coxjs.publish({
					type : "Base64",
					data : {
						id : "loginCookie",
						type : "encode",
						data : theUserName,
						context: args.target
					}
				});

			},

			setCookie : function(value) {
				// create cookie
				//"targert and value", value.value, value.context
				if (value != undefined) {

					var date = new Date();
					date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
					var expiryCreate = "; expires=" + date.toGMTString();
					var expiryDestroy = "; expires=" + new Date(0).toGMTString();

					var theCheckBox = coxjs.select("input[name='rememberme']:first", value.context)[0];

					if (theCheckBox.checked == true) {
						if (navigator.cookieEnabled) {
							document.cookie = "cox-rememberme-user=" + value.value + expiryCreate + "; path=/";
						}
					} else {
						document.cookie = "cox-rememberme-user=" + value.value + expiryDestroy + "; path=/";
					};

				}
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {

			}
		};
	});
})(coxfw); /**
 * @author Sudeep Kumar
 * @version 0.1.0.0
 * @namespace modules.global
 * @class MobileDatePickerModal
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.global.MobileDatePickerModal", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * Stores a boolean value corresponding to launch device layout
		 *
		 * @property _hasDualLayout
		 * @type boolean
		 */
		var _hasDualLayout;

		return {
			/**
			 * Setup all subsriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT MobileDatePickerModal.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Subscribe
				coxjs.subscribe({
					"MobileDatePickerModal" : _module.startExecution,
					"Orientation" : _module.resetDatePicker
				});

				/**
				 * @event load
				 *
				 * Check if launched device has dual layout
				 *
				 */
				//check if the launching device has different layout in each orientation
				//Trying to target 'Nexus7' and 'Samsung Galaxy Tab' which behave as mobile in 'portrait' and desktop in 'landscape'
				if (window.matchMedia) {
					_hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600;
				}
			},
			/**
			 * execute this module.
			 *
			 * @method execute
			 */
			execute : function() {

			},

			startExecution : function() {

				/**
				 * @event click
				 *
				 * wrapper for datepicker when its open as modal instead of overlay. This applies for mobile device.
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".date-picker" The loaded form
				 */
				coxjs.select("body").on("click", ".date-picker", function(event) {
					if (coxjs.select(window).width() < 767) {
						if (coxjs.select(".datepicker-modal-component").attr('style') === undefined) {
							coxjs.select("#ui-datepicker-div").wrap("<div class='datepicker-modal-component' style='width: 100%; height: auto; left: 0px; display: block;'></div>");
							coxjs.select("#ui-datepicker-div").wrap("<div class='datepicker-modal-component-content'></div>");
							coxjs.select("<div class='datepicker-modal-component-title'>Pick Your Date</div>").insertBefore(".datepicker-modal-component-content");
							coxjs.select("<div class='datepicker-modal-component-head'><span title='Close' class='date-modal-close'></span></div>").insertBefore(".datepicker-modal-component-title");
							coxjs.select(".datepicker-modal-component-content").append("<div class='datepicker-modal-component-buttons'><a href='#' class='button date-modal-button'>Done</a><a class='button-secondary date-modal-close'>Close</a></div>");
							
						}
						// In certain scenarios, datepicker div is set to display none on launch, so reset display
						//TODO: Investigate why it happens and fix root cause
						if (coxjs.select("#ui-datepicker-div").css("display") == "none"){
								coxjs.select("#ui-datepicker-div").css("display", "block");
						}
						if (_hasDualLayout) {
							var modalComponentHeight = (coxjs.select(window).height() < coxjs.select(".datepicker-modal-component").height()) ? "auto" : coxjs.select(window).height() + "px";
							coxjs.select(".datepicker-modal-component").css({
								"height" : modalComponentHeight
							});
						}

						//Variable to store top offset of modal.
						var modalTop = coxjs.select(window).scrollTop();
						
						// display the modal
						coxjs.select(".datepicker-modal-component").css({
							"display" : "block",
							"top" : modalTop
						});
					}
				});

				/**
				 * @event click
				 *
				 * close the datepicker modal once user select date and click done button.
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".date-modal-button" The loaded form
				 */
				coxjs.select("body").on("click", ".date-modal-button", function(event) {
					// Prevent default behavior on the node.
					event.preventDefault();
					
					coxjs.select(".datepicker-modal-component").css({
						"display" : "none"
					});
				});				
				/**
				 * @event click
				 *
				 * close the datepicker modal once user select date and click close button.
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".date-modal-close" The loaded form
				 */
				coxjs.select("body").on("click", ".date-modal-close", function(event) {
					coxjs.select(".date-picker").val("");
					coxjs.select(".datepicker-modal-component").css({
						"display" : "none"
					});
				});
				// DualLayout device specific fix to show the datepicker on orientation change
				/**
				 * @event click
				 *
				 * display the datepicker component. Fixes the isue when datepicker is not shown on orientation change
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".pro-date" the date input
				 */
				coxjs.select("body").on("click", ".date-picker", function(event) {
					if (_hasDualLayout) {
						coxjs.select(".datepicker-modal-component").css({
							"display" : "block"
						});
					}
				});
				
				/**
				 * @event click
				 *
				 * hide the datepicker component if clicked outside the datepicker modal
				 *
				 */
				coxjs.select("html").on("click", function(event) {
					if (coxjs.select(window).width() < 767) {
						var targetElement = coxjs.select(event.target);
						// check if target element is not with in the datepicker modal and if datepicker is visible
						if (coxjs.select(".datepicker-modal-component").css("display") == "block" && !(targetElement.is(".date-picker, .ui-datepicker-next, .ui-datepicker-prev")) && targetElement.closest(".datepicker-modal-component").length == 0) {
							coxjs.select(".datepicker-modal-component").hide();
						}	
					}				
				});

			},
			
		
			// resetDatePicker on orientation change ONLY for dual layout devices
			resetDatePicker : function(data) {
				if (_hasDualLayout) {
					if (data.orientation == "landscape") {
						coxjs.select(".date-modal-close").trigger("click");
					} else {
						if (coxjs.select(".datepicker-modal-component").length > 0) {
							coxjs.select(".datepicker-modal-component").css("display", "none");
						} else {
							coxjs.select("#ui-datepicker-div").css("display", "none");
						}
					}
				}
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Manages modals using jQuery UI's Dialog.
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.global.Modal
 */
(function(coxfw) {
	coxfw.core.define("modules.global.Modal", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * Stores a copy of the dialog nodes to apply inside methods.
		 *
		 * @member {object} _dialog
		 */
		var _dialog;
		/**
		 * Stores a copy of the colspan number corresponding to width.
		 *
		 * @property _colspan
		 */
		var _colspans;
		
		
		// pass the complete url string
		var _params;
		// store whether close button is hidden or not
		var hideCloseBtn;
		return {
			/**
			 * Setup "Modal" subscriptions.
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT Modal.js");
				
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				coxjs.subscribe({
					"Orientation" : _module.positionModal //reset modal dimensions when orientation change
				});
			},
			/**
			 * Setup and handle modal events.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC Modal.js");
				
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Open a modal when the "click" event is fired on these nodes.
				 *
				 * @event click
				 * @param {string} ".cms-modal-trigger" Nodes intended to open a modal.
				 */
				coxjs.select('body').on('click', '.cms-modal-trigger', function(e) {
					// Reset _colspans.
					_colspans = 12;
					// Prevent default behavior on the node.
					e.preventDefault();
					// Close and destroy any existing modals.
					if (_dialog) {
						coxjs.select(".cms-dialog").remove();
						_dialog = null;
					}
					// Get the content location.
					var modalUrl;
					// check if content is inline
					var hasInlineContent = false;
					if (coxjs.select(this).attr("data-content-element") != null) {
						modalUrl = " #"+coxjs.select(this).attr("data-content-element");
						hasInlineContent = true;
					} else {
						modalUrl = this.href;						
					}
					
					_params = modalUrl;
					// Get the modal options from the trigger.
					var modalWidth = coxjs.select(this).data('modalWidth') || '1010';					
					hideCloseBtn = coxjs.select(this).data('hideCloseBtn');
					var modalTheme = coxjs.select(this).data('modalTheme');
					// Define how many columns are spanned over the given pixel width.
					switch (modalWidth) {
					case 850:
						_colspans = "10";
						break;
					case 690:
						_colspans = "8";
						break;
					default:
						break;
					} 
					// Create the dialog.
					var dialogObj = (hasInlineContent == false) ? coxjs.select('<div>') : ((coxjs.select(modalUrl).length==0) ? coxjs.select('<div>') : coxjs.select(modalUrl));
					_dialog = dialogObj.dialog({
						open : function() {
							// load content if content is to be loaded via Ajax
							if (hasInlineContent == false){
								coxjs.select(this).load(modalUrl, function(response, status, xhr) {
									if (status == "success") _module.positionModal(modalWidth);
									if (status == "error") { //console.log(msg + xhr.status + " " + xhr.statusText);
										coxjs.select('<h2>Page Not Found</h2><div class="msg-error col-reset"><p>We\'re sorry, we can\'t find this part of the page.</p></div>').appendTo(".ui-dialog-content");
									}
								});
							}
							else {
								if (coxjs.select(modalUrl).length==0) { 
									coxjs.select('<h2>Page Not Found</h2><div class="msg-error col-reset"><p>We\'re sorry, we can\'t find this part of the page.</p></div>').appendTo(".ui-dialog-content");
								}
								coxjs.select(".cms-dialog").css("position", "absolute");
								//Variable to store top offset of modal.
								var modalTop = coxjs.select(window).scrollTop();
								//If device is desktop and modal height is less than window height, align modal in the center.
								if ((coxjs.select("body").attr("data-layout") == "desktop") && (coxjs.select(".cms-dialog").height() < coxjs.select(window).height())) {
									modalTop = modalTop + ((coxjs.select(window).height() - coxjs.select(".ui-dialog").height())/2);
								}
								coxjs.select(".cms-dialog").css("top", modalTop);
							}
						},
						buttons : [{
							text : "Close",
							click : function() {
								coxjs.select(".ui-dialog-content").removeClass("colspan-" + _colspans);
								coxjs.select('.cms-dialog').remove();
							}
						}],
						dialogClass : "cms-dialog cols-grid",
						// strip colspan-* class on dialog close
						close : function() {
							coxjs.select(".ui-dialog-content").removeClass("colspan-" + _colspans);
							coxjs.select('.cms-dialog').remove();
						},
						resizable : false,
						draggable : false,
						height : 'auto',
						modal: true,
						width : modalWidth
					});
					// show alternative themes
					if (modalTheme) {
						coxjs.select(".ui-dialog").addClass(modalTheme);
					} else {
						// hide alternative themes
						coxjs.select(".ui-dialog").removeClass("dark");
					}
					// hide modal close btn
					if (hideCloseBtn) _module.hideCloseButton();
					// Apply the appropriate "colspan-*" class.
					coxjs.select(".ui-dialog-content").addClass("colspan-" + _colspans);
					// Swap out style classes from jQuery UI default to Cox.
					coxjs.select(".ui-dialog-buttonset").find(".ui-button").addClass("button btn-close").removeClass("ui-widget ui-state-default ui-corner-all ui-button-text-only");
					//To Position the modal depending on the window-width when it has inline content.
					if(hasInlineContent == true){
						_module.positionModal(modalWidth);
						
						/* Defect fix #DE9798, ALM# 61394 begins*/
						
						// store offer comparisons all plans section if present
						var allOffersSection = coxjs.select(".all-plans", slider);
						
						var offerComparisonContainer = coxjs.select(modalUrl).find(".offer-comparison-container")[0];	
												
						if(coxjs.select(".cms-dialog").find(".slick-carousel")[0]) {
							var slider = coxjs.select(".cms-dialog").find(".slick-carousel");							
							// Unslick and reinitialize slick if carousel is inside a inline modal content otherwise data gets squeezed
							if (slider.hasClass("slick-initialized")) {
								slider.slick("unslick");									
							}
							// reinitialize slick
							coxjs.publish({
								type: "ReinitializeSlick",
								data: slider
							});
						}
						var containerGrp = coxjs.select(".modal-inline-content").find(".section-container")[0];
						// recalculate CTA alignment if the slick-carousel in inside a section container							
						if (containerGrp) {
							coxjs.publish({
								type: "RealignContainerItems",
								data: containerGrp  
							});
						}		
						if(offerComparisonContainer) {
							coxjs.publish({
								type: "RecalculateTable",
								data: offerComparisonContainer  
							});	
							//unslick process removes this section, hence append it back
							coxjs.select(offerComparisonContainer).append(allOffersSection);
						}
						
						/* Defect fix #DE9798, ALM# 61394 ends*/			
					}						
				});
				/**
				 * Open a modal when the "click" event is fired on these nodes.
				 *
				 * @event click
				 * @param {string} ".ui-widget-overlay" Nodes intended to close an open modal.
				 */
				coxjs.select("body").on("click", ".ui-widget-overlay", function(e) {
					coxjs.select(".ui-dialog-content").removeClass("colspan-" + _colspans);
					coxjs.select('.cms-dialog').remove();
					coxjs.select('.ui-widget-overlay').remove();
					e.stopPropagation();
				});
				/**
				 * esc key event of jquery-ui-dialog is not getting called when data-hide-close-btn="true"
				 * so closing it manually. 
				 * 
				 * @event keyup
				 * @param {string} ".ui-widget-overlay" Nodes intended to close an open modal.
				 */
				coxjs.select("body").on('keyup',function(e) {
					if (e.keyCode == 27) {
						if(hideCloseBtn){
							coxjs.select(".ui-dialog-content").removeClass("colspan-" + _colspans);
							//coxjs.select('.cms-dialog').dialog(_dialog).dialog("close");
							coxjs.select('.cms-dialog').remove();
							coxjs.select('.ui-widget-overlay').remove();
						}
					}
				});
				// Fire the click, to open a modal, for any triggers that also have the "cms-auto-launch" class attached.
				coxjs.select(".cms-auto-launch.cms-modal-trigger").click();
			},
			/**
			 * Sets the display of the .ui-dialog-buttonpane to "none".
			 *
			 * @method hideCloseButton
			 */
			hideCloseButton : function() {
				coxjs.select(".ui-dialog-buttonpane").css("display", "none");
			},
			/**
			 * Using media queries to determine proper behavior, positions and modifies styles for the modal on page load and window resize.
			 *
			 * @method positionModal
			 * @param {integer} modalWidth The width, in pixels, for this modal instance.
			 */
			positionModal : function(modalWidth) {
				var top = "";
				var border = coxjs.select(".cms-dialog").css("border-top");
				var margin = coxjs.select(".cms-dialog .ui-dialog-content").css("margin-top");
				// Make sure the modal is set for absolute positioning.
				coxjs.select(".cms-dialog").css("position", "absolute");
				// Check for window.matchMedia capability.
				if (window.matchMedia) { 
					// Set positioning for page top if the viewport is of mobile width.
					if (window.matchMedia("(max-width: 767px)").matches) top = " top"

					// Reset width to 100% on devices between 768px and 959px IF they have a .cms-dialog...
					if (window.matchMedia("(min-width: 768px) and (max-width: 959px)").matches && (coxjs.select(".cms-dialog").length > 0)) { 
						// ...and that dialog is either a .colspan-12 or .colspan-10 width modal
						if (coxjs.select(".cms-dialog .ui-dialog-content").hasClass("colspan-12") || coxjs.select(".cms-dialog .ui-dialog-content").hasClass("colspan-10")) {
							//set width to 100% if the viewport is between mobile and desktop width.
							coxjs.select(".cms-dialog").css({
								"width" : "100%"						
							});					
						}					
					}
				}						
				
				// Modal is loaded completely here
				//using for rebinding the modal component
				coxjs.publish({
					type : "ModalLoaded",
					data : _params
					});
					
				// Set positioning for page top if the modal is taller than the browser window.
				setTimeout(function(){
					if (coxjs.select(".cms-dialog").height() > coxjs.select(window).height()) top = " top";
					coxjs.select(".cms-dialog").position({
						my : "center" + top,
						at : "center" + top,
						of : window
					});	
				}, 100);	//set timeout so modal is positioned after ajax data load					
					
				
				// Handle positioning when the browser windo is resized.
				coxjs.select(window).resize(function(event) {
					// Set positioning for page top if the modal is taller than the browser window.
					if (coxjs.select(".cms-dialog").height() > coxjs.select(window).height()) top = " top";
					coxjs.select(".cms-dialog").position({
						my : "center" + top,
						at : "center" + top,
						of : window
					});
					// Check for window.matchMedia capability.
					if (window.matchMedia) {
						// See if we have a modal.
						if (coxjs.select(".cms-dialog").length > 0) {
							// Set positioning for page top if the viewport is of mobile width.
							if (window.matchMedia("(max-width: 767px)").matches) {
								coxjs.select(".cms-dialog").css({
									"top" : 0
								});
							} else if (window.matchMedia("(min-width: 768px) and (max-width: 959px)").matches && ( coxjs.contains(coxjs.select(".cms-dialog")[0], coxjs.select(".ui-dialog-content.colspan-12")[0]) || coxjs.contains(coxjs.select(".cms-dialog")[0], coxjs.select(".ui-dialog-content.colspan-10")[0])) ) {
								// Remove borders and margin, and set width to 100% if the viewport is between mobile and desktop width.
								coxjs.select(".cms-dialog").css({
									"width" : "100%",
									"border-left" : 0,
									"border-right" : 0
								});
								coxjs.select(".cms-dialog .ui-dialog-content").css({
									"margin-left" : 0,
									"margin-right" : 0
								});
							} else {
								// Reset borders, margin, and width if the viewport is desktop width.
								coxjs.select(".cms-dialog").css({
									"width" : modalWidth,
									"border-left" : border,
									"border-right" : border
								});
								coxjs.select(".cms-dialog .ui-dialog-content").css({
									"margin-left" : margin,
									"margin-right" : margin
								});
							}
						}
					}
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw); /**
 * Creates a modal when clicking on an element with a class of ".modal-trigger".
 *
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.ModalOpenClose
 */
(function(coxfw) {
	coxfw.core.define("modules.global.ModalOpenClose", function(coxjs) {
		/**
		 * Reset all the containers.
		 *
		 * @member {object} _containers
		 */
		var _containers;
		/**
		 * The element clicked to open this modal.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;
		/**
		 * The modal node where content lives.
		 *
		 * @member {object} _content
		 */
		var _content;
		/**
		 * The node used to cover page content behind the modal.
		 *
		 * @member {object} _underlay
		 */
		var _underlay;
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * Global parameters for the modal module.  See below for default properties.
		 */
		var _modalOptions;
		/**
		 * The default settings for an AJAX request.
		 *
		 * @member {object} _ajaxOptions
		 * @property {object} container The DOM element intended to receive AJAX response.
		 * @property {string} type The HTML form method being used for this request.
		 * @property {string} dataType The type of data being returned.
		 * @property {string} timeout The amount of time, in milliseconds, to wait for a response.
		 * @property {boolean} cache Whether to cache the response or not.
		 * @property {object} throbber Pass to {@link modules.global.module:Ajax} whether and what kind of loading indicator to show.
		 * @property {string} throbber.type The CoxJS event to be published for the throbber.
		 * @property {object} throbber.data The object containing configuration options for the throbber.
		 * @property {object} throbber.data.nodes DOM nodes for the throbber container.
		 */
		var _ajaxOptions = {
			container : coxjs.select(".dialog-component-content"),
			type : "GET",
			dataType : "text",
			timeout : "30000",
			cache : false,
			throbber : {
				type : "showThrobber",
				data : {
					nodes : coxjs.select(".dialog-component-content").closest(".loading-wrapper")
				}
			}
		};

		return {
			/**
			 * Setup "Modal" subscriptions.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT ModalOpenClose.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Subscribe to AJAX requests.
				 *
				 * @event subscribe
				 * @param {string} Modal Mediator subscription to {@link modules.global.module:ModalOpenClose~modalHandler}.
				 */
				coxjs.subscribe({
					"Modal" : _module.modalHandler,
					"Orientation" : _module.resetModalDimensions //reset modal dimensions when orientation change
				});

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(".auto-launch");
			},
			/**
			 * Setup and handle modal events.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC ModalOpenClose.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Initialize the global options.
				_module.modalOptions();
				/**
				 * Publish modal if an .auto-launch node exists after page is either loaded or AJAX has finished.
				 *
				 * @event xhr-selectors
				 * @param {string} ".auto-launch" Nodes intended to open modals.
				 */
				coxjs.select("body").on("xhr-selectors", ".auto-launch", function(event) {
					// Grab the launcher for this modal.
					var launcher = coxjs.select(this);

					// Set the options for this modal.
					_module.modalOptions(event, coxjs.select(launcher), {
						enabled : true,
						initialX : window.scrollX, //capture initial scrollX position
						initialY : window.scrollY, //capture initial scrollY position
						initialWidth : launcher.attr("data-modal-width")	//capture original modal width
					});

					// Publish Modal call.
					coxjs.publish({
						type : "Modal",
						data : _modalOptions
					});

					// Track modal on auto-launch
					_module.trackModalLaunch(launcher);

					// focus set to modal content div
					coxjs.select(".dialog-component-content").attr("tabindex", -1).focus();
				});
				/**
				 * Trigger "xhr-selectors" if any .auto-launch node exists when the DOM is loaded.
				 *
				 * @event load
				 * @param {string} ".auto-launch" Nodes intended to open overlays when loaded.
				 */
				if (coxjs.select(".auto-launch").length > 0)
					coxjs.select(".auto-launch").trigger("xhr-selectors");
				/**
				 * Publish modal when clicking the .modal-trigger node.
				 *
				 * @event click
				 * @param {string} ".modal-trigger" Nodes intended to open overlays when clicked.
				 */
				coxjs.select("body").on("click", ".modal-trigger", function(event) {
					// Assign node clicked to the module's _trigger.
					_trigger = coxjs.select(this);

					// Stop click bubbling beyond our trigger.
					event.stopPropagation();

					// Prevent the default behavior for the modal trigger.
					coxjs.preventDefault(event);

					// Set the options for this modal.
					// initialX, initialY and initialWidth needed for modals in mobile and portrait
					_module.modalOptions(event, _trigger, {
						enabled : true,
						initialX : window.scrollX, //capture initial scrollX position
						initialY : window.scrollY, //capture initial scrollY position
						initialWidth : _trigger.attr("data-modal-width")	//capture original modal width
					});

					// Publish Modal call.
					coxjs.publish({
						type : "Modal",
						data : _modalOptions
					});

					// Track modal on click
					_module.trackModalLaunch(_trigger);

					// focus set to modal content div
					coxjs.select(".dialog-component-content").attr("tabindex", -1).focus();
				});
				/**
				 * Added functionality to allow the user to click the underlay id to close the Dialog.
				 * To disable this functionality put an attribute 'data-disable-close="true"' at the node having class "modal-trigger"
				 *
				 * @event click
				 * @param {selector} "#underlay, .btn-icon-close, .btn-close" Nodes intended to close overlays when clicked.
				 */
				coxjs.select("body").on("click", "#underlay, .btn-icon-close, .btn-close", function(event) {
					// get the original modal launcher element so focus can be reset to this element on modal close
					var modalLauncher = _modalOptions.launcher;

					// Boolean for whether the modal stays open or not.
					var stayEnabled = false;

					// Assign node clicked to the module's _trigger.
					_trigger = coxjs.select(this);

					// Stop click bubbling beyond our trigger.
					event.stopPropagation();

					// Prevent the default behavior for the modal trigger.
					coxjs.preventDefault(event);

					// Only close the modal if disableClose is false and the _trigger is not a child of .dialog-component-buttons.
					if (_modalOptions.disableClose && (_trigger.parent(".dialog-component-buttons").length == 0)) stayEnabled = true;

					// Set the options for this modal.
					_module.modalOptions(event, _trigger, {
						enabled : stayEnabled,
						disableClose : _modalOptions.disableClose
					});

					// Publish Modal call.
					coxjs.publish({
						type : "Modal",
						data : _modalOptions
					});

					// reset focus to trigger that launched the modal on modal close
					if (stayEnabled != true) {
						coxjs.select(modalLauncher).focus();
					}

					// remove tabindex attribute set on modal content upon close of modal
					coxjs.select(".dialog-component-content").removeAttr("tabindex");
				});

				/**
				 * @event keydown
				 *
				 *
				 * close the dialog on click of 'Esc'
				 * Trap the focus within the modal area
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} "dialog-component" The opened modal
				 */
				coxjs.select("body").on("keydown", ".dialog-component", function(event) {
					if (event.keyCode == 27) {
						if (_modalOptions.disableClose == false) {
							coxjs.select(".btn-close").trigger("click");
						}
					} else {
						// Publish call to manage tabbing and focusing inside modal.
						coxjs.publish({
							type : "FocusManager",
							data : {
								container : this,
								event : event
							}
						});
					}
				});
			},
			/**
			 * Sets up modals.
			 *
			 * @method modalHandler
			 * @param {object} options The incoming modal settings object.
			 */
			modalHandler : function(options) {
console.log("     ModalOpenClose.modalHandler");
				_modalOptions = options;

				// Check for #underlay and create it, if necessary.
				if (coxjs.select("#underlay").length == 0) {
					_underlay = coxjs.select("<div></div>", {
						id : "underlay",
						tabindex : "-1"
					}).appendTo("body");
				} else {
					_underlay = coxjs.select("#underlay");
				}

				// Check for .dialog-component and create them, if necessary.
				if (options.containers.length == 0) {
					//changed 'btn-close' element tag from span to anchor for accessibility
					//_containers = coxjs.select("<div class='dialog-component loading-wrapper' role='alertdialog' aria-labelledby='dialog-title' aria-hidden='true' aria-expanded='false'>" + "<div class='loader'></div>" + "<div class='dialog-component-head'><a class='btn-close' title='Close' href='#'></a></div>" + "<div class='dialog-component-title' id='dialog-title'></div><div class='dialog-component-content' role='document'></div>" + "</div>").appendTo("body");
					_containers = coxjs.select("<div class='dialog-component loading-wrapper' role='dialog' aria-labelledby='dialog-title' aria-hidden='true'>" + "<div class='loader'></div>" + "<div class='dialog-component-head'><a class='btn-close' title='Close' href='#'></a></div>" + "<div class='dialog-component-title' id='dialog-title'></div><div class='dialog-component-content' role='document'></div>" + "</div>").appendTo("body");
				} else {
					_containers = options.containers;
				}

				// Check for .dialog-component-content.
				if (options.content.length == 0) {
					_content = coxjs.select(".dialog-component-content");
				} else {
					_content = options.content;
				}

				// Once we have containers, inject the specified class(es).
				_containers.addClass(options.classes);

				// Set the global containers to the locally used ones.
				_modalOptions.containers = _containers;

				// Set the global content to the locally used ones.
				_modalOptions.content = _content;

				// Check options and show/hide closing "X" depending on configuration.
				if (options.disableClose) {
					coxjs.select(".dialog-component-head").addClass("disable-close");
					coxjs.select(".dialog-component-head a").removeAttr("href");
					coxjs.select(".dialog-component-head a").removeClass("btn-close");

				} else {
					coxjs.select(".dialog-component-head").removeClass("disable-close");
					coxjs.select(".dialog-component-head a").attr("href", "#");
					coxjs.select(".dialog-component-head a").addClass("btn-close");
				}

				// Open a modal if it's not specified to "close."
				if (options.enabled) {
					// Prevent the main page content from printing.
					coxjs.select("#pf-container").addClass("no-print");

					// Show the underlay.
					_underlay.css("display", "block");

					// Get the content.
					if ( typeof options.source == "string") {
						/**
						 * The source is a string, so use it to publish AJAX call.
						 *
						 * @event publish
						 * @param {string} Ajax Requests a URL via AJAX.
						 * @param {object} data The configuration for the AJAX request with the following properties:
						 * @property {object} container The DOM element intended to receive AJAX response.
						 * @property {string} url The address to fetch via AJAX.
						 */
						if (options.launcher.filter("[id!='underlay']").length > 0)
							coxjs.publish({
								type : "Ajax",
								data : coxfw.extendObj(_ajaxOptions, {
									container : options.content,
									url : options.source,
									throbber : {
										data : {
											nodes : coxjs.select(".dialog-component-content").closest(".loading-wrapper")
										}
									}
								})
							});
					} else {
						/**
						 * Display the waiting indicator, unless the launcher was the #underlay.  When using disableClose, #underlay clicks will reshow/hide throbber.
						 *
						 * @event publish
						 * @param {string} showThrobber Subscribe to throbber show requests.
						 * @param {string} type The CoxJS event to be published for the throbber.
						 * @param {object} data The object containing configuration options for the throbber, which has the following properties:
						 * @property {object} nodes DOM nodes for the throbber container.
						 */
						if (options.launcher.filter("[id!='underlay']").length > 0)
							coxjs.publish({
								type : "showThrobber",
								data : {
									nodes : coxjs.select(".dialog-component-content").closest(".loading-wrapper")
								}
							});

						// Otherwise, we're a node.
						_content.append(options.source);
						// Wrapping setTimeout waits long enough to see throbber reset position.
						// setTimeout(function() {
						/**
						 * Remove the waiting indicator.
						 *
						 * @event publish
						 * @param {string} hideThrobber Publish a throbber hide request.
						 * @param {string} type The CoxJS event to be published for the throbber.
						 * @param {object} data The object containing configuration options for the throbber, which has the following properties:
						 * @property {object} nodes DOM nodes for the throbber container.
						 */
						if (coxjs.select(".dialog-component-content").closest(".loading-wrapper-active").length > 0)
							coxjs.publish({
								type : "hideThrobber",
								data : {
									nodes : coxjs.select(".dialog-component-content").closest(".loading-wrapper-active")
								}
							});
						// }, 5000);
					}
					// Inject any other content.
					if (options.title != "") coxjs.select(".dialog-component-title", _containers).text(options.title);

					// Reset overflow.
					if (coxjs.select("body.IE").length == 0) {
						coxjs.select("body").css("overflowX", "hidden");
					} else {
						coxjs.select("html").css("overflowX", "hidden");
					}

					// Setup windowDimensions and scrollPosition.
					var windowDimensions = {};
					var scrollPosition = 0;

					// Setup basic window dimensions.
					windowDimensions.w = coxjs.select(window).width();
					windowDimensions.h = coxjs.select(window).height();
					scrollPosition = coxjs.select(window).scrollTop() + coxjs.select(window).height();

					// Reset container width and height.
					// if modal width is greater than container width, reset width to 100% or else to original data-modal-width
					(coxjs.select(window).width() < options.initialWidth) ? _containers.css("width", options.width + "%") : _containers.css("width", options.initialWidth + "px");

					_containers.css("height", (options.height == -1) ? "auto" : options.height + "px");

					//Remodulate the Dialog container dimensions.
					var centerY = Math.round((windowDimensions.h / 2) - (_containers.height() / 2));
					var centerX = Math.round((windowDimensions.w / 2) - (_containers.width() / 2));

					// Reset vertical center if it's negative, because that's above the window top
					// or if container height is less than windows height
					// recalculate vertical center based on scrollPosition, viewPort height and container height
					if (centerY < 0 || _containers.height() < windowDimensions.h && !(_modalOptions.isMobile)) {
						// set top to '0' if container height is greater than window height and there is negligible page scroll
						centerY = ((_containers.height() > windowDimensions.h) && (scrollPosition - windowDimensions.h / 2 < _containers.height() / 2)) ? 0 : scrollPosition - windowDimensions.h / 2 - _containers.height() / 2;
					}

					// Reset container top, left, and display.
					_containers.css("top", centerY + "px");
					_containers.css("left", centerX + "px");
					_containers.css("display", "block");

					// Remodulate the underlay dimensions.
					var biggestHeight = (coxjs.select(".dialog-component").height() > coxjs.select(window).height()) ? coxjs.select(".dialog-component").height() + "px" : coxjs.select(window).height() + "px";
					biggestHeight = (parseInt(biggestHeight) > coxjs.select("body").height() + coxjs.select(window).scrollTop() / 2) ? biggestHeight : coxjs.select("body").height() + coxjs.select(window).scrollTop() / 2 + "px";
					_underlay.css("height", biggestHeight);
					// console.log("___SMT___| window: ", coxjs.select(window).height());console.log("___SMT___| dialog: ", coxjs.select(".dialog-component").height());console.log("___SMT___| body: ", coxjs.select("body").height());console.log("___SMT___| underlay: ", coxjs.select("#underlay").height());
					// Reset container after AJAX completes.
					coxjs.select(document).ajaxComplete(function(event, ajaxResponse, options) {
						var finalHeight = (coxjs.select(window).height() / 2) - (_containers.height() / 2);
						// Reset vertical center if finalHeight is less than zero.
						if (finalHeight < 0 || _containers.height() < coxjs.select(window).height() && !(_modalOptions.isMobile)) {
							// set top to '0' if container height is greater than window height and there is negligible page scroll
							finalHeight = ((_containers.height() > coxjs.select(window).height()) && (scrollPosition - windowDimensions.h / 2 < _containers.height() / 2)) ? 0 : scrollPosition - windowDimensions.h / 2 - _containers.height() / 2;
						}
						_containers.css("top", finalHeight + "px");

						// Remodulate the underlay dimensions AFTER AJAX.
						var biggestHeight = (coxjs.select(".dialog-component").height() > coxjs.select(window).height()) ? coxjs.select(".dialog-component").height() + "px" : coxjs.select(window).height() + "px";
						biggestHeight = (parseInt(biggestHeight) > coxjs.select("body").height() + coxjs.select(window).scrollTop() / 2) ? biggestHeight : coxjs.select("body").height() + coxjs.select(window).scrollTop() / 2 + "px";
						_underlay.css("height", biggestHeight);
						// console.log("___SMT___| window: ", coxjs.select(window).height());console.log("___SMT___| dialog: ", coxjs.select(".dialog-component").height());console.log("___SMT___| body: ", coxjs.select("body").height());console.log("___SMT___| underlay: ", coxjs.select("#underlay").height());
					});

					// if modal launched from mobile, make underlay height same as modal
					if (options.isMobile == true) {
						var setHeight = coxjs.select(".dialog-component").height();
						_underlay.css("height", setHeight);
						coxjs.select("#pf-container").css("display", "none");
						// set window scroll to top in mobile while launching the modal
						window.scrollTo(0, 0);
					}

					//Hides <select> boxes behind the dialog box using a backing iframe
					if (coxjs.select("iframe", _underlay).length != 0) {
						var iframeBacker = coxjs.select("iframe", _underlay);
						iframeBacker.css("top", _containers.offset().top + "px");
						iframeBacker.css("left", _containers.offset().left + "px");
						iframeBacker.css("width", _containers.outerWidth() + "px");
						iframeBacker.css("height", _containers.outerHeight() + "px");
					}
				} else {
					/**
					 * Remove the waiting indicator, because we're closing the modal.
					 *
					 * @event publish
					 * @param {string} hideThrobber Publish a throbber hide request.
					 * @param {string} type The CoxJS event to be published for the throbber.
					 * @param {object} data The object containing configuration options for the throbber, which has the following properties:
					 * @property {object} nodes DOM nodes for the throbber container.
					 */
					coxjs.publish({
						type : "hideThrobber",
						data : {
							nodes : coxjs.select(".dialog-component-content").closest(".loading-wrapper-active")
						}
					});

					// Allow the main page content to print.
					coxjs.select("#pf-container").removeClass("no-print");

					// Cleanup old content.
					_content.html("");
					_content.css("height", "");
					coxjs.select(".dialog-component-title", _containers).text("");
					_modalOptions.title = "";

					// Hide #underlay.
					_underlay.css("display", "none");

					// Remove the specified class(es).
					_containers.removeClass().addClass("dialog-component loading-wrapper");

					// Hide containers.
					_containers.css("display", "none");

					//on click of close button, reset pf-container and underlay styles for mobile
					if (options.isMobile == true) {
						coxjs.select("#pf-container").css("display", "block");
						_underlay.css("height", "auto");
						// reset windowScroll upon close of modal to the same place from where modal was launched
						window.scrollTo(_modalOptions.initialX, _modalOptions.initialY);
					}

					// Reset overflow.
					if (coxjs.select("body.IE").length == 0) {
						coxjs.select("body").css("overflowX", "auto");
					} else {
						coxjs.select("html").css("overflowX", "auto");
					}

					// Reset global _modalOptions.
					_module.modalOptions();
				}

				// Swap ARIA roles for main page and modal.
				coxjs.select("[aria-hidden]").each(function() {
					// console.log("___SMT___| ARIA attribute is: ", coxjs.select(this).attr("aria-hidden"));
					if (coxjs.select(this).attr("aria-hidden") == "true") {
						coxjs.select(this).attr("aria-hidden", "false");
					} else if (coxjs.select(this).attr("aria-hidden") == "false") {
						coxjs.select(this).attr("aria-hidden", "true");
					}
				});
			},
			/**
			 * Poll DOM and populate global _modalOptions.
			 *
			 * When called with no arguments, reset _modalOptions to defaults.
			 * When called with two arguments, prep the _modalOptions for opening the requested modal.
			 * With a third argument, mix that argument into the _modalOptions after polling the DOM.
			 *
			 * @method modalOptions
			 * @param {object} event The event that fired to open the modal.
			 * @param {object} launcher The node manipulated to open modal.
			 * @param {object} options Inline options for this modal.
			 */
			modalOptions : function(event, launcher, options) {
				// With 0 arguments, just reset the global _modalOptions.
				if (arguments.length == 0) {
					/**
					 * The default settings for a modal.
					 *
					 * @member {object} _modalOptions
					 * @property {boolean} enabled Whether this modal is to be opened or closed.
					 * @property {string} requestId The unique identifier for this modal.
					 * @property {object} event The event that generated the modal.
					 * @property {object} launcher The DOM node that generated the modal.
					 * @property {object} containers The DOM nodes for receiving the modal content.
					 * @property {object} content The DOM nodes containing the modal content.
					 * @property {object|string} source Where to find the modal content; a string indicates URL, and object indicates DOM node(s).
					 * @property {string} title The title of the modal.
					 * @property {number} width The width of the modal.
					 * @property {number} height The height of the modal.
					 * @property {string} classes The classes to be applied to the modal.
					 * @property {boolean} disableClose Whether to disable closing the modal using anything BUT the blue button in footer.
					 * @property {boolean} isMobile Whether modal is launched from a mobile device or not.
					 * @property {number} initialX The scrollX position of the launcher.
					 * @property {number} initialY The scrollY position of the launcher.
					 * @property {number} initialWidth The original width of the modal.
					 *
					 */
					_modalOptions = {
						enabled : true,
						requestId : null,
						event : null,
						launcher : null,
						containers : null,
						content : null,
						source : null,
						title : "",
						width : 564,
						height : -1,
						classes : "",
						disableClose : false,
						isMobile : false, //is modal launched from mobile, set to false by default
						initialX : 0,
						initialY : 0,
						initialWidth : 0,
						hasDualLayout : false
					};

					return;
				} else {
					// Otherwise, set the passed event and launcher.
					_modalOptions.event = event;
					_modalOptions.launcher = launcher;

					// Poll _modalOptions for containers and content nodes.
					_modalOptions.containers = coxjs.select(".dialog-component");
					_modalOptions.content = coxjs.select(".dialog-component-content");

					//check if modal is getting launched from mobile based on width
					_modalOptions.isMobile = (coxjs.select(window).width() < 768);

					// modalContentInline variable - set to true or false based on modal content being inline to page
					// set to 'false' by default
					var modalContentInline = false;

					//check if the launching device has different layout in each orientation
					//Trying to target 'Nexus7' and 'Samsung Galaxy Tab' which behave as mobile in 'portrait' and desktop in 'landscape'
					if (window.matchMedia) {
						_modalOptions.hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600;
					}

					// If there is a data-content-element node, it contains the contents' id.
					if (_modalOptions.launcher.attr("data-content-element") != null) {
						_modalOptions.source = coxjs.select("#" + _modalOptions.launcher.attr("data-content-element")).clone(true);
						//if modal content resides within page, set 'var' to true
						modalContentInline = true;
					} else if (_modalOptions.launcher.attr("href") != null) {
						// Grep the path from the link.
						var path = _modalOptions.launcher[0].pathname;

						// Scrub the path to turn it into potential id.
						path = path.replace(/^\//g, "");
						path = path.replace(/\//g, "\-");
						path = path.replace(".", "\\.");
						path = path.replace(";", "");
						path = path.replace("=", "");

						// Use the href for AJAX if there is no node with associated id.
						if (coxjs.select("#" + path).length == 0) {
							_modalOptions.source = _modalOptions.launcher.attr("href");
						} else {
							_modalOptions.source = coxjs.select("#" + path).clone(true);
							//if modal content resides within page, set 'var' to true
							modalContentInline = true;
						}
					}
					// if modal content is inline, check if form element exists
					if (modalContentInline == true) {
						formElement = _modalOptions.source.find("form")[0];
						// reset the 'validator' object's currentForm to the cloned 'form' element
						// By default, it will have the page 'form' element which is incorrect
						if (formElement != undefined) {
							// retrieving the form's validator object and resetting its currentForm
							coxjs.select(formElement).data("validator").currentForm = formElement;
						}
					}
					// Set other options based on DOM.
					// Title taken from 'data-modal-title' if it exists.
					// 10/01/2014 - Discontinued use of 'title' attribute to set modal title as it is used for accessibility
					_modalOptions.title = _modalOptions.launcher.attr("data-modal-title") != null ? _modalOptions.launcher.attr("data-modal-title") : _modalOptions.title;
					_modalOptions.width = _modalOptions.launcher.attr("data-modal-width") != null ? parseInt(_modalOptions.launcher.attr("data-modal-width")) : _modalOptions.width;
					_modalOptions.height = _modalOptions.launcher.attr("data-modal-height") != null ? parseInt(_modalOptions.launcher.attr("data-modal-height")) : _modalOptions.height;

					//if data-modal-class attribute is null then set modal options classes as blank.
					_modalOptions.classes = _modalOptions.launcher.attr("data-modal-class") != null ? _modalOptions.launcher.attr("data-modal-class") : "";
					_modalOptions.disableClose = _modalOptions.launcher.attr("data-disable-close") == "true" ? true : false;

					//If modal width is greater than device width set it to 100%
					if (_modalOptions.width > coxjs.select(window).width()) {
						_modalOptions.width = "100";
					}
					// Mixin runtime options.
					if (arguments.length == 3)
						coxfw.extendObj(_modalOptions, options);
				}
			},
			/**
			 * Tracks Omniture values for every modal, whether launched by click or ".auto-launch".
			 *
			 * @method trackModalLaunch
			 * @param {object} caller The DOM node that generated the modal.
			 */
			trackModalLaunch : function(caller) {
				if ( typeof (__coxOmnitureParams) != "undefined" && typeof (s_account) != "undefined" && s_account != "") {
					var pageName = __coxOmnitureParams ? __coxOmnitureParams.pageName + ":" : "";
					var hier1 = __coxOmnitureParams ? __coxOmnitureParams.hier1 + "," : "";
					var hier2 = __coxOmnitureParams ? __coxOmnitureParams.hier2 + "," : "";
					var localeName = __coxOmnitureParams ? __coxOmnitureParams.localeName + ":" : "";
					// TODO: Investigate why there are parens around 'caller' below.
					var caller = (caller)[0];
					var callerTitle = _modalOptions.title.toLowerCase() || caller.innerHTML.toLowerCase();
					// if link has no title tag grab the link text for fallback
					if (callerTitle) {
						/**
						 * Track usage for this modal.
						 *
						 * @event publish
						 * @param {string} OmnitureInterface Interact with the external Omniture library.
						 * @param {object} data The configuration for the AJAX request with the following properties:
						 * @param {string} data.mode How we want to interact with Omniture.
						 * @param {string} data.type What kind of interaction are we having with Omniture.
						 * @param {string} data.clearVariables A stringified Boolean telling whether to clear the variables or not.
						 * @param {object} data.options The options to configure for this Omniture call.
						 * @param {string} data.options.pageName The name of the page being accessed.
						 * @param {string} data.options.hier1 First heir for this action.
						 * @param {string} data.options.hier2 Second heir for this action.
						 * @param {string} data.options.localePagename The locale name of the page being accessed.
						 */
						coxjs.publish({
							type : "OmnitureInterface",
							data : {
								mode : "track",
								type : "pageview",
								clearVariables : "true",
								options : {
									pageName : pageName + callerTitle,
									hier1 : hier1 + callerTitle,
									hier2 : hier2 + callerTitle,
									localePagename : localeName + pageName + callerTitle
								}
							}
						});
					}
				}
			},

			/**
			 * Resets dimensions for every modal when the orientation of the device changes
			 * Reset modal width, horizontal center and vertical center
			 *
			 * @method resetModalDimensions
			 *
			 */
			resetModalDimensions : function(data) {
				// reset modal dimensions on orientation change if a modal is open
				if (_containers != undefined && _containers.is(':visible')) {
					if (coxjs.select(window).width() >= 768) {
						// set width to 100% if dialog component width is greater than device width
						if (_containers.width() > coxjs.select(window).width() /*||data.orientation == "portrait" */ ) {
							_containers.css("width", "100%");
						} else {
							// set width to original data-modal-width if dialog component width is less than device width
							_containers.css("width", _modalOptions.initialWidth + "px");
							// adjust the horizontal center position based on orientation change
							var centerX = coxjs.select(window).width() / 2 - _containers.width() / 2;
							_containers.css("left", centerX + "px");
						}
						var windowH = coxjs.select(window).height();
						// always adjust the vertical center when orientation changes
						var centerY = windowH / 2 - _containers.height() / 2;
						if (centerY < 0 || _containers.height() < windowH) {
							// set top to '0' if container height is greater than window height and there is negligible page scroll
							centerY = ((_containers.height() > windowH) && (coxjs.select(window).scrollTop() + windowH / 2 < _containers.height() / 2)) ? 0 : coxjs.select(window).scrollTop() + windowH / 2 - _containers.height() / 2;
						}
						_containers.css("top", centerY + "px");
					}
					// reset underlay height, pf-container display if page is launched from devices	having different layout (both mobile and desktop)
					if (_modalOptions.hasDualLayout) {
						coxjs.select("#pf-container").css("display", (data.orientation == "portrait") ? "none" : "block");
						coxjs.select("#underlay").css("height", ((data.orientation == "portrait") ? coxjs.select(".dialog-component").height() : coxjs.select("body").height()) + "px");
						if (data.orientation == "landscape") {
							centerY = _modalOptions.launcher.offset().top + windowH / 2 - _containers.height() / 2;
							_containers.css("top", centerY + "px");
							//reset window scroll position to point from where the modal was launched
							// set a tiny delay, needed to set the scroll correctly in chrome browser
							setTimeout(function() {
								window.scrollTo(0, _modalOptions.launcher.offset().top);
							}, 1);
						}
					}
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * MultiPane Ajax Behaviour
 *
 * @author Santhana Rajagopalan
 * @version 0.1.0.0
 * @module modules.global.MultiPaneAjax
 *
 */
(function(coxfw) {

    coxfw.core.define('modules.global.MultiPaneAjax', function(coxjs) {
        /**
         * Stores a copy of the module context to apply inside methods.
         *
         * @member {object} _module
         */
        var _module;
        /**
         * The common selector for node listener(s).
         *
         * @member {string} _selector
         */
        var _selector = ".multi-ajax";

        /**
         * TODO
         *
         * @member {object} _actionConfig
         */
        var _actionConfig = {
            add: 'Add',
            remove: 'Remove'

        };
        /**
         * Subscriber which listens to each and every ajax publish which is published by multipaneajax
         *
         * @member {object} _multiPaneAjaxSubscriber
         */
        var _multiPaneAjaxSubscriber = {};
        /**
         * The object that manages the Ajax instance.
         *
         * @member {string} _instance
         */
        var _instance = {};
        /**
         * Default Configuration for multiple ajax config.
         *
         * @member {object} _selector
         */
        var _ajaxConfig = {
            type: 'GET',
            dataType: 'text',
            parameters: ''
        };
        /**
         * The element clicked to trigger the show/hide of DIV.
         *
         * @member {object} _trigger
         */
        var _trigger;
        /**
         * Variable that stores the validity of form and pseudo form if present
         *
         * @member {boolean} _formValid
         */
        var _formValid = true;
        return {
            /**
             * Begin listening for coxjs.publish() events to "Accordion".
             *
             * @method init
             */
            init: function() {
                console.log("INIT MultiPaneAjax.js");
                _module = this;
                // Add the following selector to the list of selectors checked on AJAX response.
                coxjs.setXHRSelectors(_selector);
                /**
                 * Create the Accordion.
                 *
                 * @event subscribe
                 * @param {string} create the accordion.
                 */
                coxjs.subscribe({
                    "MultiAjaxStatus": _module.updateAjaxStatus
                });
            },
            /**
             * Execute this module.
             *
             * @method execute
             */
            execute: function() {
                console.log("EXEC MultiPaneAjax.js");
                _module = this;

                /**
                 * Load the list of elements that has to be updated and start the ajax request
                 *
                 * @event click
                 * @param {string} _selector
                 */
                coxjs.select("body").on("click", _selector, function(event) {
                    _trigger = coxjs.select(this);                    
                    if(_trigger.hasClass('disabled')){
                    	return;
                    }
                    // get all the container id's that needs to be updated
                    var noOfAjax = coxjs.select(this).data('multiAjaxTarget');
                    noOfAjax = noOfAjax.match(/\S+/g);
                    // Get the trigger elements config  if present
                    var config = coxjs.select(this).data('multiAjaxConfig');
                    // saving the trigger element parameters                    
                    if (config) {
                    	_module.getAjaxConfig(coxjs.select(this), _ajaxConfig);
                    }
                    // Initializing Ajax Status
                    _module.updateAjaxStatus({
                        isError: false,
                        remainingCalls: noOfAjax.length
                    });
                    _module.showThrobber();
                    // storing the all the elements that needs to be triggered
                    _instance['targetElements'] = noOfAjax;
                    //console.log("***********MULTI AJAX START***********");
                    // Initiating the first call of multiple ajax call
                    _module.makeAjaxCall(_instance['targetElements'].shift());
                });
                //if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("multi-ajax");
            },
            /**
             * Make Ajax Call.
             *
             * @method makeAjaxCall
             * @param {targetId} target Id of the containers.
             */
            makeAjaxCall: function(targetId) {
                //Storing a copy of the object
                var targetElement = coxjs.select("#" + targetId);
                var parameters;
                // reset _formValid parameter
                _formValid = true;
                // looking for target elements config if present
                var config = targetElement.data('multiAjaxConfig');
                var targetUrl = targetElement.data("ajax-source");
                if (config) {
                	config = _module.getAjaxConfig(targetElement, config);
                } else {
                    config = _ajaxConfig;
                }
                
                if(_formValid) {
	                // Ajax Complete and error subscriber
	                _multiPaneAjaxSubscriber[targetId] = function(data) {
	                    var mapId = targetId;
	                    if (!data.isError) {
	                        coxjs.select('#' + targetId).html(data.responseText);
	                        // make subsequent ajax call if present in queue
	                        if (_instance['targetElements'] && _instance['targetElements'].length > 0) {
	                            _module.makeAjaxCall(_instance['targetElements'].shift());
	                        }
	                        _module.updateAjaxStatus({
	                            isError: false,
	                            url: targetUrl
	                        });
	                    } else {
	                        coxjs.select('#' + targetId).html("<p class='col-reset'>" + data.statusText + "</p>");
	                        // TODO Hide Throbber
	                        _module.updateAjaxStatus({
	                            isError: true,
	                            status: data.status,
	                            url: targetUrl
	                        });
	                        _instance = {}
	                        _module.hideThrobber();
	                    }
	                };
	                
	                coxjs.subscribe(_multiPaneAjaxSubscriber);
	      /*          console.log("MULTI AJAX Target: ", targetElement);
	                console.log("MULTI AJAX URL: ", targetElement.data("ajax-source"));
	                console.log("MULTI AJAX CONFIG params: ", config.parameters);*/
	                // Publish Ajax call
	                coxjs.publish({
	                    type: "Ajax",
	                    data: {
	                        container: targetElement,
	                        url: targetElement.data("ajax-source"),
	                        type: config.type,
	                        dataType: config.dataType,
	                        timeout: "30000",
	                        cache: false,
	                        data: config.parameters,
	                        id: targetId
	                    }
	                });                
                } else {
                	_module.hideThrobber();
                }

            },
            /**
             * Manage ajax complete behavior and reset globals
             *
             * @method: updateAjaxStatus
             *
             */
            updateAjaxStatus: function(data) {
                if (!data.isError) {
                    if (data.remainingCalls) {
                        _instance['remainingCalls'] = data.remainingCalls;
                    } else {
                        _instance['remainingCalls'] = parseInt(_instance['remainingCalls']) - 1;
                        if (parseInt(_instance['remainingCalls']) == 0) {

                            _instance = {};
                            _multiPaneAjaxSubscriber = {};
                            coxjs.publish({
                                type: "MultiAjaxComplete",
                                data: {
                                    trigger: _trigger,
                                    url: data.url
                                }
                            });
                            _module.hideThrobber();
                            //console.log("****************MULTI AJAX COMPLETE************");
                        }
                    }
                } else {
                    _instance = {};
                    _formValid = true;
                    _multiPaneAjaxSubscriber = {};
                    // Publish Error occured
            		coxjs.publish({
                        type: "MultiAjaxError",
                        data: {
                            isError: true,
                            status: data.status,
                            url: data.url
                        }
                    });
                }
            },
            /**
             * Striping the necessary parameters from the data-* attribute tags
             * 
             * @method: getAjaxConfig
             * @param: targetElement, defaultConfig
             */
            getAjaxConfig: function(targetElement, defaultConfig) {
            	var config = targetElement.data('multiAjaxConfig'),
            		parameters,
            		currentForm = targetElement;
            	
            	if (config) {
            		defaultConfig['type'] = config['type'] || 'GET';
            		defaultConfig['dataType'] = config['data-type'] || 'text';
                     if (config.paramPassing == 'data') {
                         parameters = targetElement.data('multiAjaxParam');
                         parameters = _module.simpleSanitize(parameters);
                     } else if (config.paramPassing == 'form') {
                         if (targetElement.is('form')) {
                             parameters = targetElement.serialize();
                         } else {
                        	 currentForm = targetElement.find('form');
                             parameters = targetElement.find('form').serialize();                             
                         }
                     } else if (config.paramPassing == 'fakeForm') {
                         currentForm = coxjs.select(targetElement).closest('form');
                         parameters = coxjs.select('input, select, textarea', targetElement).serialize();                         
                     }                     
                     defaultConfig['parameters'] = parameters;
                 }
            	if (currentForm.is('form')){
            		coxjs.select(currentForm).validate();
            		_formValid = coxjs.select('input, select, textarea', targetElement).valid();  
                   // publish the form validity status
            		coxjs.publish({
                        type: "PseudoFormState",
                        data: {
                            valid: _formValid
                        }
                    });
            	}
            	return defaultConfig;
            },
            /**
             * Simple sanity check
             *
             * @method: simpleSanitize
             * @param: data, string that is got from config
             */
            simpleSanitize: function(data) {
                var pattern = new RegExp('javascript:|<\s*script.*?\s*>');
                if (pattern.test(data)) {
                    data = data.replace(pattern, '');
                    return data;
                } else {
                    return data;
                }
            },
            /**
             * Display the waiting indicator.
             *
             * @method showThrobber
             * @param {object} throbber The configuration object for this throbber
             */
            showThrobber: function(throbber) {
                var throbberHtml = "<div class='multi-ajax-throbber-underlay'></div>";

                coxjs.select('body').append(throbberHtml);
                //30px is the height of the spinner image 
                var throbberImagePos = ((coxjs.select(window).height() - 30) / 2) + $(window).scrollTop();
                coxjs.select('.multi-ajax-throbber-underlay').css("backgroundPosition", "center " + throbberImagePos + "px");
                coxjs.select('.multi-ajax-throbber-underlay').css('height', coxjs.select('body').height());
            },
            /**
             * Remove the waiting indicator.
             *
             * @method hideThrobber
             * @param {object} throbber The configuration object for this throbber
             */
            hideThrobber: function(throbber) {
                coxjs.select('.multi-ajax-throbber-underlay').remove();
            },
            /**
             * Callback used when removing a module from the framework.
             *
             * @method destroy
             */
            destroy: function() {}
        };
    });
})(coxfw);/**
 * Publish a message when the user agent changes orientation.
 * 
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.Orientation
 */
(function(coxfw) {
	coxfw.core.define("modules.global.Orientation", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Begins listening for {@link coxfw.coxjs.publish} events to "Orientation".
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT Orientation.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Resets the ".orientation" property on {@link coxjs.browser} when a user agent changes orientation.
				 * 
				 * @event subscribe
				 * @param {string} demoChange What changes the dropdown and tab content.
				 */
				coxjs.subscribe({
					"Orientation" : _module.orientationChange
				});
			},
			/**
			 * Listen for drop-down changes related to tab navigation and switch to the appropriate tab.
			 *
			 * @method execute
			 * @property {object} orientation The MediaQueryList object usd to test orientation.
			 * @property {string} initialDirection which way the device is oriented when the page loads.
			 */
			execute : function() {
console.log("EXEC Orientation.js");
				var orientation;
				var initialDirection = "landscape";

				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Checks for portrait orientation.
				if (window.matchMedia && window.matchMedia('all').addListener) { //add additional check for addListener to circumvent AEM polyfill for matchMedia
					orientation = window.matchMedia("(orientation: portrait)");
					initialDirection = (orientation.matches) ? "portrait" : "landscape";
					/**
					 * Listen for orientation change and do something useful.
					 * 
					 * @event orientationChange
					 * @param {object} orientation Object returned from a window.matchMedia query.  Allows for boolean checking and adding event listening.
					 * @property {string} direction which way the device is oriented.
					 */
					orientation.addListener(function(orientation) {
						var direction = (orientation.matches) ? "portrait" : "landscape";
						/**
						 * Tell the framework which direction the device is oriented.
						 * 
						 * @event publish
						 * @param {string} Orientation Tell the framework what the current orientation is when it changes.
						 * @param {object} data The configuration for the Orientation change with the following properties:
						 * @property {string} orientation Whether the user agent currently browsing is rotated to portrait or landscape orientation.
						 */
						coxjs.publish({
							type : "Orientation",
							data : {
								orientation : direction
							}
						});
					});
				}

				// Set the initial orientation on page load.
				_module.orientationChange({
					orientation : initialDirection
				});
			},
			/**
			 * Update the {@link coxjs.browser} object with the direction the user agent is currently oriented.
			 *
			 * @method orientationChange
			 * @param {object} orientation Which direction the user agent browsing is currently oriented.
			 */
			orientationChange : function(data) {
				coxjs.browser.orientation = data.orientation;
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * Provide site-wide functionality for managing overlays.
 *
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.OverlayOpenClose
 */
(function(coxfw) {
	coxfw.core.define("modules.global.OverlayOpenClose", function(coxjs) {
		/**
		 * Reset all the containers.
		 *
		 * @member {object} _containers
		 */
		var _containers;
		/**
		 * The element clicked to open this overlay.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;
		/**
		 * The next sibling element that contains the overlay content.
		 *
		 * @member {object} _content
		 */
		var _content;
		/**
		 * Property indicating the position of overlay
		 * Set to "top" by default
		 *
		 * @member {String} _position
		 */
		var _position = "top";
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module.
			 *
			 * @method init
			 */
			init : function() {
				// console.log("INIT OverlayOpenClose.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				coxjs.subscribe({
					"Orientation" : _module.resetOverlayDimensions //reset overlay dimensions when orientation change
				});
			},
			/**
			 * Apply .on("click") to all '.overlay-trigger' nodes in 'body', including those added to DOM.  Also manage navigation events as they pertain to overlays.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC OverlayOpenClose.js");
				/**
				 * Prevent clicks inside open overlays from bubbling out and closing the overlay.
				 *
				 * @event click
				 * @param {string} ".overlay-trigger" Nodes intended to open overlays when clicked.
				 */
				coxjs.select("body").on("click touchstart", ".overlay-trigger", function(event) {
					// Assign node clicked to the module's _trigger.
					_trigger = coxjs.select(this);

					_position = _trigger.attr("data-position");
					// Poll content from the next node.
					_content = _trigger.next();

					// Get all containers on the page.
					_containers = coxjs.select(".overlay-container");

					// Initially position the content based on dimensions of trigger.
					_containers.css("top", 0);

					// Initially position the content based on dimensions of trigger.
					_containers.css("left", 0);

					// Hide the content node.
					_containers.removeClass("overlay-open");

					// Stop click bubbling beyond our trigger.
					event.stopPropagation();

					// Prevent the default behavior for the overlay trigger.
					coxjs.preventDefault(event);

					// Initially calculate the top position of the content based on dimensions of trigger.
					var topPosition = _trigger.position().top + parseInt(_trigger.css("padding-top")) + parseInt(_trigger.css("padding-bottom")) + parseInt(_trigger.css("margin-top")) + parseInt(_trigger.css("margin-bottom"));

					//Recalculate top position based on 'data-position' attribute
					var verticalPosition = (_position == "right") ? (topPosition - 10) : (topPosition + _trigger.height() + 10);

					// Set 'top' css
					_content.css("top", (verticalPosition + "px"));

					// Initially position the content based on dimensions of trigger and data-position.
					_content.css("left", (_position == "right") ? (_content.position().left + _trigger.position().left + _trigger.width() + 30 ) : _content.position().left + _trigger.position().left - ((_content.width() + parseInt(_content.css("padding-left")) + parseInt(_content.css("padding-right")) + parseInt(_content.css("margin-left")) + parseInt(_content.css("margin-right"))) / 2) + ((_trigger.width() + parseInt(_trigger.css("padding-left")) + parseInt(_trigger.css("padding-right")) + parseInt(_trigger.css("margin-left")) + parseInt(_trigger.css("margin-right"))) / 2) + "px");

					// Show the content node.
					_content.addClass("overlay-open");
					
					var hasDualLayout;
					//check if the launching device has different layout in each orientation
					//Trying to target 'Nexus7' and 'Samsung Galaxy Tab' which behave as mobile in 'portrait' and desktop in 'landscape'
					if(window.matchMedia){
						hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 
																								         : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600 ;																	
					}

					// If overlay is opened from mobile, there is a chance for part of overlay to get cut as mobile screen is small
					// Hence recalculate left position
					if( window.matchMedia ) {
						if (coxjs.select("body").attr("data-layout") == "mobile" || hasDualLayout == true || window.matchMedia("(orientation : portrait)").matches ) {
							var recalculatedLeftPos;
							// If overlay trigger is nearer to right edge of screen
							if (_trigger.position().left + _trigger.width() / 2 + _content.width() / 2 > coxjs.select(window).width()) {
								var adjustmentVal = (_trigger.position().left + _trigger.width() / 2 + _content.width() / 2) - (coxjs.select(window).width() - 40);
								recalculatedLeftPos = parseInt(_content.css("left")) - adjustmentVal;
							}
							// If overlay trigger is nearer to left edge of screen
							if (parseInt(_content.css("left")) < 0) {
								var adjustmentVal = _content.width() / 2 - _trigger.position().left + _trigger.width() / 2;
								recalculatedLeftPos = parseInt(_content.css("left")) + adjustmentVal;
							}
							_content.css("left", recalculatedLeftPos + "px");
						}
					}
				
					// reset left position of pointer (overlay-container:after) based on overlay container position change
					var pointerPosition = (_trigger.position().left + parseInt(_trigger.css("margin-left")) + _trigger.width() / 2 - parseInt(_content.css("left")) - 15) + "px"; //15 is pointer width/2	
					//delete any existing rule for pointer position and reset it based on new position
					var styleElements = coxjs.select("head").find("style");
					coxjs.each(styleElements, function(i,ele){
						if (ele.innerHTML.indexOf("overlay-open:after") != -1) {
							coxjs.select(ele).remove();
						}
					});					
					coxjs.select('head').append('<style>.overlay-open:after{left:'+pointerPosition+'}</style>');	
					// Hide the header overlays when opening a content overlay.
					coxjs.select(".pf-overlay-active").each(function(index, overlay) {
						coxjs.select(overlay).removeClass("pf-overlay-active");
					});
					
					//set focus to first focusable element in overlay  
					if (coxjs.select(":focusable", ".overlay-open").length > 0) {
						coxjs.select(":focusable", ".overlay-open")[0].focus();
					}
				});
				/**
				 * Prevent clicks inside open overlays from bubbling out and closing the overlay.
				 *
				 * @event click
				 * @param {string} ".overlay-open" The open overlay node.
				 */
				coxjs.select("body").on("click touchstart", ".overlay-open", function(event) {
					if (event.target.type != "submit") {
						event.stopPropagation();
					}
				});
				/**
				 * Remove overlays when user clicks .pf-toggle nodes.
				 *
				 * @event click
				 * @param {string} ".pf-toggle" Navigation nodes that close overlays when clicked.
				 */
				coxjs.select(".pf-toggle").on("click", function(event) {
					coxjs.select(".overlay-container").removeClass("overlay-open");
				});
				/**
				 * Remove overlays when user mouses over .pf-nav-flyout nodes.
				 *
				 * @event mouseover
				 * @param {string} ".pf-nav-flyout" Navigation nodes that close overlays when moused over.
				 */
				coxjs.select(".pf-nav-flyout").on("mouseover", function(event) {
					coxjs.select(".overlay-container").removeClass("overlay-open");
				});
				/**
				 * Remove overlays when user clicks the html node.
				 *
				 * @event click, touchstart, keydown
				 * @param {string} "html" The main HTML node.
				 * 'keydown' event added so overlay gets closed on tabbing, when overlay does not have any focusable item
				 */
				coxjs.select("html").on("click touchstart keydown", function(event) {
					coxjs.select(".overlay-container").removeClass("overlay-open");
				});
				/**
				 * @event keydown
				 *
				 * 
				 * close the overlay on click of 'Esc'
				 * Trap the focus within the overlay container area
				 * If a overlay is within a modal and overlay is open, Escape closes overlay
				 * If an overlay is within a modal but overlay is closed, Escape closes modal
				 * 
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} "overlay-trigger, overlay-open" Overlay trigger or container
				 */
				coxjs.select("body").on("keydown", ".overlay-trigger, .overlay-open", function(event) {		
					// If escape key is pressed, close overlay
					if (event.keyCode == 27){			
						if (!(coxjs.select(this).hasClass("overlay-trigger") && coxjs.select(".overlay-open:visible").length == 0)){
							coxjs.select(".overlay-container").removeClass("overlay-open");	
							coxjs.stopPropagation(event); //stop event from propagating if event was triggered from inside overlay container
							_trigger.focus(); //return focus to overlay trigger. 	
						}																	
					} 					
					else if (coxjs.select(this).hasClass("overlay-open")) { //if any other key is pressed from with in overlay container, manage focus and tab
						// Publish call to manage tabbing inside overlays.
						coxjs.publish({
							type : "FocusManager",
							data : {
								container : this,
								event : event
							}
						});	
					}
					coxjs.stopPropagation(event); // prevent overlay from closing if it has any focusable item.
				}); 
			},

			resetOverlayDimensions : function(data) {
				// execute code only if a overlay is open
				if (coxjs.select(".overlay-open").length > 0) {
					_content = coxjs.select(".overlay-open");
					_trigger = _content.prev();
					var hasDualLayout;
					// Initially calculate the top position of the content based on dimensions of trigger.
					var topPosition = _trigger.position().top + parseInt(_trigger.css("padding-top")) + parseInt(_trigger.css("padding-bottom")) + parseInt(_trigger.css("margin-top")) + parseInt(_trigger.css("margin-bottom"));

					//Recalculate top position based on 'data-position' attribute
					var verticalPosition = (_position == "right") ? (topPosition - 10) : (topPosition + _trigger.height() + 10);

					// Set 'top' css
					_content.css("top", (verticalPosition + "px"));
					
					_content.css("left", (_trigger.position().left + parseInt(_trigger.css("margin-left")) + _trigger.width() / 2 - _content.width() / 2) + "px");
					
					//check if the launching device has different layout in each orientation
					//Trying to target 'Nexus7' and 'Samsung Galaxy Tab' which behave as mobile in 'portrait' and desktop in 'landscape'
					if(window.matchMedia){
						hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 
																								         : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600 ;																	
					}

					//Recalculate positions if mobile
					if (coxjs.select("body").attr("data-layout") == "mobile" || hasDualLayout == true) {
						// Check if overlay-trigger is nearer to right edge
						if (_trigger.position().left + _trigger.width() / 2 + parseInt(_trigger.css("margin-left")) + _content.width() / 2 > coxjs.select(window).width() - 40) {//40 is 20px right + left margin
							var adjustmentVal = (_trigger.position().left + parseInt(_trigger.css("margin-left")) + _trigger.width() / 2 + _content.width() / 2) - (coxjs.select(window).width() - 40 - 10);
							newLeft = parseInt(_content.css("left")) - adjustmentVal;
							_content.css("left", newLeft + "px");
						}
						// Check if overlay-trigger is nearer to left edge
						if (parseInt(_content.css("left")) < 0) {
							var adjustmentVal = _content.width() / 2 - (_trigger.position().left + _trigger.width() / 2);
							newLeft = parseInt(_content.css("left")) + adjustmentVal;
							_content.css("left", newLeft + "px");
						}
						
						//delete any existing rule for pointer position and reset it based on new position
						var styleElements = coxjs.select("head").find("style");
						coxjs.each(styleElements, function(i,ele){
							if (ele.innerHTML.indexOf("overlay-open:after") != -1) {
								coxjs.select(ele).remove();
							}
						});					
						coxjs.select('head').append('<style>.overlay-open:after{left:'+pointerPosition+'}</style>');					
					}
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.global
 * @class Pagination
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.Pagination', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// console.log("INIT Pagination.js");
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC Pagination.js");
				// set the module variable to this object
				_module = this;

				// check if page has pagination element
				_context = coxjs.select(".paging");

				// return if there is no pagination div
				if (_context.length < 1) return; 
				
				// Display "active" page and its neighboring pages.
				_module.showPageNumbers();				
				
				//redisplay active pages on window resize
				coxjs.select(window).resize(function(event){
					_module.showPageNumbers();
				});	
				
				// prevent disabled link click event
				coxjs.select(".paging .disabled").on('click', function(event) {
					event.preventDefault();
				});				
			},
			
			/* *
			 * Function to show page numbers based on active element
			 */
			
			showPageNumbers : function () {
				
				// an array to contain all elements which needs to be displayed
				var showElementArray = [];				
				
				//get viewportWidth, if it's > 960, make it 960 as its the maximum available space for content 
				var viewportWidth = coxjs.select(window).width() > 960 ? 960 : coxjs.select(window).width();				
				
				// container width takes precedence over viewport width if defined 
				var availableWidth = (coxjs.select("div.paging[class^='colspan-']").length > 0) ? coxjs.select("div.paging[class^='colspan-']").width() : viewportWidth;
				
				// subtract 4% margin on each side if browser is mobile and 10px margin on each side if browser is desktop
				availableWidth = (coxjs.select("body").attr("data-layout") == "mobile") ? availableWidth - 0.08*availableWidth : availableWidth - 20;
				
				
				//Calculate width available for the numbers by subtracting arrow widths and spacing from available width 
				var availableWidthForNumbers = availableWidth - 120*2;
				
				//get active element and calculate its width
				var activeElement = coxjs.select(".paging .active").closest("li");
				var activeElementWidth = activeElement.width() + 6; //account 3px spacing on either side of number
								
				// calculate the maximum numbers that can be accommodated
				var maxNumbers = Math.floor(availableWidthForNumbers/ activeElementWidth); 
				maxNumbers = (maxNumbers > 0) ? maxNumbers : 1; //check required to ensure extra small device like iphone also work well
				
				// check returned results array to see if its less or more than max numbers 
				var displayNumbersCount = coxjs.select(".paging ul li").length > maxNumbers ? maxNumbers : coxjs.select(".paging ul li").length;
				
				//set paging widget 'ul' width
				var pageMenuWidth = (displayNumbersCount * activeElementWidth); 
				coxjs.select(".paging ul").css("width", pageMenuWidth + "px");
				
				// retrieve the active 'li' and add it to the array
				var currentElement = activeElement;
				showElementArray.push(activeElement);				
				
				var i = 1; // one element is pushed to array so assign i as 1
				
				//if active 'li' is first child, add consecutive next elements to the array 'showElementArray'
				if(coxjs.select(activeElement).is("li:first-child")) {
					while (i < displayNumbersCount) {
						currentElement = coxjs.select(currentElement).next();
						showElementArray.push(currentElement);					
						i++;
					}
				} 
				// if active 'li' is last child, add consecutive previous elements to the array 'showElementArray'
				else if (coxjs.select(activeElement).is("li:last-child")) {
					while (i < displayNumbersCount) {
						currentElement = coxjs.select(currentElement).prev();
						showElementArray.push(currentElement);					
						i++;
					}
				} 
				// if active 'li' is somewhere in the middle, add both previous and next elements based on activeElement position
				else {
					var startElement = activeElement;
					var endElement = activeElement;
					var indexCount; 
					// loop till 'i' reaches midlength of maxcount that can be displayed and add previous elements to array 'showElementArray' if present
					while(i < displayNumbersCount/2) {						
						if (coxjs.select(startElement).prev().length > 0) {
							startElement = coxjs.select(startElement).prev();
							showElementArray.push(startElement);
							i++;
							indexCount = i;
						} else {
							break; //break if there is no previous element
						}						
					}
					// loop for the rest of the length and add next elements if present
					while (indexCount < displayNumbersCount) {
						if (coxjs.select(endElement).next().length > 0) {
							endElement = coxjs.select(endElement).next();
							showElementArray.push(endElement);
							indexCount++
						} else { //add previous elements otherwise
							startElement = coxjs.select(startElement).prev();
							showElementArray.push(startElement);
							indexCount++;							
						}						
					}					
				}
				
				// first hide all 'li's'
				coxjs.select(".paging ul li").css("display", "none");
			
				// loop through each element and set respective style to show
				coxjs.each(showElementArray, function(index, element) {
					coxjs.select(element).css("display","inline-block");
				});	
				
				if (coxjs.select("body").hasClass("IE")) {
					coxjs.select(".paging .disabled").attr("disabled", "disabled");	
				}
								 
			},			

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.global
 * @class Placeholder
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.Placeholder', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		/**
		 * Stores a copy of the placeholder object.
		 *
		 * @property _placeholder
		 * @type object
		 */
		var _placeholder;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT Placeholder.js");
			},
			/**
			 * Sets the local module object and selects all input fields and loops through all inputs that have placeholder attribute
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC Placeholder.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Have browser generate input element and check for placeholder support.
				var allInputFieldsOnPage = coxjs.select("input");

				// loop over all the input fields and find the ones that have placeholder attribute
				$.each(allInputFieldsOnPage, function(index, value) {
					var inputsWithPlaceholder = coxjs.select(this).attr('placeholder');
					if ( typeof inputsWithPlaceholder !== 'undefined' && inputsWithPlaceholder !== false)
						_module.processPlaceholder(this);
				});

			},

			/**
			 * Identifies if the input field has a user typed value in it or placeholder value
			 * checks for IE to do placholder workaraound
			 * sets input value once blur or focus has been dispatched
			 *
			 * @method processPlaceholder
			 * @param requestObj reference to input field with placeholder
			 */
			processPlaceholder : function(requestObj) {
				// set local context variable to the input object
				var context = requestObj;
				// find the placeholder attribute from the context var and set it to the private placeholder variable
				_placeholder = coxjs.select(context).attr("placeholder");

				var testInput = document.createElement("input");

				// create event listeners for blur and focus on the input fields
				if (!("placeholder" in testInput)) {
					// on input focus
					coxjs.select(context).focus(function(event) {
						_module.placeholderForPassword(this, event);
						_placeholder = coxjs.select(this).attr("placeholder");
						_module.onFocus(this);
					});

					// on input blur
					coxjs.select(context).blur(function(event) {
						_module.placeholderForPassword(this, event);
						_placeholder = coxjs.select(this).attr("placeholder");
						_module.onBlur(this);
					});

					// set default value
					if (context.value == "") {
						coxjs.select(context).toggleClass("placeholder");
						context.value = _placeholder;
					}
				}

			},

			// when user focuses on input field if the value is equal to the placeholder value empty the input field
			onFocus : function(el) {
				if (el.value == _placeholder) {
					coxjs.select(el).toggleClass("placeholder");
					el.value = "";
				}
			},

			// when the user moves his mouse off the input field check if there is a new value if so keep it,
			// else set back with the placeholder value
			onBlur : function(el) {
				if (el.value == "") {
					coxjs.select(el).toggleClass("placeholder");
					el.value = _placeholder;
				}
			},

			// creates placeholder for input type 'password' for IE 9 and below
			placeholderForPassword : function(input, evt) {
				if (input.type == "password") {
					var type = evt.type;
					var labelField = coxjs.select(input).prev();
					var placeholderValue = coxjs.select(input).attr('placeholder');
					if (labelField !== undefined) {
						switch(type) {
							case 'focus':
								coxjs.select(labelField).css('display', 'none');
								break;
							case 'blur':
								if (input.value == "" || input.value == placeholderValue) {
									coxjs.select(labelField).css('display', 'block');
								} else {
									coxjs.select(labelField).css('display', 'none');
								}
								break;
						}
					}
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi & Shilpa Mathadevaru
 * @version 1.2.3
 * @namespace modules.global
 * @class ProductSpinner
 *
 *
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.global.ProductSpinner", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * Stores the step button to be used in multiple places within the module.
		 *
		 * @property _nextStepButton
		 * @type object
		 */
		var _nextStepButton;
		/**
		 * Stores the spinner context to be used in multiple places within the module.
		 *
		 * @property _spinContext
		 * @type object
		 */
		var _spinContext;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT ProductSpinner.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Subscribe to spin requests.
				coxjs.subscribe({
					"ProductSpinner" : _module.startSpinner
				});
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				// console.log("EXEC ProductSpinner.js");
			},

			startSpinner : function(spinRequest) {
				sb = coxjs.select(spinRequest.data.sb);
				sbInputVal = spinRequest.data.val;
				 _spinContext = sb.parents(".spinner");
				_nextStepButton = coxjs.select(".next-step", _spinContext);
				// set spinner value to hidden input
				coxjs.select(".sb-value", _spinContext).val(sbInputVal);				
				// call increment or decrement method depending on clicked button
				switch(spinRequest.type) {
					case "increase":
						_module.incrementSpinBox(spinRequest.data);
						break;

					case "decrease":
						_module.decrementSpinBox(spinRequest.data);
						break;
				}
			},

			// decrease count and hide spinbox content if any
			decrementSpinBox : function(dataObj) {
				
					if (sbInputVal == dataObj.max) {
						coxjs.select(".minibox-max", _spinContext).hide();
						coxjs.select(".sb-content-container", _spinContext).show();
					}

					// check if old spin box input value is greater than the defined 'min' value
					// do not decrement if otherwise
					if (sbInputVal == 0) {
						(dataObj.trigger).addClass("disabled");
						if (coxjs.select(_nextStepButton).is('input')) {
							_nextStepButton.addClass("button-disabled").attr("disabled", "disabled");
						} else {
							_nextStepButton.css("display", "none");
						}
						coxjs.select(".sb-content-1", _spinContext).hide();
					} else if (sbInputVal > dataObj.min && sbInputVal <= dataObj.max) {
						coxjs.select("[data-spin-type='increase']", _spinContext).removeClass("disabled");
						if (coxjs.select(_nextStepButton).is('input')) {
							_nextStepButton.removeClass("button-disabled").removeAttr("disabled");
						} else {
							_nextStepButton.css("display", "inline-block");
						}
						
						// adding class "always-show" if you dont want to hide your boxes on max limit
						if(coxjs.select(".sb-content-container").hasClass("always-show")){
							if ((sbInputVal == dataObj.max)||(sbInputVal < dataObj.max) ) {
								coxjs.select(".sb-content-" + (sbInputVal + 1), _spinContext).hide();
							}
						}
						else{
							if (sbInputVal < dataObj.max) {
								coxjs.select(".sb-content-" + (sbInputVal + 1), _spinContext).hide();
							}
						}
						
					}
				
				// Show content container DIV and hide minibox-max DIV when spinner gets decremented to max value
							
			},

			// increase count and append/show spinbox content if any
			incrementSpinBox : function(dataObj) {
				// check if incremented value is less than 	the defined 'max' value
				// do not increment if otherwise
				if(coxjs.select(".sb-content-container").hasClass("always-show")){
					
					if (sbInputVal <= dataObj.max+1) {
						if (sbInputVal > 1) {
							coxjs.select(".sb-content-" + sbInputVal, _spinContext).show();
						} else {
							coxjs.select("[data-spin-type='decrease']", _spinContext).removeClass("disabled");
							if (coxjs.select(_nextStepButton).is('input')) {
								_nextStepButton.removeClass("button-disabled").removeAttr("disabled");
							} else {
								_nextStepButton.css("display", "inline-block");
							}
							coxjs.select(".sb-content-" + sbInputVal, _spinContext).show();
						}
					} 
					if (sbInputVal == dataObj.max+1) {
						coxjs.select(".minibox-max", _spinContext).show();
						(dataObj.trigger).addClass("disabled");
						if (coxjs.select(_nextStepButton).is('input')) {
							
							coxjs.select(".spinup-tooltip").addClass("btn-help-spinup");
							coxjs.select(".spinup-tooltip-mobile").addClass("btn-help-spinup-mobile");
							coxjs.select("#spin-down").click(function(){
								coxjs.select(".spinup-tooltip").removeClass("btn-help-spinup");
							});
							
							_nextStepButton.addClass("button-disabled").attr("disabled", "disabled");
						} else {
							coxjs.select(".sb-content-container", _spinContext).show();
							_nextStepButton.css("display", "inline-block");
						}

					}
					
				}
				
				else{
					
					if (sbInputVal <= dataObj.max) {
						if (sbInputVal > 1) {
							coxjs.select(".sb-content-" + sbInputVal, _spinContext).show();
						} else {
							coxjs.select("[data-spin-type='decrease']", _spinContext).removeClass("disabled");
							if (coxjs.select(_nextStepButton).is('input')) {
								_nextStepButton.removeClass("button-disabled").removeAttr("disabled");
							} else {
								_nextStepButton.css("display", "inline-block");
							}
							coxjs.select(".sb-content-" + sbInputVal, _spinContext).show();
						}
					} else if (sbInputVal > dataObj.max) {
						coxjs.select(".minibox-max", _spinContext).show();
						(dataObj.trigger).addClass("disabled");
						if (coxjs.select(_nextStepButton).is('input')) {
							
							coxjs.select(".sb-content-container", _spinContext).hide();
							_nextStepButton.addClass("button-disabled").attr("disabled", "disabled");
						} else {
							coxjs.select(".sb-content-container", _spinContext).show();
							_nextStepButton.css("display", "inline-block");
						}

					}
					
				}
				
				
				
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * 
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.global.ProgressiveScroll
 */
(function(coxfw) {
	coxfw.core.define("modules.global.ProgressiveScroll", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		var _selector = ".scroll-active";
		
		var _callAjax = true;
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				
			},
			
			execute : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				
				if(!coxjs.select(_selector)) return;
				
				coxjs.subscribe({
					"initProgressiveScroll" : _module.listenForScrollEvents,
					"ModalLoaded" : _module.modalOpened, 
					"makeAnotherCall" : _module.makeAnotherCall
				});
				
				// Return if this page does not have the required _selector.
				if (coxjs.select(_selector).length < 1) return;

				// Stores a copy of the module context to apply inside methods.
				_module = this;
				
				coxjs.select("body").on("xhr-selectors init-progressiveScroll", _selector, function(event) {
					// get the current browser
					_module.listenForScrollEvents();
				});
				
				
				
				if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("init-progressiveScroll");
			},
			
			modalOpened : function() {
				if(coxjs.select(".cms-dialog .scroll-active")) {
					// get the current browser
					_module.listenForScrollEvents();
				}
			},
			
			listenForScrollEvents : function() {
				var padding = 30;

				coxjs.select(window).scroll(function(){
					var scrollpos = Math.round(coxjs.select(window).scrollTop() + coxjs.select("#pf-footer").height()) + padding;
					var windowheight = Math.round(coxjs.select(document).height() - coxjs.select(window).height());
					
					if(scrollpos > windowheight){
						if(_callAjax) {
							// publish scroll event
							coxjs.publish({
								type : "ProgressiveScroll"
							});
							
							_callAjax = false;
						}
				    }
				});	
			},
			
			makeAnotherCall : function() {
				_callAjax = true;
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi
 * @version 0.1.0.0
 * @namespace modules.global
 * @class PromoFeature
 */
(function(coxfw) {
	coxfw.core.define('modules.global.PromoFeature', function(coxjs) {

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * Stores a boolean value corresponding to launch device layout
		 *
		 * @property _hasDualLayout
		 * @type boolean
		 */
		var _hasDualLayout;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".promo-feature"

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT PromoFeature.js");

				_module = this;
				// calculate and set height on orientation change
				coxjs.subscribe({
					"Orientation" : _module.calculateHeight
				})
			},
			/**
			 * Sets the local module object and sets the private slick variable
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC PromoFeature.js");
				// set the module variable to this object
				_module = this;

				//return if no promo feature is available
				if (!coxjs.select(_selector)[0])
					return;

				if (window.matchMedia) {
					_hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600;
					// if mobile or dual device portrait version, calculate promo feature component DIV height
					if (window.matchMedia("(max-width: 767px)").matches || (_hasDualLayout && window.matchMedia("(orientation : portrait)").matches)) {
						_module.calculateHeight();
					}
				}

				/**
				 * Animate promo feature to open overlay
				 *
				 * @event click, touchstart
				 * @param {string} ".promo-feature-link a" link used to open promo feature overlay
				 */
				coxjs.select("body").on("click touchstart", ".promo-feature-link a", function(e) {
					e.preventDefault();
					// context is the clicked promo feature div
					var context = coxjs.select(this).closest(".promo-feature");
					// IF IE8 or IE9, animate using jquery animate method
					if (coxjs.select("body").hasClass("IE8") || coxjs.select("body").hasClass("IE9")) {
						coxjs.select(".promo-feature-details", context).animate({
							"max-height" : "230px"
						}, 250);
					}
					//'active' class opens the overlay
					coxjs.select(".promo-feature-details", context).removeClass("inactive").addClass("active");
					//set height for mobile
					if (coxjs.select(window).width() < 768) {
						var biggestHeight = coxjs.select(".promo-feature-content", context).height();
						coxjs.select(".promo-feature-details.active", context).css({
							"height" : biggestHeight,
							"max-height" : biggestHeight
						})
					}
					// show the promo feature details link on transition end
					coxjs.select(".promo-feature-details", context).one("webkitTransitionEnd msTransitionEnd transitionend", function(event) {
						coxjs.select(".promo-feature-details-link", context).css("display", "block")
					});
				});

				/**
				 * Animate promo feature to close overlay
				 *
				 * @event click, touchstart
				 * @param {string} ".promo-feature-details-link a" link used to close promo feature overlay
				 */
				coxjs.select("body").on("click touchstart", ".promo-feature-details-link a", function(e) {
					e.preventDefault();
					// context is the clicked promo feature div
					var context = coxjs.select(this).closest(".promo-feature");
					// IF IE8 or IE9, animate using jquery animate method
					if (coxjs.select("body").hasClass("IE8") || coxjs.select("body").hasClass("IE9")) {
						coxjs.select(".promo-feature-details", context).animate({
							"max-height" : 0
						}, 250);
					}
					//'inactive' class closes the overlay
					coxjs.select(".promo-feature-details", context).removeClass("active").addClass("inactive");
					//reset maxHeight for mobile
					if (coxjs.select(window).width() < 768) {
						coxjs.select(".promo-feature-details.inactive", context).css("max-height", "0");
					}
					// hide the promo feature details link on transition end
					coxjs.select(".promo-feature-details", context).one("webkitTransitionEnd msTransitionEnd transitionend", function(event) {
						coxjs.select(".promo-feature-details-link", context).css("display", "none")
					});
				});

			},

			/*
			 *  calculate the height of promo feature visible div and overlay div, set height to whichever is bigger
			 *  applicable only on mobile
			 */
			calculateHeight : function() {
				var promoFeatureList = coxjs.select(".promo-feature");
				if (promoFeatureList.length > 0) {
					coxjs.each(promoFeatureList, function(i, e) {
						var context = coxjs.select(e);
						if (window.matchMedia) {
							// if mobile or dual device portrait version, calculate promo feature component DIV height
							if (window.matchMedia("(max-width: 767px)").matches || (_hasDualLayout && window.matchMedia("(orientation : portrait)").matches)) {
								//remove any previous height value that might have got set
								coxjs.select(".promo-feature, .promo-feature-content, .promo-feature-details", context).removeAttr("style");
								// get new height
								coxjs.select(".promo-feature-details", context).removeClass("inactive");
								var biggestHeight = (coxjs.select(".promo-feature-content", context).height() > coxjs.select(".promo-feature-details", context).height()) ? coxjs.select(".promo-feature-content", context).height() : coxjs.select(".promo-feature-details", context).height();
								biggestHeight = biggestHeight + 28 + "px";
								// add height of link div
								if (!coxjs.select(".promo-feature-details", context).hasClass("active")) {
									coxjs.select(".promo-feature-details", context).addClass("inactive");
								} else {
									coxjs.select(".promo-feature-details.active").css({
										"height" : biggestHeight,
										"max-height" : biggestHeight
									})
								}
								//set css height based on calculations done above
								coxjs.select(".promo-feature, .promo-feature-content", context).css({
									"min-height" : biggestHeight,
									"max-height" : biggestHeight
								})
							} else {
								// remove any previously set height if not mobile
								coxjs.select(".promo-feature, .promo-feature-content, .promo-feature-details", context).removeAttr("style");
							}
						}
					});
				}
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Sudeep Kumar
 * @version 0.1.0.0
 * @namespace modules.global
 * @class RadioBox
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.RadioBox', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT RadioBox.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC RadioBox.js");
				/**
				 * @event click
				 *
				 * Add active-radio on click of required radio box
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".install-options div"
				 */
				coxjs.select("body").on("click", ".radio-boxes", function(event) {
					// Stop default link click.
					coxjs.preventDefault(event);
					_trigger = coxjs.select(this)[0];
					coxjs.select(_trigger).addClass("active-radio");
					coxjs.select(_trigger).siblings().removeClass("active-radio");
					var  activatedValue = coxjs.select(_trigger).children().attr("id");
					var fieldUpdated = coxjs.select(_trigger).attr("class").split(" ")[0];
					coxjs.select(":input."+fieldUpdated).val(activatedValue);
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.global
 * @class RadioBox
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.RealRadioBox', function(coxjs) {

		var _selector = ".group-chooser";

		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				_module = this;

				// handle the body on load if theres an active radio btn
				coxjs.select("body").on("xhr-selectors init-group-choose-block", _selector, function(event) {
					// check if theres a checked radio btn onload
					var radioBtns = coxjs.select(this).find('input[type="radio"]');	
					
					var radioBtnInputField = coxjs.select(this).find('input.choice-value');					
					
					coxjs.select(radioBtns).each(function(index, el) {
						if (coxjs.select(el).attr("checked") == "checked") _module.handleRadioBtnSelection(coxjs.select(el).parent()[0]);
						else _module.clearOutInputField(coxjs.select(el).parent());
					});

					// when user tabs onto radio btn add focused class
					coxjs.select(radioBtns).focus(function(e) {
						var radioBox = coxjs.select(this).parent();
						coxjs.select(radioBox).addClass("focused-choice");
							
					});
					
					// when user tabs into input field inside of radio btn add focused class
					coxjs.select(radioBtnInputField).focus(function(e) {
						var radioBox = coxjs.select(this).parent().parent();
						coxjs.select(radioBox).addClass("focused-choice");	
					});

					// when user tabs off radio btn
					coxjs.select(radioBtns).blur(function(e) {
						var radioBox = coxjs.select(this).parent();
						if (coxjs.select(radioBox).hasClass("focused-choice"))
							coxjs.select(radioBox).removeClass("focused-choice");
						if (coxjs.select(radioBox).hasClass("active-choice"))
							coxjs.select(radioBox).removeClass("focused-choice");
					});
					
					// when user tabs out of input field inside of radio btn add focused class
					coxjs.select(radioBtnInputField).blur(function(e) {
						var radioBox = coxjs.select(this).parent().parent();
						if (coxjs.select(radioBox).hasClass("focused-choice"))
							coxjs.select(radioBox).removeClass("focused-choice");
					});

					// when user selects radio btn
					coxjs.select(radioBtns).change(function(e) {
						var radioBox = coxjs.select(this).parent();
						if (coxjs.select(radioBox).hasClass("active-choice"))
							coxjs.select(radioBox).removeClass("focused-choice");
					});
					
				});

				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("init-group-choose-block");

				// handle when user clicks the radio btn
				coxjs.select("body").on("click", ".group-choice", function(event) {
					// handle the selected radio box and set hidden radio btn value with radio box value
					_module.handleRadioBtnSelection(this);
				});
			},

			handleRadioBtnSelection : function(selectedRadioBox) {
				// get the current radio block
				var currentRadioBlock = coxjs.select(selectedRadioBox).closest(".group-chooser");
				// make current selection focused
				_module.makeInputfieldFocused(selectedRadioBox);

				// get all the radio btns in group
				var radioBtns = coxjs.select(currentRadioBlock).find(".group-choice");

				// loop through radio btns add active class to current radio btn
				coxjs.select(radioBtns).each(function(index, el) {
					if (el == selectedRadioBox) {
						// add active class
						coxjs.select(el).addClass("active-choice");
						// set the current real radio btn to checked = true
						var selectedRadioBtn = coxjs.select(el).find('input[type="radio"]')[0];
						coxjs.select(selectedRadioBtn).prop('checked', 'checked');
						coxjs.select(selectedRadioBtn).attr("checked", "checked");
					} else {
						// remove active class
						coxjs.select(el).removeClass("active-choice");
						// uncheck other radio btns in group
						var nonSelectedRadioBtn = coxjs.select(el).find('input[type="radio"]')[0];
						coxjs.select(nonSelectedRadioBtn).removeAttr("checked");
						// clear out input field inside radio btn
						_module.clearOutInputField(el);
					}
				});
				
				// check for input field inside of radio box
				// make it validate if radio box is selected
				_module.addInputFieldValidation(currentRadioBlock);
				
				//adding publisher 
				//execute after selection of radio box
				coxjs.publish({
					type:"radioBoxActionComplete",
					data : {
					}
				});
			},
			
			addInputFieldValidation : function(radioBlock) {
				var radioValue = coxjs.select(radioBlock).find(".group-choice .choice-value");
				
				coxjs.select(radioValue).each(function(index, el) {
					if (coxjs.select(el).is("input")) {
						var radioBtn = coxjs.select(el).closest(".group-choice").find('input[type="radio"]');
						
						if (coxjs.select(radioBtn).attr("checked") == "checked") coxjs.select(el).addClass("required").removeClass("ignore-validation");
						else coxjs.select(el).removeClass("required").addClass("ignore-validation");
					}
				});
			},
			
			clearOutInputField : function(radioBtn) {
				// clear out input fields
				coxjs.select(radioBtn).find("input.choice-value").val("");
			},
			
			makeInputfieldFocused : function(inputfield) {
				// find current hidden input field (radiobtn)				
				var currentHiddenInput = coxjs.select(inputfield).find("input");
				// manually make it focused for accessibility
				// Disabling this for iPad. Manually setting focus causes fixed elements to jump.
				if(currentHiddenInput.length == 1 && !navigator.userAgent.match(/iPad/i)) {
					coxjs.select(currentHiddenInput).focus();
				}
				
			}, 
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Scott Thompson
 * @version 1.0.0
 * @namespace modules.global
 * @class SearchPromote
 *
 */
(function(coxfw) {
	coxfw.core.define('modules.global.SearchPromote', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The element clicked to trigger the clear search.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * To find out current object.
		 *
		 * @property _context
		 * @type object
		 */
		var _context;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT SearchPromote.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Resets the Recent Searches and YUI autocomplete dropdowns on window resize.
				 * 
				 * @event resize
				 * @param {object} event The event object at the time it was fired.
				 */
				coxjs.select(window).on("resize", function(event) {
					_module.resetDropdowns();
				});
			
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC SearchPromote.js");
				// Return if we don't have any clear search link on the page.
				if (coxjs.select("#search-promote-form").length < 1) return;

				// Set the module variable to this object
				_module = this;

				// Add a class to all .link-list components so the mobile navigation can show/hide them.
				if (coxjs.select(".search-panel").length > 0) {
					coxjs.select(".link-list:not(.search-recent)").addClass("search-link-list");
				}

				// If we have any checked Refine inputs, count them and put that into the Refine badge.
				if (coxjs.select(".search-panel li:first-child + li span").length > 0) {
					var checkedCount = coxjs.select(".search-refine form input:checked").length;
					if (checkedCount > 0) {
						coxjs.select(".search-panel li:first-child + li span").html(checkedCount);
						coxjs.select(".search-panel li:first-child + li span").addClass("showme");
					}
				}

				// Populate Recent Searches list from cookie.
				var _cookieArray = ($.cookie("cox-search-recent-terms") == undefined) ? [] : $.cookie("cox-search-recent-terms").split("|");
				while (_cookieArray.length) {
					var term = _cookieArray.pop();
					coxjs.select(".search-recent ul .search-clear-recent").before(coxjs.select("<li/>", {
						"class" : "col-content"
					}).append(coxjs.select("<a/>", {
						href : "?q=" + term,
						text : term
					})));
				};

				// Clear search input on iPad body touch.
				coxjs.select("body[data-os='ios']").on("touchstart", function(e) {
					// Removing all the search results.
					if ((coxjs.select(e.target).parents(".yui-ac-container, .ui-autocomplete").length == 0) && coxjs.select(document.activeElement).hasClass("search-promote-keyword")) {
						document.activeElement.blur();
					}
				});

				// Clear recent search cookies
				coxjs.select("body").on("click", ".search-clear-recent", function(e) {
					// Clearing the cookie value
					$.cookie("cox-search-recent-terms", "", {
						path : "/"
					});

					// Removing all the search results.
					coxjs.select(".search-recent, .recent-search-dropdown, .ui-helper-hidden-accessible").remove();
				});

				// Function handles showing hiding of multiple DIVs on click of the context element
				coxjs.select("body").on("click", ".panel-trigger", function(e) {
					e.preventDefault();

					// Clear existing .active-panel's, set current to .active-panel.
					coxjs.select(".panel-trigger").removeClass("active-panel");

					// Add the .active-panel class to the clicked node, unless user clicked the "Apply Refinements" link on mobile, where it's applied to the "Results" tab.
					if (coxjs.select(this).hasClass("button")) {
						coxjs.select(".search-panel li:first-child a").addClass("active-panel");
					} else {
						coxjs.select(this).addClass("active-panel");
					}

					// Swap out all the classes specified in the link.
					coxjs.select(coxjs.select(this).attr("data-hide-div")).removeClass("active-panel");
					coxjs.select(coxjs.select(this).attr("data-show-div")).addClass("active-panel");
				});

				// Create the Recent Searches cookie on submit of the search terms.
				coxjs.select("body").on("submit", "#search-promote-form", function(e) {
					var keyWordInput = coxjs.select(".search-promote-keyword", this);
					var keyWordValue = coxjs.select(keyWordInput).val();
					_module.updateCookie(keyWordValue);
					if (keyWordInput.data('ui-autocomplete') != undefined) {
						keyWordInput.autocomplete("close");
					}
				});
				
				// Create the Recent Searches cookie from the Did you mean text string.
				coxjs.select("body").on("click", ".similar a", function(e) {
					var keyWordValue = coxjs.select(this).text();
					_module.updateCookie(keyWordValue);
				});

				// Recent Searches Dropdown.
				coxjs.select("body").on("focus", ".search-promote-keyword", function(e) {
					var _cookieArray = (($.cookie("cox-search-recent-terms") == undefined) || ($.cookie("cox-search-recent-terms") == "")) ? [] : $.cookie("cox-search-recent-terms").split("|").reverse();

					// Add the "Clear History" item to the Autocomplete source if there are any terms.
					if (_cookieArray.length > 0) {
						_cookieArray.push({
							label : "Clear History",
							value : true
						});
					}

					// If YUI AutoComplete results open, we focused from a selection there, so keep the input and...
					if ("acObj" in window) {
						if (!acObj.isContainerOpen()) coxjs.select(this).val("");
					}

					// ...initiate an instant autocomplete search, with our cookie as the source.
					coxjs.select(this).autocomplete({
						source : function(request, response) {
							// We only want to show the Recent Searches dropdown if the filter request.term has no length.
							if (request.term.length < 1) {
								response(_cookieArray);
							}
						},
						minLength : 0,
						focus : function(event, ui) {
							if ((ui.item.label == "Clear History") && (ui.item.value === true)) {
								coxjs.select(this).val("");
								return false;
							}
						},
						select : function(event, ui) {
							if ((ui.item.label == "Clear History") && (ui.item.value === true)) {
								return false;
							} else {
								coxjs.select(this).val(ui.item.value);
								this.form.submit();
							}
						},
						open : function(event, ui) {
							coxjs.select(".ui-autocomplete").addClass("recent-search-dropdown");
						},
						create : function(event, ui) {
							coxjs.select(this).data("ui-autocomplete")._renderItem = function(ul, item) {
								if ((item.label == "Clear History") && (item.value === true)) {
									return coxjs.select("<li/>", {
										text : item.label,
										"class" : "search-clear-recent"
									}).append(coxjs.select("<a/>", {
										href : "#",
										html : "&nbsp;",
										title : "Click to remove all recent terms."
									})).appendTo(ul);
								} else {
									return coxjs.select("<li/>", {
										text : item.label
									}).bind("click", function(e) {
										coxjs.select(".search-promote-keyword").val(item.value);
									}).append(coxjs.select("<a/>", {
										href : "#",
										html : "&nbsp;",
										title : "Click to remove '" + item.label + "'",
										"data-term" : item.value
									}).bind("click", function(event) {
										var keyWordValue = coxjs.select(this).data("term");
										var keyWordIndex = coxjs.inArray(keyWordValue, _cookieArray);

										// Stop default behavior.
										event.preventDefault();
										event.stopPropagation();

										// Make sure the term is in the cookie...
										if (keyWordIndex !== -1) {
											// ...then pop off the last item, since it's there for the "Clear History" list item...
											_cookieArray.pop();

											// ...splice it out and rewrite the cookie...
											_cookieArray.splice(keyWordIndex, 1);
											$.cookie("cox-search-recent-terms", _cookieArray.join("|"), {
												expires : 365,
												path : "/"
											});

											// ...remove it from the Recent Terms dropdown...
											coxjs.select(this).parents("li").remove();

											// ...and, finally...
											if (_cookieArray.length > 0) {
												// ...clear the individual item from the Recent Searches list.
												coxjs.select(".search-recent ul li a:contains('" + keyWordValue + "')").each(function() {
													coxjs.select(this).parents("li").remove();
												});
											} else {
												// ...OR remove the Recent Searches lists.
												coxjs.select(".search-recent, .recent-search-dropdown, .ui-helper-hidden-accessible").remove();
											}
										}
									})).appendTo(ul);
								}
							};
						}
					}).bind("focus", function() {
						coxjs.select(this).autocomplete("search");
					});
				});

				// Remove the Recent Searches dropdown if we've typed any characters into the search input.
				coxjs.select("body").on("keyup", ".search-promote-keyword", function(e) {
					if ((this.value.length > 0) && (e.keyCode != "38") && (e.keyCode != "40")) {
						coxjs.select(this).autocomplete("close");
					}
				});

				// Redirecting to Result page after clicking on checkbox.
				coxjs.select("body").on("click", ".search-refine input", function(e) {
					var refineResultURL = coxjs.select(this).val();

					// Inject the throbber nodes,...
					coxjs.select(this).parents(".section-container").addClass("loading-wrapper").prepend(coxjs.select("<div/>", {
						"class" : "loader"
					}));

					// ...publish the Throbber,...
					coxjs.publish({
						type : "showThrobber",
						data : {
							'nodes' : coxjs.select(this).parents(".loading-wrapper")
						}
					});

					// ...and finally, navigate to the checkbox URL.
					location.href = refineResultURL;
				});
			},
			
			/**
			 * Update the cookie when the new search terms (for the input or Did you mean link click)
			 *
			 * @method updateCookie
			 */
			updateCookie : function(keyWordValue) {
				var cookieValue = "";
				var _cookieArray = (($.cookie("cox-search-recent-terms") == undefined) || ($.cookie("cox-search-recent-terms") == "")) ? [] : $.cookie("cox-search-recent-terms").split("|");

				// If we don't have it already, remove the first, append the current search terms...
				if (coxjs.inArray(keyWordValue, _cookieArray) === -1) {
					if (_cookieArray.length == 5) {
						_cookieArray.shift();
					}
					
					//Check for leading and trailing pipes and remove them. Also, don't add blank search keywords to the cookie
					var searchKeyword = keyWordValue.split("|");
					for(var i = 0 ; i < searchKeyword.length ; i++)	{
						if( searchKeyword[i].trim() != "")
							_cookieArray.push(searchKeyword[i]);
					}
					
					cookieValue = _cookieArray.join("|");

					// ...and write out the new cookie.
					$.cookie("cox-search-recent-terms", cookieValue, {
						expires : 365,
						path : "/"
					});
				}
			},
			/**
			 * Reset the dropdowns when the browser resizes.
			 *
			 * @method resetDropdowns
			 * @param {object} data Data passed into this function from publisher.
			 */
			resetDropdowns : function(data) {
				var keywordInput = coxjs.select(".search-promote-keyword");
				if ((keywordInput.data('ui-autocomplete') != undefined) && (keywordInput[0] !== document.activeElement)) {
					keywordInput.autocomplete("close");
				}
				if (window["acObj"]) acObj.collapseContainer();
			},
			/*
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Nimesh Shroti
 * @version 0.1.0.0
 * @namespace modules.global.SingleToggle
 * @class SingleToggle
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.SingleToggle', function(coxjs) {
		/**
		 * The element clicked to trigger the toggle event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".single-toggle";

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// console.log("INIT SingleToggle.js");
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC SingleToggle.js");
				/**
				 * @event xhr-selectors
				 *
				 * Attach mask to any data-mask attribute.
				 *
				 * @param {selector} _selector Node intended to receive masking
				 */
					
				coxjs.select("body").on("xhr-selectors", _selector, function(event) {
					coxjs.select((".toggle-div")).slideToggle(1);
				});
				/**
				 * @event click
				 *
				 * Expand the div on click of required class.
				 *
				 * @param {selector} "body" The parent container to listen within
				 */
				 
                 coxjs.select("body").on("click", ".toggle-single-click", function(event) {
					// Stop default link click.
					coxjs.preventDefault(event);
					_trigger = coxjs.select(this);
					if (_trigger.hasClass("expand-view")) {
						_trigger.removeClass('expand-view').addClass('collapse-view');
			        } else if (_trigger.hasClass('collapse-view')) {
			        	_trigger.removeClass('collapse-view').addClass('expand-view');
			        } else {
			        	_trigger.addClass('expand-view');
			        }
					if(coxjs.select(_trigger).parents(".toggle-container")){
						var toggleContainer = coxjs.select(_trigger).parents(".toggle-container");
						coxjs.select(".toggle-div", toggleContainer).slideToggle(500, function(){
							//to resolve hasLayout issue in IE8
							setTimeout(function() {
								if (coxjs.select("body.IE8").length > 0) 
									coxjs.select(toggleContainer).parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");  
							},0);
														
						});
						
					} else{
						coxjs.select((".toggle-div")).slideToggle(500);
					}
					
				});
                 
                 /**
 				 * @event load
 				 *
 				 * Trigger "xhr-selectors" if `_selector` exists when the DOM is loaded.
 				 *
 				 * @param {selector} _selector Nodes intended to init mask library.
 				 */
 				if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("xhr-selectors");
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Mayank Kothari
 * @version 0.1.0.0
 * @namespace modules.global
 * @class SlickSlider
 */
(function(coxfw) {
	coxfw.core.define('modules.global.SlickSlider', function(coxjs) {
		/**
		 * Stores a copy of the slick object from jquery library
		 *
		 * @property _slider
		 * @type object
		 */
		var _slider;
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * Stores a boolean value corresponding to launch device layout
		 *
		 * @property _hasDualLayout
		 * @type boolean
		 */
		var _hasDualLayout;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				/* TODO: Implement orientation change re-initialisation */

				_module = this;
				
				// reinitialize slick from other module
				coxjs.subscribe({
					"ReinitializeSlick" : _module.getSliderOptions
				})
			},
			/**
			 * Sets the local module object and sets the private slick variable
			 *
			 * @method execute
			 */
			execute : function() {
				// set the module variable to this object
				_module = this;
				/* TODO Comments*/
				if (window.matchMedia) {
					_hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600;
					// add the slick-carousel class to the tab if data layout is mobile.
					if (coxjs.select(".tab")) {
						if (coxjs.select(window).width() < 768 || ((_hasDualLayout) && window.matchMedia("(orientation : portrait)").matches )) {
							coxjs.select(".tab").addClass("slick-carousel");
						}
					}					
				}			

				// set the slick variable to the slider object in the DOM
				_slider = coxjs.select(".slick-carousel");

				// Leave if we don't have any .carousel-container's on the page.
				if (_slider.length < 1)
					return;
				_slider.each(function(sliderIndex, sliderElement) {
					var slider = coxjs.select(sliderElement);
					_module.getSliderOptions(slider);
				});

			},

			getSliderOptions : function(slider) {
				var slidesToShow = slider.attr("data-show-slides");
				var centerMode = false;
				var centerPadding = "";
				// set slider for offer comparison so that all plans section is excluded. default for others
				var slide = (slider.hasClass("offer-comparison-container")) ? 'div.offer-comparison' : '';
				
				// store offer comparisons all plans section if present
				var allOffersSection = coxjs.select(".all-plans", slider);
				
				
				/* Fix for defect - Offer Comparison in Accordion collapses */
				//get slider width to check if it is 0
				// if slider is present inside parent element like accordion which is displayed none, slider width gets set as 0
				if (slider.width() == 0) {
					var accordionObj = slider.closest(".accordion-panel"); // on initial load accordion panel is closed
					if (accordionObj.length > 0) {
						// set display to block so slick slider width gets calculated correctly based on accordion parent
						accordionObj.css({
							"display" : "block",							
							"height" : "0px"
						});
					}
				}		

				slider.slick({
					dots : true,
					infinite: false,
					slide : slide,
					slidesToShow : parseInt(slidesToShow),
					slidesToScroll : parseInt(slidesToShow),
					centerMode : centerMode,
					prevArrow : '<a data-role="none" class="slick-prev" aria-label="previous">Previous</a>',
					nextArrow : '<a data-role="none" class="slick-next" aria-label="next">Next</a>',
					responsive : (slider.parents(".tab-component").length > 0) ? null : [	
						{
							breakpoint : 767,
							settings : {
								slidesToShow : slider.hasClass("on-demand") || slider.hasClass("external-search-navigation")  ? 3 : 1,
								slidesToScroll : slider.hasClass("on-demand") || slider.hasClass("external-search-navigation") ? 3 : 1,
								infinite : slider.hasClass("on-demand") ? true : false,
								centerMode: slider.hasClass("on-demand") ? true : false		
							}
						},
						{
							breakpoint : 480,
							settings : {
								slidesToShow : slider.hasClass("external-search-navigation") ? 3 : 1, 
								slidesToScroll : slider.hasClass("external-search-navigation") ? 3 : 1, 
								infinite : slider.hasClass("on-demand") ? true : false,
								centerMode: slider.hasClass("on-demand") ? true : false,
								centerPadding: slider.hasClass("on-demand") ? "23%" : ''														
							}
						}				
					]
				});

				// Add clicking of content triggers for the Tabs component.
				if (slider.parents(".tab-component").length > 0) {
					slider.on("afterChange", function(event, slick, currentSlide) {
						coxjs.select("a", coxjs.select(slick.$slides[currentSlide])[0]).click();
					});
				}
				
				// Fix for Adobe defect begins 
				/* 				 
				 *  Offer Comparison Module
				 * Requirement : 'all-plans' node should be static and not slide, hence 'slide' property was defined separately using selector 'offer-comparison'
				 * Issue : Slick slider when responding to breakpoints destroys all nodes and readds them. During readdition, only nodes defined in 'slide' property gets added
				 * 		   So the 'all-plans' section disappears. 
				 * Fix:    Fix is to store the node and append it after Slick loads or responds to breakpoint	
				 * TODO: Move the fix outside of slick slider
				 * */
				if (slider.hasClass("offer-comparison-container")) {
					// append the 'all-plans' section only for mobile device on load as desktop is not affected during load
					if (coxjs.select("body").attr("data-layout") == "mobile") {
						slider.append(allOffersSection);
					}	
					// Append the 'all-plans' section everytime slick responds to the breakpoint and changes 			
					slider.on("afterChange", function(event, slick, currentSlide) {						
							slider.append(allOffersSection);															
					});
				}
				// Fix for Adobe defect ends 
			},

 
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * 
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.global.Slider
 */
(function(coxfw) {
	coxfw.core.define('modules.global.Slider', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".slider";

		return {
			/**
			 * 
			 * @method init
			 */
			init : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Initialize slider when init-slider is dispatched.
				 *
				 * @event xhr-selectors
				 * @param {string} "init-slider" slider to when loaded via AJAX.
				 */
				coxjs.select("body").on("xhr-selectors init-slider", _selector, function(event) {
					// set current slider
					var currentSlider = coxjs.select(this);
					// set default values
					var minValue = 0;
					var maxValue = 100;
					// check if values are set on slider element
					if(coxjs.select(currentSlider).attr("data-min-value")) minValue = Number(coxjs.select(currentSlider).attr("data-min-value"));
					if(coxjs.select(currentSlider).attr("data-max-value")) maxValue = Number(coxjs.select(currentSlider).attr("data-max-value"));
					// set slider with values and listen for change event
					currentSlider.slider({ min: minValue, max: maxValue,
						slide: function(event, ui ){
							console.log(ui.value);	
						}
					});
				});
				
				if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("init-slider");
			},
			

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * Adds Social Sharing to any page containing a social-share container class.
 *
 * @author Robert Sekman
 * @version 0.1.0.0
 * @module modules.global.SocialShare
 */
(function(coxfw) {
	coxfw.core.define('modules.global.SocialShare', function(coxjs) {
		/**
		 * The element works with onload event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {

			},

			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				// Store a copy of module context.
				_module = this;

				// grab the social-container div on the page
				var socialContainer = coxjs.select('.social-container');

				// preventing the console noise about this not existing. FB does auto create if not present.
				coxjs.select(socialContainer).append('<div id="fb-root"></div>');

				// only run this if the social-container div exists on the page
				if (socialContainer.length) {
					// create the list
					var socialLinks = coxjs.select("<ul/>", {
						"class" : "social-links"
					});

					// create the wrapper ul
					coxjs.select(this).next('.social-container').html(socialLinks);

					// Facebook (https://developers.facebook.com/docs/plugins/share-button)
					coxjs.select(socialLinks).append('<li><div class="fb-share-button" data-layout="button"></div></li>');
					_module.loadFacebook();

					// Twitter (https://dev.twitter.com/web/tweet-button)
					coxjs.select(socialLinks).append('<li><a href="https://twitter.com/share" class="twitter-share-button" data-count="none"></a></li>');
					_module.loadTwitter();

					// Google Plus (https://developers.google.com/+/web/+1button/)
					coxjs.select(socialLinks).append('<li><div class="g-plusone" data-annotation="none" data-size="medium"></div></li>');
					_module.loadGooglePlus();

					// add all the social items to the wrapper ul
					coxjs.select(socialContainer).append(socialLinks);
				}

			},

			/**
			 * Load the Twitter API library
			 *
			 * @method loadTwitter
			 */
			loadTwitter : function() {
				window.twttr = ( function(d, s, id) {
					var js, fjs = d.getElementsByTagName(s)[0], t = window.twttr || {};
					if (d.getElementById(id))
						return t;
					js = d.createElement(s);
					js.id = id;
					js.src = "https://platform.twitter.com/widgets.js";
					fjs.parentNode.insertBefore(js, fjs);

					t._e = [];
					t.ready = function(f) {
						t._e.push(f);
					};

					return t;
				}(document, "script", "twitter-wjs"));
			},

			/**
			 * Load the Facebook API library
			 *
			 * @method loadFacebook
			 */
			loadFacebook : function() {
				( function(d, s, id) {
					var js, fjs = d.getElementsByTagName(s)[0];
					if (d.getElementById(id))
						return;
					js = d.createElement(s);
					js.id = id;
					js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.3&appId=460929994057868"; // Cox appId from Adam Naide
					fjs.parentNode.insertBefore(js, fjs);
				}(document, 'script', 'facebook-jssdk'));
			},

			/**
			 * Load the Google+ API library
			 *
			 * @method loadGooglePlus
			 */
			loadGooglePlus : function() {
				if ( typeof (gapi) != 'undefined') {
					coxjs.select(".g-plusone").each(function() {
						gapi.plusone.render(coxjs.select(this).get(0));
					});
				} else {
					coxjs.getScript('https://apis.google.com/js/platform.js');
				}
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * Allows data tables to be sortable by clicking on the header.
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.global.SortTable
 */
(function(coxfw) {
	coxfw.core.define("modules.global.SortTable", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(".tablesorter, .tablesorter table");
			},
			/**
			 * Check for table with .tablesorter class.
			 *
			 * @method execute
			 */
			execute : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Apply sorting capabilities to table.tablesorter nodes in-page or AJAX response.
				 *
				 * @event xhr-selectors
				 * @param {string} ".tablesorter" Add Sorting capability when this class is on table element.
				 */
				coxjs.select("body").on("xhr-selectors", ".tablesorter, .tablesorter table", function(event) {
					// Local copy of the table being sorted.
					var table = coxjs.select(this);
					
					// Check if any of the headings have a .no-sorting class and configure them to NOT be sortable.
					var noSorting = {};
					coxjs.select("th.no-sorting", this).each(function() {
						noSorting[this.cellIndex] = { sorter: false };
					});

					// Sort table using tablesorter plugin, pass params to sort in ascending or descending order.
					coxjs.select(table).tablesorter({
						cssAsc:"sort-asc",
						cssDesc:"sort-desc",
						textExtraction: function(node) { 
							if(coxjs.select(node).text().indexOf("/") != -1){
								var strWithDate = coxjs.select(node).text();
								return strWithDate.replace("/", " "); 
							}else{
								var removeDollarSign = coxjs.select(node).text().replace(/[,$]/g,'');
								var removeNegativeBracket = removeDollarSign.replace("(", "-"); 
								return removeNegativeBracket.replace(")", ""); 
							}
						},
						headers: noSorting
					}); 
				});
				/**
				 * Trigger "xhr-selectors" if any .tablesorter node exists when the DOM is loaded.
				 *
				 * @event load
				 * @param {string} ".tablesorter" Add Sorting capability when this class is on table element
				 */
				if (coxjs.select(".tablesorter, .tablesorter table").length > 0) coxjs.select(".tablesorter, .tablesorter table").trigger("xhr-selectors");
				/**
				 * Change header anchor title to reflect current sort direction for accessibility.
				 *
				 * @event sortEnd
				 * @param {string} ".tablesorter th.header" The header clicked to initiate the sorting.
				 */
				coxjs.select(".tablesorter, .tablesorter table").on("sortEnd", function(something) {
					coxjs.select(".tablesorter thead tr th.header").each(function(another) {
						var column = coxjs.select(this);
						var asc = column.is(".sort-asc");
						var desc = column.is(".sort-desc");

						// Grab the span.readme visually hidden node and remove original ARIA message.
						var anchor = coxjs.select("a", this)[0];
						anchor.title = anchor.title.replace(/ - Sort .*/g, "");

						// Reset the ARIA message based on current direction of sort.
						if (asc) {
							anchor.title += " - Sort Ascending";
						} else if (desc) {
							anchor.title += " - Sort Descending";
						}
					});
				});
			},
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.global
 * @class Spinner
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.Spinner', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The element clicked to trigger the spinbox.
		 * It could be either the up or down button.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// console.log("INIT Spinner.js");
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC Spinner.js");
				// set the module variable to this object
				_module = this;

				/**
				 * @event click
				 *
				 *
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".sb-button" Node used to either increase or decrease the count.
				 */
				coxjs.select("body").on("click", ".sb-button", function(event) {
					_trigger = coxjs.select(this);
					_module.getSpinBoxConfigs();
				});
			},

			getSpinBoxConfigs : function() {
				var spinType = _trigger.attr("data-spin-type");
				_context = _trigger.closest(".sb-wrapper");
				var sb = coxjs.select(".sb-input", _context)[0];
				var min = (sb.getAttribute("min")) ? Number(sb.getAttribute("min")) : null;
				var max = (sb.getAttribute("max")) ? Number(sb.getAttribute("max")) : null;
				var step = (sb.getAttribute("step")) ? Number(sb.getAttribute("step")) : 1;
				var sbInputVal = Number(coxjs.trim(sb.innerHTML));

				// call increment or decrement method depending on clicked button
				switch(spinType) {
					case "increase":
						if (sbInputVal <= max) {
							sbInputVal = sbInputVal + step;
							sb.innerHTML = sbInputVal;
						}
						break;

					case "decrease":
						if (sbInputVal > min) {
							sbInputVal = sbInputVal - step;
							sb.innerHTML = sbInputVal;
						}
						break;
				}

				coxjs.publish({
					type : "ProductSpinner",
					data : {
						type : spinType,
						data : {
							trigger : _trigger,
							sb : sb,
							min : min,
							max : max,
							step : step,
							val : sbInputVal
						}
					}
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * A jQuery plugin that makes large tables more usable by having the table header stick to the top of the screen when scrolling.
 * Based on https://github.com/jmosbech/StickyTableHeaders
 *
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.StickyHeader
 */
(function(coxfw) {
	coxfw.core.define("modules.global.StickyHeader", function(coxjs) {
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".sticky-header";
		/**
		 * The table header that needs to be sticky.
		 *
		 * @member {object} _trigger
		 */
		var _trigger;

		return {
			/**
			 * Nothing to initialize for this module.  This is a placeholder to make sure this module is a {@link coxfw.core.validConstructor}.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT StickyHeader.js");
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},
			/**
			 * Setup and handle tables with sticky headers.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC StickyHeader.js");
				/**
				 * @event xhr-selectors
				 *
				 * Attach sticky code to any sticky-header table.
				 *
				 * @param {selector} _selector Node intended to receive sticky treatment
				 */

				coxjs.select("body").on("xhr-selectors", _selector, function(event) {
					_trigger = coxjs.select(this);

					// Get out of here if we don't have a .sticky-header node.
					if (_trigger.length == 0)
						return;

					// Make the _trigger sticky.
					_trigger.stickyTableHeaders();
				});

				/**
				 * @event load
				 *
				 * Trigger "xhr-selectors" if `_selector` exists when the DOM is loaded.
				 *
				 * @param {selector} _selector Nodes intended to init sticky header.
				 */
				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("xhr-selectors");
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.global
 * @class ToggleDiv
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.global.ToggleDiv', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The element clicked to trigger the show/hide of DIV.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * The parent node for the widget that provides context for other node selections.
		 *
		 * @property _context
		 * @type object
		 */
		var _context;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				_module = this;

				// Subscribe to toggle requests.
				coxjs.subscribe({
					"ToggleDiv" : _module.toggleDiv
				});
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {

				// set the module variable to this object
				_module = this;

				/**
				 * @event click
				 *
				 *
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".showhide-trigger" Node used to either increase or decrease the count.
				 */
				coxjs.select("body").on("click", ".showhide-trigger", function(event) {					
					_trigger = coxjs.select(this);
					_context = (_trigger.parents(".dialog-component").length > 0) ? _trigger.parents(".dialog-component") : _trigger.parents(".toggle-container");
					//to prevent the default event
					if(coxjs.select(_trigger).prop("tagName") == 'A') {
						coxjs.preventDefault(event);						
					}					
					
					coxjs.publish({
						type : "ToggleDiv",
						data : {
							element : _trigger[0],
							context : _context[0]
						}
					});
				});
			},

			toggleDiv : function(dataObj) {
				switch (dataObj.element.tagName) {
					case "SELECT":
						// For Dropdown - Code needs to be added

						break;

					case "A":
						// For Anchor Element
						_module.showHideMultipleDivs(dataObj.element, dataObj.context);
						break;

					case "INPUT":
						// For Input Element 
						var elementType = coxjs.select(dataObj.element).attr("type");

						if (elementType == "radio") {
							_module.showHideMultipleDivs(dataObj.element, dataObj.context);
						} else if (elementType == "checkbox") {
							var showChkBox = coxjs.select(dataObj.element).attr("data-show-chkBox");
							var elmDiv = coxjs.select("." +showChkBox, dataObj.context);
							if (coxjs.select(dataObj.element).prop("checked") == true) {
								_module.showMultipleDivs(elmDiv);
							} else {
								_module.hideMultipleDivs(elmDiv);
							}
						}					
						break;
						
					case "DIV":
						// For Anchor Element
						_module.showHideMultipleDivs(dataObj.element, dataObj.context);
						break;
				}
			},

			// hide/show multiple divs on click of trigger element of context element
			showHideMultipleDivs : function(element, context) {
				// IE8 Fix: Set parent container to zoom:1 so DOM resize happens correctly when dynamic elements get loaded.
				coxjs.select(context).css("zoom", "1");
				// Find list of all DIV elements to be hidden
				var hideDivElements = coxjs.select(element).attr("data-hide-div");
				if (hideDivElements != null) {
					var arrHideDivElms = hideDivElements.split(" ");
					if (arrHideDivElms != null) {
						coxjs.each(arrHideDivElms, function(i, val) {
							var elmDiv = coxjs.select("." + val, context);
							_module.hideMultipleDivs(elmDiv);
						});
					}
				}
				// Find list of all DIV elements to be shown
				var showDivElements = coxjs.select(element).attr("data-show-div");
				if (showDivElements != null) {
					var arrShowDivElms = showDivElements.split(" ");
					if (arrShowDivElms != null) {
						coxjs.each(arrShowDivElms, function(i, val) {
							var elmDiv = coxjs.select("." + val, context);
							_module.showMultipleDivs(elmDiv);
						});
					}
				}
			},

			//hides the div element. Adds .ignore-validation class to the required field and if .error and .error-wrapper class then removes them
			hideMultipleDivs : function(hideElementDiv) {
				coxjs.select(hideElementDiv).hide();
				var divContentElements = coxjs.select(".required", hideElementDiv);
				if (divContentElements != null && divContentElements.length != 0) {
					coxjs.each(divContentElements, function(i, val) {
						coxjs.select(val).addClass("ignore-validation");
						if (coxjs.select(val).hasClass("error")) {
							coxjs.select(val).removeClass("error");
							coxjs.select(val).siblings(".error-wrapper").css("display", "none");
							coxjs.select(val).parent().prev().removeClass("errorMsg");
							//For IE8 and 9 remove the error class from label of password field.
							if (coxjs.select(".display-placeholder").hasClass("error"))
								coxjs.select(".display-placeholder").removeClass("error");
							coxjs.select(".error-header").css("display", "none");
						}
					});
				}
			},

			//shows the div element. Remove .ignore-validation class
			showMultipleDivs : function(showElementDiv) {
				coxjs.select(showElementDiv).show();
				var divContentElements = coxjs.select(".required", showElementDiv);
				if (divContentElements != null && divContentElements.length != 0) {
					coxjs.each(divContentElements, function(i, val) {
						if(!coxjs.select(val).hasClass("autocomplete-dummy")) {
							if (coxjs.select(val).hasClass("ignore-validation")) {
								coxjs.select(val).removeClass("ignore-validation");
							}
						}
					});
				}
				
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Mayank Kothari
 * @version 0.1.0.0
 * @namespace modules.global
 * @class Tooltip
 */
(function(coxfw) {
	coxfw.core.define('modules.global.Tooltip', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * The element clicked to trigger the tooltip.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * Stores a copy of the tooltip node to apply inside methods.
		 *
		 * @member {object} _tooltip
		 */
		var _tooltip;
		/**
		 * Stores a copy of the height of the tooltip content.
		 *
		 * @property _contentHeight
		 * @type object
		 */
		var _contentHeight;
		/**
		 * Stores a copy of the width of the tooltip content.
		 *
		 * @property _contentWidth
		 * @type object
		 */
		var _contentWidth;
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT Tooltip.js");
				/* To recalculate the arrow & tooltip content position on orientation change  */
				/*To handle modal components*/
				_module = this;
				coxjs.subscribe({
					"Orientation" : _module.resetTooltipPosition,
					"ModalLoaded" : _module.modalRegisterHandlers
				});
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC Tooltip.js");
				// set the module variable to this object
				_module = this;

				/**
				 * @event click
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".tooltip-trigger" Node used to trigger the tooltip.
				 */
				coxjs.select("body").on("click touchstart", ".tooltip-trigger", function(e) {
					// Prevent default behavior on the node.
					e.preventDefault();

					/**
					 *  closing any previously opened tooltip.
					 *
					 */
					if (coxjs.select(".tooltip-trigger.active").length > 0) {
						_module.closeTooltip();
					}
					_trigger = coxjs.select(this);
					_trigger.addClass("active");
					_module.getDataPosition();
					_module.setToolTipPosition();
					//console.log(coxjs.select(".arrow").css("style"));
					e.stopPropagation();
				});

				//close tooltip if clicked on active trigger
				coxjs.select("body").on('click touchstart', '.tooltip-trigger.active', function(e) {
					_module.closeTooltip();
					e.stopPropagation();
				});

				//To stop closing of tooltip when clicked inside tooltip content
				coxjs.select("body").on('click touchstart', '.ui-tooltip-content', function(e) {
					e.stopPropagation();
				});

				//close tooltip when clicked on the close button
				coxjs.select("body").on('click touchstart', '.ui-tooltip-close', function(e) {
					e.preventDefault();
					_module.closeTooltip();
					e.stopPropagation();
				});
				
				//Defect fix# 57102 - capture window blur to see if page has lost focus and close tooltip
				coxjs.select(window).blur(function(e){
					if (coxjs.select(".tooltip-trigger.active").length > 0) {
						_module.closeTooltip();
					}
				})

				/**
				 * To stop hover functionality.
				 *
				 */
				coxjs.select(".tooltip-trigger").on('mouseout', function(e) {
					e.stopImmediatePropagation();
				});
				coxjs.select(".tooltip-trigger").on('mouseleave', function(e) {
					e.stopImmediatePropagation();
				});
				coxjs.select(".tooltip-trigger").on('mouseenter', function(e) {
					e.stopImmediatePropagation();
				});

				/**
				 * Remove tooltips when user clicks the html node.
				 *
				 * @event click, touchstart, keydown
				 * @param {string} "html" The main HTML node.
				 * 'keydown' event added so overlay gets closed on tabbing, when overlay does not have any focusable item
				 */
				coxjs.select("html").on("click touchstart keydown", function(event) {
					if (coxjs.select(".tooltip-trigger.active").length > 0) {
						_module.closeTooltip();
					}
				});
				//Resize the tooltip position on resizing the browser
				coxjs.select(window).resize(function(){
					_module.resetTooltipPosition();
				});
			},

			/* To determine where the tooltip content w.r.t tooltip-trigger depending on the position of the tool-tip trigger */
			getDataPosition : function() {
				// Width of an element triggering tooltip
				var triggerWidth = _trigger.width();
				// Space to the left of an element triggering tooltip
				var leftSpace = _trigger.offset().left;
				// Space to the right of an element triggering tooltip
				var rightSpace = coxjs.select(window).width()-_trigger.offset().left;
				if ((coxjs.select("body").attr("data-layout") == "desktop")) {
					//320 is the width of tooltip content & 16 is the space required for arrow.
					if (leftSpace < 320 + 16){
						_trigger.attr("data-position", "left");
					}
					else  {
						if(rightSpace > 320 + triggerWidth + 16){
							_trigger.attr("data-position", "bottom");
						}
						else {
							_trigger.attr("data-position", "right");
						}
					}
				} else {
					// tooltip content occupies 75% width of the device
					if (leftSpace > 0.75*coxjs.select(window).width() + 16){
						_trigger.attr("data-position", "right");
					}
					else  {
						if(rightSpace > 0.75*coxjs.select(window).width() + triggerWidth + 16){
							_trigger.attr("data-position", "left");
						}
						else {
							_trigger.attr("data-position", "bottom");
						}
					}
				}
			},

			/* To set the tooltip content position on load   */
			setToolTipPosition : function() {
				// Get the tooltip options from the trigger.
				var tooltipContent = "<div class='col-content'><a class='ui-tooltip-close'></a>" + coxjs.select("#" + _trigger.attr("data-content-element")).html() + "</div>";
				var tooltipTheme = _trigger.attr("data-tooltip-theme");
				var tooltipPosition = _trigger.attr("data-position");

				//assigning default value
				if (tooltipPosition === undefined)
					tooltipPosition = "bottom";

				var _position;
				switch (tooltipPosition) {
				case 'top':
					_position = {
						my : 'center bottom',
						at : 'center top-10'
				};
					break;
				case 'bottom':
					_position = {
						my : 'center top',
						at : 'center bottom+10'
				};
					break;
				case 'left':
					_position = {
						my : 'right center',
						at : 'left-10 center'
				};
					break;
				case 'right':
					_position = {
						my : 'left center',
						at : 'right+10 center'
				};
					break;
				}

				_position.collision = 'flipfit flip';
				_position.using = function(position, feedback) {
					coxjs.select(".ui-tooltip").css(position);
					coxjs.select("<div>").addClass("arrow").addClass(feedback.vertical).addClass(feedback.horizontal).appendTo(".ui-tooltip");
				};

				// configure the tooltip options.
				_tooltip = _trigger.tooltip({
					items : "a.tooltip-trigger",
					content : function() {
						return tooltipContent;
					},
					position : _position,
					hide : false
				});

				// To execute open method of jQuery UI Tooltip
				_trigger.tooltip("open");

				// show alternative themes
				if (tooltipTheme) {
					coxjs.select(".ui-tooltip-content").addClass(tooltipTheme);
					coxjs.select(".arrow").addClass(tooltipTheme);
				} else {
					// hide alternative themes
					coxjs.select(".ui-tooltip-content").removeClass("theme-b");
					coxjs.select(".arrow").removeClass("theme-b");
				}

				/**
				 * To adjust the position of arrow w.r.t tooltip content.
				 *
				 */
				_module.setArrowPosition();

			},

			// To execute close method of jQuery UI Tooltip
			closeTooltip : function() {
				coxjs.select(".tooltip-trigger.active ").removeAttr('data-position'); //remove dynamically created data-position attribute on tooltip destroy				
				coxjs.select(".tooltip-trigger.active ").tooltip('destroy'); //replace 'close' method with 'destroy' to remove additional 'ui-helper-hidden-accessible' nodes
				coxjs.select(".tooltip-trigger").removeClass("active");
			},

			/*Orientation Change handling */
			resetTooltipPosition : function() {
				if (coxjs.select(".tooltip-trigger.active").length < 1)
					return;
				// close tooltip and return if device has dual layout
				if (window.matchMedia) {
					var hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600;
					if (hasDualLayout == true) {
						_module.closeTooltip();
						return;
					}
				}
				//considering only one active tool tip will be available at max
				_trigger = coxjs.select(".tooltip-trigger.active");

				// To determine what was the position of tooltip content w.r.t element triggering tooltip before orientation change
				var beforeOrientationDataPosition = _trigger.attr("data-position");

				// To determine where to show the tooltip content w.r.t element triggering tooltip
				_module.getDataPosition();

				//To change Arrow Classes
				if (beforeOrientationDataPosition != _trigger.attr("data-position")) {
					if (beforeOrientationDataPosition == "bottom") {
						if (_trigger.attr("data-position") == "right") {
							coxjs.select(".arrow").removeClass("top left right").addClass("middle right");
							coxjs.select(".arrow").css("left", _contentWidth + 7);
						} else {
							coxjs.select(".arrow").removeClass("top left right").addClass("middle left");
							coxjs.select(".arrow").css("left", -7);
						}

					} else {
						if (_trigger.attr("data-position") == "right") {
							coxjs.select(".arrow").removeClass("middle left right").addClass("middle right");
							coxjs.select(".arrow").css("left", coxjs.select(".ui-tooltip").width() + 7);
						} else if (_trigger.attr("data-position") == "left") {
							coxjs.select(".arrow").removeClass("middle left right").addClass("middle left");
							coxjs.select(".arrow").css("left", -7);
						} else {
							coxjs.select(".arrow").removeClass("middle left right").addClass("top left");
						}

					}
				}

				//Reposition Tooltip Content
				if (_trigger.attr("data-position") == undefined || _trigger.attr("data-position") == "bottom") {
					coxjs.select(".ui-tooltip").offset({
						top : _trigger.offset().top + 35,
						left : Math.max(0, _trigger.offset().left - coxjs.select(".ui-tooltip").width() / 2)
					});
				} else if (_trigger.attr("data-position") == "left") {
					if (window.matchMedia("(orientation : landscape)").matches) {
						coxjs.select(".ui-tooltip").offset({
							top : Math.max(0, _trigger.offset().top - coxjs.select(".ui-tooltip").height() / 2),
							left : _trigger.offset().left + _trigger.width() + 10
						});
					} else {
						coxjs.select(".ui-tooltip").offset({
							top : Math.max(0, _trigger.offset().top - _contentHeight / 2),
							left : _trigger.offset().left + _trigger.width() + 10
						});
					}

				} else if (_trigger.attr("data-position") == "right") {
					if (coxjs.select("body").attr("data-layout") == "mobile") {
						coxjs.select(".ui-tooltip").offset({
							top : Math.max(0, _trigger.offset().top - coxjs.select(".ui-tooltip").height() / 2),
							left : _trigger.offset().left - coxjs.select(".ui-tooltip").width() - 10
						});
					} else {
						if (window.matchMedia("(orientation : landscape)").matches) {
							coxjs.select(".ui-tooltip").offset({
								top : Math.max(0, _trigger.offset().top - coxjs.select(".ui-tooltip").height() / 2),
								left : Math.max(0, _trigger.offset().left - coxjs.select(".ui-tooltip").width() - 10)
							});
						} else {
							coxjs.select(".ui-tooltip").offset({
								top : Math.max(0, _trigger.offset().top - _contentHeight / 2),
								left : Math.max(0, _trigger.offset().left - _contentWidth - 10) + 15
							});
						}
					}
				}

				_contentHeight = coxjs.select(".ui-tooltip").height();
				_contentWidth = coxjs.select(".ui-tooltip").width();
				_module.setArrowPosition();
			},

			//set arrow position w.r.t element triggering tooltip & tooltip-content
			setArrowPosition : function() {
				//Left Offset of element triggering tooltip
				var leftOffset = _trigger.offset().left;
				//Top Offset of element triggering tooltip
				var topOffset = _trigger.offset().top;
				//Left Offset of tooltip-content
				var contentLeftOffset = 0;
				//Top Offset of tooltip-content
				var contentTopOffset = coxjs.select(".ui-tooltip").offset().top;
				//Position of tooltip-content w.r.t element triggering tooltip
				var tooltipPosition = _trigger.attr("data-position");
				contentLeftOffset = coxjs.select(".ui-tooltip").offset().left;
				//To set the arrow in center when the tooltip-trigger is an hyperlink
				var triggerWidth = 0;

				if (coxjs.select("body").attr("data-layout") == "mobile") {
					if (tooltipPosition === undefined || tooltipPosition == "bottom") {
						if (_trigger.hasClass("btn-help")) {
							triggerWidth = -3;
						} else {
							triggerWidth = _trigger.width() / 2 - 12;
						}
						coxjs.select(".arrow").css("left", leftOffset - contentLeftOffset + triggerWidth);
						if (topOffset - contentTopOffset < 0) {
							coxjs.select(".arrow").removeClass("bottom").addClass("top");
							coxjs.select(".arrow").css("top", -15);
						}
					} else if (tooltipPosition == "left") {

						coxjs.select(".arrow").css("top", topOffset - contentTopOffset - 10);
					} else if (tooltipPosition == "right") {

						coxjs.select(".arrow").css("top", topOffset - contentTopOffset + 20);
						coxjs.select(".arrow").css("left", leftOffset - contentLeftOffset - 3);
					}
				} else {
					if (tooltipPosition === undefined || tooltipPosition == "bottom") {
						if (_trigger.hasClass("btn-help")) {
							triggerWidth = 12;
						} else {
							triggerWidth = _trigger.width() / 2;
						}
						coxjs.select(".arrow").css("left", leftOffset - contentLeftOffset + triggerWidth);
						if (topOffset - contentTopOffset < 0) {
							coxjs.select(".arrow").removeClass("bottom").addClass("top");
							coxjs.select(".arrow").css("top", -15);
						}
					}
					else if (tooltipPosition == "right") {
						coxjs.select(".arrow").css("top", topOffset - contentTopOffset + 5);
						if (coxjs.select(".arrow").hasClass("right")) coxjs.select(".arrow").css("left", leftOffset - contentLeftOffset - 3);
					}
					else {
						coxjs.select(".arrow").css("top", topOffset - contentTopOffset);
						if (coxjs.select(".arrow").hasClass("right")) coxjs.select(".arrow").css("left", leftOffset - contentLeftOffset - 3);
					}
				}
			},

			/*subscribe on modal complete*/
			/* To stop the hover functionality of tooltip when it is present inside a jquery-ui-dialog */
			modalRegisterHandlers : function() {
				coxjs.select(".tooltip-trigger").on('mouseout', function(e) {
					e.stopImmediatePropagation();
				});
				coxjs.select(".tooltip-trigger").on('mouseleave', function(e) {
					e.stopImmediatePropagation();
				});
				coxjs.select(".tooltip-trigger").on('mouseenter', function(e) {
					e.stopImmediatePropagation();
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * A Plugin to initialize the JWPlayer
 *
 * customizations: http://support.jwplayer.com/customer/portal/topics/601064-customization/articles
 * caption maker: http://ie.microsoft.com/testdrive/Graphics/CaptionMaker/Default.html
 * 
 * skin customization: http://support.jwplayer.com/customer/portal/articles/1413071-skin-xml-reference
 * out of box skins: http://support.jwplayer.com/customer/portal/articles/1406968-using-jw-player-skins
 * 
 * custom playlist dev: http://support.jwplayer.com/customer/portal/articles/1543546-example-making-your-own-playlist-sidebar
 * related videos: http://support.jwplayer.com/customer/portal/articles/1409745-display-related-videos

 * @author Robert Sekman
 * @version 0.1.0.0
 * @module modules.global.VideoPlayer
 */
(function(coxfw) {
	coxfw.core.define('modules.global.VideoPlayer', function(coxjs) {
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".video-holder";

		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		
		return {
			/**
			 * Setup all subscriptions for this module.
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT VideoPlayer.js");
				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
				
				// Cox license key
				jwplayer.key = "314F7f+2nN7Z5gbamNTcmVepZHry7iUE4sx8q9N/LPQ=";
			},
			/**
			 * Select the video player divs and initialize all players
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC VideoPlayer.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				
				coxjs.guid= 0;

				/**
				 * @event xhr-selectors
				 *
				 * Attach to any video-player div class
				 *
				 * @param {selector} _selector The div in which the video player will get injected.
				 */
					
				coxjs.select("body").on("xhr-selectors", _selector, function(event) {
					// looking for inputs with data-mask attribute
					coxjs.select(this).each(function() {
						var video = coxjs.select(this);
						var playlistWidth = 320; // default width for right of video position
						
						video.html('Loading player...');
						
						var videoID = 'video-' + coxjs.guid++; // create a video id (required for jwplayer)
						video.attr('id', videoID); // add the new id to the DOM
						
						var videoUrl = video.data('videoFile'); // video file url
						var videoImage = video.data('videoImage'); // poster url
						var videoCaptions = video.data('videoCaptions'); // captions url
						var videoAspectRatio = video.data('videoRatio'); // aspect ratio
						var videoPlaylist = video.data('videoPlaylist'); // playlist url
						var videoPlaylistPosition = video.data('videoPlaylist-position'); // playlist position
						var videoRelated = video.data('videoRelated'); // related videos url
						
						// we need to hide the standard playlist for bottom position
						if (videoPlaylistPosition == "bottom") {
							// use feature detection to find if browser is IE8 or IE9 - add additional check for addListener to circumvent AEM polyfill for matchMedia
							playlistWidth = (!(window.matchMedia && window.matchMedia('all').addListener)) ? 4 : 0; // for some reason if playlistWidth is set to 0, IE8 and IE9 do not display the video
						}
						
						jwplayer(videoID).setup({
							displaytitle : false, // hide video title next to play icon
							file : videoUrl, // video file url
							image : videoImage, // poster url
							tracks : [{ // closed captioning
								file : videoCaptions
							}],
							abouttext : "Cox Video Player", // right click text
							aboutlink : "javascript:void(0)", // right click url
							playlist : videoPlaylist, // playlist url
							listbar : { // playlist config
								position : videoPlaylistPosition,
								size : playlistWidth
							},
							related : { // related videos
								file : videoRelated,
								onclick : "play"
							},
							width : "100%", // enable responsive player
							aspectratio : videoAspectRatio, // aspect ratio
							skin : "/ui/4_1/tsw/xml/jwplayer-skin.xml", // path to skin
							base : "/ui/4_1/tsw/swf/", // path to swf
							events : {
								onReady : function() {
									// remove the related video icon if the url is not defined
									if ( typeof videoRelated === 'undefined' ) {
										coxjs.select("#" + videoID + "_dock").remove();
									}
									
									// get the initial video title
									var playlistTitle = jwplayer().getPlaylistItem();
									
									// Handle playlist position on page load
									_module.positionPlaylist();
									
									// Handle playlist positioning when the browser window is resized.
									coxjs.select(window).resize(function(event) {
										_module.positionPlaylist();
									});
									
									// create our custom playlist carousel at the bottom of the player
									if (videoPlaylistPosition == "bottom") {
											_module.createCarouselPlaylist(videoID);																		
									}
								},
								onPlay : function() {
									// find all the players on the page and pause then one at a time
									// to prevent multiple players from playing at the same time.
									coxjs.select('.jwplayer').each(function() {
										if (this.id != videoID) {
											jwplayer(this.id).pause(true);
										}
									});
								}
								
							}
						});	
						
					});
				});
				/**
				 * @event load
				 *
				 * Trigger "xhr-selectors" if `_selector` exists when the DOM is loaded.
				 *
				 * @param {selector} _selector Nodes intended to init mask library.
				 */
				if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("xhr-selectors");
				
			},
			
			/**
			 * Using media queries to determine proper behavior, positions and modifies styles for the playlist position on page load and window resize.
			 *
			 * @method positionPlaylist
			 */
			positionPlaylist : function() {
				// Check for window.matchMedia capability.
				if (window.matchMedia) { 
					// Set positioning below player if it is on the right.
					if (window.matchMedia("(max-width: 767px)").matches) {
						coxjs.select(".jwplayer.playlist-right").each(function() {
							coxjs.select(this).switchClass("playlist-right", "playlist-right-orig playlist-bottom");
						});
					// Set positioning back to the right if it was there before.
					} else {
						coxjs.select(".jwplayer.playlist-right-orig").each(function() {
							coxjs.select(this).switchClass("playlist-right-orig playlist-bottom", "playlist-right");
						});
					}
				}
			},
			
			/**
			 * Create the custom carousel playlist that appears below the player
			 *
			 * @method createPlaylist
			 */
			createCarouselPlaylist : function(videoID) {
				var playlist = jwplayer().getPlaylist();
				var playlistDiv = coxjs.select("<div class='slick-carousel video-player-nav'>");
				for (var index = 0; index < playlist.length; index++) {
					var playindex = index + 1;
					var itemTitle = playlist[index].title; // video title
					if (itemTitle.length > 20) { // truncate text to 2 lines with ellipses per mock
						itemTitle = itemTitle.substring(0, 20) + "...";
					}
					var itemDescription = playlist[index].description; // video description
					if (itemDescription.length > 20) { // truncate text to 2 lines with ellipses per mock
						itemDescription = itemDescription.substring(0, 20) + "...";
					}
					coxjs.select(playlistDiv).append("" +
						"<div class='playlist-item'>" +
							"<a href='#' data-video-id='" + index + "'>" +								 	
								"<img src='" + playlist[index].image + "' class='col-content' />" +										 			
								"<span class='title'>" + itemTitle + "</span>" +
								"<span class='description'>" + itemDescription + "</span>" +
							"</a>" +
						"</div>"
					);
				};
				
				// use feature detection to find if browser is IE8 or IE9, append playlist DIV after video container accordingly
				(!(window.matchMedia && window.matchMedia('all').addListener)) ? coxjs.select('#' + videoID).parent().after(playlistDiv) : coxjs.select('#' + videoID).after(playlistDiv) ;	
				
				// get slides to be configured to show and scroll based on device width
				// 2 for mobile device, 3 for desktop
				var configSlides;			
				if (window.matchMedia) { 
					configSlides = (window.matchMedia("(max-width: 767px)").matches) ? 2 : 3;
				}
				else {
					configSlides = 3;
				}
				
				// Defect fix# DE9754 - add 'data-show-slides' attribute to the 'slick-carousel' node so it can be retrieved later during reinitialize
				coxjs.select('.slick-carousel').attr("data-show-slides", configSlides);
				
				//initialize slick slider on the bottom navigation										
				coxjs.select('.slick-carousel').slick({
					 dots: true,
					 slidesToShow: configSlides, 
					 slidesToScroll: configSlides, 
					 prevArrow : '<a data-role="none" class="slick-prev" aria-label="previous">Previous</a>',
					 nextArrow : '<a data-role="none" class="slick-next" aria-label="next">Next</a>'											
				});
				
				//Play corresponding video when bottom nav is clicked
				coxjs.select("body").on("click", ".playlist-item a", function(event) {
					coxjs.preventDefault(event);
					jwplayer(videoID).playlistItem(coxjs.select(this).data("videoId"));
				});
			},
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * A sample CoxJS module demonstrating best-practices for new developers.
 * 
 * @author Scott Thompson
 * @version 0.1.0.0
 * @module modules.global.demo
 */
(function(coxfw) {
	coxfw.core.define("modules.global.demo", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".select-navigation select";
		/**
		 * The default settings for an AJAX request.
		 * 
		 * @member {object} _ajaxOptions
		 * @property {string} type The HTML form method being used for this request.
		 * @property {string} dataType The type of data being returned.
		 * @property {string} timeout The amount of time, in milliseconds, to wait for a response.
		 * @property {boolean} cache Whether to cache the response or not.
		 */
		var _ajaxOptions = {
			type : "GET", /** @default "GET" */
			dataType : "text",
			timeout : "30000",
			cache : false
		};

		return {
			/**
			 * Begins listening for {@link coxfw.coxjs.publish} events to "demoChange".
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT demo.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
				/**
				 * Load the default content based on the option set as default.
				 * Also, check for a change in device orientation.
				 * 
				 * @event subscribe
				 * @param {string} demoChange What changes the dropdown and tab content.
				 * @param {string} Orientation When the device is rotated.
				 */
				coxjs.subscribe({
					"demoChange" : _module.demoChange,
					"Orientation" : function(data) {},
					"demoJSON" : _module.demoJSON
				});
			},
			/**
			 * Listen for drop-down changes related to tab navigation and switch to the appropriate tab.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC demo.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
				/**
				 * Load the default content based on the option set as default.
				 * 
				 * @event xhr-selectors,change
				 * @param {string} _selector The select drop-down used for navigation.
				 */
				coxjs.select("body").on("xhr-selectors change", _selector, function(event) {
					// Place the selected options' title attribute in the span preceding the form.
					var optionDescription = this.options[this.selectedIndex].title || this.options[this.selectedIndex].text;
					coxjs.select(this.form).prev(".demo-title").text(optionDescription);
					/**
					 * Load the default content based on the option set as default.
					 * 
					 * @event publish
					 * @param {string} demoChange What changes the dropdown and tab content.
					 */
					coxjs.publish({
						type : "demoChange",
						data : this
					});
				});
				/**
				 * Submit a request for JSON via AJAX.
				 *
				 * @event submit
				 * @param {string} "#ajaxJSONResponse form" The loaded form.
				 */
				coxjs.select("body").on("submit", "#ajaxJSONResponse form", function(event) {
					// Stop default form submission.
					coxjs.preventDefault(event);
					/**
					 * This form requests a JSON response via AJAX.
					 * 
					 * @event publish
					 * @param {string} Ajax Requests a URL via AJAX.
					 * @param {object} data The configuration for the AJAX request with the following properties:
					 * @property {object} container The DOM element intended to receive AJAX response.
					 * @property {string} url The address to fetch via AJAX.
					 * @property {string} type The HTML form method being used for this request.
					 * @property {string} dataType The type of data being returned.
					 * @property {string} timeout The amount of time, in milliseconds, to wait for a response.
					 * @property {boolean} cache Whether to cache the response or not.
					 * @property {string} data A QUERY_STRING'ified version of the forms' inputs.
					 * @property {object} throbber Pass to {@link modules.global.module:Ajax} whether and what kind of loading indicator to show.
					 * @property {string} throbber.type The CoxJS event to be published for the throbber.
					 * @property {object} throbber.data The object containing configuration options for the throbber.
					 * @property {object} throbber.data.nodes DOM nodes for the throbber container.
					 */
					coxjs.publish({
						type : "Ajax",
						data : coxfw.extendObj(_ajaxOptions, {
							id : "demoJSON",
							container : coxjs.select(this).parents(".response"),
							url : this.action,
							dataType : "json",
							type : this.method.toUpperCase(),
							data : coxjs.select(this).serialize(),
							throbber : {
								type : "showThrobber",
								data : {
									nodes : coxjs.select(this).parents(".response").closest(".loading-wrapper")
								}
							}
						})
					});
				});
			},
			/**
			 * Takes JSON response and does something interesting with it.
			 *
			 * @method demoJSON
			 * @param {object} ajaxResponse The select drop-down that was changed to navigate to desired content.
			 */
			demoJSON : function(ajaxResponse) {
				coxjs.select(".loading-wrapper-active", ajaxResponse.container).removeClass("loading-wrapper-active");
				coxjs.select("<pre>" + JSON.stringify(ajaxResponse.responseJSON) + "</pre>").fadeIn("slow").appendTo(ajaxResponse.container);
			},
			/**
			 * Reads URL for content from currently selected option and loads it into the content container.
			 *
			 * @method demoChange
			 * @param {object} trigger The select drop-down that was changed to navigate to desired content.
			 * @return {object} An example of a return object coming from {@link modules.global.module:Ajax} through {@link coxfw.coxjs.publish}.
			 */
			demoChange : function(trigger) {
				/**
				 * Publish AJAX call to retrieve content node referenced by selected drop down option.
				 * 
				 * @event publish
				 * @param {string} Ajax Requests a URL via AJAX.
				 * @param {string} Orientation When the device is rotated.
				 * @property {string} url The address to fetch via AJAX.
				 * @property {string} type The HTML form method being used for this request.
				 * @property {object} container The DOM element intended to receive AJAX response.
				 * @property {object} throbber Pass to {@link modules.global.module:Ajax} whether and what kind of loading indicator to show.
				 * @property {string} throbber.type The CoxJS event to be published for the throbber.
				 * @property {object} throbber.data The object containing configuration options for the throbber.
				 * @property {object} throbber.data.nodes DOM nodes for the throbber container.
				 */
				return coxjs.publish({
					type : "Ajax",
					data : coxfw.extendObj(_ajaxOptions, {
						url : trigger[trigger.selectedIndex].value,
						type : trigger.form.method,
						container : coxjs.select("#" + trigger.id + "-content .response"),
						throbber : {
							type : "showThrobber",
							data : {
								nodes : coxjs.select("#" + trigger.id + "-content .response").closest(".loading-wrapper")
							}
						}
					})
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * Manages using tabs to switch between content displays.
 *
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @module modules.residential.AltTabNavigation
 */
(function(coxfw) {
	coxfw.core.define('modules.residential.AltTabNavigation', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @member {object} _module
		 */
		var _module;
		/**
		 * Stores a copy of the tabs that will be used for the navigation
		 *
		 * @member {object} _tabs
		 */
		var _tabs;
		
		// 	var for holding the browser layout ("mobile","desktop")
		var _browserType;
		
		return {
			/**
			 * Setup all subscriptions for this module.
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT AltTabNavigation.js");							
			},
			/**
			 * Sets the local module object, sets the local tabs variable,
			 * setup the default tab, and listen to click events on the tabs.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC AltTabNavigation.js");
				// Store a copy of module context.
				_module = this;
				
				//set initial browser type
				_browserType = coxjs.select("body").attr("data-layout");							

				// select the tabs and pass the array into defaultTabSelected method
				var tabs = coxjs.select(".tab");
				if(!coxjs.select(".tab")[0]) return;
				_module.defaultTabSelected(tabs);
				
				// listen to the click event on the tab
				coxjs.select(".tab a").click(function(e) {
					 e.preventDefault();
					_module.getSelectedTab(this);
				});

				// listen to ajax complete event
				coxjs.select(document).ajaxComplete(function(event, ajaxResponse, options) {
					var tabs = coxjs.select(".tab");
					_module.defaultTabSelected(tabs);

				});
				// listen to the click event on the tab
				coxjs.select(".tab a").click(function(e) {
					 e.preventDefault();
					_module.getSelectedTab(this);
				});				
				
				//	on resize get the current browser and call toggleSlick method if browser type changes	
				coxjs.select(window).bind('resize', function() {
					//	return if no tabs
					if(!coxjs.select(".tab")[0]) return;
					if (_browserType != coxjs.select("body").attr("data-layout")) {
						_browserType = coxjs.select("body").attr("data-layout");
						_module.toggleSlick();
					}
				});
			},
			/**
			 * Loops through the tabs and properly displays the corresponding class
			 *
			 * @method defaultTabSelected
			 * @param {array} tabs A reference to the tab elements stored in an array.
			 */
			defaultTabSelected : function(tabs) {
				var tabname = window.location.hash;
				var $activeTab;

				_tabs = tabs;			
				
				coxjs.select(tabs).each(function() {
					if (_browserType == "mobile") {	
							// trigger click event on first dot so first slide is always displayed on initial load				
							coxjs.select(".slick-dots .slick-active button", this).trigger("click");							
					} else {
						// For each set of tabs, we want to keep track of
						// which tab is active and it's associated content
						var $active, $content, $links = coxjs.select(this).find('a');
						
						// If the location.hash matches one of the links, use that as the active tab.
						// If no match is found, use the first link as the initial active tab.
						if (tabname) {
							$active = coxjs.select($.grep($links,function(item,index){return coxjs.select(item).attr("href")==tabname;})[0] || $links[0]);
						} else {
							$active = coxjs.select($.grep($links,function(item,index){return coxjs.select(item).attr("class")=='active';})[0] || $links[0]);
						}
						//Hide the non active tab
						$activeTab = coxjs.select('.active', tabs);
						//$activeTab.removeClass('active');
	
						$active.addClass('active');
						$content = coxjs.select(($active.attr('href')));
						$content.show();
					}					
				});
			},
			/**
			 * Handles the selected tab from the click event
			 *
			 * @method getSelectedTab
			 * @param {object} tab A reference to the tab element that was clicked.
			 */
			getSelectedTab : function(tab) {
				var caller = tab;
				var tabs = _tabs;
				var callerParent = coxjs.select(caller).parent().parent();
				// check whether caller is a link from tab-header
				// sometimes the caller link can be from modals as well 
				if (coxjs.select(caller).parents().eq(1).hasClass("tab")) {
					$active = coxjs.select(".active", callerParent);
					$content = coxjs.select(($active.attr('href')));

					// Make the old tab inactive.
					$active.removeClass('active');
					$content.hide();

					// Update the variables with the new link and content
					$active = coxjs.select(caller);
					$content = coxjs.select((coxjs.select(caller).attr('href')));

					// Make the tab active.
					$active.addClass('active');
					if (coxjs.select("body").hasClass("IE")) {
						// Defect fix #61194 - manually trigger 'li' click in IE to force IE to redraw the element on tab change 
						$active.parent().trigger("click");
					}					
					$content.show();
				}
				
				if (coxjs.select(caller).parents().eq(1).hasClass("slick-track")) {
					$active = coxjs.select(".active", callerParent);
					$content = coxjs.select(($active.attr('href')));
					
					// Make the old tab inactive.
					$active.removeClass('active');
					$content.hide();
					
					// Update the variables with the new link and content
					$active = coxjs.select(caller);
					$content = coxjs.select((coxjs.select(caller).attr('href')));

					// Make the tab active.
					$active.addClass('active');
					$content.show();
				}
			},
			
			// tabs act as slider on mobile and normal tabs on desktop, so toggle based on browser type on orientation change and resize
			toggleSlick : function(tabs) {					
					// slick if mobile or dual layout portrait orientation
					if (_browserType == "mobile") {
						coxjs.select(".tab").addClass("slick-carousel");
						coxjs.select(".tab.slick-carousel").slick({
							dots : true,
							infinite: false,
							slidesToShow : 1,
							slidesToScroll : 1,
							prevArrow : '<a data-role="none" class="slick-prev" aria-label="previous">Previous</a>',
							nextArrow : '<a data-role="none" class="slick-next" aria-label="next">Next</a>'
					});				
					
					// reset initial tab header and content
					coxjs.select(".tab.slick-carousel .slick-active a").trigger("click");
					
					coxjs.select(".tab.slick-carousel").on("afterChange", function(event, slick, currentSlide) {
						coxjs.select("a", coxjs.select(slick.$slides[currentSlide])[0]).click();
					});
				} 
				else {
					//unslick if desktop
					var _slider = coxjs.select(".tab.slick-carousel");
					_slider.each(function() {
						if (coxjs.select(this).hasClass("slick-initialized")) {
								coxjs.select(this).slick("unslick");									
						}								
					});							
					// listen to the click event on the tab
					coxjs.select(".tab a").click(function(e) {
						 e.preventDefault();
						_module.getSelectedTab(this);
					});														
				}							
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});

})(coxfw);
/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.residential
 * @class ChannelLineup
 *
 * Manage loading and submitting Channel Lineup listings via AJAX.
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.residential.ChannelLineup", function(coxjs) {
		var _module;
		
		// 	placeholder for the number of columns in the table header 
		var _numberOfColumns = 0;
		
		// 	placeholder for the number of columns in the table header 
		var _numberModalOfColumns = 0;
		
		// 	var for holding the browserlayout ("mobile","desktop")
		var _browserLayout = "desktop";
		
		// 	used to insert loader container when making ajax call to show throbber
		var _throbberHTML = '<div class="loader"></div><div class="response"></div>';
		
		// 	placeholder for the number of total records that need to be called for desktop
		var _totalDesktopRecordsCalled = 0;
		
		// 	placeholder for the number of total records that need to be called for mobile
		var _totalMobileRecordsCalled = 0;
		
		// 	placeholder for the number of total records that need to be called for modal
		var _totalModalRecordsCalled = 0;
		
		// 	placeholder for the number of resultsets called when ajax call has been made for desktop
		var _desktopCurrentResultSet = 1;
		
		// 	placeholder for the number of resultsets called when ajax call has been made for mobile
		var _mobileCurrentResultSet = 1;
		
		// 	placeholder for the number of resultsets called when ajax call has been made for modal
		var _modalCurrentResultSet = 1;
		
		// 	array to contain all the params that need to be added to the servlet url
		var _params = [];	
		
		//	flag to determine if modal is open
		var _modalIsOpen = false;
		
		//	various constants
		var DESKTOP_TITLE = "Channel Lineup";
		var CL_AJAX_CALL_INIT = "init";
		var CL_AJAX_CALL_APPEND = "append";
		var CL_CONTAINER_MODAL = "modal";
		var CL_CONTAINER_DESKTOP = "desktop";
		var CL_CONTAINER_MOBILE = "mobile";
		
		var _selector = ".channel-lineup";
		var _tableSelector = ".channel-lineup-table";
		var _modalSelector = ".cms-dialog";
		
		var _baseURL = "";
		
		var _modalBaseURL = "";
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {},
			/**
			 * Setup initial channel lineup grid and associated event listeners.
			 *
			 * @method execute
			 */
			execute : function() {
				//	Store a copy of module context.
				_module = this;
				
				// 	set stick header
				_sectionHeaderSticky = coxjs.select(".channel-lineup .section-header");
								
				// 	set up all the subscriptions
				coxjs.subscribe({
					"init_desktop_table" : _module.initDesktopTable,
					"init_mobile_table" : _module.initMobileTable,
					"init_modal_table" : _module.initModalTable,
					
					"append_desktop_table" : _module.appendDesktopTable,
					"append_mobile_table" : _module.appendMobileTable,
					"append_modal_table" : _module.appendModalTable,
					
					"ProgressiveScroll" : _module.listenForScrollEvents,
					"ModalLoaded" : _module.channelLineupModal,
					
					"update_refine_tv_package" : _module.updateRefineTvPackages
				});
				
				// 	determine the default browser type
				coxjs.select("body").on("xhr-selectors init-channelLineup", _selector, function(event) {
					//	if channel lineup selctor isnt present dont execute any further
					if(!coxjs.select(_selector)[0]) return;
					
					_module.getDefaultBrowserType();
				});
				
				//	on resize get the current browser	
				coxjs.select(window).bind('resize', function() {
					//	if channel lineup selctor isnt present dont execute any further
					if(!coxjs.select(_selector)[0]) return;
					
					_module.determineBrowserType();
				});
				
				//	on scroll - to stick the section-header
				coxjs.select(window).on("scroll touchmove", function(e) {
					// 	in case ".channel-lineup .section-header" class is not present, then return
					if (coxjs.select(".channel-lineup .section-header").length < 1) return;

					var viewportOffset = _module.getViewportOffset(_sectionHeaderSticky);
					
					// 	to add sticky effect i.e. position fixed and set bar at the top
					if (this.scrollTop > viewportOffset.top) {
						_sectionHeaderSticky.addClass("active"); 
						// Defect fix# 59658, 'active' class is not making header sticky. So call sticky table header plugin. 
						coxjs.select('.channel-lineup .data-table').stickyTableHeaders();
					} 
					else {
						_sectionHeaderSticky.removeClass("active");
					}
				});
				
				// 	on dropdown selection call filterOptionChange()
				coxjs.select("body").on("change", ".channel-lineup .select-wrapper select", function(event) {
					_module.filterOptionChange(this);
				});
				
				//	on submit of the find your channels form
				coxjs.select("body").on("submit", ".find-channels-form", function(event) {
					event.preventDefault();
				});

				//	on click of submit btn inside of search modal call searchOptionChange()
				coxjs.select("body").on("click", "#filter-search-submit", function(event) {
					event.preventDefault();
					_module.searchOptionChange();
				});
						
				//	on click of refine btn inside modal on mobile view call refineOptionChange()
				coxjs.select("body").on("click", "#refine-btn", function(event) {
					event.preventDefault();
					_module.refineOptionChange();
				});
				
				//	on click of underlay when modal is opened call closeModalWindow()
				coxjs.select("body").on("click", ".ui-widget-overlay", function(event) {
					if(coxjs.select(_selector)[0]) {
						event.preventDefault();
						_module.closeModalWindow();
					}
				});
				
				if (coxjs.select(_selector).length > 0) coxjs.select(_selector).trigger("init-channelLineup");
			},
			
			
			
			
			/**
			 * 
			 *
			 * find the default browser layout on page load
			 * determine if _browserLayout var is "desktop" or "mobile"
			 * 
			 * if there is querystring that was passed, add querystring
			 * to params var for deeplinking when ajax needs to be called
			 * 
			 * 
			 * @method getDefaultBrowserType
			 * @param n/a
			 * 
			 */
			getDefaultBrowserType : function () {
				// 	set browser layout from data attr on container
				_browserLayout = coxjs.select("body").attr("data-layout");
				// 	check for passed query string
				var url = coxjs.select(".channel-lineup").attr("data-ajax-source");
				var queryParams = window.location.href.split("?")[1];
				
				if(queryParams) _baseURL = url + "?" + window.location.href.split("?")[1] + "&layout=" + _browserLayout;	
				else _baseURL = url + "?layout=" + _browserLayout;	

				_module.makeAjaxRequest(_browserLayout, CL_AJAX_CALL_INIT);
			},
			
			
			
			/**
			 * 
			 *
			 * on resize of browser determine if _browserLayout needs to be updated
			 * 
			 * 
			 * @method determineBrowserType
			 * @param n/a
			 * 
			 */
			determineBrowserType : function() {
				// 	set browser layout from data attr on container when layout has changed
				if(_browserLayout != coxjs.select("body").attr("data-layout")) {
					_browserLayout = coxjs.select("body").attr("data-layout");
					//  if modal is open when switching browsers close it 
					_module.closeModalWindow();

					if(_baseURL.indexOf("layout") != -1) _baseURL = _module.removeParam(_baseURL, "layout");
					// make sure format is correct
					if(_baseURL.indexOf("?") == -1) _baseURL += "?";
					else _baseURL += "&";
					// add layout param
					_baseURL += "layout=" + _browserLayout;
					
					_module.makeAjaxRequest(_browserLayout, CL_AJAX_CALL_INIT);
				}
			},
			
			
			
			
			
			
			makeAjaxRequest : function(type, status, modalurl) {
				_module.insertThrobber();
				
				
				if(status == CL_AJAX_CALL_INIT) _module.updateCurrentRequestRange(type, "resetRange");
				
				var totalIsZero = false;
				// 	get the number of results per request from data attr
				if(type == CL_CONTAINER_MODAL) _numberOfResultsPerRequest = Number(coxjs.select(_modalSelector).find(_selector).attr("data-number-per-request"));	
				else _numberOfResultsPerRequest = Number(coxjs.select(_selector).attr("data-number-per-request"));	
				
				url = _module.getAllFilterOptions(type) + "&status=" + status + _module.updateCurrentRequestRange(type, "getCurrentRange");
				
				if(type == CL_CONTAINER_MODAL) url = modalurl + _module.getAllFilterOptions(type) + "&status=" + status + _module.updateCurrentRequestRange(type, "getCurrentRange");
				// 	generate ajax request object to be publised
				var ajaxOptions = {
					id: status + "_" + type + "_table",
					container: coxjs.select(_selector),
					url : url,
					type : "GET",
					dataType : "json",
					timeout : "3000",
					cache : false,
					throbber : {
						type : "showThrobber",
						data : {
							nodes : ".loading-wrapper"
						}
					}
				};
				
				//  check if the ajax call is appending to an existing call, if so check to see if 
				//  total results value isnt zero
				if(status == CL_AJAX_CALL_APPEND && _module.updateCurrentRequestRange(type, "isZero")) totalIsZero = true;
				// 	publish to AJAX Module
				// 	make ajax call as long as total records haven't been met
				if(!_module.updateCurrentRequestRange(type, "isTotal") && _tableSelector && !totalIsZero && coxjs.select(_selector)[0]) {					
					coxjs.publish({
						type : "Ajax",
						data : ajaxOptions
					});
					//	increment the range params
					_module.updateCurrentRequestRange(type, "addToRange");
				}
			},
			
			insertThrobber : function() {
				coxjs.select(_tableSelector).append(_throbberHTML);
			},
			
			
			removeParam : function(url, param) {
				return url.replace(new RegExp('[?&]' + param + '=[^&#]*(#.*)?$'), '$1').replace(new RegExp('([?&])' + param + '=[^&]*&'), '$1');
			},
			
			
			getBaseUrlParams : function(type, newParams) {
				var tempUrl = _baseURL.split("?")[1];				
				var currentParams = tempUrl&&tempUrl.substr(0).replace(/\+/gi," ").split("&");		
				
				if(newParams) {
					var newParamsArr = newParams&&newParams.substr(0).replace(/\+/gi," ").split("&");		
					// loop through the current params on the base url and see if there are duplicates
					// if there are duplicates remove from base url
					coxjs.select(currentParams).each(function(i, e) {
						var id = e.split("=")[0];					
						coxjs.select(newParamsArr).each(function(index, element) {
							var newID = element.split("=")[0];
							if(id == newID) _baseURL = _module.removeParam(_baseURL, id);
						});
					});
				}
			},
				
			getAllFilterOptions : function(type) {
				var params = "";
				
				if(type == CL_CONTAINER_DESKTOP) {
					// check for duplicate params in base url
					_module.getBaseUrlParams(type, _module.getSearchModalParams());
					_module.getBaseUrlParams(type, _module.getSortParams(false));
					_module.getBaseUrlParams(type, _module.getFilterParams());
					
					// get all filter params
					params += _baseURL;
					params += _module.getSearchModalParams();
					params += _module.getSortParams(false);
					params += _module.getFilterParams();
				}
				
				if(type == CL_CONTAINER_MODAL) {
					params += _module.getSortParams(true);
				}
				
				if(type == CL_CONTAINER_MOBILE) {
					params += _baseURL;
					params += _module.getSearchModalParams();
					params += _module.getRefineParams();
				}
				
				return params;
			},
			
			getSearchModalParams : function() {
				var params = "";
				var inputFields = coxjs.select(".filter-search-fields").find("input");
				var selectOptions = coxjs.select(".filter-search-fields").find("select");
				
				// loop through form for input fields and set the params
				coxjs.select(inputFields).each(function(index, el){					
					// get input text value
					if(coxjs.select(el).attr("type") == "text" && coxjs.select(el).val()) params += "&filter-search-term=" + coxjs.select(el).val();
					// get the checkbox values
					if(coxjs.select(el).attr("type") == "checkbox" && coxjs.select(el).is(':checked')) params += "&" + coxjs.select(el).attr("name") + "=" + coxjs.select(el).val();
				});
				
				// loop through form for select options and set the params
				coxjs.select(selectOptions).each(function(index, el){
					// get the select option values
					if(coxjs.select(el).val()) params += "&" + coxjs.select(el).attr("name") + "=" + coxjs.select(el).val();
				});
				
				return params;
			},
			
			
			getSortParams : function(modal) {
				var selects = coxjs.select(".sort-by-select").find(".select-wrapper select");
				var params = "";
				var defaultVal = "&sort-by-select=number";
				
				if(modal) selects = coxjs.select(".cms-dialog").find(".sort-by-select").find(".select-wrapper select")[0];

				if(selects) {
					coxjs.select(selects).each(function(i, e) {
						var id = coxjs.select(e).attr("id");
						var val = coxjs.select(e).find("option:selected").val();
						params += "&" + id + "=" + val;
					});
				}
				
				if(!params) params = defaultVal;
				
				return params;
			},
			
			
			getFilterParams : function() {
				var selects = coxjs.select(".filter-by-select").find(".select-wrapper select");
				var params = "";
				var defaultVal = "&filter-by-select=en";
				
				coxjs.select(selects).each(function(i, e) {
					var id = coxjs.select(e).attr("id");
					var val = coxjs.select(e).find("option:selected").val();
					params += "&" + id + "=" + val;
				});

				if(!params) params = defaultVal;
				
				return params;
			},
			
			
			getRefineParams : function() {
				var params = "";
				var inputFields = coxjs.select(".channel-lineup-refine").find("input");
				var selectOptions = coxjs.select(".channel-lineup-refine").find("select");
				var defaultVal = "&filter-by-select=en";
				
				// loop through form for select options and set the params
				coxjs.select(selectOptions).each(function(index, el){
					// get the select option values
					params += "&" + coxjs.select(el).attr("id") + "=" + coxjs.select(el).val();
				});
			
				// loop through form for input fields and set the params
				coxjs.select(inputFields).each(function(index, el){					
					// get radio btn value
					if(coxjs.select(el).attr("type") == "radio" && coxjs.select(el).is(":checked")) params += "&" + coxjs.select(el).attr("name") + "=" + coxjs.select(el).val();
				});
				
				if(!params) params = defaultVal;
				
				return params;
			},
			
			
			
			/**
			 * 
			 *
			 * when .scroll-active class is applied to the channel-lineup container
			 * ProgressiveScroll Module publishes message for window scroll events
			 * 
			 * if modal is open make ajax request only in modal and not in desktop or mobile view
			 * 
			 * 
			 * @method listenForScrollEvents
			 * @param n/a
			 * 
			 */
			listenForScrollEvents : function() {
				// 	use _modalIsOpen flag to determine if modal status and proper ajax call to make
				if(_modalIsOpen || coxjs.select(_modalSelector).length > 0) { //Fix for defect# 60647, added additional check for modal as _modalIsOpen flag was set incorrectly
					var params = _modalBaseURL.split("?")[1];
					var modalUrl = coxjs.select(_modalSelector).find(".channel-lineup").attr("data-ajax-source");
					var url = modalUrl + "?" + params + "&layout=" + CL_CONTAINER_MODAL;
					_module.makeAjaxRequest(CL_CONTAINER_MODAL, CL_AJAX_CALL_APPEND, url);
				}else _module.makeAjaxRequest(_browserLayout, CL_AJAX_CALL_APPEND);
			},
			
			
			
			/**
			 * 
			 *
			 * when Modal Module pubishes a message for "ModalLoaded" it passes a data object
			 * that contains the url of the modals actual address.  If there is params on the 
			 * url add them to the ajax request for the modal when updating the table inside the
			 * modal
			 * 
			 * 
			 * @method channelLineupModal
			 * @param {object} data
			 * 
			 */
			channelLineupModal : function(data) {
				if(data) {
					_modalBaseURL = data;
					var params = _modalBaseURL.split("?")[1];
					var modalUrl = coxjs.select(_modalSelector).find(".channel-lineup").attr("data-ajax-source");
					var url = modalUrl + "?" + params + "&layout=" + CL_CONTAINER_MODAL;
					
					//	update _modalIsOpen flag so only modal gets updated
					_modalIsOpen = true;
					
					if(coxjs.select(_modalSelector).find(_tableSelector)[0]) _module.makeAjaxRequest(CL_CONTAINER_MODAL, CL_AJAX_CALL_INIT, url);
				}
			},
			
			
			
			
			/**
			 * 
			 *
			 * this method gets called when the user clicks the close btn 
			 * on the modal or if they click the underlay of the modal
			 * 
			 * once modal has closed reset the _modalIsOpen flag
			 * 
			 * 
			 * @method closeModalWindow
			 * @param n/a
			 * 
			 */
			closeModalWindow : function() {
				var isSearchModalOpen = coxjs.select(".cms-dialog").find(".modal-inline-content")[0];
				// 	close modal window
				coxjs.select(_modalSelector).remove();

				// 	reset flag
				_modalIsOpen = false;

				if(isSearchModalOpen) coxjs.select(".modal-inline-content").css("display", "none");
				else{
					
					//  reset ajax call in mobile or desktop				
//					_module.setAjaxRequestURL(_browserLayout, "", CL_AJAX_CALL_INIT, false);
				}	
				
				//  reset modal range param
				_module.updateCurrentRequestRange(CL_CONTAINER_MODAL, "resetRange");
			},
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			/**
			 * 
			 *
			 * once ajax is called Ajax Module publishes message "initDesktopTable"
			 * 
			 * if there is a response, dynamically build desktop table
			 * 
			 * 
			 * @method initDesktopTable
			 * @param {object} data
			 * 
			 */
			initDesktopTable : function(data) {
				// handle if 404 error or other ajax error
				if(data.isError) {
					_module.noResultsFound(0,false, true);
				}else{
					var response = data.responseJSON;
					if(response) {
						// 	set the total record
						_totalDesktopRecordsCalled = response.totalResults;
						if(_totalDesktopRecordsCalled == 0) {
							//	check for no results found to display message
							_module.noResultsFound(_totalDesktopRecordsCalled, false, false);
						}else{
							// 	build table
							_module.setPageTitle(DESKTOP_TITLE);
							
							// set desktop pdf link
							coxjs.select(".pdf-link").attr("href", response.pdfUrl);
							
							var subheader = _module.desktopTableHeader(response.tableHeader,false, response.sortSelect);
							_module.desktopTableBody(response.tableBody, false);
							
							// insert sub header
							_module.insertSubheader(subheader, CL_CONTAINER_DESKTOP, false);
						}
						
						//	add filter dropdowns
						_module.addFilterDropdowns(response.filterSelect, false);
						
						//	add the filters
						_module.displayFilters(response.filter, false);
						
						// register tooltips
						_module.registerAllTooltips();
						 
						// add dropdowns to search modal
						_module.addDropdownToSearchModal(response.searchGenre, response.searchTVPaks);
						
						// prepare for more progressive scrolling
						_module.ajaxFinishedLoading();
					}
					
				}
			},
			
			
			
			/**
			 * 
			 *
			 * once ajax is called Ajax Module publishes message "appendDesktopTable"
			 * 
			 * if there is a response, append to the existing desktop table
			 * 
			 * 
			 * @method appendDesktopTable
			 * @param {object} data
			 * 
			 */
			appendDesktopTable : function(data) {
				// handle if 404 error or other ajax error
				if(data.isError) {
					_module.noResultsFound(0,false, true);
				}else{
					var response = data.responseJSON;
					if(response) _module.appendDesktopTableBody(response.tableBody, false);
					
					// register tooltips
					_module.registerAllTooltips();		
					
					// prepare for more progressive scrolling
					_module.ajaxFinishedLoading();		
				}
			},
			
			
			
			
			/**
			 * 
			 *
			 * using the response json object build the header for the desktop table
			 * 
			 * check if "modal" is true, build table header inside of modal instead of desktop container
			 * 
			 * @method desktopTableHeader
			 * @param {object} content, {boolean} modal
			 * 
			 */
			desktopTableHeader : function(content, modal, sortContent) {	
				var header = '<table class="data-table">';
				var modalUrl = coxjs.select(_selector).attr("data-view-details-url");
						
				// 	loop through content and create the colgroup cols
				var colgroupCol = "";
				coxjs.select(content).each(function( index, el ) {
					// 	check for selected class
					el.colClass ? colgroupCol += '<col class="' + el.colClass + '" />' : colgroupCol += '<col />';
				});
				var colGroups = '<colgroup>' + colgroupCol + '</colgroup><thead><tr>';

				header += colGroups;
				var subheader = '<tr class="sub-header">';
				var sortSelect = '<td class="sort-by-select"><div class="select-wrapper">' + _module.addSortDropdowns(sortContent) + '</div></td>';
				var browserLayout = coxjs.select("body").attr("data-layout");
				subheader += sortSelect;
				
				// 	update global columns var
				if(!modal) _numberOfColumns = content.length;
				else _numberModalOfColumns = 2;
				
				// 	loop through content and creaate the table header
				coxjs.select(content).each(function( index, el ) {
					var col;
					// 	check for selected class
					el.colClass ?  col = '<th class="' + el.colClass + '">' + el.colTitle : col = '<th>' + el.colTitle;
					// 	add span text
					if(el.colTitleSpan) col += "<span>" + el.colTitleSpan + "</span>";
					col += "</th>";
					
					header += col;
				
					// 	add subheader select options
					if(index != 0) subheader += '<td><a data-hide-close-btn="true" href="' + modalUrl + '?pkg=' + el.pkg + '" class="cms-modal-trigger" data-modal-width="690">View Details</a></td>';                         
				});
				
				header += '</tr></thead></table>';
				subheader += '</tr>';

				// 	create header with created html
				if(!modal) coxjs.select(_tableSelector).html(header);
				else coxjs.select(_modalSelector).find(_tableSelector).html(header);
				
				// 	return subheader html 
				return subheader;
			},
			
			
			
			
			
			/**
			 * 
			 *
			 * using the response json object build the body of the desktop table
			 * 
			 * check if "modal" is true, build table body inside of modal instead of desktop container
			 * 
			 * @method desktopTableBody
			 * @param {object} content, {boolean} modal
			 * 
			 */
			desktopTableBody : function(content, modal) {
				var tableBody = "";
				var tableCreated = coxjs.select(_tableSelector).find("tbody")[0];
				if(modal) tableCreated = coxjs.select(_modalSelector).find(_tableSelector).find("tbody")[0];
				if(modal) _numberModalOfColumns = 3;
				if(!tableCreated) tableBody = "<tbody>";
				
				tableBody += _module.getDesktopTableRows(content, modal);
				tableBody += "</tr>";
				
				if(!tableCreated) tableBody += "</tbody>";
				if(!modal) coxjs.select(_tableSelector).find("table thead").after(tableBody);
				else coxjs.select(_modalSelector).find(_tableSelector).find("table thead").after(tableBody);
			},
			
			
			insertSubheader : function(subheader, browserLayout, modal) {
				// 	add subheader if its in desktop layout
				var tbody = coxjs.select(_tableSelector).find("tbody");
				
				if(!modal) coxjs.select(tbody).prepend(subheader);
				else {
					var thead = coxjs.select(_modalSelector).find('thead')[0]
					coxjs.select(_modalSelector).find(tbody).prepend(subheader);
											
					// stretch the header across the whole table in modal view
					coxjs.select(_modalSelector).find(tbody).find("tr:first-child th:last-child").attr("colspan",2);
					coxjs.select(_modalSelector).find(tbody).find(".sub-header").find("td:last-child").attr("colspan",2);

					coxjs.select(_modalSelector).find(thead).find("tr:first-child th:last-child").attr("colspan",2);						
					
					// hide anchor in subheader in modal view
					coxjs.select(_modalSelector).find(tbody).find("a").css("display", "none");
				} 
			},
			
			
			
			/**
			 * 
			 *
			 * using the response json object append to the table body on the desktop
			 * 
			 * check if "modal" is true, append to table body inside of modal
			 * 
			 * @method appendDesktopTableBody
			 * @param {object} content, {boolean} modal
			 * 
			 */
			appendDesktopTableBody : function(content, modal) {
				var appendToBody = "";
				if(modal) _numberModalOfColumns = 3;
				
				appendToBody += _module.getDesktopTableRows(content, modal);
				appendToBody += "</tr>";
				
				if(!modal) {
					coxjs.select(_tableSelector).find("table tbody").append(appendToBody);
					// reapply sticky header
					coxjs.select('.channel-lineup .data-table').stickyTableHeaders();
					
					
				} else {
					coxjs.select(_modalSelector).find(_tableSelector).find("table tbody").append(appendToBody);
				}
				
				// register tooltips
				_module.registerAllTooltips();
			},
			
			
			
			
			
			/**
			 * 
			 *
			 * use this method to generate the actual table rows to be inserted
			 * into the body of the table
			 * 
			 * check if "modal" is true, modal has different table layout
			 * 
			 * @method getDesktopTableRows
			 * @param {object} content, {boolean} modal
			 * 
			 */
			getDesktopTableRows : function(content, modal) {
				var tableBody = "";
				var numCols = _numberOfColumns;
				if(modal) numCols = _numberModalOfColumns;
				
				var col = "";
				
				coxjs.select(content).each(function( index, el ) {
					if((index % numCols ) == 0) col = "<tr>";
					else col = "";
					
					if(!modal) {
						// 	if there is a channelBox prop, create the div for channel info			
						if(el.channelBox) {
							col+= '<td><div class="channel-data"><h3 class="channel-box">' + el.channelBox +'</h3><img class="channel-logo" alt="' + el.logoAlt + '" src="' + el.logoUrl +'"><div class="channel-name">' + el.channelName + '</div>';
							col+= '<ul class="channel-features">';
							
							if(el.channelFeatures) {
								coxjs.select(el.channelFeatures).each(function(i, e) {
									col += '<li>' + e.type + '</li>';
								});
								// 	if there is only one channel features item
								var isChannelFeaturesArr = el.channelFeatures instanceof Array;
								if(!isChannelFeaturesArr)  col += '<li>' + el.channelFeatures + '</li>';
							} 
							col+= '</ul></div></td>';
						}
						// 	else if checked element add checked content
						else if(el.checked) col+= '<td><div class="check-mark">&nbsp;</div></td>';
						// 	else add optional link with overlay
						else if(el.optional) {
							// add optional tooltip
							col+= '<td>';
							coxjs.select("body").append('<div class="tooltip-message" id="optional-text-' + index + '">' + el.optionalText + '</div>');
							col+= '<a class="tooltip-trigger disabled" data-content-element="optional-text-' + index + '">Optional</a>';
							col+= '</td>';
						}else if(!el.checked && !el.optional) {
							col+= '<td><div>&nbsp;</div></td>';
						}
					}else{
						col +=	'<td>';
						if(el.channelBox)  col += '<h3 class="channel-box">' + el.channelBox + '</h3>';
						if(el.logoUrl) 	   col +=		'<img class="channel-logo" alt="' + el.logoAlt + '" src="' + el.logoUrl + '">';
						col +=	'</td>';
						col +=	'<td>';
						if(el.logoAlt)     col +=		'<div class="channel-name">' + el.logoAlt + '</div>';
						col +=	'</td>';
						col +=	'<td>';
						col +=		'<ul class="channel-features">';
						if(el.channelFeatures) {
							coxjs.select(el.channelFeatures).each(function(i, e) {
								col += '<li>' + e.type + '</li>';
							});
							// 	if there is only one channel features item
							var isChannelFeaturesArr = el.channelFeatures instanceof Array;
							if(!isChannelFeaturesArr)  col += '<li>' + el.channelFeatures + '</li>';
						} 
						
						col +=		'</ul>';
						col +=	'</td>';
						col += '</tr>';
					}
					tableBody += col; 
				});
				
				return tableBody;
			},	
			
			
			
			
				
			/**
			 * 
			 *
			 * once ajax is called Ajax Module publishes message "initMobileTable"
			 * 
			 * if there is a response, create mobile table
			 * 
			 * @method initMobileTable
			 * @param {object} data
			 * 
			 */
			initMobileTable : function(data) {
				// handle if 404 error or other ajax error
				if(data.isError) {
					_module.noResultsFound(0,false, true);
				}else{
					var response = data.responseJSON;
					if(response) {
						// 	set the total record
						_totalMobileRecordsCalled = response.totalResults;
						//  check if total records is zero or not
						if(_totalMobileRecordsCalled == 0) _module.noResultsFound(_totalMobileRecordsCalled, false, false);
						else {
							_module.createMobileTable(response);
							
							// remove any previous radio btns
							coxjs.select(".channel-lineup-refine").find("span").remove();
							//	add radio btns in refine form
							_module.addFilterDropdowns(response.filterSelect, true);
							// populate the tv packages in the refine form
							_module.getRefineModalBody(response.refineBody);
							// set desktop pdf link
							coxjs.select(".pdf-link").attr("href", response.pdfUrl);
						} 
						
						// add the filters
						_module.displayFilters(response.filter, true);
						// add dropdowns to search modal
						_module.addDropdownToSearchModal(response.searchGenre, response.searchTVPaks);
						
						// prepare for more progressive scrolling
						_module.ajaxFinishedLoading();
					}
				}
			},
			
			
			
			
			/**
			 * 
			 *
			 * once ajax is called Ajax Module publishes message "appendMobileTable"
			 * 
			 * if there is a response, append to mobile table
			 * 
			 * @method initMobileTable
			 * @param {object} data
			 * 
			 */
			appendMobileTable : function(data) {
				// handle if 404 error or other ajax error
				if(data.isError) {
					_module.noResultsFound(0,false, true);
				}else{
					var response = data.responseJSON;
					if(response) _module.appendMobileContentTable(response);
					
					// prepare for more progressive scrolling
					_module.ajaxFinishedLoading();
				}
			},
			
			
			
			
			/**
			 * 
			 *
			 * dynamically build the mobile table from the response json object
			 * 
			 *
			 * 
			 * @method createMobileTable
			 * @param {object} content
			 * 
			 */
			createMobileTable : function(content) {
				// 	mobile table has 5 columns
				_numberOfColumns = 5;
				// 	set the package name
				var tableHeader = content.packageName;		
				_module.setPageTitle(tableHeader);
				// 	local table var to build table
				var table = "";				
				table += '<table class="data-table">';
				table += _module.getMobileTableRows(content);
				table += '</table>';
				// insert dynamic table into container
				coxjs.select(_tableSelector).html(table);
			},
			
			
			
			
			/**
			 * 
			 *
			 * append the json response on the current mobile table 
			 * 
			 *
			 * 
			 * @method appendMobileContentTable
			 * @param {object} content
			 * 
			 */
			appendMobileContentTable : function(content) {
				// 	mobile table has 5 columns
				_numberOfColumns = 5;
				// 	local table var to build table
				var table = "";				
				table += _module.getMobileTableRows(content);				
				// 	append dynamic table portion to the existing mobile table
				coxjs.select(_tableSelector).find("table").append(table);
			},
			
			
			
			
			/**
			 * 
			 *
			 * use this method to dynamically build the existing table rows
			 * from the response json object
			 * 
			 *
			 * 
			 * @method getMobileTableRows
			 * @param {object} content
			 * 
			 */
			getMobileTableRows : function(content) {
				var table = "";
				
				coxjs.select(content.tableBody).each(function( index, el ) {
					var row = "";
					row += '<tr class="odd">';
					row += '<td><img src="' + el.logoUrl + '" alt="' + el.logoAlt + '" class="channel-logo" /></td>';
					row += '<td><h3 class="channel-box">' + el.channelBox + '</h3></td>';
					row += '<td><div class="channel-name">' + el.logoAlt  + '</div></td>';
					row += '<td>';
					row += '<ul class="channel-features">';
					// 	loop through channel features
					coxjs.select(el.channelFeatures).each(function(i, e) {
						row += '<li>' + e.type + '</li>';
					});
					row += '</ul>';
					row += '</td>';
					
					
					row += "</tr>";
					table += row;
				});
				
				return table;
			},
			
			
			
			
			
			
			getRefineModalBody : function(content) {	
				var refineRadioOptions = "";
				
				coxjs.select(content).each(function(i, e) {
					refineRadioOptions += '<span class="colspan-12">';
					if(e.selected) refineRadioOptions += '<input type="radio" checked="' + e.selected + '" value="' + e.value + '" id="' + e.value + '" name="tv-package" />';
					else refineRadioOptions += '<input type="radio" value="' + e.value + '" id="' + e.value + '" name="tv-package" />';
					refineRadioOptions += '<label for="' + e.value + '">' + e.name + '</label>';
					refineRadioOptions += '</span>';
				});
				
				refineRadioOptions += '<span class="colspan-12">';
				refineRadioOptions += '<a id="refine-btn" class="button" href="#">Refine</a>';
				refineRadioOptions += '</span>';
				
				coxjs.select(".channel-lineup-refine").find(".tv-packages").html(refineRadioOptions);
				coxjs.select(".channel-lineup-refine input[name='language-package']").change(function(e) {
					_module.refineLanguagePackageChange(coxjs.select(this).val());
				});
			},
			
			
			
			refineLanguagePackageChange : function(val) {
				var url = coxjs.select(_selector).attr("data-ajax-source") + "?refine=true&language-package=" + val;

				// 	generate ajax request object to be publised
				var ajaxOptions = {
					id: "update_refine_tv_package",
					container: coxjs.select('.refine-your-search'),
					url : url,
					type : "GET",
					dataType : "json",
					timeout : "30000",
					cache : false,
					throbber : {
						type : "showThrobber",
						data : {
							nodes : ".loading-wrapper"
						}
					}
				};
				
				coxjs.publish({
					type : "Ajax",
					data : ajaxOptions
				});
			},
			
			
			updateRefineTvPackages : function(data) {
				var response = data.responseJSON;
				var content = response.refineBody;
				var refineRadioOptions = "";
				
				coxjs.select(content).each(function(i, e) {
					refineRadioOptions += '<span class="colspan-12">';
					if(e.selected) refineRadioOptions += '<input type="radio" checked="' + e.selected + '" value="' + e.value + '" id="' + e.value + '" name="tv-package" />';
					else refineRadioOptions += '<input type="radio" value="' + e.value + '" id="' + e.value + '" name="tv-package" />';
					refineRadioOptions += '<label for="' + e.value + '">' + e.name + '</label>';
					refineRadioOptions += '</span>';
				});
				
				refineRadioOptions += '<span class="colspan-12">';
				refineRadioOptions += '<a id="refine-btn" class="button" href="#">Refine</a>';
				refineRadioOptions += '</span>';
				
				coxjs.select(".channel-lineup-refine").find(".tv-packages").html(refineRadioOptions);
			},
			
			/**
			 * 
			 *
			 * once ajax is called Ajax Module publishes message "initModalTable"
			 * 
			 * if there is a response, build modal table inside modal container
			 * 
			 * because the json response is similar to desktop json response we resuse
			 * the same methods that built the desktop table for modal table construction
			 * 
			 *
			 * 
			 * @method initModalTable
			 * @param {object} data
			 * 
			 */
			initModalTable : function(data) {
				// handle if 404 error or other ajax error
				if(data.isError) {
					_module.noResultsFound(0,true,true);
				}else{
					var response = data.responseJSON;
					if(response) {
						// set the total record
						_totalModalRecordsCalled = response.totalResults;	
						
						if(_totalModalRecordsCalled == 0) {
							//	check for no results found to display message
							_module.noResultsFound(_totalModalRecordsCalled, true, false);
						}else {
							//	add modal package title
							var modalTitle = coxjs.select(".cms-dialog .channel-lineup-modal-header");
							coxjs.select(modalTitle).html("<h2>" + response.packageName + "</h2>");
							//	add modal package desc
							var modalDesc = coxjs.select(".cms-dialog .channel-lineup-desc-text");
							coxjs.select(modalDesc).html(response.packageDesc);
							
							// add offers link if exists
							var modalButton;
							if (response.onlinePurchase) {
								modalButton = "<a class='button' href='" + response.offerUrl + "'>" + response.offerText + "</a>";
							} else {
								modalButton = "<a href='#' data-content-element='package-details-help' class='button tooltip-trigger'>" + response.detailsText + "</a>";
								modalButton += "<div id='package-details-help' class='tooltip-message'>" + response.detailsTooltip + "</div>";
								//coxfw.core.initialize("modules.global.Tooltip"); 
							}
							coxjs.select(".cms-dialog .channel-lineup-desc-button").html(modalButton);
							
							// build table
							var subheader = _module.desktopTableHeader(response.tableHeader, true, response.sortSelect);
							_module.desktopTableBody(response.tableBody, true);
							// insert sub header
							_module.insertSubheader(subheader, CL_CONTAINER_DESKTOP, true);
						
						
						
							// reapply sticky header (RS: this doubles the header when the modal is called outside of the grid)
							//coxjs.select('.cms-dialog .channel-lineup .data-table').stickyTableHeaders();
						}	
						
						// register tooltips
						_module.registerAllTooltips();		
						
						
						// prepare for more progressive scrolling
						_module.ajaxFinishedLoading();
					}
					var closeBtn = coxjs.select(".cms-dialog").find("button");
					coxjs.select(closeBtn).click(function(event) {
						event.preventDefault();
						_module.closeModalWindow();
					});

				}
			},
			
			
			
			
			/**
			 * 
			 *
			 * once ajax is called Ajax Module publishes message "appendModalTable"
			 * 
			 * if there is a response, append to modal table inside modal container
			 * 
			 * because the json response is similar to desktop json response we resuse
			 * the same methods that appends the desktop table for modal table 
			 * 
			 *
			 * 
			 * @method appendModalTable
			 * @param {object} data
			 * 
			 */
			appendModalTable : function(data) {
				// handle if 404 error or other ajax error
				if(data.isError) {
					_module.noResultsFound(0,true, true);
				}else{
					var response = data.responseJSON;
					if(response) _module.appendDesktopTableBody(response.tableBody, true);
					
					// register tooltips
					_module.registerAllTooltips();
					
					// prepare for more progressive scrolling
					_module.ajaxFinishedLoading();
				}
			},
			
			
			
			
			
			/**
			 * 
			 *
			 * display a no results found message below the table if there are no results
			 * 
			 * 
			 * @method noResultsFound
			 * @param {object} count
			 * 
			 */
			noResultsFound : function(count, modal, error) {
				if(error) {
					if(!modal) coxjs.select(".channel-lineup-table").html("<p class='no-results'>Unable to load channel lineup.</p>");
						else coxjs.select(".cms-dialog .channel-lineup-table").html("<p class='no-results'>Unable to load channel lineup.</p>");
				}else{
					if (count == 0) {
						if(!modal) coxjs.select(".channel-lineup-table").html("<p class='no-results'>No channels matched your search criteria.</p>");
						else coxjs.select(".cms-dialog .channel-lineup-table").html("<p class='no-results'>No channels matched your search criteria.</p>");
					}
				}
			},
			
			

			
			/**
			 * 
			 *
			 * display the search filters if any
			 * 
			 * 
			 * @method displayFilters
			 * @param {object} content
			 * 
			 */
			displayFilters : function(content, mobile) {
				coxjs.select(".cl-showme").remove();
				
				if (content && content.length > 0 && !mobile) {	
					var filters = "";
					coxjs.select(content).each(function( index, el ) {
						filters += '<span>' + el.term + '</span>';
					});
					
					coxjs.select(".channel-lineup .filter-list").html("filtered by:" + filters);
				}
				
				if (content && content.length > 0 && mobile) {
					coxjs.select(".channel-lineup-tabs li:first-child").append('<span class="cl-showme">' + content.length + '</span>');					
				}
			},
			
			
			
			
			
			/**
			 * 
			 *
			 * display the filter dropdowns if any
			 * 
			 * 
			 * @method addFilterDropdowns
			 * @param {object} content
			 * 
			 */
			addFilterDropdowns : function(content, mobile) {
				var filterContainer = coxjs.select(".channel-lineup .filter-by-select .select-wrapper");
				var numberOfSelects = 0;
				// 	check for dropdown content and build dropdown if there
				if(content && !mobile) {
					numberOfSelects = coxjs.select(content).length;
					if(numberOfSelects > 1) {
						var filterDropdown = '<select id="filter-by-select" name="filter-by-select">';
						coxjs.select(content).each(function(index, el){
							if(el.selected) filterDropdown += '<option selected="' + el.selected + '" value="' + el.value + '">' + el.name + '</option>';
							else filterDropdown += '<option value="' + el.value + '">' + el.name + '</option>';
						});
						
						filterDropdown += '</select>';	
						//	insert dropdown in select-wrapper
						coxjs.select(filterContainer).html(filterDropdown);
					}
				}else if(content && mobile) {
					numberOfSelects = coxjs.select(content).length;
					if(numberOfSelects > 1) {
						var radioBtns = '';
						coxjs.select(content).each(function(i, e) {
							radioBtns += '<span class="colspan-12">';
							if(e.selected) radioBtns += '<input type="radio" value="' + e.value + '" checked="' + e.selected + '" id="' + e.value + '" name="language-package" />';
							else radioBtns += '<input type="radio" value="' + e.value + '" id="' + e.value + '" name="language-package" />';
							radioBtns += '<label for="' + e.value + '">' + e.name + '</label>';
							radioBtns += '</span>';
						});
					}
					coxjs.select('.channel-lineup-refine').find("h2").after(radioBtns);
				}				
			},
						
			
			
			
			
			/**
			 * 
			 *
			 * display the sort dropdowns if any
			 * 
			 * 
			 * @method addSortDropdowns
			 * @param {object} content
			 * 
			 */
			addSortDropdowns : function(content) {
				// 	check for dropdown content and build dropdown if there
				if(content) {
					var sortDropdown = '<select id="sort-by-select" name="sort-by-select">';
					
					coxjs.select(content).each(function(index, el){
						if(el.selected) sortDropdown += '<option selected="' + el.selected + '" value="' + el.value + '">' + el.name + '</option>';
						else sortDropdown += '<option value="' + el.value + '">' + el.name + '</option>';
					});
					
					sortDropdown += '</select>';	
					
					return sortDropdown;
				}else return "";		
			},
			
			
			
			
			
			/**
			 * 
			 *
			 * when the user makes a selection on any dropdown
			 * a new ajax request is generated with new params from the dropdown selection
			 * 
			 * 
			 * @method filterOptionChange
			 * @param 
			 * 
			 */
			filterOptionChange : function(obj) {
				var isModal = false;
				var params = _modalBaseURL.split("?")[1];
				var modalUrl = coxjs.select(_modalSelector).find(".channel-lineup").attr("data-ajax-source");
				var url = modalUrl + "?" + params + "&layout=" + CL_CONTAINER_MODAL;
				
				
				
				if(coxjs.select(obj).closest(_modalSelector)[0]) isModal = true;
				 	
				if(!isModal) _module.makeAjaxRequest(_browserLayout, CL_AJAX_CALL_INIT);
				else _module.makeAjaxRequest(CL_CONTAINER_MODAL, CL_AJAX_CALL_INIT, url);
			},
			
			
			
			/**
			 * 
			 *
			 * when the user opens up the search modal and makes selections to the form
			 * once they submit their selections a new ajax request is generated from what the selected
			 * 
			 * 
			 * 
			 * @method searchOptionChange
			 * @param {object} n/a
			 * 
			 */
			searchOptionChange : function() {				
				_module.closeModalWindow();
				_module.makeAjaxRequest(_browserLayout, CL_AJAX_CALL_INIT);
			},
			
			
			
			
			addDropdownToSearchModal : function(genre, paks) {
				// populate the search tv paks dropdown
				var tvPaksContainer = coxjs.select('.filter-search-select-paks')[0];
				var tvPaksSelectHere = coxjs.select(tvPaksContainer).find("select")[0];
				
				// populate the search genre dropdowns
				var genreContainer = coxjs.select('.filter-search-select-genre')[0];
				var genreSelectHere = coxjs.select(genreContainer).find("select")[0];
				
				if(tvPaksContainer && !tvPaksSelectHere) {
					coxjs.select(tvPaksContainer).css("display", "");
					var paksSelect = '<select id="filter-search-select-paks" name="filter-search-select-paks">';
					coxjs.select(paks).each(function(index, el) {
						if(el.selected) paksSelect += '<option value="' +  el.value + '" selected="' + el.selected + '">' + el.name + '</option>';
						else paksSelect += '<option value="' +  el.value + '">' + el.name + '</option>';
					});
					
					paksSelect += '</select>';
					
					// add dropdown
					coxjs.select(tvPaksContainer).append(paksSelect);
				}
				
				if(genreContainer && !genreSelectHere) {
					coxjs.select(genreContainer).css("display", "");
					var genreSelect = '<select id="filter-search-select-genre" name="filter-search-select-genre">';
					coxjs.select(genre).each(function(index, el) {
						if(el.selected) genreSelect += '<option value="' +  el.value + '" selected="' + el.selected + '">' + el.name + '</option>';
						else genreSelect += '<option value="' +  el.value + '">' + el.name + '</option>';
					});
					
					genreSelect += '</select>';
					
					// add dropdown
					coxjs.select(genreContainer).append(genreSelect);	
				}
				
				if(genre.length == 0) coxjs.select(genreContainer).css("display", "none");
				if(paks.length == 0) coxjs.select(tvPaksContainer).css("display", "none");
			},
			
			
			
			
			
			
			
			
			/**
			 * 
			 *
			 * when the user opens up the refine modal inside the mobile view
			 * once they make their selections and submit a new ajax request is 
			 * generated from their selections
			 * 
			 * 
			 * 
			 * @method refineOptionChange
			 * @param {object} n/a
			 * 
			 */
			refineOptionChange : function() {		
				_module.closeModalWindow();
				_module.makeAjaxRequest(_browserLayout, CL_AJAX_CALL_INIT);
			},
			
			
			/**
			 * 
			 *
			 * this is method is used to set the page title with the selected package name in mobile
			 * 
			 * if its desktop view, it resets to the default title "Channel Lineup"
			 * 
			 * 
			 * 
			 * @method setPageTitle
			 * @param {string} title
			 * 
			 */
			setPageTitle : function(title) {
				coxjs.select(".section-header h2").html(title);
			},
			




			/**
			 * 
			 * get view port position for the passed element
			 * 
			 * 
			 * @method getViewportOffset
			 * @param {object} barPosition
			 * 
			 */
			getViewportOffset : function(barPosition) {
				var windowPosition = coxjs.select(window);
				scrollTop = windowPosition.scrollTop();
				offset = barPosition.offset();

				return {
					top : offset.top - scrollTop
				};
			},
			
			
			
			
			/**
			 * 
			 * this method is used to update the range parameters for the ajax request url
			 * 
			 * each container has its own currentResultSet variable to store the value of its
			 * current range param
			 * 
			 * each container has its own totalRecordsCalled variable to store the value of the 
			 * total number of records before it reached the end of the result set
			 * 
			 * "getCurrentRange" - is used to return the current range param
			 * 
			 * "addToRange" - is used to increment the current range param
			 * 
			 * "resetRange" - is used to reset the range for that particular container back to zero
			 * 
			 * "isTotal" - returns a boolean if the total records has been reach by the range param
			 * 
			 * 
			 * 
			 * @method updateCurrentRequestRange
			 * @param {string} type, {job} string
			 * 
			 */
			updateCurrentRequestRange : function(type, job) {
				var currentResultSet;
				var params;
				var totalCalled;
								
				switch(type) {
					case CL_CONTAINER_MODAL:
						totalCalled = _totalModalRecordsCalled;
						currentResultSet = _modalCurrentResultSet;
						break;
					
					case CL_CONTAINER_DESKTOP: 
						totalCalled = _totalDesktopRecordsCalled;
						currentResultSet = _desktopCurrentResultSet;
						break;
					
					case CL_CONTAINER_MOBILE:
						totalCalled = _totalMobileRecordsCalled;
						currentResultSet = _mobileCurrentResultSet;
						break;
				}
				
				switch(job) {
					case "getCurrentRange":
						var start = (currentResultSet * _numberOfResultsPerRequest) - _numberOfResultsPerRequest;
						if(currentResultSet > 1) start = ((currentResultSet * _numberOfResultsPerRequest) - _numberOfResultsPerRequest) + 1;
						
						var end = (currentResultSet * _numberOfResultsPerRequest);	
						params = "&start=" + start + "&end=" + end;					
						return params;
						break;
					
					case "addToRange":
						currentResultSet++;
						
						if(type == CL_CONTAINER_MODAL) _modalCurrentResultSet = currentResultSet;
						if(type == CL_CONTAINER_DESKTOP) _desktopCurrentResultSet = currentResultSet;
						if(type == CL_CONTAINER_MOBILE) _mobileCurrentResultSet = currentResultSet;
												
						break;
						
					case "resetRange":
						if(type == CL_CONTAINER_MODAL) _modalCurrentResultSet = 1;
						if(type == CL_CONTAINER_DESKTOP) _desktopCurrentResultSet = 1;
						if(type == CL_CONTAINER_MOBILE) _mobileCurrentResultSet = 1;
						
						break;
						
					case "isTotal":
						var reached = false;
						var currentValue = (currentResultSet * _numberOfResultsPerRequest);
						var currentTotal = (totalCalled + _numberOfResultsPerRequest);
						
						if(totalCalled == 0) reached = false;
						else if(currentValue > currentTotal) reached = true;
						
						return reached;
						break;
						
					case "isZero":
						var isZero = false;
						if(type == CL_CONTAINER_DESKTOP) {
							if(_totalDesktopRecordsCalled == 0) isZero = true;
						}
						
						if(type == CL_CONTAINER_MODAL) {
							if(_totalModalRecordsCalled == 0) isZero = true;
						}
						
						if(type == CL_CONTAINER_MOBILE) {
							if(_totalMobileRecordsCalled == 0) isZero = true;
						}
						
						return isZero;
						
						break;
				}
			},
			
			registerAllTooltips : function() {
				coxjs.publish({
					type : "ModalLoaded"
				});
				// 	reset flag
				_modalIsOpen = false;
			},
			
			ajaxFinishedLoading : function() {
				coxjs.publish({
					type : "makeAnotherCall"
				});
			},
			
			
			
			
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Tanuj Kathuria
 * @version 0.1.0.0
 * @namespace modules.residential
 * @class CompareTable
 */

(function(coxfw) {
	coxfw.core.define('modules.residential.CompareTable', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		/**
		 * Stores a copy of the offer comparison container.
		 *
		 * @property _compareContainer
		 * @type object
		 */
		var _compareContainer;
		
		/**
		 * Stores a copy of the items which will be first in viewport.
		 *
		 * @property firstItems
		 * @type array
		 */
		var firstItems = [];
		
		// 	var for holding the browser layout ("mobile","desktop")
		var _browserType;
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT CompareTable.js");

				_module = this;

				coxjs.subscribe({
					"RecalculateTable" : _module.alignComparisonTable,
					"Orientation" : _module.resetTableHeaderWidth
				});

			},
			/**
			 * @method execute
			 */
			execute : function() {
console.log("EXEC CompareTable.js");

				// set the module variable to this object
				_module = this;
								
				//set initial browser type
				_browserType = coxjs.select("body").attr("data-layout");

				_compareContainer = coxjs.select(".offer-comparison-container");

				// Leave if there is no offer comparison container on the page.
				if (_compareContainer.length < 1) return;

				_compareContainer.each(function(index, element) {
					var context = coxjs.select(element);
					// if inside modal inline content, initially context is not visible, hence don't perform any calculations
					if (_browserType == "desktop" && context.is(":visible")) {
						_module.alignComparisonTable(context);						

						coxjs.select(".slick-prev", context).on('click', function(event) {
							_module.toggleActiveItem(context);
						});

						coxjs.select(".slick-next", context).on('click', function(event) {
							_module.toggleActiveItem(context);
						});

						coxjs.select(".slick-dots", context).on('click', function(event) {
							_module.toggleActiveItem(context);
						});

						coxjs.select(element).on('swipe', function(event) {
							_module.toggleActiveItem(this);
						});
					}
				});
				
				//	on resize get the current browser and call repositionNavigation method if browser type changes	
				coxjs.select(window).bind('resize', function() {					
					if (_browserType != coxjs.select("body").attr("data-layout")) {
						// without timeout reposition gets overridden
						//TODO : optimize resize function and browser detection
						setTimeout(function(){
							_browserType = coxjs.select("body").attr("data-layout");
							_compareContainer.each(function(index, element) {
								var context = coxjs.select(element);
								_module.alignColumnHeight(context); //align height of each cell in a row and reposition slick dots 
							});
						}, 100);	
						
					}
				});
			},
			
			alignComparisonTable : function(context) {
				_browserType = coxjs.select("body").attr("data-layout");
				_module.setTableHeaderWidth(context);
				_module.countFirstItems(context);
				_module.toggleActiveItem(context);
				_module.alignColumnHeight(context);
			},
			/**
			 *
			 * Dynamically set the width of header columns spanning across the table
			 *
			 */
			setTableHeaderWidth : function(context) {
				//Calculate and set width of Header class spanning across columns
				var containerWidth = coxjs.select(context).width() - 20;
				coxjs.select(".offer-comparison .header", context).css("width", containerWidth);
			},
			/**
			 *
			 * Find the total items which will be first in viewport.		 *
			 *
			 */
			countFirstItems : function(context) {
				//Find total number of offers 
				var totalItems = coxjs.select(".offer-comparison:not(.slick-cloned)", context).length;
				//Fetch items to show in a viewport 
				var showSlides =  coxjs.select(".offer-comparison-container").attr("data-show-slides");
				var flag = counter = firstItem = 0;
				
				for(flag = showSlides*counter ; flag < totalItems; counter++) {
					if( (showSlides * (counter+1)) > totalItems)	{
							//Push last item to show in a viewport in the array
							firstItem = (totalItems % showSlides) + (showSlides * (counter-1));
							firstItems.push(firstItem);
							break;
						}
						else {
							//Push items to show first in a viewport in the array
							firstItem = (showSlides * counter);
							firstItems.push(firstItem);
						}
				}
			},
			
			/**
			 *
			 * Find the first active slide and toggle class 'item-first'			 *
			 *
			 */
			toggleActiveItem : function(context) {
				//Remove 'item-first' class from offer comparison node if it exists
				coxjs.select(".offer-comparison", context).removeClass('item-first');
	
				//Set 'item-first' class to the first element displayed
				if (coxjs.select(".offer-comparison", context).length > 4) {
					var activeIndex = coxjs.select(".slick-dots .slick-active button", context).html() - 1;
					coxjs.select('.offer-comparison[data-slick-index*=' + firstItems[activeIndex] + ']', context).addClass('item-first');
				}
				//If items are less than 5
				else {
					coxjs.select('.offer-comparison', context).eq(0).addClass('item-first');
				}
			},
	
			/**
			 *
			 *Reset width of Header class spanning across columns on orientation change			 *
			 *
			 */
			resetTableHeaderWidth : function(data) {
				if (_browserType == "desktop") {
					// set the flexslider variable to the slider object in the DOM
					_compareContainer = coxjs.select(".offer-comparison-container");
	
					// Leave if we don't have any .carousel-container's on the page.
					if (_compareContainer < 1)
						return;
	
					_compareContainer.each(function(index, element) {
						var context = coxjs.select(element);
						_module.setTableHeaderWidth(context);
						_module.alignColumnHeight(context);
					});
				}
			},
			
			/*			 
			 * Align height of each cell depending on tallest cell in the row
			 * 
			 * */
			alignColumnHeight : function(context) {
				// Do not execute if called from Adobe author's mode as it causes the script to go into infinite loop
				// Adobe's author mode adds a node with id 'CQ' 
				if (!(coxjs.select("body").find("#CQ").length > 0)) {				
					if (_browserType == "desktop") {
						// get the total number of rows
						var count = coxjs.select(".offer-comparison > .colspan-3 > .col-content")[0].children.length; 
						for (i=1; i<=count; i++) {
							// Get the items of all cells of row 1, 2, 3... upto n
							var selector = ".offer-comparison > .colspan-3 > .col-content > div:nth-child(" +i+ ")"
							var biggestHeight = 0;
							// Iterate through all column cells and calculate the tallest height
							coxjs.select(selector, context).each(function(index,element){
								biggestHeight = (coxjs.select(element).outerHeight() > biggestHeight) ? coxjs.select(element).outerHeight() : biggestHeight;	
							})
							// set height of that row to the tallest cell height
							coxjs.select(selector, context).css("height", biggestHeight+"px");
							// calculate top position based on first row height and position slick dots accordingly
							if (i == 1) {
								coxjs.select(".slick-dots", context).css("top", biggestHeight - 20 + "px");		
							}
						}
					}
				}
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);/**
 * @author Umesh Patil
 * @version 0.1.0.0
 * @namespace modules.residential.ExternalSearch
 * @class ExternalSearch
 */
(function(coxfw) {
	coxfw.core.define('modules.residential.ExternalSearch', function(coxjs) {
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				console.log("INIT ExternalSearch.js");
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				console.log("EXEC ExternalSearch.js");

				/**
				 * Open dropdown menu when user clicks the more news node.
				 *
				 * @event click, touchstart
				 * @param {string} ".nav-more-news" The More node.
				 */
				coxjs.select("body").on("click touchstart", ".nav-more-news", function(event) {
					// Stop click bubbling beyond our trigger.
					event.stopPropagation();

					// Prevent the default behavior for the overlay trigger.
					coxjs.preventDefault(event);

					// Open/Close the menu based on state
					coxjs.select(".dropdown-menu").toggleClass("open");
				});

				/**
				 * Remove dropdown menu when user clicks the html node.
				 *
				 * @event click, touchstart
				 * @param {string} "html" The main HTML node.
				 */
				coxjs.select("html").on("click touchstart", function() {
					coxjs.select(".dropdown-menu").removeClass("open");
				});

			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Robert Sekman, Kyle Patterson, Scott Thompson, Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.residential
 * @class InternalSearchResults
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.residential.InternalSearchResults', function(coxjs) {

		/**
		 * The element clicked to trigger the onchange event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT InternalSearchResults.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC InternalSearchResults.js");
				/**
				 * @event change
				 *
				 * Set windows navigation location to selected value , when the user changes the filterby dropdown
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} "#filter-select" The select dropdown
				 */
				coxjs.select("body").on("change", "#filter-select", function(event) {
					_trigger = coxjs.select(this)[0];
					window.location.href = _trigger.options[_trigger.selectedIndex].value;
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Sudeep Kumar
 * @version 0.1.0.0
 * @namespace modules.residential.digital-switch
 * @class DatePickerModifier
 * 
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.residential.digital-switch.DatePickerModifier", function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * Stores a boolean value corresponding to launch device layout
		 *
		 * @property _hasDualLayout
		 * @type boolean
		 */		
		var _hasDualLayout;

		return {
			/**
			 * Setup all subsriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT DatePickerModifier.js");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Subscribe
				coxjs.subscribe({
					"DatePickerModifier" : _module.startModifier,
					"Orientation" : _module.resetDatePicker
				});
				
				/**
				 * @event load
				 *
				 * Check if launched device has dual layout				 
				 * 
				 */
				//check if the launching device has different layout in each orientation
				//Trying to target 'Nexus7' and 'Samsung Galaxy Tab' which behave as mobile in 'portrait' and desktop in 'landscape'
				if(window.matchMedia){
					_hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 
																							         : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600 ;																	
				}
			},
			/**
			 * execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
				
			},

			startModifier : function() {
				
				//modifying attributes of pick time fields, before closing of pick date overlay. This applies for mobile version on pro install page
				var time = coxjs.select(".pro-time");
				var mtime = coxjs.select(".mpro-time");
				var disabledButton = coxjs.select("input[type='submit'][disabled='disabled']");
				var activeButton = coxjs.select(".button-active");
				//Bug Fix# 45682 - Fix IE8 issue of datepicker not getting relaunched upon second and later clicks
				if (coxjs.select("body.IE8").length > 0) {
					coxjs.select(".pro-date").closest("div").focus();				
				}
				
				var date = coxjs.select(".pro-date").val();
				if (date != undefined && date != "Pick Date" && date != "") {
					time.removeAttr("disabled");
					time.addClass("enabled overlay-trigger");
					time.val("");
					//Bug Fix# 45682 - reset time val to placeholder value in IE				
					if (coxjs.select("body.IE").length > 0) {
						time.val("Pick Time");				
					}
					if(disabledButton.hasClass("hide-pro")){
						disabledButton.removeClass("hide-pro");
						activeButton.addClass("hide-pro");
					}
				}
				var mdate = coxjs.select(".mpro-date").val();
				if (mdate != undefined && mdate != "Pick Date" && mdate != "") {
					mtime.removeAttr("disabled");
					mtime.addClass("menabled modal-trigger");
					mtime.val("");
					if(disabledButton.hasClass("hide-pro")){
						disabledButton.removeClass("hide-pro");
						activeButton.addClass("hide-pro");
					}
				}
				
				/**
				 * @event click
				 *
				 * wrapper for datepicker when its open as modal instead of overlay. This applies for mobile device.
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".mpro-date" The loaded form
				 */
				coxjs.select("body").on("click", ".mpro-date", function(event) {
					if(coxjs.select(".datepicker-modal-component").attr('style') === undefined){
						coxjs.select("#ui-datepicker-div").wrap("<div class='datepicker-modal-component' style='width: 100%; height: auto;top: 0px; left: 0px; display: block;'></div>");
						coxjs.select("#ui-datepicker-div").wrap("<div class='datepicker-modal-component-content'></div>");
						coxjs.select("<div class='datepicker-modal-component-title'>Pick Your Date</div>").insertBefore(".datepicker-modal-component-content");
						coxjs.select("<div class='datepicker-modal-component-head'><span title='Close' class='mpick-date-close'></span></div>").insertBefore(".datepicker-modal-component-title");
						coxjs.select(".datepicker-modal-component-content").append("<div class='datepicker-modal-component-buttons'><a href='#' class='button date-modal-button'>Done</a><a class='button-secondary mpick-date-close date-modal-close'>Close</a></div>");
					}
					coxjs.select("#pf-container").css("display", "none");
					// Bug Fix# 47035 - Fix datepicker modal height in dual layout device
					if (_hasDualLayout) {
						var modalComponentHeight = (coxjs.select(window).height() < coxjs.select(".datepicker-modal-component").height()) ? "auto" : coxjs.select(window).height()+"px" ;
						coxjs.select(".datepicker-modal-component").css({"height":modalComponentHeight});
					}				
					coxjs.select(".datepicker-modal-component").css({"display":"block"});
				});
				
				// DualLayout device specific fix to show the datepicker on orientation change
				/**
				 * @event click
				 *
				 * display the datepicker component. Fixes the isue when datepicker is not shown on orientation change 
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".pro-date" the date input 
				 */
				coxjs.select("body").on("click", ".pro-date", function(event) {	
					if (_hasDualLayout) {
						coxjs.select(".datepicker-modal-component").css({"display":"block"});
					}
				});
				
				/**
				 * @event click
				 *
				 * close the datepicker modal once user select date and click done button. 
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".date-modal-button" The loaded form
				 */
				coxjs.select("body").on("click", ".date-modal-button", function(event) {
					coxjs.select(".datepicker-modal-component").css({"display":"none"});
					coxjs.select("#pf-container").css("display", "block");
				});
				
				/**
				 * @event click
				 *
				 * close the datepicker modal once user select date and click close button. 
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".mpick-date-close" The loaded form
				 */
				coxjs.select("body").on("click", ".mpick-date-close", function(event) {
					coxjs.select(".mpro-date").val("");
					mtime.attr("disabled");
					mtime.removeClass("menabled modal-trigger");
					disabledButton.removeClass("hide-pro");
					activeButton.addClass("hide-pro");
					coxjs.select(".datepicker-modal-component").css({"display":"none"});
					coxjs.select("#pf-container").css("display", "block");
				});					
			},
			
			// resetDatePicker on orientation change ONLY for dual layout devices
			resetDatePicker : function(data) {				
				if(_hasDualLayout) {
					if (data.orientation == "landscape") {
						coxjs.select(".mpick-date-close").trigger("click");
					} else {
						if (coxjs.select(".datepicker-modal-component").length > 0) {
							coxjs.select(".datepicker-modal-component").css("display", "none");
						} else {
							coxjs.select("#ui-datepicker-div").css("display", "none");
						}						
					}					
				}					
			},
			
			
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Sudeep Kumar
 * @version 0.1.0.0
 * @namespace modules.residential.digital-switch
 * @class DeliveryMethod
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.residential.digital-switch.DeliveryMethod', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT DeliveryMethod.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC DeliveryMethod.js");
				/**
				 * @event click
				 *
				 * Add active-install on click of required delivery method
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".install-options div"
				 */
				coxjs.select("body").on("click", ".install-options", function(event) {
					// Stop default link click.
					coxjs.preventDefault(event);
					_trigger = coxjs.select(this)[0];
					coxjs.select(_trigger).addClass("active-install");
					coxjs.select(_trigger).siblings().removeClass("active-install");
					var  activatedValue = coxjs.select(_trigger).children().children().attr("id");
					coxjs.select(".input-active-type").val(activatedValue);
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Robert Sekman, Kyle Patterson, Scott Thompson, Prathima Sanjeevi
 * @version 1.2.3
 * @namespace modules.residential.digital-switch
 * @class OrderListNavigation
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.residential.digital-switch.OrderListNavigation', function(coxjs) {

		/**
		 * The element clicked to trigger the onclick event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT OrderListNavigation.js");
			},
			/**
			 * Execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
console.log("EXEC OrderListNavigation.js");
				/**
				 * @event change
				 *
				 * Set windows navigation location to selected value , when the user clicks on order row
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".order-list tr" table row tag
				 */
				coxjs.select("body").on("click", ".order-list tr", function(event) {
					_trigger = coxjs.select(this);
					var anchorElem = _trigger.find("a:visible");
					anchorElem.trigger("click");
					
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Sudeep Kumar
 * @version 0.1.0.0
 * @namespace modules.residential.digital-switch
 * @class PickTime
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.residential.digital-switch.PickTime', function(coxjs) {
		/**
		 * The element clicked to trigger the click event.
		 *
		 * @property _trigger
		 * @type object
		 */
		var _trigger;
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;
		/**
		 * Stores a boolean value corresponding to launch device layout
		 *
		 * @property _hasDualLayout
		 * @type boolean
		 */		
		var _hasDualLayout;

		return {
			/**
			 * Setup all subscriptions for this module.
			 *
			 * @method init
			 */
			init : function() {
				_module = this;
				// Subscribe
				coxjs.subscribe({
					"Orientation" : _module.resetTimePicker
				});
				
				/**
				 * @event load
				 *
				 * Check if launched device has dual layout				 
				 * 
				 */
				//check if the launching device has different layout in each orientation
				//Trying to target 'Nexus7' and 'Samsung Galaxy Tab' which behave as mobile in 'portrait' and desktop in 'landscape'
				if(window.matchMedia){
					_hasDualLayout = window.matchMedia("(orientation : portrait)").matches ? coxjs.select(window).width() < 768 && coxjs.select(window).height() > 768 
																							         : coxjs.select(window).width() > 768 && coxjs.select(window).height() < 600 ;																	
				}
			},
			/**
			 * execute this module.
			 * 
			 * @method execute
			 */
			execute : function() {
				
				console.log("EXEC PickTime.js");
				var time = coxjs.select(".pro-time");
				var mtime = coxjs.select(".mpro-time");
				var disabledButton = coxjs.select("input[type='submit'][disabled='disabled']");
				var activeButton = coxjs.select(".button-active");
				
				var date = coxjs.select(".pro-date").val();
				if (date != undefined && date != "Pick Date" && date != "") {
					time.addClass("enabled overlay-trigger");
					time.removeAttr("disabled");
				}
				
				var mdate = coxjs.select(".mpro-date").val();
				if (mdate != undefined && mdate != "Pick Date" && mdate != "") {
					mtime.addClass("enabled modal-trigger");
					mtime.removeAttr("disabled");
				}
				var timeValue = coxjs.select(".pro-time").val();
				var mtimeValue = coxjs.select(".mpro-time").val();		
				if ((timeValue != undefined && timeValue != "Pick Time" && timeValue != "") || (mtimeValue != undefined && mtimeValue != "Pick Time" && mtimeValue != "")) {
					disabledButton.addClass("hide-pro");
					activeButton.removeClass("hide-pro");
				}

				/**
				 * @event click
				 *
				 * Select time from different available options and once selected, activates the order summary button
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".pick-time-option"
				 */
				coxjs.select("body").on("click touchstart", ".pick-time-option", function(event) {
						var timeOptions = coxjs.select(this).children().children().text();
						time.val(timeOptions);
						mtime.val(timeOptions);
						coxjs.select(".overlay-container").removeClass("overlay-open");
						disabledButton.addClass("hide-pro");
						activeButton.removeClass("hide-pro");											
				});
				/**
				 * @event click
				 *
				 * Load the html depending on the device
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".show-time-picker form"
				 */
				coxjs.select("body").on("click touchstart", ".show-time-picker", function(event) {
					// Stop default.
					coxjs.preventDefault(event);
					var selectedDate;
					//check if this event is called from mobile or desktop.
					if(coxjs.select(window).width() < 767)
					{
						var response = ".mobile-response";
						selectedDate = coxjs.select(".mpro-date").val();
					}
					else {
						var response = ".desktop-response";
						selectedDate = coxjs.select(".pro-date").val();
						//Bug Fix# 45682 - Fix IE8 issue to show the placeholder if time selection is not made
						if (coxjs.select("body.IE8").length > 0) {
							coxjs.select(this).closest("div").focus();				
						}
					}
					// Publish internal AJAX call.
					coxjs.publish({
						type : "Ajax",
						data : {
							container : coxjs.select(response),
							url : coxjs.select(response).parent().parent().attr("data-ajax-source")+"?date="+selectedDate,
							type : "GET",
							dataType : "text",
							timeout : "30000",
							cache : false,
							data : coxjs.select(this).serialize()
						}
					});
				});
				/**
				 * @event click
				 *
				 * close the pick time modal once user click close button. 
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".mpro-time-close"
				 */
				coxjs.select("body").on("click touchstart", ".mpro-time-close", function(event) {
						mtime.val("");
						disabledButton.removeClass("hide-pro");
						activeButton.addClass("hide-pro");						
				});
				
				
			},
			
			//Reset time picker on orientation change for dual layout devices
			// Close the overlay when changed to portrait and close the modal when changed to landscape so that styles do not distort
			resetTimePicker : function(data) {
				if(_hasDualLayout) {
					if (coxjs.select(".pro-install").length > 0) {						 
						if (data.orientation == "portrait") {
							coxjs.select(".overlay-container").removeClass("overlay-open");	
							coxjs.select(".mpro-time").val("");						
						} else {
							coxjs.select(".btn-close", ".dialog-component").trigger("click");
							coxjs.select(".pro-time").val("");	
						} 
						coxjs.select("input[type='submit'][disabled='disabled']").removeClass("hide-pro");
						coxjs.select(".button-active").addClass("hide-pro");
					}		
				}						
			},	
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.residential.bill
 * @class PayBill
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.residential.bill.PayBill", function(coxjs) {

		var _module;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".group-chooser";

		var _displayNewMethodOfPayment = false;
		/**
		 * Stores the active input element (either autocomplete or autocomplete-dummy) to be used in multiple places within the module.
		 *
		 * @property _activeElement
		 * @type object
		 */
		var _activeElement;
		
		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);

				// subscribe to paymentvalidation events
				coxjs.subscribe({
					"PaymentValidation" : _module.paymentValidationResponse,
					"InvalidPaymentValidation" : _module.paymentInvalidResponse,
					"SelectedCCTypePaymentValidation" : _module.checkForCCTypeResponse,
					"DatePickerSelect" : _module.scheduledPaymentDate,
					"ToggleDiv" : _module.modalToggleHappened
				});

			},

			execute : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				coxjs.select("body").on("xhr-selectors init-paybill", _selector, function(event) {
					// find selected radio btn
					var selectedRadio = coxjs.select(this).find(".active-choice")[0];
					var currentContinueBtn = coxjs.select(this).parent().find(".accordion-next")[0];

					// if continuebtn is in saved container
					if (!currentContinueBtn) {
						currentContinueBtn = coxjs.select(".make-payment-page").find(".accordion-next")[0];
					}

					// if continue is easy pay page
					if (coxjs.select(".ibill-no-accordion")[0]) {
						currentContinueBtn = coxjs.select(".payment-btn")[0];
					}

					// check for selected radio btn, if non present disable continue btn
					if (!selectedRadio) {
						// for easy pay page
						if (coxjs.select(currentContinueBtn).hasClass("payment-btn"))
							coxjs.select(currentContinueBtn).removeClass("button").addClass("button-disabled");
						// for other pages
						else
							coxjs.select(currentContinueBtn).removeClass("button accordion-next").addClass("button-secondary-disabled");
					} else {
						// for easy pay page
						if (coxjs.select(currentContinueBtn).hasClass("payment-btn"))
							coxjs.select(currentContinueBtn).removeClass("button-disabled").addClass("button");
						// for other pages
						else
							coxjs.select(currentContinueBtn).removeClass("button-secondary-disabled").addClass("button accordion-next");
					}
					// stop accordion from trying to validate if continue btn is disabled
					coxjs.select(".button-secondary-disabled").click(function(e) {
						e.preventDefault();
					});
					// stop button click on easy pay pages
					coxjs.select(".button-disabled").click(function(e) {
						e.preventDefault();
					});

					// find parent container
					var parentContainer = coxjs.select(this).parent();
					// handle all radio btn selections
					_module.handleRadioBtnSelection(selectedRadio, parentContainer);
					
				});
				
				/**
				 * @event keypress
				 *
				 * stop submitting form on press of enter key
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} "input" The loaded form
				 */
				coxjs.select("body").on("keypress", "input", function(event) {
					if(event.currentTarget.type != "submit"){
						if(event.keyCode == 13){
							_activeElement = this;
							var inputFields = coxjs.select(_activeElement).closest(".accordion-panel-open").find("input");
							if(inputFields.length > 0) {
								if(coxjs.select(inputFields).valid()) {
									if(coxjs.select(_activeElement).closest(".accordion-panel-open").find(".accordion-next").length > 0) {
										coxjs.preventDefault(event); //prevent form submission
										coxjs.select(_activeElement).closest(".accordion-panel-open").find(".accordion-next").click();
									}
								}
							}
						}
					}
				});

				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("init-paybill");

				// listen for click of radio btn
				coxjs.select("body").on("click", ".group-choice", function(event) {
					// find selected radio btn
					var selectedRadio = this;
					// find parent container
					var parentContainer = coxjs.select(this).parent().parent();
					// remove button disable class if present
					var currentContinueBtn = coxjs.select(parentContainer).find(".button-secondary-disabled")[0];

					coxjs.select(currentContinueBtn).removeClass("button-secondary-disabled ").addClass("button accordion-next");

					// for easypay pages
					if (coxjs.select(".ibill-no-accordion")) {
						currentContinueBtn = coxjs.select(".payment-btn")[0];
						coxjs.select(currentContinueBtn).removeClass("button-disabled").addClass("button");
					}

					// handle all radio btn selections
					_module.handleRadioBtnSelection(selectedRadio, parentContainer);
				});
				
				// listen for click of second step accordion next button
				coxjs.select("body").on("click", ".accordion-next", function(event) {
					var currentNext = this;
					if((coxjs.select(currentNext).closest(".accordion-panel-open").find(".choose-payment-method-step").length > 0 || coxjs.select(currentNext).closest(".accordion-panel-open").find(".choose-payment-method-saved-step").length > 0) && (coxjs.select("#optPayWithAcct").attr("checked") == "checked")) {
						var acctNumlength = coxjs.select("#confirmAcctNum").val().length;
						var orgValue = coxjs.select("#confirmAcctNum").val();
						var value="";
						for (i = acctNumlength-4; i < acctNumlength; i++){
							value = value + coxjs.select("#confirmAcctNum").val()[i];
						}
						var finalValue = coxjs.select("#txtBankName")[0].innerHTML + " (xx" + value + ")";
						_module.updateCurrentHeaderContent(finalValue, 1);
						
					}
				});

				// listen for click of continue button of add payment modal
				coxjs.select("body").on("click", ".add-paymment-modal-button", function(event) {
					var form = coxjs.select(".dialog-component-content").find(".form-modal");
					var accNum = form.find(".txtAcctNumModal").val();
					var confirmAccNum = form.find(".confirmAcctNumModal").val();
					if(accNum != confirmAccNum ){
						coxjs.select(form).validate().showErrors({
							"confirmAcctNum" : "Confirm value does not match actual value."
						});
						event.preventDefault();
					}
				});
				
				//Event Tracking for submit in make payment 
				coxjs.select("body").on("click",".track-make-payment",function(event) {
						if (coxjs.select(".submit-payment-form").valid()) {
							var easypay = coxjs.select("#easypay-check").val();
							var paperlessBilling = coxjs.select("#paperlessbilling-check").val();
									if (easypay == "true") {

										coxjs.publish({
													type : "OmnitureInterface",
													data : {
														mode : "track",
														type : "event",
														options : {
															eventName : "easypay"
														}
													}
											});
										}

									if (paperlessBilling == "true") {
										
										coxjs.publish({
													type : "OmnitureInterface",
													data : {
														mode : "track",
														type : "event",
														options : {
															eventName : "paperlessbilling"
														}
													}
											});
										}
									}

				});
				
				//Event Tracking for paperless billing
				coxjs.select("body").on("click",".track-paperless-billing",function(event) {						
							
							var paperlessBilling = coxjs.select("[name='radioboxgroup']:checked").val();
								
									if (paperlessBilling == "radio-1") {
										
										coxjs.publish({
													type : "OmnitureInterface",
													data : {
														mode : "track",
														type : "event",
														options : {
															eventName : "paperlessbilling"
														}
													}
											});
										}

				});

			},

			handleRadioBtnSelection : function(selectedRadio, parentContainer) {
				// get the value from the selected radio btn
				var selectedRadioBtnValue = coxjs.select(selectedRadio).find(".choice-value");

				// check if selectedRadio is a saved radio btn
				var savedRadioBox = coxjs.select(selectedRadio).hasClass("saved-boxes");

				// check if selectedRadio is a multi payment radio btn
				var multiRadioBox = coxjs.select(selectedRadio).hasClass("multi-select");

				// check if the value is in the span or input field
				if (coxjs.select(selectedRadioBtnValue).is("span")) {
					// check if the selection has a cc class
					var selectedClass;
					if (coxjs.select(selectedRadioBtnValue).hasClass("Visa"))
						selectedClass = "Visa";
					else if (coxjs.select(selectedRadioBtnValue).hasClass("MasterCard"))
						selectedClass = "MasterCard";
					else if (coxjs.select(selectedRadioBtnValue).hasClass("Discover"))
						selectedClass = "Discover";
					else if (coxjs.select(selectedRadioBtnValue).hasClass("Amex"))
						selectedClass = "Amex";
					// get the value from the choice-value
					if(selectedRadioBtnValue.length == 1) selectedRadioBtnValue = coxjs.select(selectedRadioBtnValue).text();
					else selectedRadioBtnValue = coxjs.select(selectedRadioBtnValue[0]).text() + " " + "(" + coxjs.select(selectedRadioBtnValue[1]).text() + ")";
					
				} else {
					// check if the user entered a value on blur
					coxjs.select(selectedRadioBtnValue).blur(function(e) {
						selectedRadioBtnValue = coxjs.select(this).val();
						// pass the values of the selected radio btn and call appropriate method
						_module.processCurrentRadioBtnSelection(parentContainer, selectedRadioBtnValue, selectedClass, savedRadioBox, multiRadioBox);
					});
					// get the value from the choice-value
					selectedRadioBtnValue = coxjs.select(selectedRadioBtnValue).val();
				}

				// if theres no span.choice-value, or input.choice-value
				// use the label value
				if (selectedRadioBtnValue == undefined) {
					var labelValue = coxjs.select(selectedRadio).find("label")[0];
					selectedRadioBtnValue = coxjs.select(labelValue).text();
				}

				// pass the values of the selected radio btn and call appropriate method
				_module.processCurrentRadioBtnSelection(parentContainer, selectedRadioBtnValue, selectedClass, savedRadioBox, multiRadioBox);

				// remove previous validation errors
				_module.removeErrorValidationElements();
			},

			processCurrentRadioBtnSelection : function(container, selectedValue, selectedClass, isSavedRadioBox, isMultiRadioBox) {
				var classNames = coxjs.select(container).attr("class").toString().split(' ');
				$.each(classNames, function(i, className) {
					switch(className) {
						case "select-payment-amount-step":
							_module.handleSelectPaymentAmountMethod(selectedValue);
							break;

						case "choose-payment-method-step":
							_module.handleChoosePaymentMethod("");
							break;

						case "saved-payment-methods":
							_module.handleSavedPaymentMethod(selectedValue, selectedClass, isSavedRadioBox, container);
							break;

						case "schedule-payment-step":
							_module.handleSchedulePaymentMethod(selectedValue);
							break;

						case "multi-payment-options":
							_module.handleMultiplePaymentMethods(selectedValue, isMultiRadioBox);
							break;

						case "more-payment-options":
							_module.calculatePaymentAmountForDifferentPayments();
							break;

						case "choose-payment-method-saved-step":
							_module.handleEasyPayPage();
							break;
					}
				});
			},

			handleSelectPaymentAmountMethod : function(headerValue) {
				// update header value
				if (headerValue == "")
					headerValue = "$0.00";
				_module.updateCurrentHeaderContent(_module.formatInputForCurrency(headerValue), 0);
			},

			handleChoosePaymentMethod : function(headerValue) {
				// update header value
				_module.updateCurrentHeaderContent(headerValue, 1);
				// listen for bank or cc selection
				_module.listenForCreditCardOrBankSelection();
				// clear out any cc icons
				coxjs.select("span").removeClass("Visa MasterCard Discover Amex");
				coxjs.select("input").removeClass("Visa MasterCard Discover Amex");
			},

			handleSavedPaymentMethod : function(headerValue, selectedClass, isSavedRadioBox, container) {
				// get the 1st continue btn in the saved container
				var continueBtn = coxjs.select(".make-payment-page").find(".button")[0];

				if (!continueBtn) {
					continueBtn = coxjs.select(".make-payment-page").find(".button-secondary-disabled")[0];
				}

				// remove disabled class add button and accordion classes
				if (isSavedRadioBox)
					coxjs.select(continueBtn).removeClass("button-secondary-disabled").addClass("button accordion-next");

				// hide bank and cc radio btns until new payment method link clicked
				if (!_displayNewMethodOfPayment) {
					// remove any validation in cc form and bank form when its not displayed
					_module.removeInputFieldValidation(coxjs.select(".credit-card-form").find("fieldset"));
					_module.removeInputFieldValidation(coxjs.select(".bank-account-form").find("fieldset"));
					// hide the cc and bank radio btns
					_module.hideElement(coxjs.select(".choose-new-method"));
					_module.hideElement(coxjs.select(".credit-card-form"));
					_module.hideElement(coxjs.select(".bank-account-form"));
				} else
					_module.showElement(coxjs.select(".choose-new-method"));

				// if ("saved" bank radio btn or "saved" cc radio btn) is selected from saved container
				if (isSavedRadioBox && _displayNewMethodOfPayment) {
					_module.hideElement(coxjs.select(".credit-card-form"));
					_module.hideElement(coxjs.select(".bank-account-form"));
					_module.showElement(coxjs.select(continueBtn));
					// remove any validation in cc form and bank form when its not displayed
					_module.removeInputFieldValidation(coxjs.select(".credit-card-form").find("fieldset"));
					_module.removeInputFieldValidation(coxjs.select(".bank-account-form").find("fieldset"));
				} else if (!isSavedRadioBox && !_displayNewMethodOfPayment)
					_module.showElement(coxjs.select(continueBtn));
				else if (!isSavedRadioBox && _displayNewMethodOfPayment)
					coxjs.select(continueBtn).attr("style", "display: none !important");

				// listen for click of new payment method link
				coxjs.select(".add-payment").click(function(e) {
					e.preventDefault();
					// change the flag
					_displayNewMethodOfPayment = true;
					// display cc and bank radio btns
					_module.showElement(coxjs.select(".choose-new-method"));
					// remove the anchor from link and display text
					coxjs.select(this).replaceWith(coxjs.select(this).text());

					// remove any previous selected choices
					var choices = coxjs.select(".make-payment-page").find(".group-choice");

					coxjs.select(choices).each(function(index, el) {
						if (coxjs.select(el).hasClass("active-choice")) {
							coxjs.select(el).removeClass("active-choice");
							var input = coxjs.select(el).find("input")[0];
							coxjs.select(input).removeAttr("checked");
						}
					});

					// set bank form choice by default
					var bankChoice = coxjs.select(".choose-new-method")[0];
					coxjs.select(bankChoice).addClass("active-choice");
					coxjs.select(bankChoice).find("input").prop('checked', 'checked');
					coxjs.select(bankChoice).find("input").attr("checked", "checked");
					// update header value
					if($("#optPayWithAcct").length> 0){
						_module.updateCurrentHeaderContent(coxjs.select("#optPayWithAcct").next()[0].innerHTML , 1);
					}
					else {
						_module.updateCurrentHeaderContent(coxjs.select("#optPayWithCard").next()[0].innerHTML , 1);
					}
					// listen for bank or cc selection
					_module.listenForCreditCardOrBankSelection();
					
				});

				// listen for bank or cc selection
				_module.listenForCreditCardOrBankSelection();
				// update header value
				_module.updateCurrentHeaderContent(headerValue, 1, selectedClass);

				// check if page is easy pay or no accordion
				var isEasyPayPage = coxjs.select(container).parent().hasClass("ibill-no-accordion");

				if (isEasyPayPage)
					_module.handleEasyPayPage();
			},

			handleSchedulePaymentMethod : function(headerValue) {
				var todaysDate = $.datepicker.formatDate('mm/dd/yy', new Date());

				if (headerValue == "")
					headerValue = "";
				if (headerValue == "Pay Now")
					headerValue = todaysDate;

				// update header value
				_module.updateCurrentHeaderContent(headerValue, 2);
			},

			handleMultiplePaymentMethods : function(headerValue, isMultiRadioBox) {
				// select the radio btns inside the more-payment-options container
				var options = coxjs.select(".more-payment-options").find(".multi-select");
				// if the selected radio btn has the multi-select class,
				// show more-payment-options container, else hide it
				if (isMultiRadioBox) {
					// add up the selected values
					_module.calculatePaymentAmountForDifferentPayments();
					// show the more-payment-options container
					coxjs.select(".more-payment-options").css("display", "block");
					if (coxjs.select("body.IE8").length > 0) coxjs.select(".more-payment-options").parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");


					// loop through the multi-select radio btns and see if they are selected
					// if they are selected add required class, else ignore-validation
					coxjs.select(options).each(function(index, el) {
						var inputField = coxjs.select(el).find("input.choice-value")[0];
						var radioBtn = coxjs.select(el).find("input")[0];
						if (coxjs.select(radioBtn).attr("checked") == "checked")
							_module.addInputFieldValidation(inputField);
						else
							_module.removeInputFieldValidation(inputField);
					});
				} else {
					// hide the more-payment-options container when multi-select is NOT selected
					coxjs.select(".more-payment-options").css("display", "none");

					// loop through and remove any required class on input fields
					coxjs.select(options).each(function(index, el) {
						var inputField = coxjs.select(el).find("input.choice-value")[0];
						_module.removeInputFieldValidation(inputField);
					});
				}

				// update header value
				_module.updateCurrentHeaderContent(headerValue, 0);
			},

			handleEasyPayPage : function() {
				// get the accordion next btn
				var easypaySubmitBtns = coxjs.select(".choose-payment-method-saved-step").find(".accordion-next");
				// get the input button on easy pay
				var submitBtn = coxjs.select(".easypay-page").find(".button")[0];
				// add terms and conditions content
				_module.replaceCheckboxContent();
				// listen for bank or cc selection
				_module.listenForCreditCardOrBankSelection();
				// make continue btn say submit
				coxjs.select(easypaySubmitBtns).text("Submit");

				coxjs.select(easypaySubmitBtns).click(function(e) {
					e.preventDefault();
					// remove accordion-next class on buttons because this isnt accordion page
					coxjs.select(this).removeClass("accordion-next");
					// submit form from anchor
					if (!coxjs.select(this).hasClass("button-secondary-disabled"))
						coxjs.select('.form').submit();
				});

				coxjs.select(submitBtn).click(function(e) {
					coxjs.select(".form").submit();
				});
			},

			calculatePaymentAmountForDifferentPayments : function() {
				var radioBtns = coxjs.select(".more-payment-options").find(".group-choice");
				var multiSelectRadioBtnValue = coxjs.select(".multi-select").find("span.choice-value");
				var isMultiRadioBtnSelected = false;
				var totalMultiPaymentAmount = 0;

				if (coxjs.select(".multi-select").find("input").attr("checked") == "checked")
					isMultiRadioBtnSelected = true;

				coxjs.select(radioBtns).each(function(index, radioBox) {
					var radioBtn = coxjs.select(radioBox).find("input")[0];

					if (coxjs.select(radioBtn).attr("checked") == "checked") {
						// get the values of the input fields inside radio btn
						var radioValue = coxjs.select(radioBox).find("input.choice-value")[0];
						radioValue = coxjs.select(radioValue).val();
						// if no value exists in input field, default to zero
						if (radioValue == "")
							radioValue = "0.00";
						// if value is undefined, check span value
						if (!radioValue) {
							radioValue = coxjs.select(radioBox).find("span.choice-value")[0];
							radioValue = coxjs.select(radioValue).text();
						}
						// remove dollar sign so you can add up selected values
						radioValue = radioValue.replace("$", "");
						totalMultiPaymentAmount += Number(radioValue);
					}
				});

				totalMultiPaymentAmount = _module.formatInputForCurrency(totalMultiPaymentAmount.toFixed(2));
				
				// set the value of the main radio button
				coxjs.select(multiSelectRadioBtnValue).text(totalMultiPaymentAmount);
			
				// update header value
				if (isMultiRadioBtnSelected)
					_module.updateCurrentHeaderContent(totalMultiPaymentAmount, 0);
			},

			formatInputForCurrency : function(value) {
				if (value) {
					value = value.replace("$", "");
					value = value.replace(",", "");
					value = Number(value).toFixed(2);
					value = _module.addCommas(value);
					
					if (isNaN(value)) value = 0; // check to prevent NaN if a user enters more than one period. sets total line to zero
					
					return "$" + value;
				}
			},

			addCommas : function(nStr) {
				nStr += '';
				x = nStr.split('.');
				x1 = x[0];
				x2 = x.length > 1 ? '.' + x[1] : '';
				var rgx = /(\d+)(\d{3})/;
				while (rgx.test(x1)) {
					x1 = x1.replace(rgx, '$1' + ',' + '$2');
				}
				return x1 + x2;
			},

			updateCurrentHeaderContent : function(value, index, selectedClass) {
				var currentHeader = coxjs.select(".accordion-trigger")[index];
				var contentContainer = coxjs.select(currentHeader).find(".accordion-dynamic-text");
				// remove any previous cc classes
				coxjs.select(contentContainer).removeClass("Visa MasterCard Discover Amex");
				// add value and any cc classes
				coxjs.select(contentContainer).html(value).addClass(selectedClass);
			},

			listenForCreditCardOrBankSelection : function() {
				if (coxjs.select("#optPayWithAcct").attr("checked") == "checked")
					_module.showBankForm();

				if (coxjs.select("#optPayWithCard").attr("checked") == "checked")
					_module.showCreditCardForm();
			},

			addInputFieldValidation : function(el) {
				// add required class and remove ignore-validation on input field
				if (coxjs.select(el).is("input"))
					coxjs.select(el).addClass("required").removeClass("ignore-validation");

				// add required class to input fields
				if (coxjs.select(el).is("fieldset")) {
					var inputFields = coxjs.select(el).find("input");
					var selectFields = coxjs.select(el).find("select");
					var savedPaymentCheckbox = coxjs.select(el).find("#save-payment-bank")[0];
					if (!savedPaymentCheckbox)
						savedPaymentCheckbox = coxjs.select(el).find("#save-payment-credit")[0];

					coxjs.select(inputFields).each(function(index, field) {
						coxjs.select(field).addClass("required").removeClass("ignore-validation");
					});

					coxjs.select(selectFields).each(function(index, field) {
						coxjs.select(field).addClass("required").removeClass("ignore-validation");
					});
					// remove any required class from saved payment checkbox
					if (savedPaymentCheckbox)
						coxjs.select(savedPaymentCheckbox).addClass("ignore-validation").removeClass("required");
				}
			},

			removeInputFieldValidation : function(el) {
				// if element is group-chooser remove all required classes on input fields in radio btn
				if (coxjs.select(el).hasClass("group-chooser")) {
					coxjs.select(el).find("input.choice-value").addClass("ignore-validation").removeClass("required");
				}
				// if element is a input field remove required class and add ignore-validation
				if (coxjs.select(el).is("input")) {
					coxjs.select(el).addClass("ignore-validation").removeClass("required");
				}
				// remove required class on input fields
				if (coxjs.select(el).is("fieldset")) {
					var inputFields = coxjs.select(el).find("input");
					var selectFields = coxjs.select(el).find("select");
					var savedPaymentCheckbox = coxjs.select(el).find("#save-payment-bank")[0];
					if (!savedPaymentCheckbox)
						savedPaymentCheckbox = coxjs.select(el).find("#save-payment-credit")[0];

					coxjs.select(inputFields).each(function(index, field) {
						coxjs.select(field).addClass("ignore-validation").removeClass("required");
					});

					coxjs.select(selectFields).each(function(index, field) {
						coxjs.select(field).addClass("ignore-validation").removeClass("required");
					});
					// remove any required class from saved payment checkbox
					if (savedPaymentCheckbox)
						coxjs.select(savedPaymentCheckbox).addClass("ignore-validation").removeClass("required");
				}
			},
			
			clearOutFormFields : function(el) {
				var inputFields = coxjs.select(el).find("input");
				var selectFields = coxjs.select(el).find("select");

				coxjs.select(inputFields).each(function(index, field) {
					// clear out values
					coxjs.select(field).val("");
				});

				coxjs.select(selectFields).each(function(index, field) {
					// clear out values
					coxjs.select(field).val("");
				});
			},

			hideElement : function(el) {
				coxjs.select(el).css("display", "none");
				if (coxjs.select("body.IE8").length > 0) coxjs.select(el).parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");
			},

			showElement : function(el) {
				coxjs.select(el).css("display", "");
				if (coxjs.select("body.IE8").length > 0) coxjs.select(el).parentsUntil("#pf-container").css("zoom", "").css("zoom", "1");

			},

			showCreditCardForm : function() {
				var ccForm = coxjs.select(".credit-card-form");
				var bankForm = coxjs.select(".bank-account-form");
				
				// clear out bank form
				coxjs.select(".txtBankName").text('----');
				_module.clearOutFormFields(bankForm);
				
				// hide payby dropdown
				coxjs.select(".payByCardType").attr("style", "display: none !important");
				// show expiration date
				coxjs.select(".expiration-date").css("display", "block");

				// hide other payment type
				_module.hideElement(bankForm);

				// show payment type
				_module.showElement(ccForm);

				// add/remove validation
				_module.addInputFieldValidation(coxjs.select(ccForm).find("fieldset"));

				_module.removeInputFieldValidation(coxjs.select(bankForm).find("fieldset"));
			},

			showBankForm : function() {
				var ccForm = coxjs.select(".credit-card-form");
				var bankForm = coxjs.select(".bank-account-form");

				// clear out cc form
				coxjs.select("input").removeClass("Visa MasterCard Discover Amex");
				_module.clearOutFormFields(ccForm);

				// hide other payment type
				_module.hideElement(ccForm);

				// show payment type
				_module.showElement(bankForm);

				// add/remove validation
				_module.addInputFieldValidation(coxjs.select(bankForm).find("fieldset"));

				_module.removeInputFieldValidation(coxjs.select(ccForm).find("fieldset"));
			},

			paymentValidationResponse : function(response) {
				// remove errors from form...
				//_module.removeErrorValidationElements();
				var isModal = coxjs.select(response.inputField).closest(".form-modal")[0];
				// check if response is on easy pay page
				if (coxjs.select(".ibill-no-accordion")[0])
					_module.easypayValidResponse();
				else if(isModal)  
					_module.modalValidResponse(isModal);
				else {
					_module.removePaymentClasses();
					var isCreditCard = false;
					if(coxjs.select(".txtCCNum")[0]){
						var ccInputField = coxjs.select(".txtCCNum").val();
						var newCCNumber = "(xx" + ccInputField.slice(12) + ")";
					} 
					var header = coxjs.select(".accordion-trigger")[1];
					var continueBtn = coxjs.select(".make-payment-page").find(".accordion-next")[0];

					if (response.response == "Visa" || response.response == "MasterCard" || response.response == "Discover" || response.response == "Amex")
						isCreditCard = true;

					// set the header
					coxjs.select(coxjs.select(header).find(".accordion-dynamic-text")[0]).addClass(response.response);

					if (isCreditCard)
						coxjs.select(header).find(".accordion-dynamic-text").text(newCCNumber);
					else
						coxjs.select(header).find(".accordion-dynamic-text").text(response.response);

					// if continue btn is disabled
					if (!continueBtn)
						continueBtn = coxjs.select(".make-payment-page").find(".button-secondary-disabled")[0];
					// remove disabled class
					coxjs.select(continueBtn).removeClass("button-secondary-disabled").addClass("button accordion-next");
				}

			},

			paymentInvalidResponse : function(response) { 
				var isModal = coxjs.select(response.inputField).closest(".form-modal")[0];
				// check if response is on easy pay page
				if (coxjs.select(".ibill-no-accordion")[0])
					_module.easypayInvalidResponse();
				else if(isModal)  
					_module.modalInvalidResponse(isModal);
				else {
					var continueBtn = coxjs.select(".make-payment-page").find(".button")[0];
					coxjs.select(continueBtn).removeClass("button accordion-next").addClass("button-secondary-disabled");
					coxjs.select(continueBtn).click(function(e) {
						e.preventDefault();
					});
				}
			},

			easypayValidResponse : function() {
				var continueBtn = coxjs.select(".payment-btn")[0];
				coxjs.select(continueBtn).removeClass("button-disabled loading-wrapper-active").addClass("button");
				coxjs.select(continueBtn).click(function(e) {
					coxjs.select(".form").submit();
				});
			},

			easypayInvalidResponse : function() {
				var continueBtn = coxjs.select(".payment-btn")[0];
				coxjs.select(continueBtn).removeClass("button").addClass("button-disabled");
				coxjs.select(continueBtn).click(function(e) {
					e.preventDefault();
				});
			},
			
			modalValidResponse : function(modal) {
				var submitBtn = coxjs.select(modal).find(".dialog-component-buttons input")[0];
				if(coxjs.select(submitBtn).hasClass("button-disabled")) {
					coxjs.select(submitBtn).removeClass("button-disabled");
					coxjs.select(submitBtn).click(function(e) {
						coxjs.select(submitBtn).unbind('click');
						coxjs.select(modal).submit();
					});
				}
			},
			
			modalInvalidResponse : function(modal) { 
				var submitBtn = coxjs.select(modal).find(".dialog-component-buttons input")[0];
				coxjs.select(submitBtn).addClass("button-disabled");
				coxjs.select(submitBtn).click(function(event) {
					event.preventDefault();
				});
			},

			modalToggleHappened : function(modal) {
				var isModal = coxjs.select(modal.element).closest(".form-modal")[0];
				if(isModal){
					_module.clearOutFormFields($(isModal).find("fieldset"));
					var submitBtn = coxjs.select(isModal).find(".dialog-component-buttons input")[0];
					if(coxjs.select(submitBtn).hasClass("button-disabled")) {
						coxjs.select(submitBtn).removeClass("button-disabled");
						coxjs.select(submitBtn).unbind('click');
					}
				}
			},
			
			removePaymentClasses : function() {
				var header = coxjs.select(".accordion-trigger")[1];
				coxjs.select(coxjs.select(header).find(".accordion-dynamic-text")[0]).removeClass("Visa MasterCard Discover Amex");
			},

			replaceCheckboxContent : function() {
				if ( typeof (termsContent) != "undefined")
					coxjs.select(".form").find("span.checkbox").html(termsContent);
			},

			removeErrorValidationElements : function(form) {
				coxjs.select(".error-wrapper").remove();
				coxjs.select("input").removeClass("error");
				coxjs.select(".msg-error").css("display", "none");
				coxjs.select("label").removeClass("errorMsg");
				coxjs.select(".bank-label,.bank-value,.txtCCType").removeClass("required");  
			},

			checkForCCTypeResponse : function(response) {
				if (response == "DEBIT")
					_module.selectedATMCardType();
				else
					_module.selectedOtherCardType();
			},

			selectedATMCardType : function() {
				//hide validation
				coxjs.select(".pay-on-date").attr("style", "display: none !important");
				
				coxjs.select(".pay-on-date").removeClass("required").addClass("ignore-validation");
				// hide easy pay checkbox
				coxjs.select(".setUpEasyPay").attr("style", "display: none !important");
				coxjs.select(".pay-on-now").attr("style", "display: block");
			},

			selectedOtherCardType : function() {
				coxjs.select(".pay-on-date").attr("style", "display: block");
				
				// show easy pay checkbox
				
				coxjs.select(".setUpEasyPay").attr("style", "display: block");
				
				coxjs.select(".pay-on-now").attr("style", "display: none");
			},

			scheduledPaymentDate : function(response) {
				var headerValue = coxjs.select(response).val();
				// update header value
				_module.updateCurrentHeaderContent(headerValue, 2);
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
// count the number of sections that need to be valid before submitting the whole form

// when an validation error occurs find the parent panel container, then publish event to accordian

/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.residential.bill
 * @class PaymentValidation
 *
 *
 *|
 */
(function(coxfw) {
	coxfw.core.define("modules.residential.bill.PaymentValidation", function(coxjs) {

		var _module;
		/**
		 * The common selector for node listener(s).
		 *
		 * @member {string} _selector
		 */
		var _selector = ".txtRoutingNum, .txtCCNum, .txtAcctNum";

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Add the following selector to the list of selectors checked on AJAX response.
				coxjs.setXHRSelectors(_selector);
			},

			execute : function() {
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				coxjs.select("body").on("xhr-selectors init-payment-validation", _selector, function(event) {
					coxjs.select(this).on("keydown", function(e) {
						
						if (e.keyCode == 46 || (e.keyCode == 67 && e.ctrlKey === true) || (e.keyCode == 86 && e.ctrlKey === true) || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 27 || e.keyCode == 13 || (e.keyCode == 65 && e.ctrlKey === true) || (e.keyCode >= 35 && e.keyCode <= 39) || e.keyCode == 229) {							
							return true;
						} else {
							// If it's not a number stop the keypress
							if (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105 )) {
								e.preventDefault();
								return false;
							}
						}
					});

					coxjs.select(this).on("blur", function(event) {
						if (coxjs.select(this).hasClass("txtRoutingNum")) {
							_module.handleRoutingNumberValidation(this.value, this);

						} else if (coxjs.select(this).hasClass("txtCCNum")) {
							_module.handleCreditCardValidation(this.value, this);
						}
					});
					
					// hide card type
					_module.hideCardTypeOnLoad();

				});

				if (coxjs.select(_selector).length > 0)
					coxjs.select(_selector).trigger("init-payment-validation");
			},

			handleRoutingNumberValidation : function(routingNumber, inputField) {
				// find the form for the input field
				var form = coxjs.select(inputField).closest(".form");
				var publishResponse = {};
				publishResponse.inputField = inputField;

				// find the url from data-cc-validation
				var url = coxjs.select(inputField).parents().filter(function() {
					return coxjs.select(this).data("bankValidation");
				}).eq(0).data("bankValidation");

				$.getJSON(url + "?bank=" + routingNumber, function(response) {
					if (response.match) {
						// remove any previous errors
						_module.removeErrorValidationElements(form);
						// set the bank name field with response
						coxjs.select(".txtBankName").html(response.response);
						// publish response if someone needs it
						publishResponse.response = response.response;
						_module.publishValidResponse(publishResponse);
					} else {
						coxjs.select(".txtBankName").html("----");
						coxjs.select(form).validate().showErrors({
							"txtRoutingNum" : response.response
						});

						// publish invalid response
						_module.publishInvalidResponse(publishResponse);
					}
				}).fail(function() {
					console.log("ERROR: making ajax request for bank routing number!");
				});
			},

			handleCreditCardValidation : function(cardNumber, inputField) {
				// find the form for the input field
				var form = coxjs.select(inputField).closest(".form");
				var publishResponse = {};
				publishResponse.inputField = inputField;
				// find the url from data-cc-validation
				var url = coxjs.select(inputField).parents().filter(function() {
					return coxjs.select(this).data("ccValidation");
				}).eq(0).data("ccValidation");
				
				// FOR TESTING from UI 
				var testUrl = coxjs.select(inputField).parents("form:first").attr("action").match(/html/);
				if(testUrl)  {
					if (cardNumber == "0000000000000000")
						url = "includes/validate-card-credit.json";
					else if (cardNumber == "1111111111111111")
						url = "includes/validate-card-debit.json";
				}

				$.post(url, {'cc' : cardNumber}, function(response) {
					// remove previous classes
					coxjs.select(inputField).removeClass("Visa MasterCard Discover Amex generic-atm-card");
					// on success add class
					if (response.cardType) {
						// remove any previous errors
						_module.removeErrorValidationElements(form);
						// add cc class to input field
						coxjs.select(inputField).addClass(response.cardType);
						coxjs.select('.txtCCType').attr("value",response.cardType).removeClass("required");
						// publish response if someone needs it
						publishResponse.response = response.cardType;
						_module.publishValidResponse(publishResponse);
						// show select cc type
						if (response.isDebit == true) {
							_module.showSelectCardType();
							coxjs.select('.txtCCCategory').attr("value","DEBIT").removeClass("required");
						}
						else {
							_module.hideSelectCardType();
							coxjs.select('.txtCCCategory').attr("value","CREDIT").removeClass("required");
						}

					}
					// on invalid card show errors
					else {
						coxjs.select(form).validate().showErrors({
							"txtCCNum" : "Please enter valid card number."
						});
						// publish invalid response
						_module.publishInvalidResponse(publishResponse);
						// hide select cc type
						//_module.hideSelectCardType();
					}
				},"json").fail(function() {
					console.log("ERROR: making ajax request for credit card number!");
					coxjs.select(inputField).removeClass("Visa MasterCard Discover Amex generic-atm-card");

				});
			},

			removeErrorValidationElements : function(form) {
				coxjs.select(".error-wrapper").remove();
				coxjs.select(".msg-error").css("display", "none");
				coxjs.select(form).find("label").removeClass("errorMsg");
			},

			publishValidResponse : function(response) {
				coxjs.publish({
					type : "PaymentValidation",
					data : response
				});
			},

			publishInvalidResponse : function(response) {
				coxjs.publish({
					type : "InvalidPaymentValidation",
					data : response
				});
			},

			publishSelectedCCTypeResponse : function(request) {
				coxjs.publish({
					type : "SelectedCCTypePaymentValidation",
					data : request
				});
			},

			checkForCCTypeResponse : function(value) {
				if (value == "DEBIT")
					_module.selectedATMCardType();
				else
					_module.selectedOtherCardType();

				_module.publishSelectedCCTypeResponse(value);
			},

			showSelectCardType : function() {
				// show dropdown
				// coxjs.select(".payByCardType").css("display", "block");
				coxjs.select(".payByCardType").attr("style", "display: block !important");
				// add validation
				coxjs.select(".payByCardType").find("select").removeClass("ignore-validation").addClass("required");
				// publish selection of card type
				var cctypeSelect = coxjs.select(".cardType")[0];

				coxjs.select(cctypeSelect).on("change", function(event) {
					_module.checkForCCTypeResponse(coxjs.select(this).val());
				});
			},
			
			hideCardTypeOnLoad : function() {
				// hide dropdown
				coxjs.select(".payByCardType").attr("style", "display: none !important");
				// ignore validation
				coxjs.select(".payByCardType").find("select").removeClass("required").addClass("ignore-validation");
			},

			hideSelectCardType : function() {
				coxjs.select(".expiration-date").css("display", "block");
				coxjs.select(".expiration-date").find("select").removeClass("ignore-validation").addClass("required");
				// hide dropdown
				coxjs.select(".payByCardType").attr("style", "display: none !important");
				// ignore validation
				coxjs.select(".payByCardType").find("select").removeClass("required").addClass("ignore-validation");
			},

			selectedATMCardType : function() {
				coxjs.select(".expiration-date").attr("style", "display: none !important");
				//hide validation
				coxjs.select(".expiration-date").find("select").removeClass("required").addClass("ignore-validation");
				coxjs.select(".save-checkbox").attr("style", "display: none !important");
			},

			selectedOtherCardType : function() {
				coxjs.select(".expiration-date").attr("style", "display: block");
				// add validation
				coxjs.select(".expiration-date").find("select").removeClass("ignore-validation").addClass("required");
				coxjs.select(".save-checkbox").attr("style", "display: block");
			},

			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {
			}
		};
	});
})(coxfw);
/**
 * @author Kyle Patterson
 * @version 0.1.0.0
 * @namespace modules.utils
 * @class print
 *
 * Example of a subscription-based print method as a module.
 *|
 */
(function(coxfw) {
	coxfw.core.define('modules.utils.print', function(coxjs) {
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
// console.log("INIT print.js");
			},
			/**
			 * Execute this module.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC print.js");
				// Store a copy of module context.
				_module = this;
				/**
				 * @event click
				 *
				 * Fire form submit, by triggering a click on the submit button, when the user clicks the "Filter By Favorites" link.
				 *
				 * @param {selector} "body" The parent container to listen within
				 * @param {selector} ".btn-print, .print-trigger" The classed element clicked to print
				 */
				coxjs.select("body").on("click", ".btn-print, .print-trigger", function(event) {
					_module.print();
				});

			},

			print : function(params) {
				//console.log(params);
				window.print();
				/*if(params.target) {
					var element = mojo.queryFirst(params.target);
			 		window.frames[element.name].focus();
			 		window.frames[element.name].print();
				} else {
					window.print();
				}*/
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
/**
 * @author Scott Thompson
 * @version 0.1.0.0
 * @namespace testing.global
 * @class LoadingThrobber
 *
 * TEST Show and hide loading spinner.
 *|
 */
(function(coxfw) {
	// Testing multiple subscriptions to the same published method.
	coxfw.core.define("testing.global.LoadingThrobber", function(coxjs) {
		/**
		 * Stores the timing test for the current module.
		 *
		 * @property _timer
		 * @type object
		 */
		var _timer;
		/**
		 * Set a default class name to modify, unless another is provided.
		 *
		 * @property _class
		 * @type string
		 */
		var _class = "loading-wrapper-active";
		/**
		 * Stores a copy of the module context to apply inside methods.
		 *
		 * @property _module
		 * @type object
		 */
		var _module;

		return {
			/**
			 * Setup all subscriptions for this module
			 *
			 * @method init
			 */
			init : function() {
console.log("INIT LoadingThrobber.js TESTING");
				// Stores a copy of the module context to apply inside methods.
				_module = this;

				// Subscribe to throbber show/hide requests.
				coxjs.subscribe({
					"showThrobber" : _module.showThrobber,
					"hideThrobber" : _module.hideThrobber
				});
			},
			/**
			 * Subscribe to throbber show/hide requests.
			 *
			 * @method execute
			 */
			execute : function() {
console.log("EXEC LoadingThrobber.js TESTING");
				// Stores a copy of the module context to apply inside methods.
				_module = this;
			},
			/**
			 * Display the waiting indicator.
			 *
			 * @method showThrobber
			 * @param {object} throbber The configuration object for this throbber
			 */
			showThrobber : function(throbber) {
				/**
				 * coxjs.timing wraps the module's functionality to test performance
				 *
				 * @method coxjs.timing
				 * @param {string} "modalHandler" The name of the test to run
				 */
				_timer = coxjs.timing("showThrobber", function() {});
				/**
				 * Start this module's test suite.
				 *
				 * @method coxjs.test
				 * @param {string} "modalHandler" The name of the test to run
				 */
				coxjs.test("showThrobber", function() {
					/**
					 * Test how long the modal took to open.
					 *
					 * @method coxjs.ok
					 * @param {expression} "_timer.time<0.5" Fail if it took more than half a second
					 * @param {string} msg Message to display in the test results
					 */
					coxjs.ok(_timer.time < 0.5, "Throbber took " + _timer.time + "sec.");
					/**
					 * Test if the current containers are set to display after opening.
					 *
					 * @method coxjs.ok
					 * @param {expression} "_containers.css('display')=='block'" Fail if the container display is set to anything other than 'block'
					 * @param {string} msg Message to display in the test results
					 */
					coxjs.ok(throbber.nodes.hasClass(_class), "Throbber is currently " + coxjs.select(".loader", throbber.nodes).height() + "px high.");
				});
			},
			/**
			 * Remove the waiting indicator.
			 *
			 * @method hideThrobber
			 * @param {object} throbber The configuration object for this throbber
			 */
			hideThrobber : function(throbber) {
				/**
				 * coxjs.timing wraps the module's functionality to test performance
				 *
				 * @method coxjs.timing
				 * @param {string} "modalHandler" The name of the test to run
				 */
				_timer = coxjs.timing("hideThrobber", function() {});
				/**
				 * Start this module's test suite.
				 *
				 * @method coxjs.test
				 * @param {string} "modalHandler" The name of the test to run
				 */
				coxjs.test("hideThrobber", function() {
					/**
					 * Test how long the modal took to open.
					 *
					 * @method coxjs.ok
					 * @param {expression} "_timer.time<0.5" Fail if it took more than half a second
					 * @param {string} msg Message to display in the test results
					 */
					coxjs.ok(_timer.time < 0.5, "Throbber took " + _timer.time + "sec.");
					/**
					 * Test if the current containers are set to display after opening.
					 *
					 * @method coxjs.ok
					 * @param {expression} "_containers.css('display')=='block'" Fail if the container display is set to anything other than 'block'
					 * @param {string} msg Message to display in the test results
					 */
					coxjs.ok(!throbber.nodes.hasClass(_class), "Throbber is currently " + coxjs.select(".loader", throbber.nodes).height() + "px high.");
				});
			},
			/**
			 * Callback used when removing a module from the framework.
			 *
			 * @method destroy
			 */
			destroy : function() {}
		};
	});
})(coxfw);
